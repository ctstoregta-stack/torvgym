import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createBackup, emptyState, loadState, parseBackup, saveState, storageSizeBytes, uid } from "../src/lib/storage.ts";

const KEY = "gymtrack.state.v1";
const VERSION_KEY = "gymtrack.state.version";
const RECOVERY_KEY = "gymtrack.state.recovery.v1";
const AUTO_BACKUP_KEY = "gymtrack.state.auto-backup.v1";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

type GlobalWithWindow = { window?: unknown };
let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as GlobalWithWindow).window = { localStorage: storage };
});

afterEach(() => {
  delete (globalThis as GlobalWithWindow).window;
});

test("loadState retorna null quando não há dados salvos", async () => {
  assert.equal(await loadState(), null);
});

test("loadState recupera do snapshot quando o estado principal está corrompido", async () => {
  const state = {
    ...emptyState,
    routines: [{ id: "r-recovery", name: "Recuperação", createdAt: "2026-01-01T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r-recovery",
  };
  await saveState(state);
  storage.setItem(KEY, "{isso não é json");
  assert.deepEqual(await loadState(), state);
  assert.equal(storage.getItem(VERSION_KEY), "4");
});

test("loadState recupera do snapshot quando o envelope criptografado foi adulterado", async () => {
  const state = {
    ...emptyState,
    routines: [{ id: "r-tamper", name: "Integridade", createdAt: "2026-01-02T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r-tamper",
  };
  await saveState(state);

  const encrypted = JSON.parse(storage.getItem(KEY) ?? "{}");
  assert.equal(encrypted.format, "torvgym-local");
  assert.equal(typeof encrypted.ciphertext, "string");
  encrypted.ciphertext = encrypted.ciphertext.slice(0, -2) + "AA";
  storage.setItem(KEY, JSON.stringify(encrypted));

  assert.deepEqual(await loadState(), state);
});

test("loadState usa o backup interno quando o estado principal e o snapshot estão corrompidos", async () => {
  const state = {
    ...emptyState,
    routines: [{ id: "r-auto", name: "Backup automático", createdAt: "2026-01-01T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r-auto",
  };
  await saveState(state);
  storage.setItem(KEY, "{corrompido");
  storage.setItem(RECOVERY_KEY, "{corrompido");
  assert.deepEqual(await loadState(), state);
});

test("loadState retorna null quando todas as cópias estão inválidas", async () => {
  storage.setItem(KEY, "{corrompido");
  storage.setItem(RECOVERY_KEY, "{corrompido");
  storage.setItem(AUTO_BACKUP_KEY, "{corrompido");
  assert.equal(await loadState(), null);
});

test("saveState e loadState preservam os dados (ida e volta)", async () => {
  const state = {
    ...emptyState,
    routines: [
      {
        id: "r1",
        name: "Hipertrofia",
        createdAt: "2026-01-01T00:00:00.000Z",
        workouts: [
          { id: "w1", name: "Treino A", days: [1, 3], exerciseIds: ["supino"], targetSets: { supino: 3 } },
        ],
      },
    ],
    activeRoutineId: "r1",
  };
  assert.equal(await saveState(state), true);
  assert.deepEqual(await loadState(), state);
  assert.ok(storage.getItem(RECOVERY_KEY));
  assert.ok(storage.getItem(AUTO_BACKUP_KEY));
});

test("loadState descarta itens inválidos e preenche padrões", async () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      routines: [
        { id: "r1", name: "Rotina", workouts: [{ id: "w1", name: "A", days: [1, 1, 9, "x"], exerciseIds: ["a", 5], targetSets: { a: 0, b: 2.6 } }] },
        { name: "sem id" },
        null,
      ],
      customExercises: [{ id: "e1", name: "Remada" }, { id: 7 }],
      sessions: [{ id: "s1" }, "lixo"],
    }),
  );
  const state = await loadState();
  assert.ok(state);
  assert.equal(state.routines.length, 1);

  const workout = state.routines[0]?.workouts[0];
  assert.deepEqual(workout?.days, [1]);
  assert.deepEqual(workout?.exerciseIds, ["a"]);
  assert.deepEqual(workout?.targetSets, { b: 3 });

  assert.equal(state.customExercises.length, 1);
  assert.equal(state.customExercises[0]?.category, "Outros");
  assert.equal(state.sessions.length, 0);
  assert.equal(state.activeSession, null);
});

test("activeRoutineId inexistente cai para a primeira rotina", async () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      routines: [{ id: "r1", name: "A", workouts: [] }, { id: "r2", name: "B", workouts: [] }],
      activeRoutineId: "nao-existe",
    }),
  );
  assert.equal((await loadState())?.activeRoutineId, "r1");
});

test("dados da versão antiga são migrados e a versão atual é gravada", async () => {
  storage.setItem(KEY, JSON.stringify({ routines: [], customExercises: [], sessions: [] }));
  assert.ok(await loadState());
  assert.equal(storage.getItem(VERSION_KEY), "4");
});

test("sessão em andamento mantém os campos do cronômetro de descanso", async () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      routines: [],
      activeSession: {
        id: "s1",
        workoutId: "w1",
        entries: [{ exerciseId: "supino", sets: [{ weight: 50, reps: 10, completed: true }] }],
        currentExerciseIndex: 2,
        restTotal: 90,
        restRemaining: 30,
        restRunning: true,
      },
    }),
  );
  const session = (await loadState())?.activeSession;
  assert.equal(session?.currentExerciseIndex, 2);
  assert.equal(session?.restTotal, 90);
  assert.equal(session?.restRemaining, 30);
  assert.equal(session?.restRunning, true);
});

test("migração preserva RPE e observação da série", async () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      routines: [],
      sessions: [],
      activeSession: {
        id: "s1",
        workoutId: "w1",
        entries: [{ exerciseId: "supino", sets: [{ weight: 50, reps: 10, completed: true, rpe: 9, note: "Última série pesada" }] }],
      },
    }),
  );
  const set = (await loadState())?.activeSession?.entries[0]?.sets[0];
  assert.equal(set?.rpe, 9);
  assert.equal(set?.note, "Última série pesada");
  assert.equal(storage.getItem(VERSION_KEY), "4");
});
test("uid gera ids com o prefixo pedido e sem repetição", async () => {
  const ids = new Set(Array.from({ length: 200 }, () => uid("rt")));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.ok(id.startsWith("rt_"));
});

test("createBackup e parseBackup fazem round-trip validado", async () => {
  const state = {
    ...emptyState,
    routines: [
      {
        id: "r-backup",
        name: "Backup",
        createdAt: "2026-02-01T00:00:00.000Z",
        workouts: [],
      },
    ],
    activeRoutineId: "r-backup",
  };
  const backup = createBackup(state);
  assert.deepEqual(parseBackup(backup), state);
});

test("parseBackup rejeita formato desconhecido e JSON inválido", async () => {
  assert.equal(parseBackup("{nao-json"), null);
  assert.equal(
    parseBackup(JSON.stringify({ format: "outro", version: 1, state: emptyState })),
    null,
  );
});

test("storageSizeBytes reflete o estado salvo", async () => {
  await saveState({
    ...emptyState,
    routines: [{ id: "r", name: "Rotina", createdAt: "2026-01-01T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r",
  });
  assert.ok(storageSizeBytes() > 0);
});
