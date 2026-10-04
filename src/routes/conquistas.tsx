import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Tag } from "@/components/ui-kit";
import { buildGamificationSummary } from "@/store/gym-gamification";
import { useGym } from "@/store/gym-store";

export const Route = createFileRoute("/conquistas")({
  head: () => ({ meta: [
    { title:"Conquistas · TorvGym" },
    { name:"description", content:"Níveis, sequência de treinos e conquistas do TorvGym." },
  ]}),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { ready, state } = useGym();
  const summary = useMemo(() => buildGamificationSummary(state.sessions), [state.sessions]);
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
    <Card className="mt-4"><p className="text-sm font-semibold">Conquistas</p><div className="mt-3 space-y-2">
      {summary.achievements.map(a => <div key={a.id} className={`rounded-xl p-3 ${a.unlocked ? "bg-primary/10 border border-primary/20" : "bg-elevated"}`}><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p></div><Tag>{a.unlocked ? "Concluída" : `${a.progress}/${a.target}`}</Tag></div></div>)}
    </div></Card>
  </AppShell>;
}
