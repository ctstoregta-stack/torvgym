import type { Exercise } from "./types";

export type Goal = "hypertrophy" | "strength" | "conditioning" | "general";
export type Level = "beginner" | "intermediate" | "advanced";
export type Access = "gym" | "home" | "bodyweight";
export type PlannerOptions = {
  goal: Goal;
  level: Level;
  frequency: number;
  minutes: number;
  equipment: Access;
  variation?: number;
  priorityMuscles?: string[];
};
export type PlanExercise = { exerciseId: string; sets: number; min: number; max: number; rest: number };
export type PlanWorkout = { name: string; days: number[]; focus: string; exercises: PlanExercise[]; estimatedMinutes: number };

const trainingDays: Record<number, number[]> = {
  2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6],
};
const splits: Record<number, { title: string; workouts: { name: string; cats: string[] }[] }> = {
  2: { title: "Corpo inteiro · 2 dias", workouts: [
    { name: "Treino A", cats: ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Abdômen"] },
    { name: "Treino B", cats: ["Pernas", "Costas", "Peito", "Glúteos", "Ombros", "Abdômen"] },
  ] },
  3: { title: "Corpo inteiro · 3 dias", workouts: [
    { name: "Treino A", cats: ["Peito", "Costas", "Pernas", "Ombros", "Braços"] },
    { name: "Treino B", cats: ["Pernas", "Costas", "Peito", "Glúteos", "Abdômen"] },
    { name: "Treino C", cats: ["Costas", "Pernas", "Peito", "Ombros", "Braços"] },
  ] },
  4: { title: "Superior / inferior · 4 dias", workouts: [
    { name: "Superior A", cats: ["Peito", "Costas", "Ombros", "Braços", "Abdômen"] },
    { name: "Inferior A", cats: ["Pernas", "Glúteos", "Pernas", "Abdômen"] },
    { name: "Superior B", cats: ["Costas", "Peito", "Ombros", "Braços", "Abdômen"] },
    { name: "Inferior B", cats: ["Glúteos", "Pernas", "Pernas", "Abdômen"] },
  ] },
  5: { title: "Empurrar / puxar / pernas · 5 dias", workouts: [
    { name: "Empurrar", cats: ["Peito", "Ombros", "Braços", "Peito"] },
    { name: "Puxar", cats: ["Costas", "Costas", "Braços", "Abdômen"] },
    { name: "Pernas", cats: ["Pernas", "Glúteos", "Pernas", "Abdômen"] },
    { name: "Superior", cats: ["Peito", "Costas", "Ombros", "Braços"] },
    { name: "Inferior", cats: ["Pernas", "Glúteos", "Pernas", "Abdômen"] },
  ] },
  6: { title: "Empurrar / puxar / pernas · 6 dias", workouts: [
    { name: "Empurrar A", cats: ["Peito", "Ombros", "Braços", "Peito"] },
    { name: "Puxar A", cats: ["Costas", "Costas", "Braços", "Abdômen"] },
    { name: "Pernas A", cats: ["Pernas", "Glúteos", "Pernas", "Abdômen"] },
    { name: "Empurrar B", cats: ["Peito", "Ombros", "Braços", "Peito"] },
    { name: "Puxar B", cats: ["Costas", "Costas", "Braços", "Abdômen"] },
    { name: "Pernas B", cats: ["Pernas", "Glúteos", "Pernas", "Abdômen"] },
  ] },
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const muscleAliases: Record<string, string[]> = {
  "Peitoral": ["peitoral"],
  "Costas": ["dorsal", "latissimo", "romboide", "trapezio", "eretores da espinha"],
  "Quadríceps": ["quadriceps"],
  "Glúteos": ["gluteo"],
  "Ombros": ["deltoide", "deltoides", "ombros"],
  "Bíceps": ["biceps", "braquial", "braquiorradial"],
  "Tríceps": ["triceps"],
  "Abdômen": ["abdomen", "abdominal", "obliquos", "transverso do abdomen"],
};
function muscleScore(exercise: Exercise, priorities: string[]): number {
  if (!priorities.length) return 0;
  const primary = exercise.primary_muscles.map(normalize);
  const secondary = exercise.secondary_muscles.map(normalize);
  return priorities.reduce((score, priority) => {
    const aliases = (muscleAliases[priority] ?? [normalize(priority)]).map(normalize);
    const primaryMatch = primary.some((muscle) => aliases.some((alias) => muscle.includes(alias)));
    const secondaryMatch = secondary.some((muscle) => aliases.some((alias) => muscle.includes(alias)));
    return score + (primaryMatch ? 3 : secondaryMatch ? 1 : 0);
  }, 0);
}

export function buildTrainingPlan(exercises: Exercise[], options: PlannerOptions) {
  const frequency = Math.min(6, Math.max(2, Math.round(options.frequency)));
  const split = splits[frequency] ?? splits[3]!;
  const prescription = options.goal === "strength"
    ? { min: 4, max: 6, sets: options.level === "advanced" ? 5 : 4, rest: 150, label: "Força" }
    : options.goal === "hypertrophy"
      ? { min: 8, max: 12, sets: options.level === "beginner" ? 2 : options.level === "advanced" ? 4 : 3, rest: 90, label: "Hipertrofia" }
      : options.goal === "conditioning"
        ? { min: 12, max: 15, sets: 3, rest: 45, label: "Resistência muscular" }
        : { min: 8, max: 12, sets: 3, rest: 75, label: "Condicionamento geral" };
  const limit = options.minutes <= 30 ? 4 : options.minutes <= 45 ? 5 : options.minutes <= 60 ? 6 : 7;
  const pool = exercises.filter((exercise) => {
    const equipment = normalize(exercise.equipment);
    const category = normalize(exercise.category);
    const bodyweight = equipment.includes("peso corporal") || equipment === "corporal";
    if (category === "mobilidade") return false;
    if (category === "cardio" && options.goal !== "conditioning") return false;
    if (options.equipment === "gym") return true;
    if (options.equipment === "bodyweight") return bodyweight;
    return bodyweight || equipment.includes("halter") || equipment.includes("banco") || equipment.includes("caneleira");
  });
  const priorities = options.priorityMuscles ?? [];
  const used = new Set<string>();
  const warnings: string[] = [];
  const variation = Math.abs(Math.floor(options.variation ?? 0));

  const workouts: PlanWorkout[] = split.workouts.map((workout, index) => {
    const chosen: PlanExercise[] = [];
    const categories = options.goal === "conditioning" ? ["Cardio", ...workout.cats] : [...workout.cats];
    while (categories.length < limit) categories.push(...workout.cats);
    for (const category of categories) {
      if (chosen.length >= limit) break;
      const candidates = pool.filter((exercise) => normalize(exercise.category) === normalize(category));
      const unused = candidates.filter((exercise) => !used.has(exercise.id) && !chosen.some((item) => item.exerciseId === exercise.id));
      const available = unused.length ? unused : candidates.filter((exercise) => !chosen.some((item) => item.exerciseId === exercise.id));
      if (!available.length) continue;
      const scored = available.map((exercise) => ({ exercise, score: muscleScore(exercise, priorities) }));
      const bestScore = Math.max(...scored.map((item) => item.score));
      const best = scored.filter((item) => item.score === bestScore).map((item) => item.exercise);
      const selected = best[variation % best.length]!;
      used.add(selected.id);
      chosen.push({ exerciseId: selected.id, sets: prescription.sets, min: prescription.min, max: prescription.max, rest: prescription.rest });
    }
    const focus = [...new Set(chosen.map((item) => pool.find((exercise) => exercise.id === item.exerciseId)?.category).filter((value): value is string => Boolean(value)))].join(" · ");
    const estimatedSeconds = chosen.reduce((seconds, item) => {
      const exerciseSeconds = item.sets * item.min * (options.goal === "strength" ? 5 : options.goal === "conditioning" ? 3 : 4);
      const restSeconds = Math.max(0, item.sets - 1) * item.rest;
      return seconds + exerciseSeconds + restSeconds + 45;
    }, 0);
    return { name: workout.name, days: [(trainingDays[frequency] ?? trainingDays[3]!)[index] ?? 1], focus, exercises: chosen, estimatedMinutes: Math.ceil(estimatedSeconds / 60) };
  });

  const total = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
  if (total < workouts.length * Math.min(4, limit)) warnings.push("Há poucas opções compatíveis para alguns grupos musculares; revise o plano antes de salvar.");
  if (!total) warnings.push("Nenhum exercício compatível foi encontrado para os equipamentos selecionados.");
  const exerciseIds = workouts.flatMap((workout) => workout.exercises.map((item) => item.exerciseId));
  if (new Set(exerciseIds).size < exerciseIds.length) warnings.push("O catálogo não tem variedade suficiente para evitar repetições entre todos os treinos. Revise os exercícios repetidos antes de salvar.");
  const overTime = workouts.filter((workout) => workout.exercises.length > 0 && workout.estimatedMinutes > options.minutes);
  if (overTime.length) warnings.push(`A duração estimada ultrapassa o tempo selecionado em: ${overTime.map((workout) => `${workout.name} (${workout.estimatedMinutes} min)`).join(", ")}. Considere reduzir exercícios ou ajustar o tempo.`);
  if (options.goal === "conditioning" && !pool.some((exercise) => normalize(exercise.category) === "cardio")) warnings.push("Não há exercícios de cardio compatíveis no catálogo; o plano usará apenas exercícios de resistência muscular.");
  if (priorities.length) warnings.push("Os músculos prioritários influenciam a escolha dos exercícios disponíveis; confira a prévia e ajuste livremente depois de salvar.");
  return { title: split.title, goal: prescription.label, reps: prescription.min + "–" + prescription.max, rest: prescription.rest, workouts, warnings };
}
