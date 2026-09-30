import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button, Card, EmptyState, Input, Tag } from "@/components/ui-kit";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS } from "@/lib/types";

export const Route = createFileRoute("/treino/$workoutId")({
  head: () => ({
    meta: [
      { title: "Treino · Forja" },
      {
        name: "description",
        content:
          "Monte os exercícios do treino, defina séries alvo e inicie a execução.",
      },
      { property: "og:title", content: "Treino · Forja" },
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

  const found = ready ? findWorkout(workoutId) : null;

  const filtered = useMemo(
    () =>
      exercises.filter((e) =>
        `${e.name} ${e.category} ${e.equipment}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [exercises, query],
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
  const groups = muscleGroupsOf(workout.exerciseIds, getExercise);
  const activeOther =
    state.activeSession && state.activeSession.workoutId !== workout.id;

  return (
    <AppShell title={workout.name} back={{ to: "/" }}>
      <Card className="mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {routine.name}
        </p>
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
            <h2 className="truncate text-xl font-bold">{workout.name}</h2>
            <button
              className="text-xs font-semibold text-primary"
              onClick={() => {
                setName(workout.name);
                setRenaming(true);
              }}
            >
              Renomear
            </button>
          </div>
        )}

        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Dias da semana
        </p>
        <div className="mt-2 flex gap-1">
          {WEEKDAYS.map((label, day) => (
            <button
              key={day}
              onClick={() => toggleWorkoutDay(workout.id, day)}
              className={`h-9 flex-1 rounded-lg text-[11px] font-bold tap active:scale-95 ${
                workout.days.includes(day)
                  ? "bg-primary text-primary-foreground"
                  : "bg-elevated text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Grupos musculares (automático)
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {groups.length ? (
            groups.map((g) => <Tag key={g}>{g}</Tag>)
          ) : (
            <span className="text-xs text-muted-foreground">
              Derivado dos exercícios selecionados.
            </span>
          )}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Exercícios ({workout.exerciseIds.length})
        </h3>
        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => { setSelectedExercises([]); setQuery(""); setCategory(null); setPicker(true); }}>
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
          {workout.exerciseIds.map((id) => {
            const ex = getExercise(id);
            if (!ex) return null;
            const pr = prFor(id);
            return (
              <div key={id} className="surface flex items-center gap-3 p-3">
                <Link to="/exercicio/$exerciseId" params={{ exerciseId: id }}>
                  <ExerciseMedia exercise={ex} className="h-14 w-14 shrink-0" rounded="rounded-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to="/exercicio/$exerciseId" params={{ exerciseId: id }}>
                    <p className="truncate text-sm font-semibold">{ex.name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {ex.category} · {ex.equipment}
                    {pr != null ? ` · PR ${pr}kg` : ""}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Séries</span>
                    <button
                      className="h-6 w-6 rounded-md bg-elevated text-sm font-bold"
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
                <button
                  className="shrink-0 text-xs font-semibold text-destructive"
                  onClick={() => removeExerciseFromWorkout(workout.id, id)}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-[72px] left-1/2 z-20 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
        <Button
          className="w-full py-3.5"
          disabled={workout.exerciseIds.length === 0}
          onClick={() => {
            if (
              activeOther &&
              !confirm("Existe um treino em andamento. Descartar e iniciar este?")
            )
              return;
            if (!state.activeSession || state.activeSession.workoutId !== workout.id) {
              startSession(workout.id);
            }
            navigate({ to: "/executar/$workoutId", params: { workoutId: workout.id } });
          }}
        >
          {state.activeSession?.workoutId === workout.id
            ? "Continuar treino"
            : "Iniciar Treino"}
        </Button>
      </div>

      {picker && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm">
          <div className="mx-auto flex h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border-t border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="font-semibold">Adicionar exercício</p>
              <button className="text-sm text-primary" onClick={() => setPicker(false)}>
                Fechar
              </button>
            </div>
            <div className="p-4 pb-2">
              <Input
                autoFocus
                placeholder="Buscar por nome, grupo ou equipamento"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                <button type="button" onClick={() => setCategory(null)} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${category === null ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}>Todos</button>
                {categories.map((item) => (
                  <button type="button" key={item} onClick={() => setCategory(item)} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${category === item ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}>
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
                        current.includes(ex.id) ? current.filter((id) => id !== ex.id) : [...current, ex.id],
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-40 ${selected ? "border-primary/50 bg-primary/10" : "border-border bg-elevated"}`}
                  >
                    <ExerciseMedia exercise={ex} className="h-12 w-12 shrink-0" rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.category} · {ex.equipment}</p>
                    </div>
                    <span className={`text-xs font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                      {added ? "Adicionado" : selected ? "Selecionado" : "+"}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</p>}
            </div>
            <div className="border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button
                className="w-full"
                disabled={selectedExercises.length === 0}
                onClick={() => {
                  selectedExercises.forEach((id) => addExerciseToWorkout(workout.id, id));
                  setSelectedExercises([]);
                  setPicker(false);
                }}
              >
                {selectedExercises.length > 0 ? `Adicionar ${selectedExercises.length} exercício${selectedExercises.length === 1 ? "" : "s"}` : "Selecione exercícios"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
