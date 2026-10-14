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
