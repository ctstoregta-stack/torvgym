import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkoutSession,
  finishWorkoutSession,
  updateWorkoutSessionSet,
} from "../src/store/gym-session.ts";

const routine = {
  id: "r1",
  name: "Rotina",
  createdAt: "2026-10-05T00:00:00.000Z",
  workouts: [],
};

const workout = {
  id: "w1",
  name: "Treino A",
  days: [1],
  exerciseIds: ["supino", "remada"],
  targetSets: { supino: 2, remada: 3 },
};

test("fluxo de início cria a sessão com todas as séries planejadas", () => {
  const session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  assert.equal(session.finishedAt, null);
  assert.equal(session.entries.length, 2);
  assert.equal(session.entries[0]?.sets.length, 2);
  assert.equal(session.entries[1]?.sets.length, 3);
  assert.equal(session.entries[0]?.sets[0]?.completed, false);
});

test("atualização de série preserva o fluxo e marca PR progressivamente", () => {
  let session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  session = updateWorkoutSessionSet(
    session,
    "supino",
    0,
    { weight: 60, reps: 10, completed: true },
    50,
  );
  assert.equal(session.entries[0]?.sets[0]?.isPR, true);

  session = updateWorkoutSessionSet(
    session,
    "supino",
    1,
    { weight: 55, reps: 10, completed: true },
    50,
  );
  assert.equal(session.entries[0]?.sets[1]?.isPR, false);
  assert.equal(session.entries[0]?.sets[0]?.weight, 60);
});

test("finalização salva somente séries concluídas e registra finishedAt", () => {
  let session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  session = updateWorkoutSessionSet(session, "supino", 0, { weight: 60, reps: 10, completed: true }, 0);
  const finished = finishWorkoutSession(session, "2026-10-05T11:00:00.000Z");

  assert.ok(finished);
  assert.equal(finished?.finishedAt, "2026-10-05T11:00:00.000Z");
  assert.equal(finished?.entries.length, 1);
  assert.equal(finished?.entries[0]?.sets.length, 1);
  assert.equal(finished?.entries[0]?.sets[0]?.completed, true);
});

test("finalização sem nenhuma série concluída não cria histórico", () => {
  const session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  assert.equal(finishWorkoutSession(session, "2026-10-05T11:00:00.000Z"), null);
});
