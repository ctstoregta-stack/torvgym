import type { Session } from "@/lib/types";
import { sessionSetCount, sessionVolume } from "./gym-analytics.ts";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  xp: number;
};

export type GamificationSummary = {
  xp: number;
  level: number;
  levelProgress: number;
  currentStreak: number;
  bestStreak: number;
  currentWeekStreak: number;
  bestWeekStreak: number;
  totalSessions: number;
  totalVolume: number;
  totalSets: number;
  achievements: Achievement[];
};

function dayKey(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uniqueTrainingDays(sessions: Session[]) {
  return [...new Set(sessions.filter((s) => s.finishedAt).map((s) => dayKey(s.finishedAt!)))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function consecutiveFromEnd(days: string[]) {
  if (!days.length) return 0;
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const current = new Date(days[i]! + "T12:00:00");
    const previous = new Date(days[i - 1]! + "T12:00:00");
    const diff = Math.round((current.getTime() - previous.getTime()) / 86400000);
    if (diff !== 1) break;
    streak++;
  }
  return streak;
}

function bestConsecutive(days: string[]) {
  let best = 0;
  let current = 0;
  for (let i = 0; i < days.length; i++) {
    current =
      i > 0 &&
      Math.round(
        (new Date(days[i]! + "T12:00:00").getTime() -
          new Date(days[i - 1]! + "T12:00:00").getTime()) /
          86400000,
      ) === 1
        ? current + 1
        : 1;
    best = Math.max(best, current);
  }
  return best;
}

function mondayKey(value: Date) {
  const monday = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function weekKeyFromDay(day: string) {
  return mondayKey(new Date(`${day}T12:00:00`));
}

function weeklyStreaks(days: string[], now: Date) {
  const activeWeeks = new Set(days.map(weekKeyFromDay));
  const currentWeek = mondayKey(now);
  const cursor = new Date(`${currentWeek}T12:00:00`);
  // A week without training yet does not break the streak until it has ended.
  if (!activeWeeks.has(currentWeek)) cursor.setDate(cursor.getDate() - 7);
  let current = 0;
  while (activeWeeks.has(mondayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  const ordered = [...activeWeeks].sort();
  let best = 0;
  let running = 0;
  let previous: Date | null = null;
  for (const key of ordered) {
    const week = new Date(`${key}T12:00:00`);
    running = previous && week.getTime() - previous.getTime() === 7 * 86400000 ? running + 1 : 1;
    best = Math.max(best, running);
    previous = week;
  }
  return { currentWeekStreak: current, bestWeekStreak: best };
}

export function buildGamificationSummary(
  sessions: Session[],
  now = new Date(),
): GamificationSummary {
  const completed = sessions.filter((s) => s.finishedAt);
  const totalSessions = completed.length;
  const totalVolume = completed.reduce((n, s) => n + sessionVolume(s), 0);
  const totalSets = completed.reduce((n, s) => n + sessionSetCount(s), 0);
  const prs = completed.reduce(
    (n, s) =>
      n + s.entries.reduce((e, entry) => e + entry.sets.filter((set) => set.isPR).length, 0),
    0,
  );
  const validCompleted = completed.filter((s) => {
    const timestamp = s.finishedAt ? new Date(s.finishedAt).getTime() : Number.NaN;
    return Number.isFinite(timestamp) && timestamp <= now.getTime();
  });
  const days = uniqueTrainingDays(validCompleted);
  const currentStreak = consecutiveFromEnd(days);
  const bestStreak = bestConsecutive(days);
  const weekStreaks = weeklyStreaks(days, now);

  const xp = totalSessions * 100 + totalSets * 5 + Math.floor(totalVolume / 100) + prs * 50;
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = xp % 500;

  const achievements: Achievement[] = [
    {
      id: "first-workout",
      title: "Primeiro passo",
      description: "Conclua seu primeiro treino.",
      unlocked: totalSessions >= 1,
      progress: Math.min(totalSessions, 1),
      target: 1,
      xp: 100,
    },
    {
      id: "five-workouts",
      title: "Constância",
      description: "Conclua 5 treinos.",
      unlocked: totalSessions >= 5,
      progress: Math.min(totalSessions, 5),
      target: 5,
      xp: 150,
    },
    {
      id: "ten-workouts",
      title: "Ritmo forte",
      description: "Conclua 10 treinos.",
      unlocked: totalSessions >= 10,
      progress: Math.min(totalSessions, 10),
      target: 10,
      xp: 250,
    },
    {
      id: "hundred-sets",
      title: "Volume de trabalho",
      description: "Complete 100 séries.",
      unlocked: totalSets >= 100,
      progress: Math.min(totalSets, 100),
      target: 100,
      xp: 300,
    },
    {
      id: "ton-volume",
      title: "Uma tonelada",
      description: "Acumule 1.000 kg de volume.",
      unlocked: totalVolume >= 1000,
      progress: Math.min(Math.round(totalVolume), 1000),
      target: 1000,
      xp: 250,
    },
    {
      id: "first-pr",
      title: "Novo recorde",
      description: "Conquiste seu primeiro PR.",
      unlocked: prs >= 1,
      progress: Math.min(prs, 1),
      target: 1,
      xp: 150,
    },
    {
      id: "streak-three",
      title: "Sequência",
      description: "Treine em 3 dias consecutivos.",
      unlocked: bestStreak >= 3,
      progress: Math.min(bestStreak, 3),
      target: 3,
      xp: 200,
    },
    {
      id: "streak-seven",
      title: "Semana de ferro",
      description: "Treine em 7 dias consecutivos.",
      unlocked: bestStreak >= 7,
      progress: Math.min(bestStreak, 7),
      target: 7,
      xp: 500,
    },
    {
      id: "weekly-consistency-four",
      title: "Constância de verdade",
      description: "Treine em 4 semanas consecutivas, respeitando os dias de descanso.",
      unlocked: weekStreaks.bestWeekStreak >= 4,
      progress: Math.min(weekStreaks.bestWeekStreak, 4),
      target: 4,
      xp: 350,
    },
  ];

  return {
    xp,
    level,
    levelProgress,
    currentStreak,
    bestStreak,
    ...weekStreaks,
    totalSessions,
    totalVolume,
    totalSets,
    achievements,
  };
}
