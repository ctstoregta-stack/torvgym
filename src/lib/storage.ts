import type { AppState, Exercise, Routine, Session, Workout } from "./types";

const KEY = "gymtrack.state.v1";
const VERSION_KEY = "gymtrack.state.version";
const RECOVERY_KEY = "gymtrack.state.recovery.v1";
const AUTO_BACKUP_KEY = "gymtrack.state.auto-backup.v1";
const CURRENT_VERSION = 4;
const BACKUP_FORMAT = "torvgym-backup";
const BACKUP_VERSION = 1;

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

function normalizeExercise(input: unknown): Exercise | null {
  if (!isRecord(input)) return null;
  const { id, name, category, equipment, gif_url, execution, primary_muscles, secondary_muscles, custom } = input;
  if (typeof id !== "string" || typeof name !== "string") return null;
  return {
    id,
    name,
    category: typeof category === "string" ? category : "Outros",
    equipment: typeof equipment === "string" ? equipment : "Não informado",
    gif_url: typeof gif_url === "string" ? gif_url : "",
    execution: typeof execution === "string" ? execution : "",
    primary_muscles: Array.isArray(primary_muscles) ? primary_muscles.filter((item): item is string => typeof item === "string") : [],
    secondary_muscles: Array.isArray(secondary_muscles) ? secondary_muscles.filter((item): item is string => typeof item === "string") : [],
    custom: Boolean(custom),
  };
}

function normalizeWorkout(input: unknown): Workout | null {
  if (!isRecord(input)) return null;
  const { id, name, days: rawDays, exerciseIds: rawIds, targetSets: rawTargets } = input;
  if (typeof id !== "string" || typeof name !== "string") return null;
  const days = Array.isArray(rawDays) ? rawDays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : [];
  const exerciseIds = Array.isArray(rawIds) ? rawIds.filter((item): item is string => typeof item === "string") : [];
  const targetSets = isRecord(rawTargets)
    ? Object.fromEntries(Object.entries(rawTargets).filter(([, sets]) => typeof sets === "number" && Number.isFinite(sets) && sets > 0).map(([key, sets]) => [key, Math.max(1, Math.round(sets as number))]))
    : {};

  return { id, name, days: [...new Set(days)], exerciseIds, targetSets };
}

function normalizeRoutine(input: unknown): Routine | null {
  if (!isRecord(input)) return null;
  const { id, name, createdAt, workouts: rawWorkouts } = input;
  if (typeof id !== "string" || typeof name !== "string") return null;
  const workouts = Array.isArray(rawWorkouts) ? rawWorkouts.map(normalizeWorkout).filter((workout): workout is Workout => workout !== null) : [];
  return {
    id,
    name,
    createdAt: typeof createdAt === "string" ? createdAt : new Date().toISOString(),
    workouts,
  };
}

function normalizeSession(input: unknown): Session | null {
  if (!isRecord(input)) return null;
  const {
    id, workoutId, entries: rawEntries, routineId, workoutName, startedAt, finishedAt,
    currentExerciseIndex, restStartedAt, restTotal, restRemaining, restRunning,
  } = input;
  if (typeof id !== "string" || typeof workoutId !== "string" || !Array.isArray(rawEntries)) return null;
  const entries: Session["entries"] = rawEntries.filter(isRecord).flatMap((entry) => {
    const { exerciseId, sets: rawSets } = entry;
    if (typeof exerciseId !== "string" || !Array.isArray(rawSets)) return [];
    const sets = rawSets.filter(isRecord).map((set) => {
      const { weight, reps, completed, isPR, rpe, note } = set;
      return {
        weight: typeof weight === "number" && Number.isFinite(weight) ? weight : null,
        reps: typeof reps === "number" && Number.isFinite(reps) ? reps : null,
        completed: Boolean(completed),
        isPR: Boolean(isPR),
        rpe: typeof rpe === "number" && Number.isFinite(rpe) ? Math.min(10, Math.max(1, Math.round(rpe))) : null,
        note: typeof note === "string" ? note.slice(0, 500) : "",
      };
    });
    return [{ exerciseId, sets }];
  });

  const session: Session = {
    id,
    routineId: typeof routineId === "string" ? routineId : "",
    workoutId,
    workoutName: typeof workoutName === "string" ? workoutName : "Treino",
    startedAt: typeof startedAt === "string" ? startedAt : new Date().toISOString(),
    finishedAt: typeof finishedAt === "string" ? finishedAt : null,
    entries,
  };

  if (typeof currentExerciseIndex === "number") {
    session.currentExerciseIndex = Math.max(0, Math.floor(currentExerciseIndex));
  }
  if (typeof restStartedAt === "string" || restStartedAt === null) session.restStartedAt = restStartedAt;
  if (typeof restTotal === "number" && Number.isFinite(restTotal)) {
    session.restTotal = Math.max(0, restTotal);
  }
  if (typeof restRemaining === "number" && Number.isFinite(restRemaining)) {
    session.restRemaining = Math.max(0, restRemaining);
  }
  if (typeof restRunning === "boolean") session.restRunning = restRunning;

  return session;
}

function normalizeState(input: unknown): AppState | null {
  if (!isRecord(input)) return null;
  const { routines: rawRoutines, customExercises: rawCustom, sessions: rawSessions, activeSession: rawActive, activeRoutineId: rawActiveRoutine } = input;
  const routines = Array.isArray(rawRoutines) ? rawRoutines.map(normalizeRoutine).filter((routine): routine is Routine => routine !== null) : [];
  const customExercises = Array.isArray(rawCustom) ? rawCustom.map(normalizeExercise).filter((exercise): exercise is Exercise => exercise !== null) : [];
  const sessions = Array.isArray(rawSessions) ? rawSessions.map(normalizeSession).filter((session): session is Session => session !== null) : [];
  const activeSession = rawActive ? normalizeSession(rawActive) : null;
  const activeRoutineId = typeof rawActiveRoutine === "string" && routines.some((routine) => routine.id === rawActiveRoutine)
    ? rawActiveRoutine
    : routines[0]?.id ?? null;

  return { routines, activeRoutineId, customExercises, sessions, activeSession };
}

function migrate(raw: unknown, version: number): AppState | null {
  // V1-V3 mantêm o formato lógico anterior. V4 adiciona feedback por série
  // (RPE e observação) sem invalidar os dados existentes.
  if (version >= 1 && version <= CURRENT_VERSION) return normalizeState(raw);
  return null;
}

function readStoredState(key: string): AppState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function repairPrimary(state: AppState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  } catch {
    // A recuperação continua válida em memória mesmo se o storage estiver cheio.
  }
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;

  try {
    const storedVersion = Number(window.localStorage.getItem(VERSION_KEY) ?? 1);
    const version = Number.isFinite(storedVersion) ? storedVersion : 1;
    const state = migrate(readRawPrimary(), version);
    if (state) {
      if (version !== CURRENT_VERSION) repairPrimary(state);
      return state;
    }

    // O estado principal pode estar ausente/corrompido. Tenta primeiro o
    // snapshot de recuperação e depois o backup interno independente.
    const recovery = readStoredState(RECOVERY_KEY);
    if (recovery) {
      repairPrimary(recovery);
      return recovery;
    }

    const automaticBackup = readStoredState(AUTO_BACKUP_KEY);
    if (automaticBackup) {
      repairPrimary(automaticBackup);
      return automaticBackup;
    }

    return null;
  } catch {
    return null;
  }
}

function readRawPrimary(): unknown {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;

  const serialized = JSON.stringify(state);
  let primarySaved = false;

  try {
    window.localStorage.setItem(KEY, serialized);
    window.localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    primarySaved = true;
  } catch {
    // Continua tentando os snapshots independentes abaixo.
  }

  try {
    window.localStorage.setItem(RECOVERY_KEY, serialized);
  } catch {
    // O snapshot de recuperação é best-effort.
  }

  try {
    window.localStorage.setItem(AUTO_BACKUP_KEY, serialized);
  } catch {
    // O backup interno é best-effort.
  }

  return primarySaved;
}

export function createBackup(state: AppState): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
}

export function parseBackup(raw: string): AppState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed["format"] !== BACKUP_FORMAT || parsed["version"] !== BACKUP_VERSION) {
      return null;
    }
    return normalizeState(parsed["state"]);
  } catch {
    return null;
  }
}

export function storageSizeBytes(): number {
  if (typeof window === "undefined") return 0;
  try {
    const keys = [KEY, VERSION_KEY, RECOVERY_KEY, AUTO_BACKUP_KEY];
    return keys.reduce((total, key) => total + ((window.localStorage.getItem(key)?.length ?? 0) * 2), 0);
  } catch {
    return 0;
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
