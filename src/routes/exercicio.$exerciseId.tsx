import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button, Card, EmptyState, MutedTag, Tag } from "@/components/ui-kit";
import { estimate1RM, useGym } from "@/store/gym-store";

export const Route = createFileRoute("/exercicio/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Detalhe do exercício · Forja" },
      {
        name: "description",
        content:
          "Animação em loop, execução, ativação muscular, histórico real e progressão de carga.",
      },
      { property: "og:title", content: "Detalhe do exercício · Forja" },
      {
        property: "og:description",
        content: "Execução, músculos trabalhados, PR, 1RM estimado e histórico de cargas.",
      },
    ],
  }),
  component: ExerciseDetail,
});

const TABS = ["Execução", "Ativação Muscular", "Histórico & Gráfico"] as const;

function ExerciseDetail() {
  const { exerciseId } = Route.useParams();
  const { ready, getExercise, prFor, historyFor } = useGym();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Execução");

  if (!ready) {
    return (
      <AppShell title="Exercício" back={{ to: "/exercicios" }}>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  const ex = getExercise(exerciseId);
  if (!ex) {
    return (
      <AppShell title="Exercício" back={{ to: "/exercicios" }}>
        <EmptyState
          title="Exercício não encontrado"
          description="Ele pode ter sido removido da biblioteca."
          action={
            <Link to="/exercicios">
              <Button>Ver biblioteca</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const pr = prFor(ex.id);
  const history = historyFor(ex.id);

  let best1rm = 0;
  for (const h of history) {
    for (const s of h.sets) {
      if (s.weight && s.reps) best1rm = Math.max(best1rm, estimate1RM(s.weight, s.reps));
    }
  }

  const maxChart = Math.max(1, ...history.map((h) => h.maxWeight));
  const chart = [...history].reverse().slice(-12);

  return (
    <AppShell title={ex.name} back={{ to: "/exercicios" }}>
      <ExerciseMedia exercise={ex} className="mb-4 aspect-video w-full" rounded="rounded-2xl" />

      <h2 className="text-xl font-bold leading-tight">{ex.name}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{ex.category}</Tag>
        <MutedTag>{ex.equipment}</MutedTag>
        {pr != null && <MutedTag>PR {pr} kg</MutedTag>}
      </div>

      <div className="mt-4 flex gap-1 rounded-xl bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold tap ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tab === "Execução" && (
          <Card>
            <p className="text-sm font-semibold">Como executar</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {ex.execution || "Sem instruções cadastradas para este exercício."}
            </p>
            <p className="mt-4 text-sm font-semibold">Equipamento</p>
            <p className="mt-1 text-sm text-muted-foreground">{ex.equipment}</p>
          </Card>
        )}

        {tab === "Ativação Muscular" && (
          <>
            <Card>
              <p className="text-sm font-semibold text-primary">Músculos primários</p>
              <ul className="mt-2 space-y-1.5">
                {ex.primary_muscles.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-muted-foreground">
                Músculos secundários
              </p>
              <ul className="mt-2 space-y-1.5">
                {ex.secondary_muscles.length ? (
                  ex.secondary_muscles.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                      {m}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">Nenhum (isolado)</li>
                )}
              </ul>
            </Card>
          </>
        )}

        {tab === "Histórico & Gráfico" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Carga máxima (PR)
                </p>
                <p className="mt-1 text-2xl font-bold text-gold tabular-nums">
                  {pr != null ? `${pr} kg` : "—"}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  1RM estimado
                </p>
                <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
                  {best1rm ? `${best1rm} kg` : "—"}
                </p>
              </Card>
            </div>

            {history.length === 0 ? (
              <EmptyState
                title="Sem histórico ainda"
                description="Registre este exercício em um treino para ver sua progressão real aqui."
              />
            ) : (
              <>
                <Card>
                  <p className="mb-3 text-sm font-semibold">Evolução da carga máxima</p>
                  <div className="flex h-32 items-end gap-1.5">
                    {chart.map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {h.maxWeight}
                        </span>
                        <div
                          className="w-full rounded-t accent-gradient"
                          style={{ height: `${Math.max(6, (h.maxWeight / maxChart) * 100)}%` }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(h.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="space-y-2">
                  {history.map((h, i) => (
                    <Card key={i}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {new Date(h.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <span className="text-xs font-bold text-primary tabular-nums">
                          máx {h.maxWeight} kg
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {h.sets.map((s, j) => (
                          <div
                            key={j}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span>Série {j + 1}</span>
                            <span className="tabular-nums">
                              {s.weight ?? "-"} kg × {s.reps ?? "-"} reps
                              {s.isPR ? " 👑" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
