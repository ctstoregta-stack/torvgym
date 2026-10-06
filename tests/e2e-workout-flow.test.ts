import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkoutSession,
  finishWorkoutSession,
  updateWorkoutSessionSet,
} from "../src/store/gym-session.ts";
import {
  workoutExerciseProgressionFor,
} from "../src/store/gym-analytics.ts";

const routine = { id: "r-e2e", name: "E2E", createdAt: "2026-10-06T00:00:00.000Z", workouts: [] };
const workout = { id: "w-e2e", name: "Treino E2E", days: [1], exerciseIds: ["supino"], targetSets: { supino: 2 }, restSecondsByExercise: { supino: 90 } };

test("fluxo completo: iniciar → séries → descanso persistido → finalizar → relatório", () => {
  let session = createWorkoutSession(routine, workout, "s-e2e", "2026-10-06T10:00:00.000Z");
  session = {
    ...session,
    currentExerciseIndex: 0,
    restTotal: 90,
    restRemaining: 45,
    restRunning: true,
  };

  session = updateWorkoutSessionSet(session, "supino", 0, { weight: 60, reps: 10, completed: true }, 50);
  session = updateWorkoutSessionSet(session, "supino", 1, { weight: 62.5, reps: 8, completed: true }, 50);
  const finished = finishWorkoutSession(session, "2026-10-06T11:00:00.000Z");

  assert.ok(finished);
  assert.equal(finished?.finishedAt, "2026-10-06T11:00:00.000Z");
  assert.equal(finished?.entries[0]?.sets.length, 2);
  assert.equal(finished?.entries[0]?.sets[1]?.isPR, true);
  assert.equal(finished?.restRemaining, 45);
  assert.equal(finished?.restRunning, true);

  const progression = workoutExerciseProgressionFor([finished!], "w-e2e", "supino");
  assert.equal(progression?.latest.maxWeight, 62.5);
  assert.equal(progression?.latest.volume, 1100);
});
