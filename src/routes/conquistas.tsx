import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Tag } from "@/components/ui-kit";
import { buildGamificationSummary } from "@/store/gym-gamification";
import { useGym } from "@/store/gym-store";
import { sessionVolume } from "@/store/gym-analytics";
import { configureNativeTrainingReminder } from "@/lib/native-workout";

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
  const [weeklyStreakTarget, setWeeklyStreakTarget] = useState(state.goals.weeklyStreakTarget);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("18:00");
  const [reminderInterval, setReminderInterval] = useState(1);
  const [reminderMessage, setReminderMessage] = useState("");
  useEffect(() => { try { const raw = window.localStorage.getItem("torvgym.training-reminder.v1"); if (!raw) return; const saved = JSON.parse(raw) as {enabled?: boolean; time?: string; intervalDays?: number}; setReminderEnabled(saved.enabled === true); if (typeof saved.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(saved.time)) setReminderTime(saved.time); if (typeof saved.intervalDays === "number") setReminderInterval(Math.min(7, Math.max(1, Math.round(saved.intervalDays)))); } catch { /* Ignora configuração inválida. */ } }, []);
  useEffect(() => {
    if (!ready) return;
    setWeeklySessionsTarget(state.goals.weeklySessionsTarget);
    setWeeklyVolumeTarget(state.goals.weeklyVolumeTarget);
    setStreakTarget(state.goals.streakTarget);
    setWeeklyStreakTarget(state.goals.weeklyStreakTarget);
  }, [ready, state.goals]);
  const recentSessions = useMemo(() => {
    const now = new Date();
    const mondayOffset = (now.getDay() + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return state.sessions.filter((session) => {
      if (!session.finishedAt) return false;
      const finishedAt = new Date(session.finishedAt);
      return finishedAt >= weekStart && finishedAt < nextWeekStart;
    });
  }, [state.sessions]);
  const weeklyVolume = recentSessions.reduce((sum, session) => sum + sessionVolume(session), 0);
  const saveGoals = () => {
    updateGoals({ weeklySessionsTarget, weeklyVolumeTarget, streakTarget, weeklyStreakTarget });
  };
  const saveReminder = async () => {
    const [hour, minute] = reminderTime.split(":").map(Number);
    const result = await configureNativeTrainingReminder({ enabled: reminderEnabled, hour, minute, intervalDays: reminderInterval });
    if (reminderEnabled && !result.scheduled) {
      setReminderMessage("Agendamento disponível apenas no aplicativo Android instalado, não no navegador/preview.");
      return;
    }
    window.localStorage.setItem("torvgym.training-reminder.v1", JSON.stringify({ enabled: reminderEnabled, time: reminderTime, intervalDays: reminderInterval }));
    setReminderMessage(!reminderEnabled ? "Lembretes desativados." : result.notificationsEnabled ? "Lembrete agendado no Android." : "Agendamento salvo. Permita notificações do TorvGym nas configurações do Android.");
  };
  if (!ready) return <AppShell title="Conquistas"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GoalInput label="Treinos/semana" value={weeklySessionsTarget} onChange={setWeeklySessionsTarget} min={1} max={14} />
        <GoalInput label="Volume/semana (kg)" value={weeklyVolumeTarget} onChange={setWeeklyVolumeTarget} min={0} max={1000000} step={500} />
        <GoalInput label="Sequência (dias)" value={streakTarget} onChange={setStreakTarget} min={1} max={365} />
        <GoalInput label="Consistência (semanas)" value={weeklyStreakTarget} onChange={setWeeklyStreakTarget} min={1} max={52} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <GoalProgress label="Treinos" current={recentSessions.length} target={state.goals.weeklySessionsTarget} />
        <GoalProgress label="Volume" current={weeklyVolume} target={state.goals.weeklyVolumeTarget} />
        <GoalProgress label="Sequência diária" current={summary.currentStreak} target={state.goals.streakTarget} />
        <GoalProgress label="Sequência semanal" current={summary.currentWeekStreak} target={state.goals.weeklyStreakTarget} />
      </div>
      <Button className="mt-3 w-full" onClick={saveGoals}>Salvar metas</Button>
    </Card>

    <Card className="mt-4"><p className="text-sm font-semibold">Lembretes de treino</p><p className="mt-1 text-xs text-muted-foreground">Avisos locais no Android, mesmo com o TorvGym fechado. Sem serviços externos.</p><label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={reminderEnabled} onChange={(event) => { setReminderEnabled(event.target.checked); setReminderMessage(""); }} className="h-4 w-4 accent-primary" />Ativar lembretes</label><div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-muted-foreground">Horário<input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm font-normal text-foreground" /></label><label className="block text-xs font-semibold text-muted-foreground">Frequência<select value={reminderInterval} onChange={(event) => setReminderInterval(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm font-normal text-foreground">{[1,2,3,4,5,6,7].map(days => <option key={days} value={days}>{days === 1 ? "Todos os dias" : days === 7 ? "Uma vez por semana" : "A cada " + days + " dias"}</option>)}</select></label></div><Button className="mt-3 w-full" onClick={() => void saveReminder()}>Salvar lembretes</Button>{reminderMessage && <p role="status" className="mt-2 text-xs text-muted-foreground">{reminderMessage}</p>}</Card>

    <Card className="mt-4"><p className="text-sm font-semibold">Conquistas</p><div className="mt-3 space-y-2">
      {!summary.totalSessions ? (
        <EmptyState title="Sua primeira conquista está perto" description="Conclua seu primeiro treino para começar a acumular XP." action={<Link to="/"><Button>Começar treino</Button></Link>} />
      ) : summary.achievements.map(a => <div key={a.id} className={`rounded-xl p-3 ${a.unlocked ? "bg-primary/10 border border-primary/20" : "bg-elevated"}`}><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p></div><Tag>{a.unlocked ? "Concluída" : `${a.progress}/${a.target}`}</Tag></div></div>)}
    </div></Card>
  </AppShell>;
}

function GoalInput({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number }) {
  return <label className="block text-xs font-semibold text-muted-foreground">{label}<input type="number" min={min} max={max} step={step} value={value} onChange={(event) => {
    const parsed = Number(event.target.value);
    if (!Number.isFinite(parsed)) return;
    const stepped = step > 1 ? Math.round(parsed / step) * step : Math.round(parsed);
    onChange(Math.min(max, Math.max(min, stepped)));
  }} className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm font-normal text-foreground" /></label>;
}

function GoalProgress({ label, current, target }: { label: string; current: number; target: number }) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return <div className="rounded-xl bg-elevated p-3"><div className="flex justify-between text-[11px]"><span>{label}</span><strong>{percent}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-primary" style={{ width: percent + "%" }} /></div></div>;
}
