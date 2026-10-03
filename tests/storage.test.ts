import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createBackup, emptyState, loadState, parseBackup, saveState, storageSizeBytes, uid } from "../src/lib/storage.ts";

const KEY = "gymtrack.state.v1";
const VERSION_KEY = "gymtrack.state.version";

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

test("loadState retorna null quando não há dados salvos", () => {
  assert.equal(loadState(), null);
});

test("loadState retorna null para JSON corrompido, sem lançar erro", () => {
  storage.setItem(KEY, "{isso não é json");
  assert.equal(loadState(), null);
});

test("saveState e loadState preservam os dados (ida e volta)", () => {
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
  saveState(state);
  assert.deepEqual(loadState(), state);
});

test("loadState descarta itens inválidos e preenche padrões", () => {
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
  const state = loadState();
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

test("activeRoutineId inexistente cai para a primeira rotina", () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      routines: [{ id: "r1", name: "A", workouts: [] }, { id: "r2", name: "B", workouts: [] }],
      activeRoutineId: "nao-existe",
    }),
  );
  assert.equal(loadState()?.activeRoutineId, "r1");
});

test("dados da versão antiga são migrados e a versão atual é gravada", () => {
  storage.setItem(KEY, JSON.stringify({ routines: [], customExercises: [], sessions: [] }));
  assert.ok(loadState());
  assert.equal(storage.getItem(VERSION_KEY), "2");
});

test("sessão em andamento mantém os campos do cronômetro de descanso", () => {
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
  const session = loadState()?.activeSession;
  assert.equal(session?.currentExerciseIndex, 2);
  assert.equal(session?.restTotal, 90);
  assert.equal(session?.restRemaining, 30);
  assert.equal(session?.restRunning, true);
});

test("uid gera ids com o prefixo pedido e sem repetição", () => {
  const ids = new Set(Array.from({ length: 200 }, () => uid("rt")));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.ok(id.startsWith("rt_"));
});


test("createBackup e parseBackup fazem round-trip validado", () => {
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

test("parseBackup rejeita formato desconhecido e JSON inválido", () => {
  assert.equal(parseBackup("{nao-json"), null);
  assert.equal(
    parseBackup(JSON.stringify({ format: "outro", version: 1, state: emptyState })),
    null,
  );
});

test("storageSizeBytes reflete o estado salvo", () => {
  saveState({
    ...emptyState,
    routines: [{ id: "r", name: "Rotina", createdAt: "2026-01-01T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r",
  });
  assert.ok(storageSizeBytes() > 0);
});
