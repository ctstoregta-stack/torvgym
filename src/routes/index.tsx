import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, MutedTag, Tag } from "@/components/ui-kit";
import { muscleGroupsOf, useGym } from "@/store/gym-store";
import { WEEKDAYS, WEEKDAYS_FULL } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início · TorvGym — Acompanhamento de Treino" },
      {
        name: "description",
        content:
          "Veja o treino do dia, acompanhe cargas, séries e recordes pessoais direto do celular.",
      },
      { property: "og:title", content: "TorvGym — Acompanhamento de Treino" },
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

  const workouts = activeRoutine?.workouts ?? [];
  const todayWorkouts = workouts.filter((w) => w.days.includes(today));
  const totalSessions = state.sessions.filter((s) => s.finishedAt).length;
  const activeSession = state.activeSession;
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklySessions = state.sessions.filter((s) => s.finishedAt && new Date(s.finishedAt).getTime() >= since);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }
  const weeklyVolume = weeklySessions.reduce(
    (acc, s) => acc + s.entries.reduce((a, e) => a + e.sets.reduce((v, x) => v + (x.weight ?? 0) * (x.reps ?? 0), 0), 0),
    0,
  );
  const weeklyPRs = weeklySessions.reduce(
    (acc, s) => acc + s.entries.reduce((a, e) => a + e.sets.filter((x) => x.isPR).length, 0),
    0,
  );

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{WEEKDAYS_FULL[today]}</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">Olá, vamos treinar?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeRoutine ? activeRoutine.name : "Configure sua rotina para começar"}
          </p>
        </div>
        <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
          {totalSessions} concluído{totalSessions === 1 ? "" : "s"}
        </span>
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
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground">Treino de hoje</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Sua próxima ação, sem complicação.</p>
              </div>
              <Link to="/rotinas" className="text-xs font-semibold text-primary">Gerenciar</Link>
            </div>
            {todayWorkouts.length === 0 ? (
              <Card className="text-sm text-muted-foreground">
                Nenhum treino programado para hoje. Escolha um treino abaixo ou atribua dias na rotina.
              </Card>
            ) : (
              <div className="space-y-3">
                {todayWorkouts.map((w) => (
                  <WorkoutCard
                    key={w.id}
                    workoutId={w.id}
                    highlight
                    active={activeSession?.workoutId === w.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Resumo da semana</h2>
              <span className="text-xs text-muted-foreground">últimos 7 dias</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3">
                <p className="text-[11px] text-muted-foreground">Treinos</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{weeklySessions.length}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] text-muted-foreground">Volume</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{Math.round(weeklyVolume)}<span className="ml-1 text-xs font-medium text-muted-foreground">kg</span></p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] text-muted-foreground">PRs</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gold">{weeklyPRs}</p>
              </Card>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Outros treinos</h2>
              <Link to="/rotinas" className="text-xs font-semibold text-primary">Gerenciar</Link>
            </div>
            {workouts.filter((w) => !todayWorkouts.some((todayWorkout) => todayWorkout.id === w.id)).length === 0 ? (
              <EmptyState
                title="Rotina sem treinos"
                description="Adicione treinos (A, B, C...) a esta rotina para começar."
                action={<Link to="/rotinas"><Button>Adicionar treino</Button></Link>}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {workouts
                  .filter((w) => !todayWorkouts.some((todayWorkout) => todayWorkout.id === w.id))
                  .map((w) => <WorkoutCard key={w.id} workoutId={w.id} />)}
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
      <Link
        to={active ? "/executar/$workoutId" : "/treino/$workoutId"}
        params={{ workoutId }}
      >
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
          {active ? (
            <div className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Em andamento · continue pela barra inferior
            </div>
          ) : null}
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
