import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
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
  const todayWorkouts = useMemo(
    () => workouts.filter((w) => w.days.includes(today)),
    [workouts, today],
  );
  const totalSessions = useMemo(
    () => state.sessions.filter((session) => session.finishedAt).length,
    [state.sessions],
  );
  const activeSession = state.activeSession;
  const activeWorkout = activeSession
    ? workouts.find((w) => w.id === activeSession.workoutId)
    : undefined;
  const activeDoneExercises =
    activeSession?.entries.filter(
      (entry) => entry.sets.length > 0 && entry.sets.every((set) => set.completed),
    ).length ?? 0;
  const activeTotalExercises = activeSession?.entries.length ?? 0;
  const otherWorkouts = workouts.filter(
    (w) =>
      !todayWorkouts.some((todayWorkout) => todayWorkout.id === w.id) &&
      w.id !== activeSession?.workoutId,
  );

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <section className="relative isolate mb-6 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card to-card p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 -z-10 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-primary">{WEEKDAYS_FULL[today]}</p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">Olá, vamos treinar?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeRoutine ? activeRoutine.name : "Configure sua rotina para começar"}</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl" aria-hidden="true">💪</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Treinos concluídos</p><p className="mt-1 text-xl font-black tabular-nums">{totalSessions}</p></div>
          <div className="rounded-2xl border border-border/70 bg-background/50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Treinos na rotina</p><p className="mt-1 text-xl font-black tabular-nums">{workouts.length}</p></div>
          <div className="col-span-2 rounded-2xl border border-border/70 bg-background/50 p-3 sm:col-span-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Foco de hoje</p><p className="mt-1 truncate text-sm font-bold">{todayWorkouts.length ? `${todayWorkouts.length} treino${todayWorkouts.length === 1 ? "" : "s"} programado${todayWorkouts.length === 1 ? "" : "s"}` : "No seu ritmo"}</p></div>
        </div>
      </section>

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
          {activeSession && activeWorkout ? (
            <section className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">Treino em andamento</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Continue exatamente de onde parou.
                  </p>
                </div>
              </div>
              <Link
                to="/executar/$workoutId"
                params={{ workoutId: activeSession.workoutId }}
                className="block"
              >
                <div className="surface overflow-hidden rounded-2xl border-primary/40 bg-gradient-to-br from-primary/10 to-card p-4 shadow-[var(--shadow-glow)] transition duration-200 tap active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {activeSession.workoutName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activeDoneExercises}/{activeTotalExercises} exercícios concluídos
                      </p>
                    </div>
                    <Button className="shrink-0 px-4 py-2 text-xs">Continuar</Button>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{
                        width: `${activeTotalExercises ? (activeDoneExercises / activeTotalExercises) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Treino de hoje</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sua próxima ação, sem complicação.
                </p>
              </div>
              <Link to="/rotinas" className="text-xs font-semibold text-primary">
                Gerenciar
              </Link>
            </div>
            {todayWorkouts.filter((w) => w.id !== activeSession?.workoutId).length === 0 ? (
              <Card className="text-sm text-muted-foreground">
                {activeSession?.workoutId &&
                todayWorkouts.some((w) => w.id === activeSession.workoutId)
                  ? "Seu treino de hoje já está em andamento. Continue acima."
                  : "Nenhum treino programado para hoje. Veja outros treinos abaixo ou atribua dias na rotina."}
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {todayWorkouts
                  .filter((w) => w.id !== activeSession?.workoutId)
                  .map((w) => (
                    <WorkoutCard key={w.id} workoutId={w.id} highlight />
                  ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight">Outros treinos</h2>
              <Link to="/rotinas" className="text-xs font-semibold text-primary">
                Gerenciar
              </Link>
            </div>
            {otherWorkouts.length === 0 ? (
              <Card className="text-sm text-muted-foreground">
                Não há outros treinos fora da programação de hoje.
              </Card>
            ) : (
              <details className="group">
                <summary className="surface flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold tap">
                  <span>
                    {otherWorkouts.length} treino{otherWorkouts.length === 1 ? "" : "s"}{" "}
                    {otherWorkouts.length === 1 ? "disponível" : "disponíveis"}
                  </span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {otherWorkouts.map((w) => (
                    <WorkoutCard key={w.id} workoutId={w.id} />
                  ))}
                </div>
              </details>
            )}
          </section>
        </>
      )}

      <div className="mb-3 mt-7"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Continue sua evolução</p><h2 className="mt-1 text-lg font-extrabold tracking-tight">Acesso rápido</h2></div><div className="mt-0 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Link to="/exercicios">
          <Card className="h-full">
            <p className="text-sm font-semibold">Biblioteca</p>
            <p className="mt-1 text-xs text-muted-foreground">Animações e execução</p>
          </Card>
        </Link>
        <Link to="/progresso">
          <Card className="h-full">
            <p className="text-sm font-semibold">Progresso</p>
            <p className="mt-1 text-xs text-muted-foreground">Dashboard de evolução</p>
          </Card>
        </Link>
        <a href="/conquistas">
          <Card className="h-full">
            <p className="text-sm font-semibold">Conquistas</p>
            <p className="mt-1 text-xs text-muted-foreground">XP, níveis e sequência</p>
          </Card>
        </a>
        <Link to="/historico">
          <Card className="h-full">
            <p className="text-sm font-semibold">Histórico</p>
            <p className="mt-1 text-xs text-muted-foreground">Sessões e progressão</p>
          </Card>
        </Link>
        <Link to="/configuracoes">
          <Card className="h-full">
            <p className="text-sm font-semibold">Dados e backup</p>
            <p className="mt-1 text-xs text-muted-foreground">Exportar e restaurar</p>
          </Card>
        </Link>
      </div>
    </AppShell>
  );

  function WorkoutCard({
    workoutId,
    highlight,
    active,
  }: {
    workoutId: string;
    highlight?: boolean;
    active?: boolean;
  }) {
    const workout = workouts.find((w) => w.id === workoutId)!;
    const groups = muscleGroupsOf(workout.exerciseIds, getExercise);
    return (
      <Link to={active ? "/executar/$workoutId" : "/treino/$workoutId"} params={{ workoutId }}>
        <div
          className={`surface group min-w-0 overflow-hidden rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg tap active:scale-[0.99] ${
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
