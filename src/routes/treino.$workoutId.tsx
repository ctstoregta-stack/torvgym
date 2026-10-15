import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button, Card, EmptyState, Input, Tag } from "@/components/ui-kit";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS } from "@/lib/types";

export const Route = createFileRoute("/treino/$workoutId")({
  head: () => ({
    meta: [
      { title: "Treino · TorvGym" },
      {
        name: "description",
        content: "Monte os exercícios do treino, defina séries alvo e inicie a execução.",
      },
      { property: "og:title", content: "Treino · TorvGym" },
      {
        property: "og:description",
        content: "Exercícios, grupos musculares e séries alvo do seu treino.",
      },
    ],
  }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const {
    ready,
    findWorkout,
    getExercise,
    exercises,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    setTargetSets,
    toggleWorkoutDay,
    updateWorkout,
    startSession,
    state,
    prFor,
  } = useGym();

  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [confirmStart, setConfirmStart] = useState(false);
  const [notes, setNotes] = useState("");
  const [restSeconds, setRestSeconds] = useState(60);

  const found = ready ? findWorkout(workoutId) : null;

  const categories = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.category))).sort(),
    [exercises],
  );

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (!category || e.category === category) &&
          `${e.name} ${e.category} ${e.equipment}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [exercises, query, category],
  );

  if (!ready) {
    return (
      <AppShell title="Treino" back={{ to: "/" }}>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  if (!found) {
    return (
      <AppShell title="Treino" back={{ to: "/" }}>
        <EmptyState
          title="Treino não encontrado"
          description="Este treino pode ter sido excluído."
          action={
            <Link to="/rotinas">
              <Button>Ver rotinas</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const { workout, routine } = found;
  const currentNotes = workout.notes ?? "";
  const currentRest = workout.restSeconds ?? 60;
  const groups = muscleGroupsOf(workout.exerciseIds, getExercise);
  const activeOther = state.activeSession && state.activeSession.workoutId !== workout.id;

  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= workout.exerciseIds.length) return;
    const exerciseIds = [...workout.exerciseIds];
    [exerciseIds[index], exerciseIds[nextIndex]] = [exerciseIds[nextIndex]!, exerciseIds[index]!];
    updateWorkout(workout.id, { exerciseIds });
  };

  return (
    <AppShell title={workout.name} back={{ to: "/" }}>
      <Card className="relative mb-5 min-w-0 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary" aria-hidden="true">✦</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{routine.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">PERSONALIZE SEU TREINO</p>
            </div>
          </div>
        {renaming ? (
          <div className="mt-2 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              onClick={() => {
                if (name.trim()) updateWorkout(workout.id, { name: name.trim() });
                setRenaming(false);
              }}
            >
              Salvar
            </Button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-2">
            <h2 className="break-words text-xl font-black tracking-tight sm:text-2xl">{workout.name}</h2>
            <button
              className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
              onClick={() => {
                setName(workout.name);
                setRenaming(true);
              }}
            >
              Renomear
            </button>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-border/70 bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground">Dias da semana</p>
            <span className="text-[10px] text-muted-foreground">Toque para selecionar</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((label, day) => (
            <button
              key={day}
              onClick={() => toggleWorkoutDay(workout.id, day)}
              className={`h-9 min-w-0 rounded-xl text-[11px] font-extrabold tap active:scale-95 transition-colors ${
                workout.days.includes(day)
                  ? "bg-primary text-primary-foreground"
                  : "bg-elevated text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Descanso padrão
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border/80 bg-elevated px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              value={currentRest}
              onChange={(e) => setRestSeconds(Number(e.target.value))}
              onBlur={() =>
                updateWorkout(workout.id, {
                  restSeconds: Math.max(15, Math.min(600, restSeconds || currentRest)),
                })
              }
            >
              {[30, 45, 60, 75, 90, 120, 150, 180].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds}s
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Observações do treino
            <textarea
              className="mt-1 min-h-24 w-full resize-y rounded-xl border border-border/80 bg-elevated px-3 py-2 text-sm font-normal text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              maxLength={1000}
              defaultValue={currentNotes}
              placeholder="Ex.: foco em técnica, amplitude..."
              onBlur={(e) => {
                setNotes(e.target.value);
                updateWorkout(workout.id, { notes: e.target.value.slice(0, 1000) });
              }}
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-3">
          <p className="text-xs font-bold text-foreground">Grupos musculares</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Atualizados automaticamente conforme os exercícios.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {groups.length ? (
            groups.map((g) => <Tag key={g}>{g}</Tag>)
          ) : (
            <span className="text-xs text-muted-foreground">
              Derivado dos exercícios selecionados.
            </span>
          )}
        </div>
          </div>
        </div>
      </Card>

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Montagem do treino</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">
            Exercícios <span className="text-muted-foreground">({workout.exerciseIds.length})</span>
          </h3>
        </div>
        <Button
          variant="outline"
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold"
          onClick={() => {
            setSelectedExercises([]);
            setQuery("");
            setCategory(null);
            setPicker(true);
          }}
        >
          + Adicionar
        </Button>
      </div>

      {workout.exerciseIds.length === 0 ? (
        <EmptyState
          title="Nenhum exercício"
          description="Adicione exercícios da biblioteca para montar este treino."
          action={<Button onClick={() => setPicker(true)}>Adicionar exercício</Button>}
        />
      ) : (
        <div className="space-y-2">
          {workout.exerciseIds.map((id, index) => {
            const ex = getExercise(id);
            if (!ex) return null;
            const pr = prFor(id);
            return (
              <div key={id} className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-2.5 shadow-sm transition-colors hover:border-primary/25 sm:gap-3 sm:p-3">
                <Link to="/exercicio/$exerciseId" params={{ exerciseId: id }}>
                  <div className="relative shrink-0">
                    <ExerciseMedia exercise={ex} className="h-14 w-14" rounded="rounded-xl" />
                    <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-primary/30 bg-card px-1 text-[10px] font-extrabold text-primary">{index + 1}</span>
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to="/exercicio/$exerciseId" params={{ exerciseId: id }}>
                    <p className="truncate text-sm font-semibold">{ex.name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {ex.category} · {ex.equipment}
                    {pr != null ? ` · PR ${pr}kg` : ""}
                    {" · "}
                    {workout.targetSets[id] ?? 3} séries
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Séries</span>
                    <button
                      className="h-7 w-7 rounded-lg border border-border/70 bg-elevated text-sm font-extrabold transition-colors hover:border-primary/40 hover:bg-primary/10"
                      onClick={() =>
                        setTargetSets(workout.id, id, (workout.targetSets[id] ?? 3) - 1)
                      }
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm font-semibold">
                      {workout.targetSets[id] ?? 3}
                    </span>
                    <button
                      className="h-6 w-6 rounded-md bg-elevated text-sm font-bold"
                      onClick={() =>
                        setTargetSets(workout.id, id, (workout.targetSets[id] ?? 3) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Mover ${ex.name} para cima`}
                    disabled={index === 0}
                    onClick={() => moveExercise(index, -1)}
                    className="h-8 w-8 rounded-xl border border-border/70 bg-elevated text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-25"
                  >
                    <span aria-hidden="true">⌃</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover ${ex.name} para baixo`}
                    disabled={index === workout.exerciseIds.length - 1}
                    onClick={() => moveExercise(index, 1)}
                    className="h-8 w-8 rounded-lg bg-card text-sm font-bold text-muted-foreground disabled:opacity-30"
                  >
                    <span aria-hidden="true">⌄</span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 rounded-lg px-1 py-1 text-[10px] font-bold text-destructive transition-colors hover:bg-destructive/10"
                    onClick={() => removeExerciseFromWorkout(workout.id, id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2">
        <Button
          className="w-full rounded-2xl py-4 text-sm font-extrabold shadow-lg shadow-primary/20"
          disabled={workout.exerciseIds.length === 0}
          onClick={() => {
            if (activeOther) {
              setConfirmStart(true);
              return;
            }
            if (!state.activeSession || state.activeSession.workoutId !== workout.id) {
              startSession(workout.id);
            }
            navigate({ to: "/executar/$workoutId", params: { workoutId: workout.id } });
          }}
        >
          {state.activeSession?.workoutId === workout.id ? "Continuar treino" : "Iniciar Treino"}
        </Button>
      </div>

      <Dialog open={confirmStart} onOpenChange={setConfirmStart}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>Treino em andamento</DialogTitle>
            <DialogDescription>
              Você já tem outro treino em andamento. Iniciar este treino encerrará a sessão atual e
              poderá fazer você perder o progresso dela.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setConfirmStart(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                setConfirmStart(false);
                startSession(workout.id);
                navigate({ to: "/executar/$workoutId", params: { workoutId: workout.id } });
              }}
            >
              Iniciar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {picker && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm">
          <div className="mx-auto flex h-[88dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-border/80 bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 bg-gradient-to-r from-primary/10 to-card p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Biblioteca</p>
                <p className="mt-1 font-extrabold">Adicionar exercícios</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Selecione um ou mais movimentos para o treino.</p>
              </div>
              <button className="rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-primary" onClick={() => setPicker(false)}>
                Fechar
              </button>
            </div>
            <div className="p-4 pb-2">
              <Input
                autoFocus
                placeholder="Buscar exercício, grupo ou equipamento"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                <button
                  type="button"
                  aria-pressed={category === null}
                  onClick={() => setCategory(null)}
                  className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${category === null ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}
                >
                  Todos
                </button>
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                    className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${category === item ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-2">
              {filtered.map((ex) => {
                const added = workout.exerciseIds.includes(ex.id);
                const selected = selectedExercises.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    disabled={added}
                    onClick={() =>
                      setSelectedExercises((current) =>
                        current.includes(ex.id)
                          ? current.filter((id) => id !== ex.id)
                          : [...current, ex.id],
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all disabled:opacity-40 ${selected ? "border-primary/60 bg-primary/10 shadow-sm shadow-primary/10" : "border-border/80 bg-elevated hover:border-primary/25"}`}
                  >
                    <ExerciseMedia
                      exercise={ex}
                      className="h-12 w-12 shrink-0"
                      rounded="rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.category} · {ex.equipment}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {added ? "Adicionado" : selected ? "Selecionado" : "+"}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum exercício encontrado.
                </p>
              )}
            </div>
            <div className="border-t border-border/80 bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(0,0,0,0.12)]">
              <Button
                className="w-full"
                disabled={selectedExercises.length === 0}
                onClick={() => {
                  selectedExercises.forEach((id) => addExerciseToWorkout(workout.id, id));
                  setSelectedExercises([]);
                  setPicker(false);
                }}
              >
                {selectedExercises.length > 0
                  ? `Adicionar ${selectedExercises.length} exercício${selectedExercises.length === 1 ? "" : "s"}`
                  : "Selecione exercícios"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
