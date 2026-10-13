import type { Routine, Workout } from "./types";

/** Cria uma cópia independente de uma rotina e de todos os IDs de seus treinos. */
export function duplicateRoutineTemplate(
  source: Routine,
  routineId: string,
  createWorkoutId: (workout: Workout, index: number) => string,
  createdAt = new Date().toISOString(),
): Routine {
  return {
    ...source,
    id: routineId,
    name: `${source.name} (cópia)`,
    createdAt,
    workouts: source.workouts.map((workout, index) => ({
      ...workout,
      id: createWorkoutId(workout, index),
      days: [...workout.days],
      exerciseIds: [...workout.exerciseIds],
      targetSets: { ...workout.targetSets },
      ...(workout.restSecondsByExercise
        ? { restSecondsByExercise: { ...workout.restSecondsByExercise } }
        : {}),
    })),
  };
}
