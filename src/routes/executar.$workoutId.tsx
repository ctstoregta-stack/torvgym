import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { RestTimer, formatClock, type RestState } from "@/components/RestTimer";
import { Button, EmptyState, PRBadge } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import type { Session } from "@/lib/types";

const DEFAULT_REST = 60;

export const Route = createFileRoute("/executar/$workoutId")({
  head: () => ({
    meta: [
      { title: "Executando treino · TorvGym" },
      {
        name: "description",
        content:
          "Registre carga, repetições e conclua séries em poucos toques, com detecção automática de recorde.",
      },
      { property: "og:title", content: "Executando treino · TorvGym" },
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

function buildSummary(
  saved: Session | null,
  getExercise: (id: string) => { name: string } | undefined,
): Summary {
  const entries = saved?.entries ?? [];
  return {
    workoutName: saved?.workoutName ?? "Treino",
    durationSecs: saved
      ? Math.max(
          0,
          Math.floor(
            (new Date(saved.finishedAt ?? Date.now()).getTime() -
              new Date(saved.startedAt).getTime()) /
              1000,
          ),
        )
      : 0,
    sets: entries.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed).length,
      0,
    ),
    volume: entries.reduce(
      (acc, e) =>
        acc +
        e.sets
          .filter((s) => s.completed && s.weight != null && s.reps != null)
          .reduce((a, s) => a + s.weight! * s.reps!, 0),
      0,
    ),
    prs: entries.flatMap((e) =>
      e.sets
        .filter((s) => s.completed && s.isPR && s.weight != null)
        .map((s) => ({
          name: getExercise(e.exerciseId)?.name ?? "Exercício",
          weight: s.weight!,
        })),
    ),
  };
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
    updateSessionContext,
  } = useGym();

  const [now, setNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [rest, setRest] = useState<RestState>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [finishConfirm, setFinishConfirm] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRestChange = useCallback((next: RestState) => {
    setRest((current) => {
      if (next && current && next.remaining === 0 && current.remaining > 0) {
        toast.success("Descanso concluído");
      }
      if (!next) {
        updateSessionContext({ restStartedAt: null, restTotal: 0, restRemaining: 0, restRunning: false });
        return null;
      }
      updateSessionContext({
        restStartedAt: next.running && next.startedAt ? new Date(next.startedAt).toISOString() : null,
        restTotal: next.total,
        restRemaining: next.remaining,
        restRunning: next.running,
      });
      return next;
    });
  }, [updateSessionContext]);

  const handleRestSkip = useCallback(() => {
    setRest(null);
    updateSessionContext({ restStartedAt: null, restTotal: 0, restRemaining: 0, restRunning: false });
  }, [updateSessionContext]);

  const startRest = useCallback((seconds: number = DEFAULT_REST) => {
    const startedAt = new Date().toISOString();
    const next = { total: seconds, remaining: seconds, running: true, startedAt: Date.now() } as RestState;
    setRest(next);
    updateSessionContext({ restStartedAt: startedAt, restTotal: seconds, restRemaining: seconds, restRunning: true });
  }, [updateSessionContext]);

  const handleSetUpdate = useCallback((exerciseId: string, setIndex: number, completed: boolean) => {
    updateSet(exerciseId, setIndex, { completed });
    if (completed) toast.success("Série salva", { duration: 1000 });
  }, [updateSet]);

  const session = state.activeSession;

  useEffect(() => {
    if (!session || session.workoutId !== workoutId) return;
    const savedIndex = session.currentExerciseIndex;
    if (savedIndex != null && savedIndex >= 0 && savedIndex < session.entries.length) setIndex(savedIndex);
    else {
      const firstPending = session.entries.findIndex((entry) => entry.sets.some((set) => !set.completed));
      setIndex(firstPending >= 0 ? firstPending : 0);
    }
    if (session.restTotal && session.restRemaining != null) {
      const remaining = session.restRunning && session.restStartedAt ? Math.max(0, session.restTotal - Math.floor((Date.now() - new Date(session.restStartedAt).getTime()) / 1000)) : session.restRemaining;
      setRest({ total: session.restTotal, remaining, running: !!session.restRunning && remaining > 0, startedAt: session.restRunning && session.restStartedAt ? new Date(session.restStartedAt).getTime() : null });
    }
  }, [session?.id, workoutId]);

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
      </AppShell>
    );
  }

  const entries = session.entries;
  const currentIndex = Math.min(index, Math.max(0, entries.length - 1));
  const current = entries[currentIndex];
  const doneSets = entries.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0,
  );
  const totalSets = entries.reduce((acc, e) => acc + e.sets.length, 0);
  const volume = entries.reduce(
    (acc, e) =>
      acc +
      e.sets
        .filter((s) => s.completed && s.weight != null && s.reps != null)
        .reduce((a, s) => a + s.weight! * s.reps!, 0),
    0,
  );

  const ex = current ? getExercise(current.exerciseId) : undefined;
  const previous = current ? lastSetsFor(current.exerciseId) : null;
  const storedPR = current ? prFor(current.exerciseId) : null;
  const currentSetIndex = current ? current.sets.findIndex((set) => !set.completed) : -1;
  const nextSetIndex = currentSetIndex >= 0 ? currentSetIndex : current ? current.sets.length : 0;
  const hasNextSet = !!current && nextSetIndex < current.sets.length;
  const nextExercise = entries[currentIndex + 1];
  const nextExerciseName = nextExercise ? getExercise(nextExercise.exerciseId)?.name : undefined;
  const nextLabel = hasNextSet
    ? `${ex?.name ?? "Exercício"} — série ${nextSetIndex + 1}/${current?.sets.length ?? 0}`
    : nextExerciseName
      ? nextExerciseName
      : undefined;
  const nextLabelPrefix = hasNextSet ? "Próxima série" : "Próximo exercício";
  const finish = () => {
    const saved = finishSession();
    const data = buildSummary(saved, getExercise);
    toast.success("Treino salvo no histórico");
    setSummary(data);
  };

  return (
    <AppShell
      title={session.workoutName}
      back={{ to: "/" }}
      action={
        currentIndex === entries.length - 1 ? (
          <Button className="px-3 py-2 text-xs" disabled={doneSets === 0} onClick={doneSets >= totalSets ? finish : () => setFinishConfirm(true)}>
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
                onClick={() => { setIndex(i); updateSessionContext({ currentExerciseIndex: i }); }}
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
          <div className="border-b border-border bg-primary/5 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Série atual</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">
              {current.sets.findIndex((set) => !set.completed) >= 0
                ? `Série ${current.sets.findIndex((set) => !set.completed) + 1} de ${current.sets.length}`
                : "Todas as séries concluídas"}
            </p>
          </div>
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
                    value={set.weight ?? prev?.weight ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateSet(current.exerciseId, i, {
                        weight: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-input bg-elevated px-2 text-center text-lg font-semibold tabular-nums outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? prev?.reps ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateSet(current.exerciseId, i, {
                        reps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-input bg-elevated px-2 text-center text-lg font-semibold tabular-nums outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
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
                        toast.success(`🏆 Novo recorde! ${weight} kg em ${ex.name}`, { duration: 2200 });
                      } else {
                        toast.success(`Série ${i + 1} concluída`);
                      }
                      startRest();
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
                  startRest()
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
          onClick={() => setDiscardConfirm(true)}
        >
          Descartar treino
        </Button>
      </div>


      <Dialog open={finishConfirm} onOpenChange={setFinishConfirm}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>{doneSets < totalSets ? "Há séries pendentes" : "Finalizar treino?"}</DialogTitle>
            <DialogDescription>
              {doneSets < totalSets
                ? `Você concluiu ${doneSets} de ${totalSets} séries. Se finalizar agora, as séries pendentes não serão salvas no histórico.`
                : "Todas as séries foram concluídas. Deseja salvar o treino no histórico?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setFinishConfirm(false)}>Continuar treinando</Button>
            <Button className="w-full sm:w-auto" onClick={() => { setFinishConfirm(false); finish(); }}>Finalizar treino</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardConfirm} onOpenChange={setDiscardConfirm}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>Descartar treino?</DialogTitle>
            <DialogDescription>
              As séries desta sessão não serão salvas no histórico. Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDiscardConfirm(false)}>Continuar treinando</Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                discardSession();
                setDiscardConfirm(false);
                navigate({ to: "/" });
              }}
            >
              Descartar treino
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {rest && <div className="h-24" />}

      <RestTimer
        rest={rest}
        onChange={handleRestChange}
        onSkip={handleRestSkip}
        nextLabel={nextLabel}
        nextLabelPrefix={nextLabelPrefix}
      />

      {/* Navegação entre exercícios */}
      <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-2xl gap-2 -translate-x-1/2 pb-1">
        <Button variant="outline" className="flex-1 py-3.5" disabled={currentIndex === 0} onClick={() => { const nextIndex = currentIndex - 1; setIndex(nextIndex); updateSessionContext({ currentExerciseIndex: nextIndex }); }}>
          ← Anterior
        </Button>
        {currentIndex < entries.length - 1 ? (
          <Button variant="outline" className="flex-1 py-3.5" onClick={() => { const nextIndex = currentIndex + 1; setIndex(nextIndex); updateSessionContext({ currentExerciseIndex: nextIndex }); }}>
            Próximo →
          </Button>
        ) : (
          <Button className="flex-1 py-3.5" disabled={doneSets === 0} onClick={doneSets >= totalSets ? finish : () => setFinishConfirm(true)}>
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
