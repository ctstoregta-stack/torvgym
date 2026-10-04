import test from "node:test";
import assert from "node:assert/strict";
import { exerciseDatabaseIsValid, validateExercise, validateExerciseDatabase } from "../src/lib/exercise-validation.ts";
import type { Exercise } from "../src/lib/types.ts";

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "exemplo",
  name: "Exemplo",
  category: "Peito",
  equipment: "Halteres",
  gif_url: "https://example.com/exemplo.gif",
  execution: "Execução de teste.",
  primary_muscles: ["Peitoral"],
  secondary_muscles: ["Tríceps"],
  ...overrides,
});

test("valida um exercício completo", () => {
  assert.equal(validateExercise(makeExercise()).length, 0);
});

test("rejeita campos obrigatórios vazios e URL inválida", () => {
  const issues = validateExercise(
    makeExercise({ name: "", gif_url: "not-a-url", execution: "" }),
  );
  assert.ok(issues.some((issue) => issue.code === "missing-field"));
  assert.ok(issues.some((issue) => issue.code === "invalid-gif-url"));
});

test("detecta IDs e nomes duplicados de forma case-insensitive", () => {
  const issues = validateExerciseDatabase([
    makeExercise(),
    makeExercise({ id: "EXEMPLO", name: "exemplo" }),
  ]);
  assert.ok(issues.some((issue) => issue.code === "duplicate-id"));
  assert.ok(issues.some((issue) => issue.code === "duplicate-name"));
});

test("aceita mídia HTTPS que não termina necessariamente em .gif", () => {
  assert.equal(
    exerciseDatabaseIsValid([
      makeExercise({
        id: "imagem",
        name: "Imagem",
        gif_url: "https://example.com/exercicio.png",
      }),
    ]),
    true,
  );
});
