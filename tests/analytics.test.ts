import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExerciseAnalyticsIndex, estimateSet1RM, setVolume, exerciseProgressionFor } from "../src/store/gym-analytics.ts";

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
  const { buildWorkoutAnalyticsIndex } = require("../src/store/gym-analytics.ts");
  const analytics = buildWorkoutAnalyticsIndex(sessions);
  const workout = analytics.get("w1");
  assert.equal(workout?.sessions.length, 2);
  assert.equal(workout?.latestVolume, 680);
  assert.equal(workout?.previousVolume, 600);
  assert.equal(workout?.volumeChangePercent, 13.3);
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
  const { buildPeriodAnalytics } = require("../src/store/gym-analytics.ts");
  const weekly = buildPeriodAnalytics(sessions, "week");
  const monthly = buildPeriodAnalytics(sessions, "month");
  assert.equal(weekly.length, 2);
  assert.equal(weekly[0]?.sessions, 1);
  assert.equal(monthly.length, 1);
  assert.equal(monthly[0]?.volume, 650);
});
