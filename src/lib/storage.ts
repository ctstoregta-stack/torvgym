import type { AppState } from "./types";

const KEY = "gymtrack.state.v1";

export const emptyState: AppState = {
  routines: [],
  activeRoutineId: null,
  customExercises: [],
  sessions: [],
  activeSession: null,
};

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...emptyState,
      ...parsed,
      routines: parsed.routines ?? [],
      customExercises: parsed.customExercises ?? [],
      sessions: parsed.sessions ?? [],
      activeSession: parsed.activeSession ?? null,
    };
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage cheio ou indisponível: a app continua funcionando em memória */
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
