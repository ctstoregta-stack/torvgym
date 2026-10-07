import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EXERCISE_DB } from "@/data/exercises";
import { createBackup, emptyState, loadState, parseBackup, saveState, storageSizeBytes, uid } from "@/lib/storage";
import { buildExerciseAnalyticsIndex, sessionPRFor } from "@/store/gym-analytics";
import { validateExercise } from "@/lib/exercise-validation";
import { createEncryptedRecoveryPackage, createEncryptedSyncPackage, decryptEncryptedRecoveryPackage, decryptEncryptedSyncPackage } from "@/lib/cloud-sync";
import { createProtectedBackup, decryptProtectedBackup } from "@/lib/protected-backup";
import { createWorkoutSession, finishWorkoutSession, updateWorkoutSessionSet } from "@/store/gym-session";
import { startNativeWorkoutNotification, stopNativeWorkoutNotification } from "@/lib/native-workout";
import type {
  AppState,
  Exercise,
  Routine,
  Session,
  SetLog,
  TrainingGoals,
  Workout,
} from "@/lib/types";

function seedState(): AppState {
  const routineId = uid("rot");
  const mk = (
    name: string,
    days: number[],
    exerciseIds: string[],
  ): Workout => ({
    id: uid("wk"),
    name,
    days,
    exerciseIds,
    targetSets: Object.fromEntries(exerciseIds.map((id) => [id, 3])),
  });

  const routine: Routine = {
    id: routineId,
    name: "Hipertrofia - Foco em Força",
    createdAt: new Date().toISOString(),
    workouts: [
      mk("Treino A - Peito & Tríceps", [1, 4], [
        "supino-inclinado-halteres",
        "voador",
        "crucifixo-polia-alta",
        "triceps-polia-alta",
        "triceps-frances",
      ]),
      mk("Treino B - Costas & Bíceps", [2, 5], [
        "puxada-maquina",
        "remada-baixa-pegada-fechada",
        "remada-baixa-pegada-aberta",
        "rosca-scott-barra-w",
        "rosca-martelo",
      ]),
      mk("Treino C - Pernas & Ombros", [3, 6], [
        "agachamento-barra",
        "leg-press",
        "cadeira-extensora",
        "mesa-flexora",
        "elevacao-lateral-halteres",
        "desenvolvimento-ombro",
      ]),
    ],
  };

  return { ...emptyState, routines: [routine], activeRoutineId: routineId };
}

type Ctx = {
  ready: boolean;
  state: AppState;
  exercises: Exercise[];
  getExercise: (id: string) => Exercise | undefined;
  activeRoutine: Routine | null;
  findWorkout: (workoutId: string) =>
    | { routine: Routine; workout: Workout }
    | null;
  // routines
  createRoutine: (name: string) => string;
  renameRoutine: (id: string, name: string) => void;
  deleteRoutine: (id: string) => void;
  setActiveRoutine: (id: string) => void;
  // workouts
  createWorkout: (routineId: string, name: string) => string;
  duplicateWorkout: (workoutId: string) => string | null;
  updateWorkout: (workoutId: string, patch: Partial<Workout>) => void;
  deleteWorkout: (workoutId: string) => void;
  toggleWorkoutDay: (workoutId: string, day: number) => void;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  setTargetSets: (workoutId: string, exerciseId: string, sets: number) => void;
  // custom exercises
  addCustomExercise: (ex: Omit<Exercise, "custom">) => void;
  updateCustomExercise: (id: string, patch: Partial<Omit<Exercise, "id" | "custom">>) => boolean;
  deleteCustomExercise: (id: string) => "deleted" | "in-use" | "not-found";
  // goals
  updateGoals: (patch: Partial<TrainingGoals>) => void;
  // sessions
  startSession: (workoutId: string) => string | null;
  updateSet: (
    exerciseId: string,
    index: number,
    patch: Partial<SetLog>,
  ) => void;
  addSet: (exerciseId: string) => void;
  duplicateSet: (exerciseId: string, index: number) => void;
  removeSet: (exerciseId: string) => void;
  finishSession: () => Session | null;
  updateSessionContext: (patch: Partial<Pick<Session, "currentExerciseIndex" | "restStartedAt" | "restTotal" | "restRemaining" | "restRunning">>) => void;
  discardSession: () => void;
  // data safety
  createBackup: () => string;
  importBackup: (raw: string) => Promise<"invalid" | "saved" | "memory-only">;
  createProtectedBackup: (password: string) => Promise<string>;
  importProtectedBackup: (raw: string, password: string) => Promise<"invalid" | "saved" | "memory-only">;
  createEncryptedSyncPackage: (password: string) => Promise<string>;
  createRecoveryPackage: () => Promise<{ raw: string; code: string }>;
  importRecoveryPackage: (raw: string, code: string) => Promise<"invalid" | "saved" | "memory-only">;
  importEncryptedSyncPackage: (raw: string, password: string) => Promise<"invalid" | "saved" | "memory-only">;
  storageSizeBytes: () => number;
  // analytics
  prFor: (exerciseId: string) => number | null;
  lastSetsFor: (exerciseId: string) => SetLog[] | null;
  lastSetsForWorkout: (workoutId: string, exerciseId: string) => SetLog[] | null;
  historyFor: (
    exerciseId: string,
  ) => {
    date: string;
    sets: SetLog[];
    maxWeight: number;
    volume: number;
    estimated1RM: number;
  }[];
};

const GymContext = createContext<Ctx | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const sessionStartLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadState().then((loaded) => {
      if (cancelled) return;
      setState(loaded ?? seedState());
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || state.activeSession) return;
    const save = window.setTimeout(() => void saveState(state), 150);
    return () => window.clearTimeout(save);
  }, [state, ready]);

  // A sessão ativa é estado crítico: persiste imediatamente após cada
  // alteração para reduzir ao mínimo a janela de perda em crash/fechamento.
  useEffect(() => {
    if (!ready || !state.activeSession) return;
    saveState(state);
  }, [state.activeSession, ready]);

  useEffect(() => {
    if (!ready) return;

    if (!state.activeSession) {
      void stopNativeWorkoutNotification();
    }
  }, [ready, state.activeSession]);

  useEffect(() => {
    if (!ready) return;

    const flush = () => saveState(state);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        if (state.activeSession) {
          void startNativeWorkoutNotification(state.activeSession.workoutName);
        }
        return;
      }

      void stopNativeWorkoutNotification();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state, ready]);

  const exercises = useMemo(
    () => [...EXERCISE_DB, ...state.customExercises],
    [state.customExercises],
  );

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const getExercise = useCallback(
    (id: string) => exerciseById.get(id),
    [exerciseById],
  );

  const activeRoutine = useMemo(
    () => state.routines.find((r) => r.id === state.activeRoutineId) ?? null,
    [state.routines, state.activeRoutineId],
  );

  const findWorkout = useCallback(
    (workoutId: string) => {
      for (const routine of state.routines) {
        const workout = routine.workouts.find((w) => w.id === workoutId);
        if (workout) return { routine, workout };
      }
      return null;
    },
    [state.routines],
  );

  const mapWorkout = (workoutId: string, fn: (w: Workout) => Workout) =>
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => ({
        ...r,
        workouts: r.workouts.map((w) => (w.id === workoutId ? fn(w) : w)),
      })),
    }));

  const finishedSessions = useMemo(
    () => state.sessions.filter((s) => s.finishedAt),
    [state.sessions],
  );

  // O índice completo só é criado quando uma tela realmente solicita
  // histórico/analytics. Isso evita trabalho pesado durante a navegação comum.
  const analyticsCache = useRef<{
    sessions: Session[];
    index: ReturnType<typeof buildExerciseAnalyticsIndex>;
  } | null>(null);

  const getAnalyticsIndex = useCallback(() => {
    if (!analyticsCache.current || analyticsCache.current.sessions !== finishedSessions) {
      analyticsCache.current = {
        sessions: finishedSessions,
        index: buildExerciseAnalyticsIndex(finishedSessions),
      };
    }
    return analyticsCache.current.index;
  }, [finishedSessions]);

  const prFor = useCallback(
    (exerciseId: string) => {
      const historical = getAnalyticsIndex().get(exerciseId)?.pr ?? null;
      const active = state.activeSession ? sessionPRFor([state.activeSession], exerciseId) : null;
      if (historical == null) return active;
      if (active == null) return historical;
      return Math.max(historical, active);
    },
    [getAnalyticsIndex, state.activeSession],
  );

  const lastSetsForWorkout = useCallback(
    (workoutId: string, exerciseId: string) => {
      // A referência anterior precisa ser a sessão mais recente, não a primeira
      // encontrada no histórico. O histórico é cronológico (mais antigo → mais novo).
      for (let i = finishedSessions.length - 1; i >= 0; i -= 1) {
        const session = finishedSessions[i];
        if (!session || session.workoutId !== workoutId) continue;
        const entry = session.entries.find((item) => item.exerciseId === exerciseId);
        const sets = entry?.sets.filter((set) => set.completed) ?? [];
        if (sets.length) return sets;
      }
      return null;
    },
    [finishedSessions],
  );

  const historyFor = useCallback(
    (exerciseId: string) => getAnalyticsIndex().get(exerciseId)?.history ?? [],
    [getAnalyticsIndex],
  );

  const lastSetsFor = useCallback(
    (exerciseId: string) => getAnalyticsIndex().get(exerciseId)?.lastSets ?? null,
    [getAnalyticsIndex],
  );

  const updateSessionContext = useCallback((patch: Partial<Pick<Session, "currentExerciseIndex" | "restStartedAt" | "restTotal" | "restRemaining" | "restRunning">>) => {
    setState((s) => s.activeSession ? { ...s, activeSession: { ...s.activeSession, ...patch } } : s);
  }, []);

  const value: Ctx = {
    ready,
    state,
    exercises,
    getExercise,
    activeRoutine,
    findWorkout,

    createRoutine: (name) => {
      const id = uid("rot");
      setState((s) => ({
        ...s,
        activeRoutineId: id,
        routines: [
          ...s.routines,
          { id, name, createdAt: new Date().toISOString(), workouts: [] },
        ],
      }));
      return id;
    },
    renameRoutine: (id, name) =>
      setState((s) => ({
        ...s,
        routines: s.routines.map((r) => (r.id === id ? { ...r, name } : r)),
      })),
    deleteRoutine: (id) =>
      setState((s) => {
        const routines = s.routines.filter((r) => r.id !== id);
        return {
          ...s,
          routines,
          // evita sessão ativa órfã apontando para uma rotina excluída
          activeSession:
            s.activeSession?.routineId === id ? null : s.activeSession,
          activeRoutineId:
            s.activeRoutineId === id
              ? (routines[0]?.id ?? null)
              : s.activeRoutineId,
        };
      }),
    setActiveRoutine: (id) => setState((s) => ({ ...s, activeRoutineId: id })),
    updateGoals: (patch) =>
      setState((s) => ({
        ...s,
        goals: {
          ...s.goals,
          ...patch,
          weeklySessionsTarget: Math.min(14, Math.max(1, Math.round(patch.weeklySessionsTarget ?? s.goals.weeklySessionsTarget))),
          weeklyVolumeTarget: Math.min(1000000, Math.max(0, Math.round(patch.weeklyVolumeTarget ?? s.goals.weeklyVolumeTarget))),
          streakTarget: Math.min(365, Math.max(1, Math.round(patch.streakTarget ?? s.goals.streakTarget))),
        },
      })),

    createWorkout: (routineId, name) => {
      const id = uid("wk");
      setState((s) => ({
        ...s,
        routines: s.routines.map((r) =>
          r.id === routineId
            ? {
                ...r,
                workouts: [
                  ...r.workouts,
                  { id, name, days: [], exerciseIds: [], targetSets: {} },
                ],
              }
            : r,
        ),
      }));
      return id;
    },
    duplicateWorkout: (workoutId) => {
      let duplicatedId: string | null = null;
      setState((s) => ({
        ...s,
        routines: s.routines.map((routine) => {
          const source = routine.workouts.find((workout) => workout.id === workoutId);
          if (!source) return routine;
          const newWorkoutId = uid("wk");
          duplicatedId = newWorkoutId;
          const copy: Workout = {
            ...source,
            id: newWorkoutId,
            name: `${source.name} (cópia)`,
            days: [...source.days],
            exerciseIds: [...source.exerciseIds],
            targetSets: { ...source.targetSets },
          };
          return { ...routine, workouts: [...routine.workouts, copy] };
        }),
      }));
      return duplicatedId;
    },
    updateWorkout: (workoutId, patch) =>
      mapWorkout(workoutId, (w) => ({ ...w, ...patch })),
    deleteWorkout: (workoutId) =>
      setState((s) => ({
        ...s,
        routines: s.routines.map((r) => ({
          ...r,
          workouts: r.workouts.filter((w) => w.id !== workoutId),
        })),
        // evita sessão ativa órfã apontando para um treino excluído
        activeSession:
          s.activeSession?.workoutId === workoutId ? null : s.activeSession,
      })),
    toggleWorkoutDay: (workoutId, day) =>
      mapWorkout(workoutId, (w) => ({
        ...w,
        days: w.days.includes(day)
          ? w.days.filter((d) => d !== day)
          : [...w.days, day].sort(),
      })),
    addExerciseToWorkout: (workoutId, exerciseId) =>
      mapWorkout(workoutId, (w) =>
        w.exerciseIds.includes(exerciseId)
          ? w
          : {
              ...w,
              exerciseIds: [...w.exerciseIds, exerciseId],
              targetSets: { ...w.targetSets, [exerciseId]: 3 },
            },
      ),
    removeExerciseFromWorkout: (workoutId, exerciseId) =>
      mapWorkout(workoutId, (w) => ({
        ...w,
        exerciseIds: w.exerciseIds.filter((id) => id !== exerciseId),
      })),
    setTargetSets: (workoutId, exerciseId, sets) =>
      mapWorkout(workoutId, (w) => ({
        ...w,
        targetSets: { ...w.targetSets, [exerciseId]: Math.max(1, sets) },
      })),

    addCustomExercise: (ex) =>
      setState((s) => {
        const candidate = { ...ex, custom: true } as Exercise;
        if (validateExercise(candidate, { allowOptionalCustomFields: true }).length > 0) return s;

        const duplicateId = [...EXERCISE_DB, ...s.customExercises].some(
          (exercise) => exercise.id.trim().toLocaleLowerCase("pt-BR") === candidate.id.trim().toLocaleLowerCase("pt-BR"),
        );
        const duplicateName = [...EXERCISE_DB, ...s.customExercises].some(
          (exercise) => exercise.name.trim().toLocaleLowerCase("pt-BR") === candidate.name.trim().toLocaleLowerCase("pt-BR"),
        );
        if (duplicateId || duplicateName) return s;

        return {
          ...s,
          customExercises: [...s.customExercises, candidate],
        };
      }),

    updateCustomExercise: (id, patch) => {
      const current = state.customExercises.find((exercise) => exercise.id === id);
      if (!current) return false;
      const candidate = { ...current, ...patch, id, custom: true } as Exercise;
      if (validateExercise(candidate, { allowOptionalCustomFields: true }).length > 0) return false;
      const duplicateName = [...EXERCISE_DB, ...state.customExercises]
        .filter((exercise) => exercise.id !== id)
        .some(
          (exercise) =>
            exercise.name.trim().toLocaleLowerCase("pt-BR") ===
            candidate.name.trim().toLocaleLowerCase("pt-BR"),
        );
      if (duplicateName) return false;
      setState((s) => ({
        ...s,
        customExercises: s.customExercises.map((exercise) =>
          exercise.id === id ? candidate : exercise,
        ),
      }));
      return true;
    },
    deleteCustomExercise: (id) => {
      if (!state.customExercises.some((exercise) => exercise.id === id)) return "not-found";
      const usedByWorkout = state.routines.some((routine) =>
        routine.workouts.some((workout) => workout.exerciseIds.includes(id)),
      );
      const usedByHistory = state.sessions.some((session) =>
        session.entries.some((entry) => entry.exerciseId === id),
      );
      if (usedByWorkout || usedByHistory) return "in-use";
      setState((s) => ({
        ...s,
        customExercises: s.customExercises.filter((exercise) => exercise.id !== id),
      }));
      return "deleted";
    },

    startSession: (workoutId) => {
      if (state.activeSession || sessionStartLockRef.current) return null;
      const found = findWorkout(workoutId);
      if (!found) return null;

      sessionStartLockRef.current = true;
      const { routine, workout } = found;
      const id = uid("ses");
      const session = createWorkoutSession(routine, workout, id, new Date().toISOString());

      setState((s) => {
        if (s.activeSession) {
          sessionStartLockRef.current = false;
          return s;
        }
        queueMicrotask(() => {
          sessionStartLockRef.current = false;
        });
        return { ...s, activeSession: session };
      });
      return id;
    },
    updateSet: (exerciseId, index, patch) =>
      setState((s) => {
        if (!s.activeSession) return s;
        const historicalBest = getAnalyticsIndex().get(exerciseId)?.pr ?? 0;
        return {
          ...s,
          activeSession: updateWorkoutSessionSet(
            s.activeSession,
            exerciseId,
            index,
            patch,
            historicalBest,
          ),
        };
      }),
    addSet: (exerciseId) =>
      setState((s) =>
        s.activeSession
          ? {
              ...s,
              activeSession: {
                ...s.activeSession,
                entries: s.activeSession.entries.map((e) =>
                  e.exerciseId === exerciseId
                    ? {
                        ...e,
                        sets: [
                          ...e.sets,
                          { weight: null, reps: null, completed: false },
                        ],
                      }
                    : e,
                ),
              },
            }
          : s,
      ),
    duplicateSet: (exerciseId, index) =>
      setState((s) =>
        s.activeSession
          ? {
              ...s,
              activeSession: {
                ...s.activeSession,
                entries: s.activeSession.entries.map((e) =>
                  e.exerciseId === exerciseId && e.sets[index]
                    ? { ...e, sets: [...e.sets.slice(0, index + 1), { ...e.sets[index], completed: false, isPR: false }, ...e.sets.slice(index + 1)] }
                    : e,
                ),
              },
            }
          : s,
      ),
    removeSet: (exerciseId) =>
      setState((s) =>
        s.activeSession
          ? {
              ...s,
              activeSession: {
                ...s.activeSession,
                entries: s.activeSession.entries.map((e) =>
                  e.exerciseId === exerciseId && e.sets.length > 1
                    ? { ...e, sets: e.sets.slice(0, -1) }
                    : e,
                ),
              },
            }
          : s,
      ),
    finishSession: () => {
      const current = state.activeSession;
      const saved = current
        ? finishWorkoutSession(current, new Date().toISOString())
        : null;
      setState((s) => {
        if (!s.activeSession) return s;
        return {
          ...s,
          sessions: saved ? [...s.sessions, saved] : s.sessions,
          activeSession: null,
        };
      });
      return saved;
    },
    updateSessionContext,
    discardSession: () => setState((s) => ({ ...s, activeSession: null })),
    createBackup: () => createBackup(state),
    createProtectedBackup: (password) => createProtectedBackup(createBackup(state), password),
    importBackup: async (raw) => {
      const imported = parseBackup(raw);
      if (!imported) return "invalid";
      setState(imported);
      return (await saveState(imported)) ? "saved" : "memory-only";
    },
    importProtectedBackup: async (raw, password) => {
      const decrypted = await decryptProtectedBackup(raw, password);
      const imported = parseBackup(decrypted);
      if (!imported) return "invalid";
      setState(imported);
      return (await saveState(imported)) ? "saved" : "memory-only";
    },
    createEncryptedSyncPackage: (password) => createEncryptedSyncPackage(state, password),
    createRecoveryPackage: () => createEncryptedRecoveryPackage(state),
    importEncryptedSyncPackage: async (raw, password) => {
      const payload = await decryptEncryptedSyncPackage(raw, password);
      const imported = parseBackup(JSON.stringify({
        format: "torvgym-backup",
        version: 1,
        exportedAt: payload.updatedAt,
        state: payload.state,
      }));
      if (!imported) return "invalid";
      setState(imported);
      return (await saveState(imported)) ? "saved" : "memory-only";
    },
    importRecoveryPackage: async (raw, code) => {
      const payload = await decryptEncryptedRecoveryPackage(raw, code);
      const imported = parseBackup(JSON.stringify({
        format: "torvgym-backup",
        version: 1,
        exportedAt: payload.updatedAt,
        state: payload.state,
      }));
      if (!imported) return "invalid";
      setState(imported);
      return (await saveState(imported)) ? "saved" : "memory-only";
    },
    storageSizeBytes,

    prFor,
    lastSetsFor,
    lastSetsForWorkout,
    historyFor,
  };

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym deve ser usado dentro de GymProvider");
  return ctx;
}

/** Grupos musculares derivados automaticamente dos exercícios do treino. */
export function muscleGroupsOf(
  exerciseIds: string[],
  getExercise: (id: string) => Exercise | undefined,
) {
  const groups = new Set<string>();
  for (const id of exerciseIds) {
    const ex = getExercise(id);
    if (ex) groups.add(ex.category);
  }
  return Array.from(groups);
}

/** 1RM estimado (fórmula de Epley). */
export function estimate1RM(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}