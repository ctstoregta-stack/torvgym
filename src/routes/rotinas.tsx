import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Input, MutedTag, Tag } from "@/components/ui-kit";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS } from "@/lib/types";

export const Route = createFileRoute("/rotinas")({
  head: () => ({
    meta: [
      { title: "Rotinas · Forja" },
      {
        name: "description",
        content:
          "Crie rotinas, organize treinos por dia da semana e monte seus grupos musculares.",
      },
      { property: "og:title", content: "Rotinas · Forja" },
      {
        property: "og:description",
        content: "Organize rotinas e treinos da semana com grupos musculares automáticos.",
      },
    ],
  }),
  component: RoutinesPage,
});

function RoutinesPage() {
  const {
    ready,
    state,
    activeRoutine,
    setActiveRoutine,
    createRoutine,
    renameRoutine,
    deleteRoutine,
    createWorkout,
    toggleWorkoutDay,
    deleteWorkout,
    getExercise,
  } = useGym();

  const [newRoutine, setNewRoutine] = useState("");
  const [newWorkout, setNewWorkout] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!ready) return <AppShell title="Rotinas"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;

  return (
    <AppShell title="Rotinas">
      <Card className="mb-5">
        <p className="mb-2 text-sm font-semibold">Nova rotina</p>
        <div className="flex gap-2">
          <Input
            value={newRoutine}
            placeholder="Ex.: Hipertrofia - Foco em Força"
            onChange={(e) => setNewRoutine(e.target.value)}
          />
          <Button
            disabled={!newRoutine.trim()}
            onClick={() => {
              createRoutine(newRoutine.trim());
              setNewRoutine("");
            }}
          >
            Criar
          </Button>
        </div>
      </Card>

      {state.routines.length === 0 && (
        <EmptyState
          title="Nenhuma rotina"
          description="Crie uma rotina acima para organizar seus treinos da semana."
        />
      )}

      <div className="space-y-4">
        {state.routines.map((routine) => {
          const isActive = routine.id === state.activeRoutineId;
          return (
            <Card key={routine.id} className={isActive ? "border-primary/40" : ""}>
              <div className="flex items-start justify-between gap-2">
                {editing === routine.id ? (
                  <div className="flex flex-1 gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Button
                      onClick={() => {
                        if (editName.trim()) renameRoutine(routine.id, editName.trim());
                        setEditing(null);
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{routine.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {routine.workouts.length} treino
                      {routine.workouts.length === 1 ? "" : "s"}
                      {isActive ? " · Rotina ativa" : ""}
                    </p>
                  </div>
                )}
                {editing !== routine.id && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      className="px-2 text-xs"
                      onClick={() => {
                        setEditing(routine.id);
                        setEditName(routine.name);
                      }}
                    >
                      Renomear
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 text-xs text-destructive"
                      onClick={() => {
                        const activeInRoutine = state.activeSession?.routineId === routine.id;
                        const message = activeInRoutine
                          ? `Existe um treino em andamento nesta rotina. Excluir "${routine.name}" poderá encerrar essa sessão. Deseja continuar?`
                          : `Excluir a rotina "${routine.name}"?`;
                        if (confirm(message)) deleteRoutine(routine.id);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {!isActive && (
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => setActiveRoutine(routine.id)}
                >
                  Tornar rotina ativa
                </Button>
              )}

              <div className="mt-4 space-y-3">
                {routine.workouts.map((w) => {
                  const groups = muscleGroupsOf(w.exerciseIds, getExercise);
                  return (
                    <div key={w.id} className="rounded-xl border border-border bg-elevated p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/treino/$workoutId"
                          params={{ workoutId: w.id }}
                          className="min-w-0 flex-1"
                        >
                          <p className="truncate text-sm font-semibold">{w.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {w.exerciseIds.length} exercício
                            {w.exerciseIds.length === 1 ? "" : "s"}
                          </p>
                        </Link>
                        <button
                          className="text-xs font-semibold text-destructive"
                          onClick={() => {
                            const activeWorkout = state.activeSession?.workoutId === w.id;
                            const message = activeWorkout
                              ? `Existe um treino em andamento. Excluir "${w.name}" poderá encerrar essa sessão. Deseja continuar?`
                              : `Excluir o treino "${w.name}"?`;
                            if (confirm(message)) deleteWorkout(w.id);
                          }}
                        >
                          Excluir
                        </button>
                      </div>

                      <div className="mt-3 flex gap-1">
                        {WEEKDAYS.map((label, day) => (
                          <button
                            key={day}
                            onClick={() => toggleWorkoutDay(w.id, day)}
                            className={`h-8 flex-1 rounded-lg text-[11px] font-bold tap active:scale-95 ${
                              w.days.includes(day)
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-muted-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {groups.length ? (
                          groups.map((g) => <Tag key={g}>{g}</Tag>)
                        ) : (
                          <MutedTag>Adicione exercícios</MutedTag>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isActive && (
                <div className="mt-4 flex gap-2">
                  <Input
                    value={newWorkout}
                    placeholder="Novo treino (ex.: Treino A)"
                    onChange={(e) => setNewWorkout(e.target.value)}
                  />
                  <Button
                    disabled={!newWorkout.trim()}
                    onClick={() => {
                      createWorkout(routine.id, newWorkout.trim());
                      setNewWorkout("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {activeRoutine && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Toque em um treino para editar exercícios e iniciar.
        </p>
      )}
    </AppShell>
  );
}
