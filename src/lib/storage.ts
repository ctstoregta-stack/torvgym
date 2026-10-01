import type { AppState, Exercise, Routine, Session, Workout } from "./types";

const KEY = "gymtrack.state.v1";
const VERSION_KEY = "gymtrack.state.version";
const CURRENT_VERSION = 2;

export const emptyState: AppState = {
  routines: [],
  activeRoutineId: null,
  customExercises: [],
  sessions: [],
  activeSession: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeExercise(value: unknown): Exercise | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  return {
    id: value.id,
    name: value.name,
    category: typeof value.category === "string" ? value.category : "Outros",
    equipment: typeof value.equipment === "string" ? value.equipment : "Não informado",
    gif_url: typeof value.gif_url === "string" ? value.gif_url : "",
    execution: typeof value.execution === "string" ? value.execution : "",
    primary_muscles: Array.isArray(value.primary_muscles) ? value.primary_muscles.filter((item): item is string => typeof item === "string") : [],
    secondary_muscles: Array.isArray(value.secondary_muscles) ? value.secondary_muscles.filter((item): item is string => typeof item === "string") : [],
    custom: Boolean(value.custom),
  };
}

function normalizeWorkout(value: unknown): Workout | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const days = Array.isArray(value.days) ? value.days.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : [];
  const exerciseIds = Array.isArray(value.exerciseIds) ? value.exerciseIds.filter((id): id is string => typeof id === "string") : [];
  const targetSets = isRecord(value.targetSets)
    ? Object.fromEntries(Object.entries(value.targetSets).filter(([, sets]) => typeof sets === "number" && Number.isFinite(sets) && sets > 0).map(([id, sets]) => [id, Math.max(1, Math.round(sets as number))]))
    : {};

  return { id: value.id, name: value.name, days: [...new Set(days)], exerciseIds, targetSets };
}

function normalizeRoutine(value: unknown): Routine | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const workouts = Array.isArray(value.workouts) ? value.workouts.map(normalizeWorkout).filter((workout): workout is Workout => workout !== null) : [];
  return {
    id: value.id,
    name: value.name,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    workouts,
  };
}

function normalizeSession(value: unknown): Session | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.workoutId !== "string" || !Array.isArray(value.entries)) return null;
  const entries = value.entries.filter(isRecord).map((entry) => {
    if (typeof entry.exerciseId !== "string" || !Array.isArray(entry.sets)) return null;
    const sets = entry.sets.filter(isRecord).map((set) => ({
      weight: typeof set.weight === "number" && Number.isFinite(set.weight) ? set.weight : null,
      reps: typeof set.reps === "number" && Number.isFinite(set.reps) ? set.reps : null,
      completed: Boolean(set.completed),
      isPR: Boolean(set.isPR),
    }));
    return { exerciseId: entry.exerciseId, sets };
  }).filter((entry): entry is { exerciseId: string; sets: Session["entries"][number]["sets"] } => entry !== null);

  return {
    id: value.id,
    routineId: typeof value.routineId === "string" ? value.routineId : "",
    workoutId: value.workoutId,
    workoutName: typeof value.workoutName === "string" ? value.workoutName : "Treino",
    startedAt: typeof value.startedAt === "string" ? value.startedAt : new Date().toISOString(),
    finishedAt: typeof value.finishedAt === "string" ? value.finishedAt : null,
    entries,
    currentExerciseIndex: typeof value.currentExerciseIndex === "number" ? Math.max(0, Math.floor(value.currentExerciseIndex)) : undefined,
    restStartedAt: typeof value.restStartedAt === "string" ? value.restStartedAt : null,
    restTotal: typeof value.restTotal === "number" && Number.isFinite(value.restTotal) ? Math.max(0, value.restTotal) : undefined,
    restRemaining: typeof value.restRemaining === "number" && Number.isFinite(value.restRemaining) ? Math.max(0, value.restRemaining) : undefined,
    restRunning: typeof value.restRunning === "boolean" ? value.restRunning : undefined,
  };
}

function normalizeState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;
  const routines = Array.isArray(value.routines) ? value.routines.map(normalizeRoutine).filter((routine): routine is Routine => routine !== null) : [];
  const customExercises = Array.isArray(value.customExercises) ? value.customExercises.map(normalizeExercise).filter((exercise): exercise is Exercise => exercise !== null) : [];
  const sessions = Array.isArray(value.sessions) ? value.sessions.map(normalizeSession).filter((session): session is Session => session !== null) : [];
  const activeSession = value.activeSession ? normalizeSession(value.activeSession) : null;
  const activeRoutineId = typeof value.activeRoutineId === "string" && routines.some((routine) => routine.id === value.activeRoutineId)
    ? value.activeRoutineId
    : routines[0]?.id ?? null;

  return { routines, activeRoutineId, customExercises, sessions, activeSession };
}

function migrate(raw: unknown, version: number): AppState | null {
  // V1 and V2 currently share the same shape. Keeping the migration boundary
  // makes future storage changes explicit without invalidating existing users.
  if (version <= 2) return normalizeState(raw);
  return null;
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    const storedVersion = Number(window.localStorage.getItem(VERSION_KEY) ?? 1);
    const state = migrate(parsed, Number.isFinite(storedVersion) ? storedVersion : 1);
    if (!state) return null;

    if (storedVersion !== CURRENT_VERSION) {
      try {
        window.localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
        window.localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        // A migração é oportunista; os dados já normalizados continuam válidos em memória.
      }
    }

    return state;
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  } catch {
    // Storage cheio ou indisponível: a app continua funcionando em memória.
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
