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
    sets: SetLog[];
    volume: number;
    maxWeight: number;
    estimated1RM: number;
  };
  previous: {
    date: string;
    sets: SetLog[];
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
      key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
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

export type DashboardAnalytics = {
  totalSessions: number;
  totalVolume: number;
  totalSets: number;
  totalPRs: number;
  averageDurationSeconds: number;
  sessionsLast7Days: number;
  volumeLast7Days: number;
  sessionsLast30Days: number;
  volumeLast30Days: number;
  averageSessionsPerWeek: number;
  activeWeeksLast8: number;
  bestSessionVolume: number;
  streakDays: number;
  latestPR: {
    exerciseId: string;
    weight: number;
    date: string;
  } | null;
  volumeChangePercent: number | null;
  topExercises: {
    exerciseId: string;
    volume: number;
    estimated1RM: number;
    pr: number | null;
  }[];
};

export function buildDashboardAnalytics(sessions: Session[]): DashboardAnalytics {
  const completed = sessions.filter((session) => session.finishedAt);
  const sorted = [...completed].sort(
    (a, b) =>
      new Date(b.finishedAt ?? b.startedAt).getTime() -
      new Date(a.finishedAt ?? a.startedAt).getTime(),
  );
  const totalVolume = completed.reduce((sum, session) => sum + sessionVolume(session), 0);
  const totalSets = completed.reduce((sum, session) => sum + sessionSetCount(session), 0);
  const totalPRs = completed.reduce(
    (sum, session) =>
      sum +
      session.entries.reduce(
        (entrySum, entry) =>
          entrySum + entry.sets.filter((set) => set.completed && set.isPR).length,
        0,
      ),
    0,
  );
  const durations = completed.map(sessionDurationSeconds);
  const latest = sorted[0];
  const previous = sorted[1];
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = completed.filter(
    (session) => new Date(session.finishedAt ?? session.startedAt).getTime() >= recentCutoff,
  );
  const sessionsLast7Days = recentSessions.length;
  const volumeLast7Days = recentSessions.reduce((sum, session) => sum + sessionVolume(session), 0);
  const recent30Cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent30Sessions = completed.filter(
    (session) => new Date(session.finishedAt ?? session.startedAt).getTime() >= recent30Cutoff,
  );
  const sessionsLast30Days = recent30Sessions.length;
  const volumeLast30Days = recent30Sessions.reduce((sum, session) => sum + sessionVolume(session), 0);
  const averageSessionsPerWeek = Math.round((sessionsLast30Days / 4) * 10) / 10;
  const activeWeeksLast8 = new Set(
    completed
      .filter((session) => new Date(session.finishedAt ?? session.startedAt).getTime() >= Date.now() - 56 * 24 * 60 * 60 * 1000)
      .map((session) => {
        const date = new Date(session.finishedAt ?? session.startedAt);
        const mondayOffset = (date.getDay() + 6) % 7;
        const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset);
        return monday.toISOString().slice(0, 10);
      }),
  ).size;
  const bestSessionVolume = completed.reduce((best, session) => Math.max(best, sessionVolume(session)), 0);

  const dayKeys = new Set(
    completed.map((session) => {
      const date = new Date(session.finishedAt ?? session.startedAt);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }),
  );
  const latestDate = sorted[0]?.finishedAt ?? sorted[0]?.startedAt;
  let streakDays = 0;
  if (latestDate) {
    const cursor = new Date(latestDate);
    cursor.setHours(0, 0, 0, 0);
    while (dayKeys.has(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`)) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let latestPR: DashboardAnalytics["latestPR"] = null;
  for (const session of sorted) {
    if (!session.finishedAt) continue;
    for (const entry of session.entries) {
      const prSet = entry.sets.find((set) => set.completed && set.isPR && set.weight != null);
      if (prSet?.weight != null) {
        latestPR = { exerciseId: entry.exerciseId, weight: prSet.weight, date: session.finishedAt };
        break;
      }
    }
    if (latestPR) break;
  }

  const exerciseMap = new Map<
    string,
    { volume: number; estimated1RM: number; pr: number | null }
  >();
  for (const session of completed) {
    for (const entry of session.entries) {
      const current = exerciseMap.get(entry.exerciseId) ?? {
        volume: 0,
        estimated1RM: 0,
        pr: null,
      };
      for (const set of entry.sets) {
        if (!set.completed) continue;
        current.volume += setVolume(set);
        current.estimated1RM = Math.max(current.estimated1RM, estimateSet1RM(set));
        if (set.weight != null) {
          current.pr = current.pr == null ? set.weight : Math.max(current.pr, set.weight);
        }
      }
      exerciseMap.set(entry.exerciseId, current);
    }
  }

  return {
    totalSessions: completed.length,
    totalVolume,
    totalSets,
    totalPRs,
    averageDurationSeconds: durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0,
    sessionsLast7Days,
    volumeLast7Days,
    sessionsLast30Days,
    volumeLast30Days,
    averageSessionsPerWeek,
    activeWeeksLast8,
    bestSessionVolume,
    streakDays,
    latestPR,
    volumeChangePercent:
      latest && previous
        ? percentChange(sessionVolume(latest), sessionVolume(previous))
        : null,
    topExercises: [...exerciseMap.entries()]
      .map(([exerciseId, data]) => ({ exerciseId, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5),
  };
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

export function workoutExerciseHistoryFor(
  sessions: Session[],
  workoutId: string,
  exerciseId: string,
) {
  return exerciseHistoryFor(
    sessions.filter((session) => session.workoutId === workoutId),
    exerciseId,
  );
}

export function workoutExerciseProgressionFor(
  sessions: Session[],
  workoutId: string,
  exerciseId: string,
) {
  return exerciseProgressionFromHistory(
    workoutExerciseHistoryFor(sessions, workoutId, exerciseId),
  );
}


export type PersonalRecord = {
  exerciseId: string;
  maxWeight: number;
  estimated1RM: number;
  maxVolume: number;
  latestDate: string;
  sessions: number;
};

export function buildPersonalRecords(sessions: Session[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>();
  const completed = sessions.filter((session) => session.finishedAt);

  for (const session of completed) {
    for (const entry of session.entries) {
      const sets = entry.sets.filter(
        (set) => set.completed && (set.weight ?? 0) > 0 && (set.reps ?? 0) > 0,
      );
      if (!sets.length) continue;

      const current = records.get(entry.exerciseId) ?? {
        exerciseId: entry.exerciseId,
        maxWeight: 0,
        estimated1RM: 0,
        maxVolume: 0,
        latestDate: session.finishedAt ?? session.startedAt,
        sessions: 0,
      };

      current.maxWeight = Math.max(current.maxWeight, ...sets.map((set) => set.weight ?? 0));
      current.estimated1RM = Math.max(current.estimated1RM, ...sets.map(estimateSet1RM));
      current.maxVolume = Math.max(
        current.maxVolume,
        sets.reduce((sum, set) => sum + setVolume(set), 0),
      );
      current.sessions += 1;

      if (
        new Date(session.finishedAt ?? session.startedAt).getTime() >
        new Date(current.latestDate).getTime()
      ) {
        current.latestDate = session.finishedAt ?? session.startedAt;
      }

      records.set(entry.exerciseId, current);
    }
  }

  return [...records.values()].sort((a, b) => {
    if (b.maxWeight !== a.maxWeight) return b.maxWeight - a.maxWeight;
    return b.estimated1RM - a.estimated1RM;
  });
}


export type ProgressionRecommendation = {
  action: ExerciseProgression["recommendation"];
  targetWeight: number | null;
  targetReps: number | null;
  reason: string;
};

function roundLoad(value: number) {
  return Math.round(value * 2) / 2;
}

export function workoutExerciseRecommendationFor(
  sessions: Session[],
  workoutId: string,
  exerciseId: string,
): ProgressionRecommendation | null {
  const history = workoutExerciseHistoryFor(sessions, workoutId, exerciseId);
  const progression = exerciseProgressionFromHistory(history);
  if (!progression) return null;

  const latestSet = progression.latest.sets
    .filter((set) => set.weight != null && set.reps != null)
    .sort((a, b) => (b.reps ?? 0) - (a.reps ?? 0))[0];

  const latestWeight = latestSet?.weight ?? progression.latest.maxWeight;
  const latestReps = latestSet?.reps ?? null;

  switch (progression.recommendation) {
    case "increase-load":
      return {
        action: "increase-load",
        targetWeight: latestWeight > 0 ? roundLoad(latestWeight * 1.025) : null,
        targetReps: latestReps,
        reason: "Seu 1RM estimado evoluiu o suficiente para testar uma pequena progressão de carga.",
      };
    case "add-reps":
      return {
        action: "add-reps",
        targetWeight: latestWeight || null,
        targetReps: latestReps != null ? latestReps + 1 : null,
        reason: "Mantenha a carga atual e tente ganhar uma repetição com boa execução.",
      };
    case "recover":
      return {
        action: "recover",
        targetWeight: latestWeight > 0 ? roundLoad(latestWeight * 0.9) : null,
        targetReps: latestReps,
        reason: "O desempenho caiu de forma relevante; reduza a carga e priorize recuperação.",
      };
    default:
      return {
        action: "maintain",
        targetWeight: latestWeight || null,
        targetReps: latestReps,
        reason: "Consolide a carga atual antes de buscar nova progressão.",
      };
  }
}


export type GoalStatus = "ahead" | "on-track" | "behind" | "complete";

export type GoalInsight = {
  current: number;
  target: number;
  remaining: number;
  progressPercent: number;
  status: GoalStatus;
};

export type WeeklyGoalInsights = {
  sessions: GoalInsight;
  volume: GoalInsight;
  streak: GoalInsight;
  overallStatus: GoalStatus;
  daysElapsed: number;
  daysRemaining: number;
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

function goalInsight(current: number, target: number, expectedProgress: number): GoalInsight {
  const safeTarget = Math.max(target, 1);
  const progressPercent = Math.round((current / safeTarget) * 100);
  const remaining = Math.max(0, safeTarget - current);
  const status: GoalStatus = current >= safeTarget
    ? "complete"
    : progressPercent >= Math.round(expectedProgress * 100) + 15
      ? "ahead"
      : progressPercent < Math.max(0, Math.round(expectedProgress * 100) - 15)
        ? "behind"
        : "on-track";
  return { current, target: safeTarget, remaining, progressPercent, status };
}

export function buildWeeklyGoalInsights(
  sessions: Session[],
  goals: import("@/lib/types").TrainingGoals,
  now = new Date(),
): WeeklyGoalInsights {
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const completed = sessions.filter((session) => {
    if (!session.finishedAt) return false;
    const finished = new Date(session.finishedAt);
    return finished >= weekStart && finished < weekEnd;
  });
  const weekSessions = completed.length;
  const weekVolume = completed.reduce((sum, session) => sum + sessionVolume(session), 0);
  const dashboard = buildDashboardAnalytics(sessions);
  const dayOfWeek = now.getDay();
  const daysElapsed = Math.min(7, Math.max(1, dayOfWeek === 0 ? 7 : dayOfWeek));
  const expectedProgress = daysElapsed / 7;
  const daysRemaining = Math.max(0, 7 - daysElapsed);
  const sessionsInsight = goalInsight(weekSessions, goals.weeklySessionsTarget, expectedProgress);
  const volumeInsight = goalInsight(weekVolume, goals.weeklyVolumeTarget, expectedProgress);
  const streakInsight = goalInsight(dashboard.streakDays, goals.streakTarget, expectedProgress);

  const allComplete = [sessionsInsight, volumeInsight, streakInsight].every((item) => item.status === "complete");
  const anyBehind = [sessionsInsight, volumeInsight, streakInsight].some((item) => item.status === "behind");
  const overallStatus: GoalStatus = allComplete
    ? "complete"
    : anyBehind
      ? "behind"
      : [sessionsInsight, volumeInsight, streakInsight].every((item) => item.status === "ahead")
        ? "ahead"
        : "on-track";

  return {
    sessions: sessionsInsight,
    volume: volumeInsight,
    streak: streakInsight,
    overallStatus,
    daysElapsed,
    daysRemaining,
  };
}
