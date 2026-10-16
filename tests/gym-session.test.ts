import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkoutSession,
  finishWorkoutSession,
  lastCompletedSetsForWorkout,
  updateWorkoutSessionSet,
} from "../src/store/gym-session.ts";

const routine = {
  id: "routine-a",
  name: "Rotina A",
  createdAt: "2026-01-01T00:00:00.000Z",
  workouts: [],
};
const workout = {
  id: "workout-a",
  name: "Treino A",
  days: [1],
  exerciseIds: ["agachamento"],
  targetSets: { agachamento: 2 },
};

function session(id: string, routineId: string, finishedAt: string | null, weight: number) {
  return {
    id,
    routineId,
    workoutId: "workout-a",
    workoutName: "Treino A",
    startedAt: finishedAt ?? "2026-10-10T10:00:00.000Z",
    finishedAt,
    entries: [
      {
        exerciseId: "agachamento",
        sets: [{ weight, reps: 8, completed: true }],
      },
    ],
  };
}

test("nova sessão não preenche automaticamente carga nem repetições anteriores", () => {
  const created = createWorkoutSession(routine, workout, "session-new", "2026-10-13T10:00:00.000Z");
  assert.deepEqual(created.entries[0]?.sets, [
    { weight: null, reps: null, completed: false },
    { weight: null, reps: null, completed: false },
  ]);
});

test("referência anterior usa a sessão concluída mais recente, sem depender da ordem do array", () => {
  const result = lastCompletedSetsForWorkout(
    [
      session("newer", "routine-a", "2026-10-12T10:00:00.000Z", 40),
      session("older", "routine-a", "2026-10-08T10:00:00.000Z", 20),
    ],
    "workout-a",
    "agachamento",
    "routine-a",
  );
  assert.equal(result?.[0]?.weight, 40);
});

test("referência anterior respeita rotina e ignora sessão ativa", () => {
  const result = lastCompletedSetsForWorkout(
    [
      session("other-routine", "routine-b", "2026-10-13T10:00:00.000Z", 90),
      session("active", "routine-a", null, 70),
      session("same-routine", "routine-a", "2026-10-11T10:00:00.000Z", 35),
    ],
    "workout-a",
    "agachamento",
    "routine-a",
  );
  assert.equal(result?.[0]?.weight, 35);
});

test("finalização mantém apenas séries concluídas e rejeita sessão vazia", () => {
  const created = createWorkoutSession(
    routine,
    workout,
    "session-finish",
    "2026-10-13T10:00:00.000Z",
  );
  const updated = updateWorkoutSessionSet(
    created,
    "agachamento",
    0,
    {
      weight: 50,
      reps: 8,
      completed: true,
    },
    0,
  );
  const finished = finishWorkoutSession(updated, "2026-10-13T10:30:00.000Z");
  assert.equal(finished?.entries[0]?.sets.length, 1);
  assert.equal(finishWorkoutSession(created, "2026-10-13T10:30:00.000Z"), null);
});


test("ignora carga e repetições negativas ou inválidas sem corromper a série", () => {
  const created = createWorkoutSession(routine, workout, "session-invalid", "2026-10-13T10:00:00.000Z");
  const updated = updateWorkoutSessionSet(
    created,
    "agachamento",
    0,
    { weight: -10, reps: -2 },
    0,
  );

  assert.equal(updated.entries[0]?.sets[0]?.weight, null);
  assert.equal(updated.entries[0]?.sets[0]?.reps, null);
});

test("aceita limpar campos numéricos, valida RPE e limita observações a 500 caracteres", () => {
  const created = createWorkoutSession(routine, workout, "session-fields", "2026-10-13T10:00:00.000Z");
  const populated = updateWorkoutSessionSet(
    created,
    "agachamento",
    0,
    { weight: 40, reps: 8, rpe: 8, note: "Observação" },
    0,
  );
  const invalid = updateWorkoutSessionSet(
    populated,
    "agachamento",
    0,
    { weight: Number.NaN, reps: 1.5, rpe: 11, note: "x".repeat(600) },
    0,
  );

  assert.equal(invalid.entries[0]?.sets[0]?.weight, 40);
  assert.equal(invalid.entries[0]?.sets[0]?.reps, 8);
  assert.equal(invalid.entries[0]?.sets[0]?.rpe, 8);
  assert.equal(invalid.entries[0]?.sets[0]?.note?.length, 500);

  const cleared = updateWorkoutSessionSet(
    invalid,
    "agachamento",
    0,
    { weight: null, reps: null, rpe: null },
    0,
  );
  assert.equal(cleared.entries[0]?.sets[0]?.weight, null);
  assert.equal(cleared.entries[0]?.sets[0]?.reps, null);
  assert.equal(cleared.entries[0]?.sets[0]?.rpe, null);
});

test("recalcula recordes quando a carga de uma série concluída é alterada", () => {
  const created = createWorkoutSession(
    routine,
    workout,
    "session-pr-edit",
    "2026-10-13T10:00:00.000Z",
  );
  const first = updateWorkoutSessionSet(
    created,
    "agachamento",
    0,
    { weight: 60, reps: 8, completed: true },
    65,
  );
  const second = updateWorkoutSessionSet(
    first,
    "agachamento",
    1,
    { weight: 70, reps: 8, completed: true },
    65,
  );

  assert.deepEqual(
    second.entries[0]?.sets.map((set) => set.isPR),
    [false, true],
  );

  const lowered = updateWorkoutSessionSet(
    second,
    "agachamento",
    1,
    { weight: 62.5 },
    65,
  );
  assert.deepEqual(
    lowered.entries[0]?.sets.map((set) => set.isPR),
    [false, false],
  );

  const raised = updateWorkoutSessionSet(
    lowered,
    "agachamento",
    1,
    { weight: 67.5 },
    65,
  );
  assert.deepEqual(
    raised.entries[0]?.sets.map((set) => set.isPR),
    [false, true],
  );
});
