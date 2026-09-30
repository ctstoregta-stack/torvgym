import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Input, MutedTag, Tag } from "@/components/ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS } from "@/lib/types";

export const Route = createFileRoute("/rotinas")({
  head: () => ({
    meta: [
      { title: "Rotinas · TorvGym" },
      {
        name: "description",
        content:
          "Crie rotinas, organize treinos por dia da semana e monte seus grupos musculares.",
      },
      { property: "og:title", content: "Rotinas · TorvGym" },
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
  const [pendingDelete, setPendingDelete] = useState<{ type: "routine" | "workout"; id: string; name: string; active: boolean } | null>(null);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(() => new Set());
  const [settingsRoutine, setSettingsRoutine] = useState<string | null>(null);

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
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-2 text-left tap"
                    onClick={() =>
                      setExpandedRoutines((current) => {
                        const next = new Set(current);
                        if (next.has(routine.id)) next.delete(routine.id);
                        else next.add(routine.id);
                        return next;
                      })
                    }
                    aria-expanded={expandedRoutines.has(routine.id)}
                  >
                    <span className="mt-0.5 text-muted-foreground">
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${expandedRoutines.has(routine.id) ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-base font-semibold">{routine.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {routine.workouts.length} treino
                        {routine.workouts.length === 1 ? "" : "s"}
                        {isActive ? " · Rotina ativa" : ""}
                      </p>
                    </span>
                  </button>
                )}
                {editing !== routine.id && (
                  <Button
                    variant="ghost"
                    className="h-10 w-10 shrink-0 px-0"
                    aria-label="Configurações da rotina"
                    onClick={() => setSettingsRoutine(routine.id)}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L7 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H5v-2.4h.8a1.7 1.7 0 0 0 1.6-1A1.7 1.7 0 0 0 7.1 9L7 8.9l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V6H16v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L20.7 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.4h-.1a1.7 1.7 0 0 0-1.6.6Z" />
                    </svg>
                  </Button>
                )}
              </div>

              {expandedRoutines.has(routine.id) && !isActive && (
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => setActiveRoutine(routine.id)}
                >
                  Tornar rotina ativa
                </Button>
              )}

              {expandedRoutines.has(routine.id) && (
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
                            setPendingDelete({
                              type: "workout",
                              id: w.id,
                              name: w.name,
                              active: state.activeSession?.workoutId === w.id,
                            });
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
              )}

              {expandedRoutines.has(routine.id) && isActive && (
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

      <Dialog open={!!settingsRoutine} onOpenChange={(open) => !open && setSettingsRoutine(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>Configurações da rotina</DialogTitle>
            <DialogDescription>Gerencie as opções desta rotina.</DialogDescription>
          </DialogHeader>
          {settingsRoutine && (
            <div className="grid gap-2 pt-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  const routine = state.routines.find((item) => item.id === settingsRoutine);
                  if (routine) {
                    setEditing(routine.id);
                    setEditName(routine.name);
                  }
                  setSettingsRoutine(null);
                }}
              >
                Renomear
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive"
                onClick={() => {
                  const routine = state.routines.find((item) => item.id === settingsRoutine);
                  if (routine) {
                    setPendingDelete({
                      type: "routine",
                      id: routine.id,
                      name: routine.name,
                      active: state.activeSession?.routineId === routine.id,
                    });
                  }
                  setSettingsRoutine(null);
                }}
              >
                Excluir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>{pendingDelete?.active ? "Treino em andamento" : "Confirmar exclusão"}</DialogTitle>
            <DialogDescription>
              {pendingDelete?.active
                ? `Existe um treino em andamento. Excluir "${pendingDelete.name}" também encerrará a sessão atual e poderá apagar seu progresso.`
                : `Excluir "${pendingDelete?.name}"? Esta ação não poderá ser desfeita.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPendingDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                if (!pendingDelete) return;
                if (pendingDelete.type === "routine") deleteRoutine(pendingDelete.id);
                else deleteWorkout(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
