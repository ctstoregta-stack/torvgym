import { test } from "node:test";
import assert from "node:assert/strict";
import { duplicateRoutineTemplate } from "../src/lib/routine-templates.ts";

test("duplicação de rotina preserva configurações sem reutilizar IDs ou referências mutáveis", () => {
  const source = {
    id: "r1",
    name: "Força",
    createdAt: "2026-01-01T00:00:00.000Z",
    workouts: [
      {
        id: "w1",
        name: "Treino A",
        days: [1, 4],
        exerciseIds: ["supino"],
        targetSets: { supino: 4 },
        restSeconds: 90,
        restSecondsByExercise: { supino: 120 },
        notes: "Controle de execução",
      },
    ],
  };
  const duplicate = duplicateRoutineTemplate(
    source,
    "r2",
    (_workout, index) => `w-copy-${index}`,
    "2026-10-12T00:00:00.000Z",
  );
  assert.equal(duplicate.id, "r2");
  assert.equal(duplicate.name, "Força (cópia)");
  assert.equal(duplicate.workouts[0]?.id, "w-copy-0");
  assert.deepEqual(duplicate.workouts[0]?.days, [1, 4]);
  assert.deepEqual(duplicate.workouts[0]?.exerciseIds, ["supino"]);
  assert.deepEqual(duplicate.workouts[0]?.targetSets, { supino: 4 });
  assert.deepEqual(duplicate.workouts[0]?.restSecondsByExercise, { supino: 120 });
  assert.equal(duplicate.workouts[0]?.restSeconds, 90);
  assert.equal(duplicate.workouts[0]?.notes, "Controle de execução");
  duplicate.workouts[0]!.days.push(2);
  duplicate.workouts[0]!.targetSets.supino = 2;
  assert.deepEqual(source.workouts[0]?.days, [1, 4]);
  assert.deepEqual(source.workouts[0]?.targetSets, { supino: 4 });
});
