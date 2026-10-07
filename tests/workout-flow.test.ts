import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorkoutSession,
  finishWorkoutSession,
  updateWorkoutSessionSet,
} from "../src/store/gym-session.ts";

const routine = {
  id: "r1",
  name: "Rotina",
  createdAt: "2026-10-05T00:00:00.000Z",
  workouts: [],
};

const workout = {
  id: "w1",
  name: "Treino A",
  days: [1],
  exerciseIds: ["supino", "remada"],
  targetSets: { supino: 2, remada: 3 },
};

test("fluxo de início cria a sessão com todas as séries planejadas", () => {
  const session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  assert.equal(session.finishedAt, null);
  assert.equal(session.entries.length, 2);
  assert.equal(session.entries[0]?.sets.length, 2);
  assert.equal(session.entries[1]?.sets.length, 3);
  assert.equal(session.entries[0]?.sets[0]?.completed, false);
});

test("atualização de série preserva o fluxo e marca PR progressivamente", () => {
  let session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  session = updateWorkoutSessionSet(
    session,
    "supino",
    0,
    { weight: 60, reps: 10, completed: true },
    50,
  );
  assert.equal(session.entries[0]?.sets[0]?.isPR, true);

  session = updateWorkoutSessionSet(
    session,
    "supino",
    1,
    { weight: 55, reps: 10, completed: true },
    50,
  );
  assert.equal(session.entries[0]?.sets[1]?.isPR, false);
  assert.equal(session.entries[0]?.sets[0]?.weight, 60);
});

test("finalização salva somente séries concluídas e registra finishedAt", () => {
  let session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  session = updateWorkoutSessionSet(session, "supino", 0, { weight: 60, reps: 10, completed: true }, 0);
  const finished = finishWorkoutSession(session, "2026-10-05T11:00:00.000Z");

  assert.ok(finished);
  assert.equal(finished?.finishedAt, "2026-10-05T11:00:00.000Z");
  assert.equal(finished?.entries.length, 1);
  assert.equal(finished?.entries[0]?.sets.length, 1);
  assert.equal(finished?.entries[0]?.sets[0]?.completed, true);
});

test("finalização sem nenhuma série concluída não cria histórico", () => {
  const session = createWorkoutSession(routine, workout, "s1", "2026-10-05T10:00:00.000Z");
  assert.equal(finishWorkoutSession(session, "2026-10-05T11:00:00.000Z"), null);
});
import { buildDashboardAnalytics, buildPersonalRecords, workoutExerciseProgressionFor, workoutExerciseRecommendationFor } from "../src/store/gym-analytics.ts";

test("progressão usa o histórico do mesmo treino, sem misturar outro treino", () => {
  const sessions = [
    {
      id: "s2", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 10, completed: true }] }],
    },
    {
      id: "s3", routineId: "r1", workoutId: "w2", workoutName: "Treino B",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 100, reps: 10, completed: true }] }],
    },
    {
      id: "s1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-05T10:00:00.000Z", finishedAt: "2026-10-05T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 50, reps: 10, completed: true }] }],
    },
  ];
  const progression = workoutExerciseProgressionFor(sessions, "w1", "supino");
  assert.equal(progression?.latest.maxWeight, 60);
  assert.equal(progression?.previous?.maxWeight, 50);
  assert.equal(progression?.recommendation, "increase-load");
});


test("recordes pessoais preservam o melhor peso, 1RM estimado e volume por exercício", () => {
  const records = buildPersonalRecords([
    {
      id: "s1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-05T10:00:00.000Z", finishedAt: "2026-10-05T11:00:00.000Z",
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 60, reps: 10, completed: true },
          { weight: 70, reps: 6, completed: true },
        ],
      }],
    },
    {
      id: "s2", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 65, reps: 10, completed: true },
          { weight: 72.5, reps: 5, completed: true },
        ],
      }],
    },
  ]);

  assert.equal(records.length, 1);
  assert.equal(records[0]?.maxWeight, 72.5);
  assert.equal(records[0]?.maxVolume, 1020);
  assert.equal(records[0]?.sessions, 2);
  assert.equal(records[0]?.estimated1RM, 86.7);
});


test("recomendação de progressão calcula uma meta pequena e específica", () => {
  const sessions = [
    {
      id: "s2", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 10, completed: true }] }],
    },
    {
      id: "s1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-05T10:00:00.000Z", finishedAt: "2026-10-05T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 50, reps: 10, completed: true }] }],
    },
  ];

  const recommendation = workoutExerciseRecommendationFor(sessions, "w1", "supino");
  assert.equal(recommendation?.action, "increase-load");
  assert.equal(recommendation?.targetWeight, 61.5);
  assert.equal(recommendation?.targetReps, 10);
});


test("dashboard calcula métricas de consistência e volume de 30 dias", () => {
  const sessions = [
    {
      id: "s1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 50, reps: 10, completed: true }] }],
    },
  ];
  const dashboard = buildDashboardAnalytics(sessions);
  assert.equal(dashboard.sessionsLast30Days, 1);
  assert.equal(dashboard.volumeLast30Days, 500);
  assert.equal(dashboard.activeWeeksLast8, 1);
  assert.equal(dashboard.averageSessionsPerWeek, 0.3);
  assert.equal(dashboard.bestSessionVolume, 500);
  assert.equal(dashboard.topExercises[0]?.exerciseId, "supino");
  assert.equal(dashboard.topExercises[0]?.volume, 500);
});

import { buildWeeklyGoalInsights } from "../src/store/gym-analytics.ts";

test("orientação de metas interpreta ritmo semanal e calcula o que falta", () => {
  const goals = { weeklySessionsTarget: 4, weeklyVolumeTarget: 1000, streakTarget: 3 };
  const sessions = [
    {
      id: "s1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-05T10:00:00.000Z", finishedAt: "2026-10-05T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 100, reps: 5, completed: true }] }],
    },
    {
      id: "s2", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-06T10:00:00.000Z", finishedAt: "2026-10-06T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 100, reps: 5, completed: true }] }],
    },
  ];
  const insights = buildWeeklyGoalInsights(sessions, goals, new Date("2026-10-07T12:00:00.000Z"));
  assert.equal(insights.sessions.current, 2);
  assert.equal(insights.sessions.remaining, 2);
  assert.equal(insights.sessions.progressPercent, 50);
  assert.equal(insights.volume.current, 1000);
  assert.equal(insights.volume.remaining, 0);
  assert.equal(insights.volume.status, "complete");
});

test("orientação de metas sinaliza atraso quando o ritmo fica abaixo do esperado", () => {
  const goals = { weeklySessionsTarget: 5, weeklyVolumeTarget: 5000, streakTarget: 7 };
  const insights = buildWeeklyGoalInsights([], goals, new Date("2026-10-07T12:00:00.000Z"));
  assert.equal(insights.overallStatus, "behind");
  assert.equal(insights.sessions.remaining, 5);
  assert.equal(insights.volume.remaining, 5000);
  assert.equal(insights.daysRemaining, 4);
});


test("progressão avançada detecta evolução consistente e aumenta a carga", () => {
  const sessions = [1, 2, 3].map((day, index) => ({
    id: "trend-" + index, routineId: "r1", workoutId: "w1", workoutName: "Treino A",
    startedAt: "2026-10-" + String(day + 1).padStart(2, "0") + "T10:00:00.000Z",
    finishedAt: "2026-10-" + String(day + 1).padStart(2, "0") + "T11:00:00.000Z",
    entries: [{ exerciseId: "supino", sets: [{ weight: 50 + index * 5, reps: 10, completed: true }] }],
  }));
  const recommendation = workoutExerciseRecommendationFor(sessions, "w1", "supino");
  assert.equal(recommendation?.action, "increase-load");
  assert.equal(recommendation?.trend, "improving");
  assert.equal(recommendation?.confidence, "high");
});

test("progressão avançada detecta queda consistente e recomenda recuperação", () => {
  const sessions = [1, 2, 3].map((day, index) => ({
    id: "decline-" + index, routineId: "r1", workoutId: "w1", workoutName: "Treino A",
    startedAt: "2026-10-" + String(day + 1).padStart(2, "0") + "T10:00:00.000Z",
    finishedAt: "2026-10-" + String(day + 1).padStart(2, "0") + "T11:00:00.000Z",
    entries: [{ exerciseId: "supino", sets: [{ weight: 70 - index * 10, reps: 10, completed: true }] }],
  }));
  const recommendation = workoutExerciseRecommendationFor(sessions, "w1", "supino");
  assert.equal(recommendation?.action, "recover");
  assert.equal(recommendation?.trend, "declining");
  assert.equal(recommendation?.confidence, "high");
});
