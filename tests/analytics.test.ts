import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExerciseAnalyticsIndex, estimateSet1RM, setVolume } from "../src/store/gym-analytics.ts";

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
