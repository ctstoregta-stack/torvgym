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


import { EXERCISE_DB } from "../src/data/exercises.ts";
import {
  PREBUILT_ROUTINE_TEMPLATES,
  instantiateRoutineTemplate,
} from "../src/lib/routine-templates.ts";

test("modelos pré-montados usam exercícios existentes e parâmetros válidos", () => {
  const exerciseIds = new Set(EXERCISE_DB.map((exercise) => exercise.id));
  assert.ok(PREBUILT_ROUTINE_TEMPLATES.length >= 3);
  for (const template of PREBUILT_ROUTINE_TEMPLATES) {
    assert.ok(template.workouts.length >= 3);
    for (const workout of template.workouts) {
      assert.ok(workout.days.length > 0);
      assert.ok(workout.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6));
      assert.ok(workout.exercises.length >= 5);
      assert.ok(workout.exercises.every((item) => exerciseIds.has(item.exerciseId)));
      assert.ok(workout.exercises.every((item) =>
        item.sets >= 1 && item.reps.min >= 1 && item.reps.max >= item.reps.min,
      ));
      assert.ok(workout.restSeconds >= 60);
    }
  }
});

test("instancia modelo com IDs independentes e configurações de séries, repetições e descanso", () => {
  const template = PREBUILT_ROUTINE_TEMPLATES[0]!;
  const routine = instantiateRoutineTemplate(
    template,
    "new-routine",
    (_workout, index) => `new-workout-${index}`,
    "2026-10-16T12:00:00.000Z",
  );
  assert.equal(routine.id, "new-routine");
  assert.equal(routine.name, template.name);
  assert.equal(routine.workouts.length, template.workouts.length);
  for (const [index, workout] of routine.workouts.entries()) {
    const source = template.workouts[index]!;
    assert.equal(workout.id, `new-workout-${index}`);
    assert.deepEqual(workout.days, source.days);
    assert.equal(workout.exerciseIds.length, source.exercises.length);
    assert.equal(workout.restSeconds, source.restSeconds);
    for (const item of source.exercises) {
      assert.equal(workout.targetSets[item.exerciseId], item.sets);
      assert.deepEqual(workout.targetReps?.[item.exerciseId], item.reps);
    }
  }
  routine.workouts[0]!.days.push(6);
  assert.notDeepEqual(routine.workouts[0]!.days, template.workouts[0]!.days);
});
