import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTrainingPlan } from "../src/lib/training-planner.ts";
import type { Exercise } from "../src/lib/types.ts";

const exercise = (
  id: string,
  category: string,
  equipment = "Máquina",
  primary_muscles: string[] = [],
  secondary_muscles: string[] = [],
): Exercise => ({
  id, name: id, category, equipment, gif_url: "", execution: "",
  primary_muscles, secondary_muscles,
});
const database = [
  exercise("chest-a", "Peito", "Máquina", ["Peitoral Maior"]),
  exercise("chest-b", "Peito", "Máquina", ["Deltóide Anterior"]),
  exercise("back-a", "Costas", "Máquina", ["Grande Dorsal"]),
  exercise("back-b", "Costas", "Máquina", ["Rombóides"]),
  exercise("legs-a", "Pernas", "Máquina", ["Quadríceps"]),
  exercise("legs-b", "Pernas", "Máquina", ["Isquiocrurais"]),
  exercise("shoulders", "Ombros", "Halteres", ["Deltóide Lateral"]),
  exercise("arms", "Braços", "Halteres", ["Bíceps Braquial"]),
  exercise("glutes", "Glúteos", "Peso corporal", ["Glúteo Máximo"]),
  exercise("abs", "Abdômen", "Peso corporal", ["Reto Abdominal"]),
];

test("frequência e dias da semana correspondem à seleção", () => {
  const plan = buildTrainingPlan(database, { goal: "hypertrophy", level: "intermediate", frequency: 4, minutes: 45, equipment: "gym" });
  assert.equal(plan.workouts.length, 4);
  assert.deepEqual(plan.workouts.map((workout) => workout.days[0]), [1, 2, 4, 5]);
});

test("objetivo e experiência alteram a prescrição", () => {
  const plan = buildTrainingPlan(database, { goal: "strength", level: "advanced", frequency: 3, minutes: 60, equipment: "gym" });
  assert.equal(plan.reps, "4–6");
  assert.equal(plan.workouts[0]?.exercises[0]?.sets, 5);
  assert.equal(plan.rest, 150);
});

test("equipamento de peso corporal exclui exercícios de máquinas", () => {
  const plan = buildTrainingPlan([
    exercise("push", "Peito", "Peso corporal"),
    exercise("row", "Costas", "Máquina"),
  ], { goal: "general", level: "beginner", frequency: 2, minutes: 45, equipment: "bodyweight" });
  const ids = plan.workouts.flatMap((workout) => workout.exercises.map((item) => item.exerciseId));
  assert.ok(ids.includes("push"));
  assert.ok(!ids.includes("row"));
  assert.ok(plan.warnings.some((warning) => warning.includes("poucas opções")));
});

test("músculos prioritários favorecem exercícios que os trabalham", () => {
  const plan = buildTrainingPlan(database, { goal: "hypertrophy", level: "intermediate", frequency: 2, minutes: 30, equipment: "gym", priorityMuscles: ["Peitoral"] });
  assert.equal(plan.workouts[0]?.exercises[0]?.exerciseId, "chest-a");
});

test("não repete exercício entre treinos enquanto houver alternativas compatíveis", () => {
  const plan = buildTrainingPlan(database, { goal: "hypertrophy", level: "intermediate", frequency: 2, minutes: 30, equipment: "gym" });
  const ids = plan.workouts.flatMap((workout) => workout.exercises.map((item) => item.exerciseId));
  assert.equal(ids.length, new Set(ids).size);
});

test("variação altera a seleção e banco vazio produz aviso", () => {
  const options = { goal: "hypertrophy" as const, level: "intermediate" as const, frequency: 2, minutes: 30, equipment: "gym" as const };
  const first = buildTrainingPlan(database, options);
  const alternate = buildTrainingPlan(database, { ...options, variation: 1 });
  assert.notDeepEqual(first.workouts[0]?.exercises.map((item) => item.exerciseId), alternate.workouts[0]?.exercises.map((item) => item.exerciseId));
  const empty = buildTrainingPlan([], options);
  assert.equal(empty.workouts.flatMap((workout) => workout.exercises).length, 0);
  assert.ok(empty.warnings.some((warning) => warning.includes("Nenhum exercício")));
});
