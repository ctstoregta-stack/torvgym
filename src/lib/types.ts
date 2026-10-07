export type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  gif_url: string;
  execution: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  custom?: boolean;
};

export type Workout = {
  id: string;
  name: string;
  /** 0 = Domingo ... 6 = Sábado */
  days: number[];
  exerciseIds: string[];
  /** target sets per exercise */
  targetSets: Record<string, number>;
  restSeconds?: number;
  /** Descanso específico por exercício; quando ausente, usa restSeconds. */
  restSecondsByExercise?: Record<string, number>;
  notes?: string;
};

export type Routine = {
  id: string;
  name: string;
  createdAt: string;
  workouts: Workout[];
};

export type SetLog = {
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isPR?: boolean;
  rpe?: number | null;
  note?: string;
};

export type ExerciseLog = {
  exerciseId: string;
  sets: SetLog[];
};

export type Session = {
  id: string;
  routineId: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string | null;
  entries: ExerciseLog[];
  currentExerciseIndex?: number;
  restStartedAt?: string | null;
  restTotal?: number;
  restRemaining?: number;
  restRunning?: boolean;
};

export type TrainingGoals = {
  weeklySessionsTarget: number;
  weeklyVolumeTarget: number;
  streakTarget: number;
};

export type AppState = {
  routines: Routine[];
  activeRoutineId: string | null;
  customExercises: Exercise[];
  sessions: Session[];
  activeSession: Session | null;
  goals: TrainingGoals;
};

export const WEEKDAYS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export const WEEKDAYS_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;
