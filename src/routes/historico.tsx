import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import type { Session } from "@/lib/types";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico · Forja" },
      { name: "description", content: "Acompanhe treinos, volume e recordes pessoais." },
      { property: "og:title", content: "Histórico de treinos · Forja" },
      { property: "og:description", content: "Sessões concluídas, volume e progressão." },
    ],
  }),
  component: HistoryPage,
});

function sessionVolume(session: Session) {
  return session.entries.reduce(
    (acc, entry) => acc + entry.sets.reduce((v, set) => v + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0,
  );
}

function HistoryPage() {
  const { ready, state, getExercise } = useGym();
  const [range, setRange] = useState<7 | 30 | 90 | 0>(0);

  const allSessions = state.sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime());
  const since = range ? Date.now() - range * 24 * 60 * 60 * 1000 : 0;
  const sessions = range
    ? allSessions.filter((s) => new Date(s.finishedAt!).getTime() >= since)
    : allSessions;

  if (!ready) {
    return <AppShell title="Histórico"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;
  }

  const totalVolume = sessions.reduce((acc, session) => acc + sessionVolume(session), 0);
  const totalPRs = sessions.reduce(
    (acc, session) => acc + session.entries.reduce((a, entry) => a + entry.sets.filter((set) => set.isPR).length, 0),
    0,
  );

  return (
    <AppShell title="Histórico">
      {sessions.length === 0 ? (
        <EmptyState
          title="Nenhum treino concluído"
          description="Finalize um treino para começar a acompanhar sua evolução aqui."
          action={<Link to="/"><Button>Ir para o início</Button></Link>}
        />
      ) : (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {([
              [0, "Tudo"],
              [7, "7 dias"],
              [30, "30 dias"],
              [90, "90 dias"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${range === value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3">
              <p className="text-[11px] text-muted-foreground">Treinos</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{sessions.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] text-muted-foreground">Volume</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {Math.round(totalVolume).toLocaleString("pt-BR")}<span className="ml-1 text-xs font-medium text-muted-foreground">kg</span>
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] text-muted-foreground">PRs</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gold">{totalPRs}</p>
            </Card>
          </div>

          {sessions.length > 1 && (
            <Card className="my-4 p-3">
              <p className="mb-3 text-sm font-semibold">Volume por treino</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessions.slice(0, 8).reverse().map((session) => ({
                    name: new Date(session.finishedAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                    volume: Math.round(sessionVolume(session)),
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="volume" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {sessions.map((session) => {
              const volume = sessionVolume(session);
              const prs = session.entries.reduce((a, entry) => a + entry.sets.filter((set) => set.isPR).length, 0);
              return (
                <Card key={session.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{session.workoutName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.finishedAt!).toLocaleString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{Math.round(volume)} kg</p>
                      {prs > 0 && <p className="text-[11px] font-bold text-gold">{prs} PR{prs > 1 ? "s" : ""} 👑</p>}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {session.entries.map((entry) => {
                      const ex = getExercise(entry.exerciseId);
                      return (
                        <Link
                          key={entry.exerciseId}
                          to="/exercicio/$exerciseId"
                          params={{ exerciseId: entry.exerciseId }}
                          className="flex min-h-10 items-center justify-between rounded-lg bg-elevated px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <span className="min-w-0 truncate text-xs font-medium">{ex?.name ?? entry.exerciseId}</span>
                          <span className="shrink-0 pl-2 text-xs text-muted-foreground tabular-nums">
                            {entry.sets.length} × {Math.max(...entry.sets.map((set) => set.weight ?? 0))} kg
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
