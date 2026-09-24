import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button, EmptyState, PRBadge } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";

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

function elapsed(startedAt: string, now: number) {
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ExecutePage() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
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
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const session = state.activeSession;

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

  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = session.entries.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0,
  );
  const volume = session.entries.reduce(
    (a, e) =>
      a +
      e.sets
        .filter((s) => s.completed)
        .reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0,
  );

  return (
    <AppShell title={session.workoutName} back={{ to: "/" }}>
      <div className="surface mb-4 grid grid-cols-3 divide-x divide-border p-3 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground">Duração</p>
          <p className="text-base font-bold tabular-nums">
            {elapsed(session.startedAt, now)}
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
          <p className="text-base font-bold tabular-nums">
            {Math.round(volume)} kg
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {session.entries.map((entry) => {
          const ex = getExercise(entry.exerciseId);
          if (!ex) return null;
          const previous = lastSetsFor(entry.exerciseId);
          const storedPR = prFor(entry.exerciseId);

          return (
            <div key={entry.exerciseId} className="surface overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border p-3">
                <Link to="/exercicio/$exerciseId" params={{ exerciseId: ex.id }}>
                  <ExerciseMedia exercise={ex} className="h-12 w-12" rounded="rounded-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to="/exercicio/$exerciseId" params={{ exerciseId: ex.id }}>
                    <p className="truncate text-sm font-semibold">{ex.name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {storedPR != null ? `PR atual: ${storedPR} kg` : "Sem PR registrado"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[38px_1fr_1fr_1fr_44px] items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Série</span>
                <span>Anterior</span>
                <span>Carga</span>
                <span>Reps</span>
                <span className="text-center">✓</span>
              </div>

              {entry.sets.map((set, i) => {
                const prev = previous?.[i];
                const prevLabel = prev
                  ? `${prev.weight ?? "-"}kg × ${prev.reps ?? "-"}`
                  : "—";
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-[38px_1fr_1fr_1fr_44px] items-center gap-2 px-3 py-1.5 ${
                      set.completed ? "bg-success/10" : ""
                    }`}
                  >
                    <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
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
                        updateSet(entry.exerciseId, i, {
                          weight: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-input bg-elevated px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps ?? ""}
                      placeholder={prev?.reps != null ? String(prev.reps) : "0"}
                      onChange={(e) =>
                        updateSet(entry.exerciseId, i, {
                          reps: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-input bg-elevated px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-primary"
                    />
                    <button
                      aria-label={`Concluir série ${i + 1}`}
                      onClick={() => {
                        if (set.completed) {
                          updateSet(entry.exerciseId, i, { completed: false, isPR: false });
                          return;
                        }
                        const weight = set.weight ?? prev?.weight ?? null;
                        const reps = set.reps ?? prev?.reps ?? null;
                        const sessionBest = Math.max(
                          0,
                          ...entry.sets
                            .filter((s) => s.completed && s.weight != null)
                            .map((s) => s.weight!),
                        );
                        const best = Math.max(storedPR ?? 0, sessionBest);
                        const isPR = weight != null && weight > best;
                        updateSet(entry.exerciseId, i, {
                          weight,
                          reps,
                          completed: true,
                          isPR,
                        });
                      }}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg tap active:scale-90 ${
                        set.completed
                          ? "bg-success text-background"
                          : "bg-elevated text-muted-foreground"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              <div className="flex gap-2 p-3">
                <Button
                  variant="outline"
                  className="flex-1 py-2 text-xs"
                  onClick={() => addSet(entry.exerciseId)}
                >
                  + Série
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 py-2 text-xs"
                  onClick={() => removeSet(entry.exerciseId)}
                >
                  − Série
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-[72px] left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 gap-2">
        <Button
          variant="danger"
          className="px-4 py-3.5"
          onClick={() => {
            if (confirm("Descartar este treino? As séries não serão salvas.")) {
              discardSession();
              navigate({ to: "/" });
            }
          }}
        >
          Descartar
        </Button>
        <Button
          className="flex-1 py-3.5"
          disabled={doneSets === 0}
          onClick={() => {
            finishSession();
            navigate({ to: "/historico" });
          }}
        >
          Finalizar treino
        </Button>
      </div>
    </AppShell>
  );
}
