import type { Routine, Session, SetLog, Workout } from "@/lib/types";

export function createWorkoutSession(
  routine: Routine,
  workout: Workout,
  id: string,
  startedAt: string,
): Session {
  return {
    id,
    routineId: routine.id,
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt,
    finishedAt: null,
    entries: workout.exerciseIds.map((exerciseId) => ({
      exerciseId,
      sets: Array.from(
        { length: workout.targetSets[exerciseId] ?? 3 },
        () => ({ weight: null, reps: null, completed: false }),
      ),
    })),
  };
}

export function updateWorkoutSessionSet(
  session: Session,
  exerciseId: string,
  index: number,
  patch: Partial<SetLog>,
  historicalBest: number,
): Session {
  const nextEntries = session.entries.map((entry) =>
    entry.exerciseId === exerciseId
      ? {
          ...entry,
          sets: entry.sets.map((set, i) =>
            i === index ? { ...set, ...patch } : set,
          ),
        }
      : entry,
  );
  const target = nextEntries.find((entry) => entry.exerciseId === exerciseId);
  if (!target) return { ...session, entries: nextEntries };

  let runningBest = historicalBest;
  const recalculated = target.sets.map((set) => {
    if (!set.completed || set.weight == null) return { ...set, isPR: false };
    const isPR = set.weight > runningBest;
    runningBest = Math.max(runningBest, set.weight);
    return { ...set, isPR };
  });

  return {
    ...session,
    entries: nextEntries.map((entry) =>
      entry.exerciseId === exerciseId
        ? { ...entry, sets: recalculated }
        : entry,
    ),
  };
}

export function finishWorkoutSession(
  current: Session,
  finishedAt: string,
): Session | null {
  const entries = current.entries
    .map((entry) => ({
      ...entry,
      sets: entry.sets.filter((set) => set.completed),
    }))
    .filter((entry) => entry.sets.length > 0);

  if (!entries.length) return null;

  return {
    ...current,
    entries,
    finishedAt,
  };
}
