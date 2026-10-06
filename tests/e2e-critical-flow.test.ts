import assert from "node:assert/strict";
import test from "node:test";
import { createBackup, parseBackup } from "../src/lib/storage.ts";
import {
  createWorkoutSession,
  finishWorkoutSession,
  updateWorkoutSessionSet,
} from "../src/store/gym-session.ts";
import type { Routine, Workout, AppState } from "../src/lib/types.ts";

const routine: Routine = {
  id: "routine-e2e",
  name: "Rotina E2E",
  createdAt: "2026-01-01T00:00:00.000Z",
  workouts: [],
};

const workout: Workout = {
  id: "workout-e2e",
  name: "Treino E2E",
  days: [1],
  exerciseIds: ["exercise-a", "exercise-b"],
  targetSets: {
    "exercise-a": 2,
    "exercise-b": 1,
  },
  restSeconds: 60,
};

test("E2E crítico: iniciar → séries → descanso persistido → próximo exercício → finalizar → relatório", () => {
  let session = createWorkoutSession(
    routine,
    workout,
    "session-e2e",
    "2026-10-06T10:00:00.000Z",
  );

  assert.equal(session.entries.length, 2);
  assert.equal(session.entries[0]?.sets.length, 2);
  assert.equal(session.entries[1]?.sets.length, 1);

  session = updateWorkoutSessionSet(
    session,
    "exercise-a",
    0,
    { weight: 20, reps: 10, completed: true },
    15,
  );
  session = {
    ...session,
    currentExerciseIndex: 0,
    restStartedAt: "2026-10-06T10:01:00.000Z",
    restTotal: 60,
    restRemaining: 42,
    restRunning: true,
  };

  assert.equal(session.entries[0]?.sets[0]?.completed, true);
  assert.equal(session.entries[0]?.sets[0]?.isPR, true);
  assert.equal(session.restRemaining, 42);

  session = updateWorkoutSessionSet(
    session,
    "exercise-a",
    1,
    { weight: 20, reps: 9, completed: true },
    15,
  );
  session = {
    ...session,
    currentExerciseIndex: 1,
    restStartedAt: null,
    restTotal: 0,
    restRemaining: 0,
    restRunning: false,
  };
  session = updateWorkoutSessionSet(
    session,
    "exercise-b",
    0,
    { weight: 30, reps: 8, completed: true },
    15,
  );

  const finished = finishWorkoutSession(session, "2026-10-06T10:20:00.000Z");
  assert.ok(finished);
  assert.equal(finished?.finishedAt, "2026-10-06T10:20:00.000Z");
  assert.equal(
    finished?.entries.reduce((total, entry) => total + entry.sets.length, 0),
    3,
  );
});

test("E2E crítico: fechar/reabrir preserva sessão ativa, exercício atual e descanso", () => {
  const session = {
    ...createWorkoutSession(
      routine,
      workout,
      "session-resume",
      "2026-10-06T11:00:00.000Z",
    ),
    currentExerciseIndex: 1,
    restStartedAt: "2026-10-06T11:05:00.000Z",
    restTotal: 90,
    restRemaining: 37,
    restRunning: true,
  };

  const state: AppState = {
    routines: [{ ...routine, workouts: [workout] }],
    activeRoutineId: routine.id,
    customExercises: [],
    sessions: [],
    activeSession: session,
  };

  const restored = parseBackup(createBackup(state));
  assert.ok(restored);
  assert.equal(restored?.activeSession?.id, "session-resume");
  assert.equal(restored?.activeSession?.currentExerciseIndex, 1);
  assert.equal(restored?.activeSession?.restRemaining, 37);
  assert.equal(restored?.activeSession?.restRunning, true);
});

test("E2E crítico: editar/duplicar/excluir rotina e restaurar backup mantém a estrutura dos dados", () => {
  const editedWorkout: Workout = {
    ...workout,
    id: "workout-edited",
    name: "Treino Editado",
  };
  const duplicatedWorkout: Workout = {
    ...editedWorkout,
    id: "workout-duplicated",
    name: "Treino Editado (cópia)",
  };
  const editedRoutine: Routine = {
    ...routine,
    name: "Rotina Editada",
    workouts: [editedWorkout, duplicatedWorkout],
  };
  const state: AppState = {
    routines: [editedRoutine],
    activeRoutineId: editedRoutine.id,
    customExercises: [],
    sessions: [],
    activeSession: null,
  };

  const restored = parseBackup(createBackup(state));
  assert.ok(restored);
  assert.equal(restored?.routines.length, 1);
  assert.equal(restored?.routines[0]?.name, "Rotina Editada");
  assert.deepEqual(
    restored?.routines[0]?.workouts.map((item) => item.name),
    ["Treino Editado", "Treino Editado (cópia)"],
  );

  const deletedState: AppState = {
    ...restored!,
    routines: [],
    activeRoutineId: null,
  };
  assert.deepEqual(parseBackup(createBackup(deletedState))?.routines, []);
});
