import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDashboardAnalytics, buildExerciseAnalyticsIndex, buildPeriodAnalytics, buildWorkoutAnalyticsIndex, estimateSet1RM, setVolume, exerciseProgressionFor, workoutExerciseHistoryFor } from "../src/store/gym-analytics.ts";

test("calcula volume e 1RM estimado de uma série", () => {
  const set = { weight: 60, reps: 10, completed: true };
  assert.equal(setVolume(set), 600);
  assert.equal(estimateSet1RM(set), 80);
});

test("analytics por exercício agrega volume e melhor 1RM por sessão", () => {
  const sessions = [{
    id: "s1",
    routineId: "r1",
    workoutId: "w1",
    workoutName: "Treino A",
    startedAt: "2026-10-01T10:00:00.000Z",
    finishedAt: "2026-10-01T11:00:00.000Z",
    entries: [{
      exerciseId: "supino",
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 70, reps: 5, completed: true },
        { weight: null, reps: null, completed: false },
      ],
    }],
  }];
  const analytics = buildExerciseAnalyticsIndex(sessions);
  const history = analytics.get("supino")?.history[0];
  assert.equal(history?.volume, 950);
  assert.equal(history?.estimated1RM, 81.7);
  assert.equal(analytics.get("supino")?.pr, 70);
});


test("gera tendência e sugestão conservadora de progressão", () => {
  const sessions = [
    {
      id: "s2",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-03T10:00:00.000Z",
      finishedAt: "2026-10-03T11:00:00.000Z",
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 72.5, reps: 5, completed: true },
          { weight: 70, reps: 6, completed: true },
        ],
      }],
    },
    {
      id: "s1",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-01T10:00:00.000Z",
      finishedAt: "2026-10-01T11:00:00.000Z",
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 70, reps: 5, completed: true },
          { weight: 65, reps: 6, completed: true },
        ],
      }],
    },
  ];
  const progression = exerciseProgressionFor(sessions, "supino");
  assert.equal(progression?.volumeChangePercent, 5.7);
  assert.equal(progression?.recommendation, "increase-load");
});


test("analytics por treino calcula duração, volume, séries e evolução", () => {
  const sessions = [
    {
      id: "s2",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-03T10:00:00.000Z",
      finishedAt: "2026-10-03T11:10:00.000Z",
      entries: [
        { exerciseId: "supino", sets: [
          { weight: 70, reps: 5, completed: true },
          { weight: 70, reps: 5, completed: true },
        ] },
        { exerciseId: "voador", sets: [
          { weight: 40, reps: 10, completed: true },
        ] },
      ],
    },
    {
      id: "s1",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-01T10:00:00.000Z",
      finishedAt: "2026-10-01T11:00:00.000Z",
      entries: [
        { exerciseId: "supino", sets: [
          { weight: 60, reps: 5, completed: true },
          { weight: 60, reps: 5, completed: true },
        ] },
      ],
    },
  ];
  const analytics = buildWorkoutAnalyticsIndex(sessions);
  const workout = analytics.get("r1::w1");
  assert.equal(workout?.sessions.length, 2);
  assert.equal(workout?.latestVolume, 1100);
  assert.equal(workout?.previousVolume, 600);
  assert.equal(workout?.volumeChangePercent, 83.3);
  assert.equal(workout?.totalSets, 5);
  assert.equal(workout?.averageDurationSeconds, 3900);
});

test("analytics semanal e mensal agrupam sessões, volume e séries", () => {
  const sessions = [
    {
      id: "s1",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-01T10:00:00.000Z",
      finishedAt: "2026-10-01T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 5, completed: true }] }],
    },
    {
      id: "s2",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: "2026-10-08T10:00:00.000Z",
      finishedAt: "2026-10-08T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 70, reps: 5, completed: true }] }],
    },
  ];
  const weekly = buildPeriodAnalytics(sessions, "week");
  const monthly = buildPeriodAnalytics(sessions, "month");
  assert.equal(weekly.length, 2);
  assert.equal(weekly[0]?.sessions, 1);
  assert.equal(monthly.length, 1);
  assert.equal(monthly[0]?.volume, 650);
});


test("dashboard consolida métricas gerais e destaca exercícios por volume", () => {
  const sessions = [
    {
      id: "s2",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: new Date(Date.now() - 2 * 86400000 - 3600000).toISOString(),
      finishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 80, reps: 5, completed: true, isPR: true },
          { weight: 70, reps: 8, completed: true },
        ],
      }],
    },
    {
      id: "s1",
      routineId: "r1",
      workoutId: "w1",
      workoutName: "Treino A",
      startedAt: new Date(Date.now() - 4 * 86400000 - 3600000).toISOString(),
      finishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      entries: [{
        exerciseId: "supino",
        sets: [
          { weight: 70, reps: 5, completed: true },
        ],
      }],
    },
  ];
  const dashboard = buildDashboardAnalytics(sessions);
  assert.equal(dashboard.totalSessions, 2);
  assert.equal(dashboard.totalVolume, 1310);
  assert.equal(dashboard.totalSets, 3);
  assert.equal(dashboard.totalPRs, 1);
  assert.equal(dashboard.sessionsLast7Days, 2);
  assert.equal(dashboard.topExercises[0]?.exerciseId, "supino");
  assert.equal(dashboard.topExercises[0]?.volume, 1310);
});


test("progressão por treino também respeita a rotina quando ids de treino coincidem", () => {
  const sessions = [
    {
      id: "s-r1-new", routineId: "r1", workoutId: "w-shared", workoutName: "Treino A",
      startedAt: "2026-10-10T10:00:00.000Z", finishedAt: "2026-10-10T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 70, reps: 8, completed: true }] }],
    },
    {
      id: "s-r1-old", routineId: "r1", workoutId: "w-shared", workoutName: "Treino A",
      startedAt: "2026-10-03T10:00:00.000Z", finishedAt: "2026-10-03T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 65, reps: 8, completed: true }] }],
    },
    {
      id: "s-r2", routineId: "r2", workoutId: "w-shared", workoutName: "Treino A",
      startedAt: "2026-10-11T10:00:00.000Z", finishedAt: "2026-10-11T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 120, reps: 3, completed: true }] }],
    },
  ];
  const history = workoutExerciseHistoryFor(sessions, "w-shared", "supino", "r1");
  assert.equal(history.length, 2);
  assert.equal(history[0]?.maxWeight, 70);
  assert.equal(history[1]?.maxWeight, 65);
});


test("analytics por treino não mistura rotinas com IDs de treino coincidentes", () => {
  const sessions = [
    {
      id: "same-r1", routineId: "r1", workoutId: "shared", workoutName: "Treino A",
      startedAt: "2026-10-10T10:00:00.000Z", finishedAt: "2026-10-10T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 10, completed: true }] }],
    },
    {
      id: "same-r2", routineId: "r2", workoutId: "shared", workoutName: "Treino A",
      startedAt: "2026-10-11T10:00:00.000Z", finishedAt: "2026-10-11T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 120, reps: 3, completed: true }] }],
    },
  ];
  const analytics = buildWorkoutAnalyticsIndex(sessions);
  assert.equal(analytics.size, 2);
  assert.equal(analytics.get("r1::shared")?.routineId, "r1");
  assert.equal(analytics.get("r1::shared")?.totalVolume, 600);
  assert.equal(analytics.get("r1::shared")?.sessions.length, 1);
  assert.equal(analytics.get("r2::shared")?.routineId, "r2");
  assert.equal(analytics.get("r2::shared")?.totalVolume, 360);
  assert.equal(analytics.get("r2::shared")?.sessions.length, 1);
});


test("dashboard preenche períodos semanais e mensais sem treino com zeros", () => {
  const sessions = [
    {
      id: "s-oct-1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-01T10:00:00.000Z", finishedAt: "2026-10-01T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 5, completed: true }] }],
    },
    {
      id: "s-oct-8", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-08T10:00:00.000Z", finishedAt: "2026-10-08T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 70, reps: 5, completed: true }] }],
    },
  ];

  const weeks = buildPeriodAnalytics(sessions, "week", {
    count: 4,
    referenceDate: new Date("2026-10-13T12:00:00"),
  });
  assert.deepEqual(weeks.map((item) => item.key), ["2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"]);
  assert.deepEqual(weeks.map((item) => item.sessions), [0, 1, 1, 0]);
  assert.equal(weeks[0]?.volume, 0);
  assert.equal(weeks[3]?.sets, 0);

  const months = buildPeriodAnalytics(sessions, "month", {
    count: 3,
    referenceDate: new Date("2026-10-13T12:00:00"),
  });
  assert.deepEqual(months.map((item) => item.key), ["2026-08", "2026-09", "2026-10"]);
  assert.deepEqual(months.map((item) => item.sessions), [0, 0, 2]);
  assert.equal(months[1]?.volume, 0);
});


test("métricas ignoram séries não concluídas mesmo quando carga e repetições foram preenchidas", () => {
  const sessions = [{
    id: "s-pending-set",
    routineId: "r1",
    workoutId: "w1",
    workoutName: "Treino A",
    startedAt: "2026-10-12T10:00:00.000Z",
    finishedAt: "2026-10-12T11:00:00.000Z",
    entries: [{
      exerciseId: "supino",
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 100, reps: 8, completed: false },
      ],
    }],
  }];

  assert.equal(buildWorkoutAnalyticsIndex(sessions).get("r1::w1")?.totalVolume, 600);
  assert.equal(buildWorkoutAnalyticsIndex(sessions).get("r1::w1")?.totalSets, 1);
  assert.equal(buildPeriodAnalytics(sessions, "week").reduce((sum, period) => sum + period.volume, 0), 600);
  assert.equal(buildPeriodAnalytics(sessions, "week").reduce((sum, period) => sum + period.sets, 0), 1);

  const dashboard = buildDashboardAnalytics(sessions);
  assert.equal(dashboard.totalVolume, 600);
  assert.equal(dashboard.totalSets, 1);
});


test("dashboard exclui sessões futuras e calcula consistência semanal sem penalizar descanso", () => {
  const sessions = [
    {
      id: "week-1", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-09-28T10:00:00.000Z", finishedAt: "2026-09-28T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 5, completed: true }] }],
    },
    {
      id: "week-2", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-05T10:00:00.000Z", finishedAt: "2026-10-05T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 65, reps: 5, completed: true }] }],
    },
    {
      id: "future", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
      startedAt: "2026-10-20T10:00:00.000Z", finishedAt: "2026-10-20T11:00:00.000Z",
      entries: [{ exerciseId: "supino", sets: [{ weight: 100, reps: 10, completed: true }] }],
    },
  ];
  const dashboard = buildDashboardAnalytics(sessions, new Date("2026-10-13T12:00:00"));
  assert.equal(dashboard.totalSessions, 2);
  assert.equal(dashboard.totalVolume, 625);
  assert.equal(dashboard.activeWeekStreak, 2);
  assert.equal(dashboard.bestWeekStreak, 2);
});

test("dashboard não mantém sequência atual após ficar mais de um dia sem treinar", () => {
  const sessions = [{
    id: "old", routineId: "r1", workoutId: "w1", workoutName: "Treino A",
    startedAt: "2026-10-01T10:00:00.000Z", finishedAt: "2026-10-01T11:00:00.000Z",
    entries: [{ exerciseId: "supino", sets: [{ weight: 60, reps: 5, completed: true }] }],
  }];
  const dashboard = buildDashboardAnalytics(sessions, new Date("2026-10-13T12:00:00"));
  assert.equal(dashboard.streakDays, 0);
  assert.equal(dashboard.activeWeekStreak, 0);
});
