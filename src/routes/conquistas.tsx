import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Tag } from "@/components/ui-kit";
import { buildGamificationSummary } from "@/store/gym-gamification";
import { useGym } from "@/store/gym-store";
import { sessionVolume } from "@/store/gym-analytics";

export const Route = createFileRoute("/conquistas")({
  head: () => ({ meta: [
    { title:"Conquistas · TorvGym" },
    { name:"description", content:"Níveis, sequência de treinos e conquistas do TorvGym." },
  ]}),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { ready, state, updateGoals } = useGym();
  const summary = useMemo(() => buildGamificationSummary(state.sessions), [state.sessions]);
  const [weeklySessionsTarget, setWeeklySessionsTarget] = useState(state.goals.weeklySessionsTarget);
  const [weeklyVolumeTarget, setWeeklyVolumeTarget] = useState(state.goals.weeklyVolumeTarget);
  const [streakTarget, setStreakTarget] = useState(state.goals.streakTarget);
  const recentSessions = useMemo(
    () => state.sessions.filter((session) => session.finishedAt && new Date(session.finishedAt).getTime() >= Date.now() - 7 * 86400000),
    [state.sessions],
  );
  const weeklyVolume = recentSessions.reduce((sum, session) => sum + sessionVolume(session), 0);
  const saveGoals = () => {
    updateGoals({ weeklySessionsTarget, weeklyVolumeTarget, streakTarget });
  };
  if (!ready) return <AppShell title="Conquistas"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;
  if (!summary.totalSessions) return <AppShell title="Conquistas" back={{to:"/"}}><EmptyState title="Sua primeira conquista está perto" description="Conclua seu primeiro treino para começar a acumular XP." action={<Link to="/"><Button>Começar treino</Button></Link>} /></AppShell>;

  return <AppShell title="Conquistas" back={{to:"/"}}>
    <Card>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">Nível</p><p className="text-3xl font-bold">{summary.level}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">XP</p><p className="text-lg font-bold tabular-nums">{summary.xp.toLocaleString("pt-BR")}</p></div></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-primary" style={{width:`${summary.levelProgress / 5}%`}} /></div>
      <p className="mt-2 text-[11px] text-muted-foreground">{500-summary.levelProgress} XP para o próximo nível</p>
    </Card>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Card className="p-3"><p className="text-[11px] text-muted-foreground">Sequência atual</p><p className="mt-1 text-xl font-bold">{summary.currentStreak} dia{summary.currentStreak===1?"":"s"}</p></Card>
      <Card className="p-3"><p className="text-[11px] text-muted-foreground">Melhor sequência</p><p className="mt-1 text-xl font-bold">{summary.bestStreak} dia{summary.bestStreak===1?"":"s"}</p></Card>
    </div>
    <Card className="mt-4">
      <p className="text-sm font-semibold">Metas pessoais</p>
      <p className="mt-1 text-xs text-muted-foreground">Ajuste seus objetivos sem depender de serviços externos.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <GoalInput label="Treinos/semana" value={weeklySessionsTarget} onChange={setWeeklySessionsTarget} min={1} max={14} />
        <GoalInput label="Volume/semana (kg)" value={weeklyVolumeTarget} onChange={setWeeklyVolumeTarget} min={0} max={1000000} step={500} />
        <GoalInput label="Sequência (dias)" value={streakTarget} onChange={setStreakTarget} min={1} max={365} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <GoalProgress label="Treinos" current={recentSessions.length} target={state.goals.weeklySessionsTarget} />
        <GoalProgress label="Volume" current={weeklyVolume} target={state.goals.weeklyVolumeTarget} />
        <GoalProgress label="Sequência" current={summary.currentStreak} target={state.goals.streakTarget} />
      </div>
      <Button className="mt-3 w-full" onClick={saveGoals}>Salvar metas</Button>
    </Card>

    <Card className="mt-4"><p className="text-sm font-semibold">Conquistas</p><div className="mt-3 space-y-2">
      {summary.achievements.map(a => <div key={a.id} className={`rounded-xl p-3 ${a.unlocked ? "bg-primary/10 border border-primary/20" : "bg-elevated"}`}><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p></div><Tag>{a.unlocked ? "Concluída" : `${a.progress}/${a.target}`}</Tag></div></div>)}
    </div></Card>
  </AppShell>;
}

function GoalInput({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number }) {
  return <label className="block text-xs font-semibold text-muted-foreground">{label}<input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm font-normal text-foreground" /></label>;
}

function GoalProgress({ label, current, target }: { label: string; current: number; target: number }) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return <div className="rounded-xl bg-elevated p-3"><div className="flex justify-between text-[11px]"><span>{label}</span><strong>{percent}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-primary" style={{ width: percent + "%" }} /></div></div>;
}
