import type { Session, SetLog } from "@/lib/types";

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
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as {
      date: string;
      sets: SetLog[];
      maxWeight: number;
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
