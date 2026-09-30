import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico · Forja" },
      {
        name: "description",
        content:
          "Todos os treinos concluídos com séries, cargas, volume total e recordes pessoais.",
      },
      { property: "og:title", content: "Histórico de treinos · Forja" },
      {
        property: "og:description",
        content: "Sessões concluídas, volume, séries e PRs registrados.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { ready, state, getExercise } = useGym();
  const [range, setRange] = useState<7 | 30 | 90 | 0>(0);

  if (!ready) {
    return (
      <AppShell title="Histórico">
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  const sessions = useMemo(() => {
    const all = state.sessions
      .filter((s) => s.finishedAt)
      .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime());
    if (!range) return all;
    const since = Date.now() - range * 24 * 60 * 60 * 1000;
    return all.filter((s) => new Date(s.finishedAt!).getTime() >= since);
  }, [state.sessions, range]);

  const totalPRs = sessions.reduce((acc, s) => acc + s.entries.reduce((a, e) => a + e.sets.filter((x) => x.isPR).length, 0), 0);\n\n  const totalVolume = sessions.reduce(
    (acc, s) =>
      acc +
      s.entries.reduce(
        (a, e) => a + e.sets.reduce((v, x) => v + (x.weight ?? 0) * (x.reps ?? 0), 0),
        0,
      ),
    0,
  );

  return (
    <AppShell title="Histórico">
      {sessions.length === 0 ? (
        <EmptyState
          title="Nenhum treino concluído"
          description="Finalize um treino para que ele apareça aqui com séries, cargas e recordes."
          action={
            <Link to="/">
              <Button>Ir para o treino de hoje</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                <p className="mt-1 text-xl font-bold tabular-nums">{Math.round(totalVolume)}<span className="ml-1 text-xs font-medium text-muted-foreground">kg</span></p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] text-muted-foreground">PRs</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gold">{totalPRs}</p>
              </Card>
            </div>
          </div>

          {sessions.length > 1 && (
            <Card className="mb-4 p-3">
              <p className="mb-3 text-sm font-semibold">Volume por treino</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessions.slice(0, 8).reverse().map((s) => ({
                    name: new Date(s.finishedAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                    volume: Math.round(s.entries.reduce((a, e) => a + e.sets.reduce((v, x) => v + (x.weight ?? 0) * (x.reps ?? 0), 0), 0)),
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("pt-BR")} kg`, "Volume"]} />
                    <Bar dataKey="volume" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
           <div>
              <p className="text-[11px] text-muted-foreground">Volume total</p>
              <p className="text-lg font-bold tabular-nums">
                {Math.round(totalVolume).toLocaleString("pt-BR")} kg
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sessions.map((s) => {
              const volume = s.entries.reduce(
                (a, e) => a + e.sets.reduce((v, x) => v + (x.weight ?? 0) * (x.reps ?? 0), 0),
                0,
              );
              const prs = s.entries.reduce(
                (a, e) => a + e.sets.filter((x) => x.isPR).length,
                0,
              );
              return (
                <Card key={s.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{s.workoutName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.finishedAt!).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{Math.round(volume)} kg</p>
                      {prs > 0 && (
                        <p className="text-[11px] font-bold text-gold">
                          {prs} PR{prs > 1 ? "s" : ""} 👑
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {s.entries.map((e) => {
                      const ex = getExercise(e.exerciseId);
                      return (
                        <Link
                          key={e.exerciseId}
                          to="/exercicio/$exerciseId"
                          params={{ exerciseId: e.exerciseId }}
                          className="flex items-center justify-between rounded-lg bg-elevated px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-xs font-medium">
                            {ex?.name ?? e.exerciseId}
                          </span>
                          <span className="shrink-0 pl-2 text-xs text-muted-foreground tabular-nums">
                            {e.sets.length} × {Math.max(...e.sets.map((x) => x.weight ?? 0))} kg
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
