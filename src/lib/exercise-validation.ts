import type { Exercise } from "./types";

export type ExerciseDatabaseIssue = {
  code:
    | "duplicate-id"
    | "duplicate-name"
    | "missing-field"
    | "invalid-gif-url"
    | "invalid-muscle-list";
  exerciseId?: string;
  message: string;
};

const REQUIRED_TEXT_FIELDS = [
  "id",
  "name",
  "category",
  "equipment",
  "gif_url",
  "execution",
] as const;

export function validateExercise(
  exercise: Exercise,
  options: { allowOptionalCustomFields?: boolean } = {},
): ExerciseDatabaseIssue[] {
  const issues: ExerciseDatabaseIssue[] = [];

  for (const field of REQUIRED_TEXT_FIELDS) {
    const optionalCustomField =
      options.allowOptionalCustomFields &&
      exercise.custom === true &&
      (field === "gif_url" || field === "execution");
    if (
      !optionalCustomField &&
      (typeof exercise[field] !== "string" || exercise[field].trim() === "")
    ) {
      issues.push({
        code: "missing-field",
        exerciseId: exercise.id,
        message: `Campo obrigatório ausente: ${field}`,
      });
    }
  }

  if (
    typeof exercise.gif_url === "string" &&
    exercise.gif_url.trim() !== ""
  ) {
    try {
      const url = new URL(exercise.gif_url);
      if (url.protocol !== "https:") {
        issues.push({
          code: "invalid-gif-url",
          exerciseId: exercise.id,
          message: "A URL da mídia deve usar HTTPS.",
        });
      }
    } catch {
      issues.push({
        code: "invalid-gif-url",
        exerciseId: exercise.id,
        message: "A URL da mídia não é válida.",
      });
    }
  }

  if (
    !Array.isArray(exercise.primary_muscles) ||
    exercise.primary_muscles.some(
      (muscle) => typeof muscle !== "string" || muscle.trim() === "",
    )
  ) {
    issues.push({
      code: "invalid-muscle-list",
      exerciseId: exercise.id,
      message: "A lista de músculos primários contém valores inválidos.",
    });
  }

  if (
    !Array.isArray(exercise.secondary_muscles) ||
    exercise.secondary_muscles.some(
      (muscle) => typeof muscle !== "string" || muscle.trim() === "",
    )
  ) {
    issues.push({
      code: "invalid-muscle-list",
      exerciseId: exercise.id,
      message: "A lista de músculos secundários contém valores inválidos.",
    });
  }

  return issues;
}

export function validateExerciseDatabase(
  exercises: Exercise[],
): ExerciseDatabaseIssue[] {
  const issues: ExerciseDatabaseIssue[] = [];
  const ids = new Map<string, Exercise>();
  const names = new Map<string, Exercise>();

  for (const exercise of exercises) {
    issues.push(...validateExercise(exercise));

    const normalizedId = exercise.id.trim().toLocaleLowerCase("pt-BR");
    const normalizedName = exercise.name.trim().toLocaleLowerCase("pt-BR");

    if (ids.has(normalizedId)) {
      issues.push({
        code: "duplicate-id",
        exerciseId: exercise.id,
        message: `ID duplicado: ${exercise.id}`,
      });
    } else {
      ids.set(normalizedId, exercise);
    }

    if (names.has(normalizedName)) {
      issues.push({
        code: "duplicate-name",
        exerciseId: exercise.id,
        message: `Nome duplicado: ${exercise.name}`,
      });
    } else {
      names.set(normalizedName, exercise);
    }
  }

  return issues;
}

export function exerciseDatabaseIsValid(exercises: Exercise[]): boolean {
  return validateExerciseDatabase(exercises).length === 0;
}
