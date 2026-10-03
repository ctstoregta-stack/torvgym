import type { Session, SetLog } from "@/lib/types";

export function estimateSet1RM(set: SetLog) {
  if (set.weight == null || set.reps == null || set.weight <= 0 || set.reps <= 0) return 0;
  return Math.round(set.weight * (1 + set.reps / 30) * 10) / 10;
}

export function setVolume(set: SetLog) {
  if (set.weight == null || set.reps == null || set.weight <= 0 || set.reps <= 0) return 0;
  return set.weight * set.reps;
}

export function sessionPRFor(sessions: Session[], exerciseId: string) {
  let max: number | null = null;
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (entry.exerciseId !== exerciseId) continue;
      for (const set of entry.sets) {
        if (set.completed && set.weight != null) {
          max = max == null ? set.weight : Math.max(max, set.weight);
        }
      }
    }
  }
  return max;
}

export function exerciseHistoryFor(sessions: Session[], exerciseId: string) {
  return sessions
    .map((session) => {
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry) return null;
      const sets = entry.sets.filter((s) => s.completed);
      if (!sets.length) return null;
      return {
        date: session.finishedAt ?? session.startedAt,
        sets,
        maxWeight: Math.max(...sets.map((s) => s.weight ?? 0)),
        volume: sets.reduce((total, set) => total + setVolume(set), 0),
        estimated1RM: Math.max(...sets.map(estimateSet1RM), 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as {
      date: string;
      sets: SetLog[];
      maxWeight: number;
      volume: number;
      estimated1RM: number;
    }[];
}

export function lastExerciseSets(sessions: Session[], exerciseId: string) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime(),
  );
  for (const session of sorted) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    const done = entry?.sets.filter((s) => s.completed) ?? [];
    if (done.length) return done;
  }
  return null;
}


export type ExerciseAnalytics = {
  pr: number | null;
  history: { date: string; sets: SetLog[]; maxWeight: number; volume: number; estimated1RM: number }[];
  lastSets: SetLog[] | null;
};

export function buildExerciseAnalyticsIndex(sessions: Session[]) {
  const index = new Map<string, ExerciseAnalytics>();
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(b.finishedAt ?? b.startedAt).getTime() -
      new Date(a.finishedAt ?? a.startedAt).getTime(),
  );

  for (const session of sortedSessions) {
    for (const entry of session.entries) {
      const completedSets = entry.sets.filter((set) => set.completed);
      if (!completedSets.length) continue;

      const current = index.get(entry.exerciseId) ?? {
        pr: null,
        history: [],
        lastSets: null,
      };

      for (const set of completedSets) {
        if (set.weight != null) {
          current.pr = current.pr == null ? set.weight : Math.max(current.pr, set.weight);
        }
      }

      current.history.push({
        date: session.finishedAt ?? session.startedAt,
        sets: completedSets,
        maxWeight: Math.max(...completedSets.map((set) => set.weight ?? 0)),
        volume: completedSets.reduce((total, set) => total + setVolume(set), 0),
        estimated1RM: Math.max(...completedSets.map(estimateSet1RM), 0),
      });

      if (!current.lastSets) current.lastSets = completedSets;

      index.set(entry.exerciseId, current);
    }
  }

  for (const value of index.values()) {
    value.history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  return index;
}
export type WorkoutExerciseAnalytics = {
  lastSets: SetLog[] | null;
};

export function buildWorkoutExerciseAnalyticsIndex(sessions: Session[]) {
  const index = new Map<string, WorkoutExerciseAnalytics>();
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(b.finishedAt ?? b.startedAt).getTime() -
      new Date(a.finishedAt ?? a.startedAt).getTime(),
  );

  for (const session of sortedSessions) {
    for (const entry of session.entries) {
      const completedSets = entry.sets.filter((set) => set.completed);
      if (!completedSets.length) continue;

      const key = `${session.workoutId}::${entry.exerciseId}`;
      if (!index.has(key)) {
        index.set(key, { lastSets: completedSets });
      }
    }
  }

  return index;
}
