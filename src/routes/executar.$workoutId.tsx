import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { RestTimer, formatClock, type RestState } from "@/components/RestTimer";
import { Button, EmptyState, PRBadge } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import type { Session } from "@/lib/types";

const DEFAULT_REST = 60;

export const Route = createFileRoute("/executar/$workoutId")({
  head: () => ({
    meta: [
      { title: "Executando treino · Forja" },
      {
        name: "description",
        content:
          "Registre carga, repetições e conclua séries em poucos toques, com detecção automática de recorde.",
      },
      { property: "og:title", content: "Executando treino · Forja" },
      {
        property: "og:description",
        content: "Planilha rápida de séries com referência do treino anterior e PR.",
      },
    ],
  }),
  component: ExecutePage,
});

function elapsedSecs(startedAt: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

type Summary = {
  workoutName: string;
  durationSecs: number;
  sets: number;
  volume: number;
  prs: { name: string; weight: number }[];
};

function ExecutePage() {
  const navigate = useNavigate();
  const { workoutId } = Route.useParams();
  const {
    ready,
    state,
    getExercise,
    updateSet,
    addSet,
    removeSet,
    finishSession,
    discardSession,
    prFor,
    lastSetsFor,
  } = useGym();

  const [now, setNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [rest, setRest] = useState<RestState>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRestChange = useCallback((next: RestState) => {
    setRest((current) => {
      if (next && current && next.remaining === 0 && current.remaining > 0) {
        toast.success("Descanso concluído");
      }
      return next;
    });
  }, []);

  const handleRestSkip = useCallback(() => setRest(null), []);

  const session = state.activeSession;

  if (summary) {
    return <SummaryScreen summary={summary} />;
  }

  if (!ready) {
    return (
      <AppShell title="Treino" back={{ to: "/" }}>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  if (!session || session.workoutId !== workoutId) {
    return (
      <AppShell title="Treino" back={{ to: "/" }}>
        <EmptyState
          title="Nenhum treino em andamento"
          description="Abra o treino e toque em Iniciar Treino para registrar suas séries."
          action={
            <Link to="/treino/$workoutId" params={{ workoutId }}>
              <Button>Abrir treino</Button>
            </Link>
          }
        />
      );
  }

  const entries = session.entries;

  const ex = current ? getExercise(current.exerciseId) : undefined;
  const previous = current ? lastSetsFor(current.exerciseId) : null;
  const storedPR = current ? prFor(current.exerciseId) : null;
  const nextExercise = entries[currentIndex + 1];
  const nextExerciseName = nextExercise ? getExercise(nextExercise.exerciseId)?.name : undefined;
  const finish = () => {
    const saved = finishSession();
    const data = buildSummary(saved);
    toast.success("Treino salvo no histórico");
    setSummary(data);
  };

  return (
    <AppShell
      title={session.workoutName}
      back={{ to: "/" }}
      action={
        currentIndex === entries.length - 1 ? (
          <Button className="px-3 py-2 text-xs" disabled={doneSets === 0} onClick={finish}>
            Finalizar
          </Button>
        ) : null
      }
    >
      <div className="surface mb-3 grid grid-cols-3 divide-x divide-border p-3 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground">Duração</p>
          <p className="text-base font-bold tabular-nums">
            {formatClock(elapsedSecs(session.startedAt, now))}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Séries</p>
          <p className="text-base font-bold tabular-nums">
            {doneSets}/{totalSets}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Volume</p>
          <p className="text-base font-bold tabular-nums">{Math.round(volume)} kg</p>
        </div>
      </div>

      {/* Progresso do treino + atalhos por exercício */}
      <div className="mb-3">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Exercício {currentIndex + 1}/{entries.length}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {doneSets}/{totalSets} séries
          </span>
        </div>
        <div className="flex gap-1">
          {entries.map((e, i) => {
            const allDone = e.sets.every((s) => s.completed);
            return (
              <button
                key={e.exerciseId}
                aria-label={`Ir para exercício ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 flex-1 rounded-full tap ${
                  i === currentIndex
                    ? "bg-primary"
                    : allDone
                      ? "bg-success/70"
                      : "bg-elevated"
                }`}
              />
            );
          })}
        </div>
      </div>

      {ex && current && (
        <div className="surface overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <Link to="/exercicio/$exerciseId" params={{ exerciseId: ex.id }}>
              <ExerciseMedia exercise={ex} className="h-16 w-16" rounded="rounded-xl" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to="/exercicio/$exerciseId" params={{ exerciseId: ex.id }}>
                <p className="text-base font-bold leading-tight">{ex.name}</p>
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ex.equipment} ·{" "}
                {storedPR != null ? `PR ${storedPR} kg` : "Sem PR registrado"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[34px_62px_1fr_1fr_52px] items-center gap-2 px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Sér</span>
            <span>Ant.</span>
            <span className="text-center">Carga</span>
            <span className="text-center">Reps</span>
            <span className="text-center">✓</span>
          </div>

          <div className="space-y-2 p-3">
            {current.sets.map((set, i) => {
              const prev = previous?.[i];
              const prevLabel = prev
                ? `${prev.weight ?? "-"}×${prev.reps ?? "-"}`
                : "—";
              return (
                <div
                  key={i}
                  className={`grid grid-cols-[34px_62px_1fr_1fr_52px] items-center gap-2 rounded-xl px-1 py-1 ${
                    set.completed ? "bg-success/10" : ""
                  }`}
                >
                  <span className="flex items-center gap-1 text-base font-bold tabular-nums">
                    {i + 1}
                    {set.isPR && <PRBadge small />}
                  </span>
                  <span className="truncate text-xs text-muted-foreground tabular-nums">
                    {prevLabel}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={set.weight ?? ""}
                    placeholder={prev?.weight != null ? String(prev.weight) : "0"}
                    onChange={(e) =>
                      updateSet(current.exerciseId, i, {
                        weight: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-input bg-elevated px-2 text-center text-lg font-semibold tabular-nums outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ""}
                    placeholder={prev?.reps != null ? String(prev.reps) : "0"}
                    onChange={(e) =>
                      updateSet(current.exerciseId, i, {
                        reps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-input bg-elevated px-2 text-center text-lg font-semibold tabular-nums outline-none focus:border-primary"
                  />
                  <button
                    aria-label={`Concluir série ${i + 1}`}
                    onClick={() => {
                      if (set.completed) {
                        updateSet(current.exerciseId, i, {
                          completed: false,
                          isPR: false,
                        });
                        return;
                      }
                      const weight = set.weight ?? prev?.weight ?? null;
                      const reps = set.reps ?? prev?.reps ?? null;
                      const sessionBest = Math.max(
                        0,
                        ...current.sets
                          .filter((s) => s.completed && s.weight != null)
                          .map((s) => s.weight!),
                      );
                      const best = Math.max(storedPR ?? 0, sessionBest);
                      const isPR = weight != null && weight > best;
                      updateSet(current.exerciseId, i, {
                        weight,
                        reps,
                        completed: true,
                        isPR,
                      });
                      if (isPR) {
                        toast.success(`Novo recorde! ${weight} kg em ${ex.name}`);
                      } else {
                        toast.success(`Série ${i + 1} concluída`);
                      }
                      setRest({
                        total: DEFAULT_REST,
                        remaining: DEFAULT_REST,
                        running: true,
                      });
                    }}
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl tap active:scale-90 ${
                      set.completed
                        ? "bg-success text-background"
                        : "bg-elevated text-muted-foreground"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <Button
              variant="outline"
              className="flex-1 py-2.5 text-xs"
              onClick={() => addSet(current.exerciseId)}
            >
              + Série
            </Button>
            <Button
              variant="ghost"
              className="flex-1 py-2.5 text-xs"
              onClick={() => removeSet(current.exerciseId)}
            >
              − Série
            </Button>
            {!rest && (
              <Button
                variant="outline"
                className="flex-1 py-2.5 text-xs"
                onClick={() =>
                  setRest({
                    total: DEFAULT_REST,
                    remaining: DEFAULT_REST,
                    running: true,
                  })
                }
              >
                Descanso
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button
          variant="danger"
          className="px-4 py-2.5 text-xs"
          onClick={() => {
            if (confirm("Descartar este treino? As séries não serão salvas.")) {
              discardSession();
              navigate({ to: "/" });
            }
          }}
        >
          Descartar treino
        </Button>
      </div>

      {rest && <div className="h-24" />}

      <RestTimer rest={rest} onChange={handleRestChange} onSkip={handleRestSkip} nextLabel={nextExerciseName} />

      {/* Navegação entre exercícios */}
      <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-lg gap-2 -translate-x-1/2 pb-1">
        <Button variant="outline" className="flex-1 py-3.5" disabled={currentIndex === 0} onClick={() => setIndex(currentIndex - 1)}>
          ← Anterior
        </Button>
        {currentIndex < entries.length - 1 ? (
          <Button variant="outline" className="flex-1 py-3.5" onClick={() => setIndex(currentIndex + 1)}>
            Próximo →
          </Button>
        ) : (
          <Button className="flex-1 py-3.5" disabled={doneSets === 0} onClick={finish}>
            Finalizar
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function SummaryScreen({ summary }: { summary: Summary }) {
  const navigate = useNavigate();
  return (
    <AppShell title="Treino concluído">
      <div className="surface p-5 text-center">
        <p className="text-sm text-muted-foreground">{summary.workoutName}</p>
        <p className="mt-1 text-2xl font-bold">Treino concluído</p>
        <div className="mt-5 grid grid-cols-3 divide-x divide-border">
          <div><p className="text-[11px] text-muted-foreground">Duração</p><p className="text-lg font-bold tabular-nums">{formatClock(summary.durationSecs)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Séries</p><p className="text-lg font-bold tabular-nums">{summary.sets}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Volume</p><p className="text-lg font-bold tabular-nums">{Math.round(summary.volume)} kg</p></div>
        </div>
      </div>
      {summary.prs.length > 0 && (
        <div className="surface mt-4 p-4">
          <p className="mb-2 text-sm font-semibold">Novos recordes</p>
          <ul className="space-y-2">
            {summary.prs.map((pr, i) => (
              <li key={pr.name + "-" + i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="truncate text-sm">{pr.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-gold tabular-nums">{pr.weight} kg <PRBadge small /></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="outline" className="min-h-12 w-full" onClick={() => navigate({ to: "/" })}>← Voltar ao início</Button>
        <Button className="min-h-12 w-full" onClick={() => navigate({ to: "/historico" })}>Ver histórico</Button>
      </div>
    </AppShell>
  );
}
