import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Session } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Tag } from "@/components/ui-kit";
import {
  buildDashboardAnalytics,
  buildExerciseAnalyticsIndex,
  buildPeriodAnalytics,
  buildPersonalRecords,
  exerciseProgressionFromHistory,
  buildWeeklyGoalInsights,
} from "@/store/gym-analytics";
import { useGym } from "@/store/gym-store";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso · TorvGym" },
      { name: "description", content: "Dashboard de evolução, volume, frequência, PRs e progressão." },
    ],
  }),
  component: ProgressPage,
});

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const minutes = Math.round(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`
    : `${minutes} min`;
}

function ProgressPage() {
  const { ready, state, activeRoutine, getExercise } = useGym();
  const completed = useMemo(
    () => state.sessions.filter((session) => session.finishedAt),
    [state.sessions],
  );
  const dashboard = useMemo(() => buildDashboardAnalytics(completed), [completed]);
  const goalInsights = useMemo(() => buildWeeklyGoalInsights(completed, state.goals), [completed, state.goals]);
  const weekly = useMemo(() => buildPeriodAnalytics(completed, "week").slice(-8), [completed]);
  const weeklyTrend = useMemo(() => buildPeriodAnalytics(completed, "week").slice(-12), [completed]);
  const monthly = useMemo(() => buildPeriodAnalytics(completed, "month").slice(-6), [completed]);
  const exerciseIndex = useMemo(() => buildExerciseAnalyticsIndex(completed), [completed]);
  const personalRecords = useMemo(() => buildPersonalRecords(completed).slice(0, 6), [completed]);
  const nextWorkout = useMemo(() => {
    if (state.activeSession) {
      return { workout: activeRoutine?.workouts.find((item) => item.id === state.activeSession?.workoutId) ?? null, label: "Treino em andamento" };
    }
    if (!activeRoutine?.workouts.length) return { workout: null, label: "Nenhum treino programado" };
    const today = new Date().getDay();
    for (let offset = 0; offset < 7; offset += 1) {
      const day = (today + offset) % 7;
      const workout = activeRoutine.workouts.find((item) => item.days.includes(day));
      if (workout) return { workout, label: offset === 0 ? "Treino de hoje" : "Próximo treino" };
    }
    return { workout: null, label: "Nenhum treino programado" };
  }, [activeRoutine, state.activeSession]);

  const progressions = useMemo(
    () =>
      [...exerciseIndex.entries()]
        .map(([exerciseId, data]) => ({
          exerciseId,
          progression: exerciseProgressionFromHistory(data.history),
        }))
        .filter((item) => item.progression)
        .sort(
          (a, b) =>
            Math.abs(b.progression?.estimated1RMChangePercent ?? 0) -
            Math.abs(a.progression?.estimated1RMChangePercent ?? 0),
        )
        .slice(0, 6),
    [exerciseIndex],
  );

  if (!ready) return <AppShell title="Progresso"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;

  if (!completed.length) {
    return (
      <AppShell title="Progresso" back={{ to: "/" }}>
        <EmptyState
          title="Seu dashboard começa no primeiro treino"
          description="Finalize um treino para acompanhar frequência, volume, PRs e evolução por exercício."
          action={<Link to="/"><Button>Ir para o início</Button></Link>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Progresso" back={{ to: "/" }}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Treinos" value={dashboard.totalSessions.toLocaleString("pt-BR")} />
        <Metric label="Volume" value={`${Math.round(dashboard.totalVolume).toLocaleString("pt-BR")} kg`} />
        <Metric label="Séries" value={dashboard.totalSets.toLocaleString("pt-BR")} />
        <Metric label="PRs" value={dashboard.totalPRs.toLocaleString("pt-BR")} />
        <Metric label="Volume 7d" value={`${Math.round(dashboard.volumeLast7Days).toLocaleString("pt-BR")} kg`} />
        <Metric label="Volume 30d" value={`${Math.round(dashboard.volumeLast30Days).toLocaleString("pt-BR")} kg`} />
      </div>

      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Orientação das metas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {goalInsights.overallStatus === "complete"
                ? "Metas atingidas para o período."
                : goalInsights.overallStatus === "ahead"
                  ? "Você está à frente do ritmo esperado."
                  : goalInsights.overallStatus === "behind"
                    ? "O ritmo está abaixo do esperado; veja o que falta."
                    : "Você está no ritmo esperado para esta semana."}
            </p>
          </div>
          <Tag>
            {goalInsights.overallStatus === "complete"
              ? "Concluído"
              : goalInsights.overallStatus === "ahead"
                ? "Adiantado"
                : goalInsights.overallStatus === "behind"
                  ? "Atrasado"
                  : "No ritmo"}
          </Tag>
        </div>
        <div className="mt-4 space-y-3">
          <GoalRow label="Treinos" insight={goalInsights.sessions} unit="treino" />
          <GoalRow label="Volume" insight={goalInsights.volume} unit="kg" />
          <GoalRow label="Sequência" insight={goalInsights.streak} unit="dia" />
        </div>
        <div className="mt-4 rounded-xl bg-elevated p-3">
          <p className="text-[11px] text-muted-foreground">Próxima ação</p>
          <p className="mt-1 text-sm font-semibold">
            {goalInsights.overallStatus === "complete"
              ? "Mantenha a consistência e consolide o resultado."
              : goalInsights.sessions.remaining > 0
                ? "Faça mais " + goalInsights.sessions.remaining + " treino" + (goalInsights.sessions.remaining === 1 ? "" : "s") + " para atingir a meta semanal."
                : goalInsights.volume.remaining > 0
                  ? "Acumule mais " + Math.round(goalInsights.volume.remaining).toLocaleString("pt-BR") + " kg de volume nesta semana."
                  : "Mantenha a sequência por mais " + goalInsights.streak.remaining + " dia" + (goalInsights.streak.remaining === 1 ? "" : "s") + "."}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {goalInsights.daysRemaining > 0
              ? goalInsights.daysRemaining + " dia" + (goalInsights.daysRemaining === 1 ? "" : "s") + " restante" + (goalInsights.daysRemaining === 1 ? "" : "s") + " na semana."
              : "Último dia da semana."}
          </p>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-semibold">Ritmo atual</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-elevated p-3"><p className="text-[11px] text-muted-foreground">Média semanal</p><p className="mt-1 text-xl font-bold tabular-nums">{dashboard.averageSessionsPerWeek.toLocaleString("pt-BR")}</p><p className="text-[11px] text-muted-foreground">treinos/semana</p></div>
          <div className="rounded-xl bg-elevated p-3"><p className="text-[11px] text-muted-foreground">Semanas ativas</p><p className="mt-1 text-xl font-bold tabular-nums">{dashboard.activeWeeksLast8}/8</p><p className="text-[11px] text-muted-foreground">últimas 8 semanas</p></div>
          <div className="rounded-xl bg-elevated p-3"><p className="text-[11px] text-muted-foreground">Volume 30d</p><p className="mt-1 text-xl font-bold tabular-nums">{Math.round(dashboard.volumeLast30Days).toLocaleString("pt-BR")} kg</p><p className="text-[11px] text-muted-foreground">{dashboard.sessionsLast30Days} treinos</p></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-elevated p-3">
            <p className="text-[11px] text-muted-foreground">Últimos 7 dias</p>
            <p className="mt-1 text-xl font-bold">{dashboard.sessionsLast7Days} treino{dashboard.sessionsLast7Days === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-xl bg-elevated p-3">
            <p className="text-[11px] text-muted-foreground">Duração média</p>
            <p className="mt-1 text-xl font-bold">{formatDuration(dashboard.averageDurationSeconds)}</p>
          </div>
        </div>
        {dashboard.volumeChangePercent != null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Volume no último treino: <strong className="text-foreground">{dashboard.volumeChangePercent > 0 ? "+" : ""}{dashboard.volumeChangePercent}%</strong> em relação ao anterior.
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground">Sequência atual</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {dashboard.streakDays} dia{dashboard.streakDays === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Dias consecutivos com treino concluído.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Melhor sessão: <strong className="text-foreground">{Math.round(dashboard.bestSessionVolume).toLocaleString("pt-BR")} kg</strong></p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground">PR mais recente</p>
          {dashboard.latestPR ? (
            <>
              <p className="mt-1 truncate text-base font-bold">{getExercise(dashboard.latestPR.exerciseId)?.name ?? dashboard.latestPR.exerciseId}</p>
              <p className="text-xs text-gold">{dashboard.latestPR.weight} kg · {new Date(dashboard.latestPR.date).toLocaleDateString("pt-BR")}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Nenhum PR marcado ainda.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <p className="text-[11px] text-muted-foreground">{nextWorkout.label}</p>
        {nextWorkout.workout ? (
          <>
            <p className="mt-1 truncate text-base font-bold">{nextWorkout.workout.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{nextWorkout.workout.exerciseIds.length} exercícios · {nextWorkout.workout.exerciseIds.reduce((sum, id) => sum + (nextWorkout.workout?.targetSets[id] ?? 3), 0)} séries planejadas</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Atribua um dia a um treino na rotina para vê-lo aqui.</p>
        )}
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Calendário de treinos</p>
            <p className="text-xs text-muted-foreground">Veja rapidamente os dias em que você treinou.</p>
          </div>
          <Tag>{completed.filter((session) => new Date(session.finishedAt ?? session.startedAt).getMonth() === new Date().getMonth() && new Date(session.finishedAt ?? session.startedAt).getFullYear() === new Date().getFullYear()).length} neste mês</Tag>
        </div>
        <WorkoutCalendar sessions={completed} />
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-semibold">Semanas recentes</p>
        <div className="mt-3 space-y-2">
          {weekly.map((item) => (
            <div key={item.key} className="grid grid-cols-[48px_1fr_auto] items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(6, (item.volume / Math.max(...weekly.map((w) => w.volume), 1)) * 100))}%` }} />
              </div>
              <span className="text-[11px] font-semibold tabular-nums">{item.sessions}x · {Math.round(item.volume)} kg</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-semibold">Meses recentes</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {monthly.map((item) => (
            <div key={item.key} className="rounded-xl bg-elevated p-3">
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-bold">{Math.round(item.volume).toLocaleString("pt-BR")} kg</p>
              <p className="text-[11px] text-muted-foreground">{item.sessions} treinos · {item.sets} séries</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Exercícios de maior volume</p>
            <p className="text-xs text-muted-foreground">Onde você mais acumulou trabalho.</p>
          </div>
          <Link to="/exercicios" className="text-xs font-semibold text-primary">Biblioteca</Link>
        </div>
        <div className="mt-3 space-y-2">
          {dashboard.topExercises.map((item) => (
            <Link key={item.exerciseId} to="/exercicio/$exerciseId" params={{ exerciseId: item.exerciseId }} className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3">
              <span className="min-w-0 truncate text-sm font-semibold">{getExercise(item.exerciseId)?.name ?? item.exerciseId}</span>
              <span className="shrink-0 text-xs font-bold tabular-nums">{Math.round(item.volume).toLocaleString("pt-BR")} kg</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Recordes pessoais</p>
            <p className="text-xs text-muted-foreground">Seus melhores resultados por exercício.</p>
          </div>
          <Tag>{personalRecords.length} recorde{personalRecords.length === 1 ? "" : "s"}</Tag>
        </div>
        <div className="mt-3 space-y-2">
          {personalRecords.map((record) => (
            <Link
              key={record.exerciseId}
              to="/exercicio/$exerciseId"
              params={{ exerciseId: record.exerciseId }}
              className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{getExercise(record.exerciseId)?.name ?? record.exerciseId}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  1RM est. {record.estimated1RM.toLocaleString("pt-BR")} kg · volume máx. {Math.round(record.maxVolume).toLocaleString("pt-BR")} kg
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">{record.maxWeight.toLocaleString("pt-BR")} kg</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-semibold">Progressão recente</p>
        <div className="mt-3 space-y-2">
          {progressions.map(({ exerciseId, progression }) => {
            if (!progression) return null;
            const change = progression.estimated1RMChangePercent;
            const label =
              progression.recommendation === "increase-load" ? "Aumentar carga" :
              progression.recommendation === "add-reps" ? "Adicionar reps" :
              progression.recommendation === "recover" ? "Recuperar" : "Manter";
            return (
              <Link key={exerciseId} to="/exercicio/$exerciseId" params={{ exerciseId }} className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3">
                <span className="min-w-0 truncate text-sm font-semibold">{getExercise(exerciseId)?.name ?? exerciseId}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Tag>{label}</Tag>
                  <span className="text-xs font-bold tabular-nums">{change == null ? "—" : `${change > 0 ? "+" : ""}${change}% 1RM`}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}



function DashboardIndicator({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl bg-elevated p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function GoalRow({
  label,
  insight,
  unit,
}: {
  label: string;
  insight: { current: number; target: number; remaining: number; progressPercent: number; status: string };
  unit: string;
}) {
  const statusLabel = insight.status === "complete" ? "Concluído" : insight.status === "ahead" ? "Adiantado" : insight.status === "behind" ? "Atrasado" : "No ritmo";
  const current = unit === "kg" ? Math.round(insight.current).toLocaleString("pt-BR") : insight.current.toLocaleString("pt-BR");
  const target = unit === "kg" ? Math.round(insight.target).toLocaleString("pt-BR") : insight.target.toLocaleString("pt-BR");
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{current}/{target} {unit} · {statusLabel}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-primary" style={{ width: Math.min(100, Math.max(0, insight.progressPercent)) + "%" }} />
      </div>
      {insight.remaining > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Faltam {unit === "kg" ? Math.round(insight.remaining).toLocaleString("pt-BR") : insight.remaining} {unit}.</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}


function WorkoutCalendar({ sessions }: { sessions: Session[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const trainedDays = new Set(
    sessions
      .filter((session) => session.finishedAt)
      .map((session) => {
        const date = new Date(session.finishedAt ?? session.startedAt);
        return date.getFullYear() === year && date.getMonth() === month ? date.getDate() : null;
      })
      .filter((day): day is number => day != null),
  );
  const cells = Array.from({ length: leading + daysInMonth }, (_, index) =>
    index < leading ? null : index - leading + 1,
  );

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={index}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => (
          <div key={index} className={day == null ? "h-9" : "flex h-9 items-center justify-center rounded-lg bg-elevated text-xs font-semibold"}>
            {day != null && <span className={trainedDays.has(day) ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground" : "text-muted-foreground"}>{day}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
