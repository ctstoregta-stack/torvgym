import type { Routine, Session, SetLog, Workout } from "../lib/types";

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
      sets: Array.from({ length: workout.targetSets[exerciseId] ?? 3 }, () => ({
        weight: null,
        reps: null,
        completed: false,
      })),
    })),
  };
}

function sanitizeSetPatch(patch: Partial<SetLog>): Partial<SetLog> {
  const safe: Partial<SetLog> = {};

  if (patch.weight === null || (typeof patch.weight === "number" && Number.isFinite(patch.weight) && patch.weight >= 0)) {
    safe.weight = patch.weight;
  }
  if (patch.reps === null || (typeof patch.reps === "number" && Number.isInteger(patch.reps) && patch.reps >= 0)) {
    safe.reps = patch.reps;
  }
  if (patch.rpe === null || (typeof patch.rpe === "number" && Number.isInteger(patch.rpe) && patch.rpe >= 1 && patch.rpe <= 10)) {
    safe.rpe = patch.rpe;
  }
  if (typeof patch.completed === "boolean") safe.completed = patch.completed;
  if (typeof patch.isPR === "boolean") safe.isPR = patch.isPR;
  if (typeof patch.note === "string") safe.note = patch.note.slice(0, 500);

  return safe;
}

export function updateWorkoutSessionSet(
  session: Session,
  exerciseId: string,
  index: number,
  patch: Partial<SetLog>,
  historicalBest: number,
): Session {
  const safePatch = sanitizeSetPatch(patch);
  const nextEntries = session.entries.map((entry) =>
    entry.exerciseId === exerciseId
      ? {
          ...entry,
          sets: entry.sets.map((set, i) => (i === index ? { ...set, ...safePatch } : set)),
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
      entry.exerciseId === exerciseId ? { ...entry, sets: recalculated } : entry,
    ),
  };
}

export function finishWorkoutSession(current: Session, finishedAt: string): Session | null {
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

/**
 * Finds the latest completed sets for an exercise in the same workout context.
 * Sorts by completion timestamp instead of relying on the array order, which
 * may change after backup import or recovery. Active sessions are ignored.
 */
export function lastCompletedSetsForWorkout(
  sessions: Session[],
  workoutId: string,
  exerciseId: string,
  routineId?: string,
): SetLog[] | null {
  const ordered = [...sessions]
    .filter(
      (item) =>
        item.finishedAt &&
        item.workoutId === workoutId &&
        (routineId === undefined || item.routineId === routineId),
    )
    .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime());

  for (const item of ordered) {
    const entry = item.entries.find((candidate) => candidate.exerciseId === exerciseId);
    const sets = entry?.sets.filter((set) => set.completed) ?? [];
    if (sets.length) return sets;
  }

  return null;
}
