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
  if (!isRecord(value) || typeof  !== "string" || typeof  !== "string") return null;
  return {
    id: ,
    name: ,
    category: typeof  === "string" ?  : "Outros",
    equipment: typeof  === "string" ?  : "Não informado",
    gif_url: typeof  === "string" ?  : "",
    execution: typeof  === "string" ?  : "",
    primary_muscles: Array.isArray() ? .filter((item): item is string => typeof item === "string") : [],
    secondary_muscles: Array.isArray() ? .filter((item): item is string => typeof item === "string") : [],
    custom: Boolean(),
  };
}

function normalizeWorkout(value: unknown): Workout | null {
  if (!isRecord(value) || typeof  !== "string" || typeof  !== "string") return null;
  const days = Array.isArray() ? .filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : [];
  const exerciseIds = Array.isArray() ? .filter((id): id is string => typeof id === "string") : [];
  const targetSets = isRecord()
    ? Object.fromEntries(Object.entries().filter(([, sets]) => typeof sets === "number" && Number.isFinite(sets) && sets > 0).map(([id, sets]) => [id, Math.max(1, Math.round(sets as number))]))
    : {};

  return { id: , name: , days: [...new Set(days)], exerciseIds, targetSets };
}

function normalizeRoutine(value: unknown): Routine | null {
  if (!isRecord(value) || typeof  !== "string" || typeof  !== "string") return null;
  const workouts = Array.isArray() ? .map(normalizeWorkout).filter((workout): workout is Workout => workout !== null) : [];
  return {
    id: ,
    name: ,
    createdAt: typeof  === "string" ?  : new Date().toISOString(),
    workouts,
  };
}

function normalizeSession(value: unknown): Session | null {
  if (!isRecord(value) || typeof  !== "string" || typeof  !== "string" || !Array.isArray()) return null;
  const entries = .filter(isRecord).map((entry) => {
    if (typeof  !== "string" || !Array.isArray()) return null;
    const sets = .filter(isRecord).map((set) => ({
      weight: typeof  === "number" && Number.isFinite() ?  : null,
      reps: typeof  === "number" && Number.isFinite() ?  : null,
      completed: Boolean(),
      isPR: Boolean(),
    }));
    return { exerciseId: , sets };
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const session: Session = {
    id: ,
    routineId: typeof  === "string" ?  : "",
    workoutId: ,
    workoutName: typeof  === "string" ?  : "Treino",
    startedAt: typeof  === "string" ?  : new Date().toISOString(),
    finishedAt: typeof  === "string" ?  : null,
    entries,
  };

  if (typeof  === "number") {
    session.currentExerciseIndex = Math.max(0, Math.floor());
  }
  if (typeof  === "string") session.restStartedAt = ;
  if (typeof  === "number" && Number.isFinite()) {
    session.restTotal = Math.max(0, );
  }
  if (typeof  === "number" && Number.isFinite()) {
    session.restRemaining = Math.max(0, );
  }
  if (typeof  === "boolean") session.restRunning = ;

  return session;
}

function normalizeState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;
  const routines = Array.isArray() ? .map(normalizeRoutine).filter((routine): routine is Routine => routine !== null) : [];
  const customExercises = Array.isArray() ? .map(normalizeExercise).filter((exercise): exercise is Exercise => exercise !== null) : [];
  const sessions = Array.isArray() ? .map(normalizeSession).filter((session): session is Session => session !== null) : [];
  const activeSession =  ? normalizeSession() : null;
  const activeRoutineId = typeof  === "string" && routines.some((routine) => routine.id === )
    ? 
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
