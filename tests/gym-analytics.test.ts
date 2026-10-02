import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildExerciseAnalyticsIndex,
  buildWorkoutExerciseAnalyticsIndex,
  sessionPRFor,
} from "../src/store/gym-analytics.ts";
import type { Session } from "../src/lib/types.ts";

function makeSession(
  id: string,
  workoutId: string,
  finishedAt: string,
  entries: Session["entries"],
): Session {
  return {
    id,
    routineId: "r1",
    workoutId,
    workoutName: `Treino ${workoutId}`,
    startedAt: finishedAt,
    finishedAt,
    entries,
  };
}

const sessions: Session[] = [
  makeSession("s1", "w1", "2026-01-01T10:00:00.000Z", [
    {
      exerciseId: "supino",
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 70, reps: 8, completed: true },
        { weight: 100, reps: 1, completed: false },
      ],
    },
  ]),
  makeSession("s2", "w1", "2026-01-08T10:00:00.000Z", [
    {
      exerciseId: "supino",
      sets: [
        { weight: 65, reps: 10, completed: true },
        { weight: null, reps: 12, completed: true },
      ],
    },
    { exerciseId: "agachamento", sets: [{ weight: 80, reps: 10, completed: false }] },
  ]),
  makeSession("s3", "w2", "2026-01-15T10:00:00.000Z", [
    { exerciseId: "supino", sets: [{ weight: 62.5, reps: 9, completed: true }] },
  ]),
];

test("sessionPRFor retorna a maior carga entre séries concluídas", () => {
  assert.equal(sessionPRFor(sessions, "supino"), 70);
});

test("sessionPRFor ignora séries não concluídas", () => {
  assert.equal(sessionPRFor(sessions, "agachamento"), null);
});

test("sessionPRFor retorna null para exercício sem histórico", () => {
  assert.equal(sessionPRFor(sessions, "inexistente"), null);
  assert.equal(sessionPRFor([], "supino"), null);
});

test("índice por exercício: PR considera só séries concluídas", () => {
  const index = buildExerciseAnalyticsIndex(sessions);
  assert.equal(index.get("supino")?.pr, 70);
});

test("índice por exercício: exercício sem séries concluídas não entra no índice", () => {
  const index = buildExerciseAnalyticsIndex(sessions);
  assert.equal(index.has("agachamento"), false);
});

test("índice por exercício: histórico vem do mais recente para o mais antigo", () => {
  const history = buildExerciseAnalyticsIndex(sessions).get("supino")?.history ?? [];
  assert.deepEqual(
    history.map((item) => item.date),
    ["2026-01-15T10:00:00.000Z", "2026-01-08T10:00:00.000Z", "2026-01-01T10:00:00.000Z"],
  );
  assert.deepEqual(
    history.map((item) => item.maxWeight),
    [62.5, 65, 70],
  );
});

test("índice por exercício: lastSets são as séries da sessão mais recente", () => {
  const lastSets = buildExerciseAnalyticsIndex(sessions).get("supino")?.lastSets;
  assert.equal(lastSets?.length, 1);
  assert.equal(lastSets?.[0]?.weight, 62.5);
});

test("índice por exercício: independe da ordem em que as sessões chegam", () => {
  const reversed = [...sessions].reverse();
  const a = buildExerciseAnalyticsIndex(sessions).get("supino");
  const b = buildExerciseAnalyticsIndex(reversed).get("supino");
  assert.deepEqual(a, b);
});

test("índice por treino: separa as últimas séries por treino e exercício", () => {
  const index = buildWorkoutExerciseAnalyticsIndex(sessions);
  assert.equal(index.get("w1::supino")?.lastSets?.[0]?.weight, 65);
  assert.equal(index.get("w2::supino")?.lastSets?.[0]?.weight, 62.5);
  assert.equal(index.has("w1::agachamento"), false);
});
