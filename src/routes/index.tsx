import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, MutedTag, Tag } from "@/components/ui-kit";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS, WEEKDAYS_FULL } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início · Forja — Acompanhamento de Treino" },
      {
        name: "description",
        content:
          "Veja o treino do dia, acompanhe cargas, séries e recordes pessoais direto do celular.",
      },
      { property: "og:title", content: "Forja — Acompanhamento de Treino" },
      {
        property: "og:description",
        content: "Rotinas, execução de treino em poucos toques e evolução de cargas.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { ready, state, activeRoutine, getExercise } = useGym();
  const today = new Date().getDay();

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  const workouts = activeRoutine?.workouts ?? [];
  const todayWorkouts = workouts.filter((w) => w.days.includes(today));
  const totalSessions = state.sessions.filter((s) => s.finishedAt).length;

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {WEEKDAYS_FULL[today]}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {activeRoutine ? activeRoutine.name : "Sem rotina ativa"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSessions} treino{totalSessions === 1 ? "" : "s"} concluído
          {totalSessions === 1 ? "" : "s"}
        </p>
      </div>

      {!activeRoutine ? (
        <EmptyState
          title="Crie sua primeira rotina"
          description="Monte uma rotina, adicione treinos e atribua os dias da semana."
          action={
            <Link to="/rotinas">
              <Button>Criar rotina</Button>
            </Link>
          }
        />
      ) : (
        <>
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Treino de hoje
            </h2>
            {todayWorkouts.length === 0 ? (
              <Card className="text-sm text-muted-foreground">
                Nenhum treino programado para hoje. Escolha um treino abaixo ou
                atribua dias na rotina.
              </Card>
            ) : (
              <div className="space-y-3">
                {todayWorkouts.map((w) => (
                  <WorkoutCard key={w.id} workoutId={w.id} highlight />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Todos os treinos
              </h2>
              <Link to="/rotinas" className="text-xs font-semibold text-primary">
                Gerenciar
              </Link>
            </div>
            {workouts.length === 0 ? (
              <EmptyState
                title="Rotina sem treinos"
                description="Adicione treinos (A, B, C...) a esta rotina para começar."
                action={
                  <Link to="/rotinas">
                    <Button>Adicionar treino</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {workouts.map((w) => (
                  <WorkoutCard key={w.id} workoutId={w.id} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/exercicios">
          <Card className="h-full">
            <p className="text-sm font-semibold">Biblioteca</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Animações e execução
            </p>
          </Card>
        </Link>
        <Link to="/historico">
          <Card className="h-full">
            <p className="text-sm font-semibold">Histórico</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sessões e progressão
            </p>
          </Card>
        </Link>
      </div>
    </AppShell>
  );

  function WorkoutCard({
    workoutId,
    highlight,
  }: {
    workoutId: string;
    highlight?: boolean;
  }) {
    const workout = workouts.find((w) => w.id === workoutId)!;
    const groups = muscleGroupsOf(workout.exerciseIds, getExercise);
    return (
      <Link to="/treino/$workoutId" params={{ workoutId }}>
        <div
          className={`surface p-4 tap active:scale-[0.99] ${
            highlight ? "border-primary/40 shadow-[var(--shadow-glow)]" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{workout.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {workout.exerciseIds.length} exercício
                {workout.exerciseIds.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex gap-1">
              {workout.days.map((d) => (
                <span
                  key={d}
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    d === today
                      ? "bg-primary text-primary-foreground"
                      : "bg-elevated text-muted-foreground"
                  }`}
                >
                  {WEEKDAYS[d]?.[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {groups.length ? (
              groups.map((g) => <Tag key={g}>{g}</Tag>)
            ) : (
              <MutedTag>Sem exercícios</MutedTag>
            )}
          </div>
        </div>
      </Link>
    );
  }
}
