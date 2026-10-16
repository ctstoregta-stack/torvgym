import type { Routine, Workout } from "./types";

export type PrebuiltWorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: { min: number; max: number };
};

export type PrebuiltWorkoutTemplate = {
  name: string;
  days: number[];
  exercises: PrebuiltWorkoutExercise[];
  restSeconds: number;
  notes: string;
};

export type PrebuiltRoutineTemplate = {
  id: string;
  name: string;
  description: string;
  level: string;
  frequency: string;
  focus: string;
  workouts: PrebuiltWorkoutTemplate[];
};

const exercise = (
  exerciseId: string,
  sets = 3,
  min = 8,
  max = 12,
): PrebuiltWorkoutExercise => ({ exerciseId, sets, reps: { min, max } });

/**
 * Evidence-informed starting templates for natural trainees. They are starting
 * points, not a claim that one split is uniquely superior or suitable for everyone.
 */
export const PREBUILT_ROUTINE_TEMPLATES: PrebuiltRoutineTemplate[] = [
  {
    id: "full-body-3",
    name: "Corpo inteiro · 3 dias",
    description: "Treine o corpo todo em sessões alternadas, com recuperação entre elas.",
    level: "Iniciante a intermediário",
    frequency: "3 dias por semana",
    focus: "Aprender os movimentos e progredir sem concentrar todo o volume em um único dia.",
    workouts: [
      {
        name: "A · Corpo inteiro",
        days: [1],
        exercises: [
          exercise("agachamento-goblet", 3, 8, 12),
          exercise("supino-reto-halteres", 3, 6, 10),
          exercise("puxada-neutra", 3, 8, 12),
          exercise("levantamento-romeno-halter", 2, 8, 12),
          exercise("elevacao-lateral-halteres", 2, 10, 15),
          exercise("triceps-corda", 2, 10, 15),
          exercise("rosca-martelo", 2, 10, 15),
        ],
        restSeconds: 120,
        notes: "Deixe ao menos um dia de recuperação antes da próxima sessão. Priorize técnica estável.",
      },
      {
        name: "B · Corpo inteiro",
        days: [3],
        exercises: [
          exercise("leg-press", 3, 8, 12),
          exercise("supino-inclinado-halteres", 3, 8, 12),
          exercise("remada-unilateral-halter", 3, 8, 12),
          exercise("mesa-flexora", 3, 10, 15),
          exercise("desenvolvimento-ombro", 2, 8, 12),
          exercise("panturrilha-em-pe", 2, 10, 15),
          exercise("abdominal-crunch-polia", 2, 10, 15),
        ],
        restSeconds: 120,
        notes: "Use amplitude confortável e mantenha repetições controladas.",
      },
      {
        name: "C · Corpo inteiro",
        days: [5],
        exercises: [
          exercise("agachamento-barra", 3, 6, 10),
          exercise("supino-vertical-maquina", 3, 8, 12),
          exercise("remada-maquina", 3, 8, 12),
          exercise("hip-thrust-barra", 3, 8, 12),
          exercise("crucifixo-invertido", 2, 10, 15),
          exercise("triceps-overhead-corda", 2, 10, 15),
          exercise("rosca-inclinada-halter", 2, 10, 15),
        ],
        restSeconds: 120,
        notes: "Alterne A, B e C semanalmente na ordem indicada e registre as cargas para acompanhar a progressão.",
      },
    ],
  },
  {
    id: "upper-lower-4",
    name: "Superior / Inferior · 4 dias",
    description: "Distribui o trabalho em dois treinos de membros superiores e dois de inferiores.",
    level: "Intermediário",
    frequency: "4 dias por semana",
    focus: "Boa distribuição semanal de volume, com dois estímulos por grupo muscular principal.",
    workouts: [
      {
        name: "Superior A",
        days: [1],
        exercises: [
          exercise("supino-reto-barra", 3, 6, 10),
          exercise("remada-baixa-pegada-fechada", 3, 8, 12),
          exercise("supino-inclinado-halteres", 2, 8, 12),
          exercise("puxada-neutra", 3, 8, 12),
          exercise("elevacao-lateral-halteres", 3, 10, 15),
          exercise("triceps-corda", 2, 10, 15),
          exercise("rosca-direta-barra-w", 2, 10, 15),
        ],
        restSeconds: 120,
        notes: "Faça os exercícios multiarticulares primeiro; descanse mais se a técnica ou o desempenho caírem.",
      },
      {
        name: "Inferior A",
        days: [2],
        exercises: [
          exercise("agachamento-barra", 3, 6, 10),
          exercise("levantamento-romeno-barra", 3, 6, 10),
          exercise("leg-press", 2, 10, 15),
          exercise("mesa-flexora", 3, 10, 15),
          exercise("panturrilha-em-pe", 3, 10, 15),
          exercise("abdominal-crunch-polia", 2, 10, 15),
        ],
        restSeconds: 150,
        notes: "Mantenha a lombar estável no terra romeno e ajuste a amplitude à sua mobilidade.",
      },
      {
        name: "Superior B",
        days: [4],
        exercises: [
          exercise("supino-inclinado-barra", 3, 6, 10),
          exercise("remada-maquina", 3, 8, 12),
          exercise("puxada-frontal-polia", 2, 8, 12),
          exercise("crucifixo-inverso-maquina", 3, 10, 15),
          exercise("elevacao-lateral-polia", 2, 10, 15),
          exercise("triceps-overhead-corda", 2, 10, 15),
          exercise("rosca-inclinada-halter", 2, 10, 15),
        ],
        restSeconds: 120,
        notes: "Ajuste o volume de braços se eles já estiverem muito fatigados nos exercícios compostos.",
      },
      {
        name: "Inferior B",
        days: [5],
        exercises: [
          exercise("hack-squat", 3, 8, 12),
          exercise("hip-thrust-barra", 3, 8, 12),
          exercise("cadeira-extensora", 2, 10, 15),
          exercise("cadeira-flexora", 3, 10, 15),
          exercise("panturrilha-sentado", 3, 10, 15),
          exercise("prancha", 3, 30, 45),
        ],
        restSeconds: 150,
        notes: "Na prancha, a faixa indica segundos de sustentação, não repetições.",
      },
    ],
  },
  {
    id: "push-pull-legs-6",
    name: "Push / Pull / Legs · 6 dias",
    description: "Divisão avançada em empurrar, puxar e pernas, repetida duas vezes na semana.",
    level: "Intermediário avançado",
    frequency: "6 dias por semana",
    focus: "Sessões mais curtas e distribuição de volume; escolha esta opção somente se sua rotina permitir recuperação.",
    workouts: [
      {
        name: "Push A · Peito, ombros e tríceps",
        days: [1],
        exercises: [
          exercise("supino-reto-barra", 3, 6, 10),
          exercise("supino-inclinado-halteres", 2, 8, 12),
          exercise("desenvolvimento-ombro", 2, 8, 12),
          exercise("elevacao-lateral-halteres", 3, 10, 15),
          exercise("triceps-corda", 3, 10, 15),
        ],
        restSeconds: 120,
        notes: "Evite adicionar séries por impulso; aumente o volume gradualmente se a recuperação estiver boa.",
      },
      {
        name: "Pull A · Costas e bíceps",
        days: [2],
        exercises: [
          exercise("puxada-neutra", 3, 8, 12),
          exercise("remada-curvada-barra", 3, 6, 10),
          exercise("pulldown-bracos-retos", 2, 10, 15),
          exercise("crucifixo-invertido", 2, 10, 15),
          exercise("rosca-direta-barra-w", 3, 8, 12),
        ],
        restSeconds: 120,
        notes: "Evite balanço excessivo e mantenha o controle da fase de retorno.",
      },
      {
        name: "Legs A · Pernas",
        days: [3],
        exercises: [
          exercise("agachamento-barra", 3, 6, 10),
          exercise("levantamento-romeno-barra", 3, 6, 10),
          exercise("leg-press", 2, 10, 15),
          exercise("mesa-flexora", 2, 10, 15),
          exercise("panturrilha-em-pe", 3, 10, 15),
        ],
        restSeconds: 150,
        notes: "Se o desempenho cair muito entre séries, aumente o descanso antes de aumentar o esforço.",
      },
      {
        name: "Push B · Peito, ombros e tríceps",
        days: [4],
        exercises: [
          exercise("supino-inclinado-barra", 3, 6, 10),
          exercise("supino-vertical-maquina", 2, 8, 12),
          exercise("elevacao-lateral-polia", 3, 10, 15),
          exercise("crucifixo-polia-alta", 2, 10, 15),
          exercise("triceps-overhead-corda", 3, 10, 15),
        ],
        restSeconds: 120,
        notes: "Ajuste a seleção se houver desconforto articular; nenhum exercício é obrigatório.",
      },
      {
        name: "Pull B · Costas e bíceps",
        days: [5],
        exercises: [
          exercise("puxada-frontal-polia", 3, 8, 12),
          exercise("remada-unilateral-halter", 3, 8, 12),
          exercise("remada-baixa-pegada-aberta", 2, 8, 12),
          exercise("face-pull", 2, 12, 15),
          exercise("rosca-inclinada-halter", 3, 10, 15),
        ],
        restSeconds: 120,
        notes: "Mantenha as repetições consistentes para comparar o progresso entre sessões.",
      },
      {
        name: "Legs B · Pernas",
        days: [6],
        exercises: [
          exercise("hack-squat", 3, 8, 12),
          exercise("hip-thrust-barra", 3, 8, 12),
          exercise("cadeira-extensora", 2, 10, 15),
          exercise("cadeira-flexora", 3, 10, 15),
          exercise("panturrilha-sentado", 3, 10, 15),
        ],
        restSeconds: 150,
        notes: "Domingo livre para recuperação; reduza frequência se o cansaço persistir ou o desempenho regredir.",
      },
    ],
  },
];

/** Cria uma cópia editável do modelo com IDs independentes para rotina e treinos. */
export function instantiateRoutineTemplate(
  source: PrebuiltRoutineTemplate,
  routineId: string,
  createWorkoutId: (workout: PrebuiltWorkoutTemplate, index: number) => string,
  createdAt = new Date().toISOString(),
): Routine {
  return {
    id: routineId,
    name: source.name,
    createdAt,
    workouts: source.workouts.map((workout, index) => ({
      id: createWorkoutId(workout, index),
      name: workout.name,
      days: [...workout.days],
      exerciseIds: workout.exercises.map((item) => item.exerciseId),
      targetSets: Object.fromEntries(workout.exercises.map((item) => [item.exerciseId, item.sets])),
      targetReps: Object.fromEntries(
        workout.exercises.map((item) => [item.exerciseId, { ...item.reps }]),
      ),
      restSeconds: workout.restSeconds,
      notes: workout.notes,
    })),
  };
}

/** Cria uma cópia independente de uma rotina e de todos os IDs de seus treinos. */
export function duplicateRoutineTemplate(
  source: Routine,
  routineId: string,
  createWorkoutId: (workout: Workout, index: number) => string,
  createdAt = new Date().toISOString(),
): Routine {
  return {
    ...source,
    id: routineId,
    name: `${source.name} (cópia)`,
    createdAt,
    workouts: source.workouts.map((workout, index) => ({
      ...workout,
      id: createWorkoutId(workout, index),
      days: [...workout.days],
      exerciseIds: [...workout.exerciseIds],
      targetSets: { ...workout.targetSets },
      ...(workout.targetReps ? { targetReps: Object.fromEntries(Object.entries(workout.targetReps).map(([id, range]) => [id, { ...range }])) } : {}),
      ...(workout.restSecondsByExercise
        ? { restSecondsByExercise: { ...workout.restSecondsByExercise } }
        : {}),
    })),
  };
}
