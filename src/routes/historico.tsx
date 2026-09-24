import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";

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

  if (!ready) {
    return (
      <AppShell title="Histórico">
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  const sessions = state.sessions
    .filter((s) => s.finishedAt)
    .sort(
      (a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime(),
    );

  const totalVolume = sessions.reduce(
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
          <div className="surface mb-4 grid grid-cols-2 divide-x divide-border p-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Treinos</p>
              <p className="text-lg font-bold tabular-nums">{sessions.length}</p>
            </div>
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
