import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGamificationSummary } from "../src/store/gym-gamification.ts";

function session(id: string, date: string, pr = false) {
  return {
    id, routineId:"r", workoutId:"w", workoutName:"Treino",
    startedAt: date, finishedAt: date,
    entries:[{exerciseId:"ex",sets:[
      {weight:100,reps:5,completed:true,isPR:pr},
      {weight:100,reps:5,completed:true},
    ]}],
  };
}

test("calcula XP, nível e conquistas básicas", () => {
  const summary = buildGamificationSummary([
    session("1","2026-10-01T10:00:00.000Z",true),
    session("2","2026-10-02T10:00:00.000Z"),
    session("3","2026-10-03T10:00:00.000Z"),
  ]);
  assert.equal(summary.totalSessions,3);
  assert.equal(summary.totalSets,6);
  assert.equal(summary.currentStreak,3);
  assert.equal(summary.bestStreak,3);
  assert.equal(summary.achievements.find(a => a.id === "first-workout")?.unlocked,true);
  assert.equal(summary.achievements.find(a => a.id === "streak-three")?.unlocked,true);
  assert.ok(summary.xp > 0);
});

test("não conta sessão ativa ou dias repetidos como treinos extras na sequência", () => {
  const summary = buildGamificationSummary([
    session("1","2026-10-01T10:00:00.000Z"),
    session("2","2026-10-01T18:00:00.000Z"),
    { ...session("active","2026-10-02T10:00:00.000Z"), finishedAt:null },
  ]);
  assert.equal(summary.totalSessions,2);
  assert.equal(summary.currentStreak,1);
});
