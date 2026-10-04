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

export type ExerciseProgression = {
  latest: {
    date: string;
    volume: number;
    maxWeight: number;
    estimated1RM: number;
  };
  previous: {
    date: string;
    volume: number;
    maxWeight: number;
    estimated1RM: number;
  } | null;
  volumeChangePercent: number | null;
  estimated1RMChangePercent: number | null;
  recommendation: "increase-load" | "add-reps" | "maintain" | "recover";
};

export function exerciseProgressionFromHistory(
  history: ExerciseAnalytics["history"],
): ExerciseProgression | null {
  if (!history.length) return null;

  const latest = history[0];
  if (!latest) return null;

  const previous = history[1] ?? null;
  if (!previous) {
    return {
      latest,
      previous: null,
      volumeChangePercent: null,
      estimated1RMChangePercent: null,
      recommendation: "maintain",
    };
  }

  const percentChange = (current: number, prior: number) =>
    prior > 0 ? Math.round(((current - prior) / prior) * 1000) / 10 : null;

  const volumeChangePercent = percentChange(latest.volume, previous.volume);
  const estimated1RMChangePercent = percentChange(
    latest.estimated1RM,
    previous.estimated1RM,
  );

  let recommendation: ExerciseProgression["recommendation"] = "maintain";
  if (latest.estimated1RM >= previous.estimated1RM * 1.025) {
    recommendation = "increase-load";
  } else if (latest.estimated1RM >= previous.estimated1RM) {
    recommendation = "add-reps";
  } else if (latest.estimated1RM < previous.estimated1RM * 0.95) {
    recommendation = "recover";
  }

  return {
    latest,
    previous,
    volumeChangePercent,
    estimated1RMChangePercent,
    recommendation,
  };
}

export function exerciseProgressionFor(
  sessions: Session[],
  exerciseId: string,
): ExerciseProgression | null {
  return exerciseProgressionFromHistory(exerciseHistoryFor(sessions, exerciseId));
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
export type WorkoutAnalytics = {
  workoutId: string;
  workoutName: string;
  sessions: {
    sessionId: string;
    date: string;
    durationSeconds: number;
    volume: number;
    sets: number;
    exercises: number;
  }[];
  totalVolume: number;
  totalSets: number;
  averageDurationSeconds: number;
  latestVolume: number;
  previousVolume: number | null;
  volumeChangePercent: number | null;
};

export type PeriodAnalytics = {
  key: string;
  label: string;
  sessions: number;
  volume: number;
  sets: number;
};

export function sessionVolume(session: Session) {
  return session.entries.reduce(
    (total, entry) =>
      total +
      entry.sets.reduce((sum, set) => sum + setVolume(set), 0),
    0,
  );
}

export function sessionSetCount(session: Session) {
  return session.entries.reduce((total, entry) => total + entry.sets.length, 0);
}

export function sessionDurationSeconds(session: Session) {
  if (!session.finishedAt) return 0;
  return Math.max(
    0,
    Math.floor(
      (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) /
        1000,
    ),
  );
}

function percentChange(current: number, prior: number) {
  return prior > 0 ? Math.round(((current - prior) / prior) * 1000) / 10 : null;
}

export function buildWorkoutAnalyticsIndex(sessions: Session[]) {
  const index = new Map<string, WorkoutAnalytics>();
  const sortedSessions = [...sessions]
    .filter((session) => session.finishedAt)
    .sort(
      (a, b) =>
        new Date(b.finishedAt ?? b.startedAt).getTime() -
        new Date(a.finishedAt ?? a.startedAt).getTime(),
    );

  for (const session of sortedSessions) {
    const current = index.get(session.workoutId) ?? {
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      sessions: [],
      totalVolume: 0,
      totalSets: 0,
      averageDurationSeconds: 0,
      latestVolume: 0,
      previousVolume: null,
      volumeChangePercent: null,
    };

    const volume = sessionVolume(session);
    const sets = sessionSetCount(session);
    current.sessions.push({
      sessionId: session.id,
      date: session.finishedAt ?? session.startedAt,
      durationSeconds: sessionDurationSeconds(session),
      volume,
      sets,
      exercises: session.entries.length,
    });
    current.totalVolume += volume;
    current.totalSets += sets;

    index.set(session.workoutId, current);
  }

  for (const value of index.values()) {
    const durations = value.sessions.map((session) => session.durationSeconds);
    value.averageDurationSeconds = durations.length
      ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
      : 0;
    value.latestVolume = value.sessions[0]?.volume ?? 0;
    value.previousVolume = value.sessions[1]?.volume ?? null;
    value.volumeChangePercent =
      value.previousVolume != null
        ? percentChange(value.latestVolume, value.previousVolume)
        : null;
  }

  return index;
}

export function buildPeriodAnalytics(
  sessions: Session[],
  period: "week" | "month",
) {
  const groups = new Map<string, PeriodAnalytics>();

  for (const session of sessions) {
    if (!session.finishedAt) continue;
    const date = new Date(session.finishedAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    let key: string;
    let label: string;
    if (period === "week") {
      const mondayOffset = (date.getDay() + 6) % 7;
      const start = new Date(year, month, day - mondayOffset);
      key = start.toISOString().slice(0, 10);
      label = start.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } else {
      key = `${year}-${String(month + 1).padStart(2, "0")}`;
      label = date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
    }

    const current = groups.get(key) ?? {
      key,
      label,
      sessions: 0,
      volume: 0,
      sets: 0,
    };
    current.sessions += 1;
    current.volume += sessionVolume(session);
    current.sets += sessionSetCount(session);
    groups.set(key, current);
  }

  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
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
