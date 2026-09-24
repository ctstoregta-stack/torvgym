import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EXERCISE_DB } from "@/data/exercises";
import { emptyState, loadState, saveState, uid } from "@/lib/storage";
import type {
  AppState,
  Exercise,
  Routine,
  Session,
  SetLog,
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
  updateWorkout: (workoutId: string, patch: Partial<Workout>) => void;
  deleteWorkout: (workoutId: string) => void;
  toggleWorkoutDay: (workoutId: string, day: number) => void;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  setTargetSets: (workoutId: string, exerciseId: string, sets: number) => void;
  // custom exercises
  addCustomExercise: (ex: Omit<Exercise, "custom">) => void;
  // sessions
  startSession: (workoutId: string) => string | null;
  updateSet: (
    exerciseId: string,
    index: number,
    patch: Partial<SetLog>,
  ) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string) => void;
  finishSession: () => void;
  discardSession: () => void;
  // analytics
  prFor: (exerciseId: string) => number | null;
  lastSetsFor: (exerciseId: string) => SetLog[] | null;
  historyFor: (
    exerciseId: string,
  ) => { date: string; sets: SetLog[]; maxWeight: number }[];
};

const GymContext = createContext<Ctx | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded ?? seedState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const exercises = useMemo(
    () => [...EXERCISE_DB, ...state.customExercises],
    [state.customExercises],
  );

  const getExercise = useCallback(
    (id: string) => exercises.find((e) => e.id === id),
    [exercises],
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

  const prFor = useCallback(
    (exerciseId: string) => {
      let max: number | null = null;
      for (const session of finishedSessions) {
        for (const entry of session.entries) {
          if (entry.exerciseId !== exerciseId) continue;
          for (const set of entry.sets) {
            if (set.completed && set.weight != null) {
              max = max == null ? set.weight : Math.max(max, set.weight);
            }
          }
        }
      }
      return max;
    },
    [finishedSessions],
  );

  const historyFor = useCallback(
    (exerciseId: string) =>
      finishedSessions
        .map((session) => {
          const entry = session.entries.find(
            (e) => e.exerciseId === exerciseId,
          );
          if (!entry) return null;
          const sets = entry.sets.filter((s) => s.completed);
          if (!sets.length) return null;
          return {
            date: session.finishedAt ?? session.startedAt,
            sets,
            maxWeight: Math.max(...sets.map((s) => s.weight ?? 0)),
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b!.date).getTime() - new Date(a!.date).getTime(),
        ) as { date: string; sets: SetLog[]; maxWeight: number }[],
    [finishedSessions],
  );

  const lastSetsFor = useCallback(
    (exerciseId: string) => {
      const sorted = [...finishedSessions].sort(
        (a, b) =>
          new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime(),
      );
      for (const session of sorted) {
        const entry = session.entries.find((e) => e.exerciseId === exerciseId);
        const done = entry?.sets.filter((s) => s.completed) ?? [];
        if (done.length) return done;
      }
      return null;
    },
    [finishedSessions],
  );

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
          activeRoutineId:
            s.activeRoutineId === id
              ? (routines[0]?.id ?? null)
              : s.activeRoutineId,
        };
      }),
    setActiveRoutine: (id) => setState((s) => ({ ...s, activeRoutineId: id })),

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
    updateWorkout: (workoutId, patch) =>
      mapWorkout(workoutId, (w) => ({ ...w, ...patch })),
    deleteWorkout: (workoutId) =>
      setState((s) => ({
        ...s,
        routines: s.routines.map((r) => ({
          ...r,
          workouts: r.workouts.filter((w) => w.id !== workoutId),
        })),
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
      setState((s) => ({
        ...s,
        customExercises: [...s.customExercises, { ...ex, custom: true }],
      })),

    startSession: (workoutId) => {
      const found = findWorkout(workoutId);
      if (!found) return null;
      const { routine, workout } = found;
      const id = uid("ses");
      const session: Session = {
        id,
        routineId: routine.id,
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        entries: workout.exerciseIds.map((exerciseId) => ({
          exerciseId,
          sets: Array.from(
            { length: workout.targetSets[exerciseId] ?? 3 },
            () => ({ weight: null, reps: null, completed: false }),
          ),
        })),
      };
      setState((s) => ({ ...s, activeSession: session }));
      return id;
    },
    updateSet: (exerciseId, index, patch) =>
      setState((s) => {
        if (!s.activeSession) return s;
        return {
          ...s,
          activeSession: {
            ...s.activeSession,
            entries: s.activeSession.entries.map((entry) =>
              entry.exerciseId === exerciseId
                ? {
                    ...entry,
                    sets: entry.sets.map((set, i) =>
                      i === index ? { ...set, ...patch } : set,
                    ),
                  }
                : entry,
            ),
          },
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
    finishSession: () =>
      setState((s) => {
        if (!s.activeSession) return s;
        const entries = s.activeSession.entries
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.completed) }))
          .filter((e) => e.sets.length > 0);
        if (!entries.length) return { ...s, activeSession: null };
        return {
          ...s,
          sessions: [
            ...s.sessions,
            {
              ...s.activeSession,
              entries,
              finishedAt: new Date().toISOString(),
            },
          ],
          activeSession: null,
        };
      }),
    discardSession: () => setState((s) => ({ ...s, activeSession: null })),

    prFor,
    lastSetsFor,
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
