import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import { buildPeriodAnalytics, buildWorkoutAnalyticsIndex, sessionDurationSeconds, sessionSetCount, sessionVolume } from "@/store/gym-analytics";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [
    { title: "Relatórios · TorvGym" },
    { name: "description", content: "Relatórios detalhados dos seus treinos e evolução." },
  ] }),
  component: ReportsPage,
});

type Range = 30 | 90 | 0;

function ReportsPage() {
  const { ready, state, getExercise } = useGym();
  const [range, setRange] = useState<Range>(90);
  const [exporting, setExporting] = useState(false);
  const sessions = useMemo(() => {
    const completed = state.sessions.filter((s) => s.finishedAt);
    if (!range) return completed;
    const since = Date.now() - range * 86400000;
    return completed.filter((s) => new Date(s.finishedAt!).getTime() >= since);
  }, [state.sessions, range]);

  const periods = useMemo(() => buildPeriodAnalytics(sessions, "week").slice(-12), [sessions]);
  const workouts = useMemo(() => [...buildWorkoutAnalyticsIndex(sessions).values()].sort((a,b) => b.totalVolume-a.totalVolume), [sessions]);
  const previousMetrics = useMemo(() => {
    if (!range) return null;
    const currentStart = Date.now() - range * 86400000;
    const previousStart = currentStart - range * 86400000;
    const previous = state.sessions.filter((s) => {
      if (!s.finishedAt) return false;
      const time = new Date(s.finishedAt).getTime();
      return time >= previousStart && time < currentStart;
    });
    return {
      sessions: previous.length,
      volume: previous.reduce((n, s) => n + sessionVolume(s), 0),
      sets: previous.reduce((n, s) => n + sessionSetCount(s), 0),
    };
  }, [range, state.sessions]);

  const metrics = useMemo(() => {
    const volume = sessions.reduce((n,s) => n + sessionVolume(s), 0);
    const sets = sessions.reduce((n,s) => n + sessionSetCount(s), 0);
    const duration = sessions.reduce((n,s) => n + sessionDurationSeconds(s), 0);
    const prs = sessions.reduce((n,s) => n + s.entries.reduce((e,entry) => e + entry.sets.filter(set => set.isPR).length, 0), 0);
    return { volume, sets, duration, prs, averageDuration: sessions.length ? Math.round(duration/sessions.length) : 0 };
  }, [sessions]);

  const exportCsv = () => {
    setExporting(true);
    const rows = [
      ["Data","Treino","Volume (kg)","Séries","Duração (min)","PRs"],
      ...sessions.slice().sort((a,b) => new Date(a.finishedAt!).getTime()-new Date(b.finishedAt!).getTime()).map(s => [
        new Date(s.finishedAt!).toLocaleString("pt-BR"), s.workoutName, String(Math.round(sessionVolume(s))),
        String(sessionSetCount(s)), String(Math.round(sessionDurationSeconds(s)/60)),
        String(s.entries.reduce((n,e) => n + e.sets.filter(set => set.isPR).length, 0)),
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `torvgym-relatorio-${new Date().toISOString().slice(0,10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (!ready) return <AppShell title="Relatórios"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;
  if (!sessions.length) return <AppShell title="Relatórios" back={{to:"/historico"}}><EmptyState title="Ainda não há dados para este relatório" description="Finalize treinos para gerar métricas e relatórios exportáveis." action={<Link to="/"><Button>Ir para o início</Button></Link>} /></AppShell>;

  return <AppShell title="Relatórios" back={{to:"/historico"}}>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {([[30,"30 dias"],[90,"90 dias"],[0,"Todo o período"]] as const).map(([value,label]) =>
        <button key={value} type="button" onClick={() => setRange(value)} className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-semibold ${range===value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{label}</button>
      )}
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">    {previousMetrics && (
      <Card className="mt-3">
        <p className="text-sm font-semibold">Comparação com período anterior</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Comparison label="Treinos" current={sessions.length} previous={previousMetrics.sessions} />
          <Comparison label="Volume" current={metrics.volume} previous={previousMetrics.volume} />
          <Comparison label="Séries" current={metrics.sets} previous={previousMetrics.sets} />
        </div>
      </Card>
    )}

      <Metric label="Treinos" value={String(sessions.length)} /><Metric label="Volume" value={`${Math.round(metrics.volume).toLocaleString("pt-BR")} kg`} />
      <Metric label="Séries" value={String(metrics.sets)} /><Metric label="PRs" value={String(metrics.prs)} />
    </div>
    <Card className="mt-4"><p className="text-sm font-semibold">Resumo semanal</p><div className="mt-3 space-y-2">
      {periods.map(p => <div key={p.key} className="grid grid-cols-[48px_1fr_auto] items-center gap-2"><span className="text-[11px] text-muted-foreground">{p.label}</span><div className="h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-primary" style={{width:`${Math.min(100,Math.max(6,p.volume/Math.max(...periods.map(x=>x.volume),1)*100))}%`}} /></div><span className="text-[11px] font-semibold tabular-nums">{p.sessions}x · {Math.round(p.volume)} kg</span></div>)}
    </div></Card>
    <Card className="mt-4"><p className="text-sm font-semibold">Treinos por volume</p><div className="mt-3 space-y-2">
      {workouts.slice(0,8).map(w => <div key={w.workoutId} className="rounded-xl bg-elevated p-3"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{w.workoutName}</span><span className="text-xs font-bold">{Math.round(w.totalVolume).toLocaleString("pt-BR")} kg</span></div><div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span>{w.sessions.length} sessões</span><span>{w.totalSets} séries</span><span>média {Math.round(w.averageDurationSeconds/60)} min</span>{w.volumeChangePercent != null && <span>{w.volumeChangePercent > 0 ? "+" : ""}{w.volumeChangePercent}% vs. anterior</span>}</div></div>)}
    </div></Card>
    <Card className="mt-4"><p className="text-sm font-semibold">Exercícios mais utilizados</p><div className="mt-3 space-y-2">
      {topExercises(sessions,getExercise).map(x => <Link key={x.id} to="/exercicio/$exerciseId" params={{exerciseId:x.id}} className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3"><span className="truncate text-sm font-semibold">{x.name}</span><span className="text-xs text-muted-foreground">{x.sessions} sessões · {x.sets} séries</span></Link>)}
    </div></Card>
    <Card className="mt-4"><p className="text-sm font-semibold">Resumo de tempo</p><p className="mt-1 text-xs text-muted-foreground">Total {formatDuration(metrics.duration)} · média {formatDuration(metrics.averageDuration)}</p></Card>
    <Button className="mt-4 w-full" onClick={exportCsv} disabled={exporting}>{exporting ? "Preparando relatório..." : "Exportar relatório CSV"}</Button>
  </AppShell>;
}

function Metric({label,value}:{label:string;value:string}) { return <Card className="p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></Card>; }
function formatDuration(seconds:number) { if (!seconds) return "0 min"; const m=Math.round(seconds/60); return m>=60 ? `${Math.floor(m/60)}h ${String(m%60).padStart(2,"0")}min` : `${m} min`; }
function topExercises(sessions: ReturnType<typeof useGym>["state"]["sessions"], getExercise: ReturnType<typeof useGym>["getExercise"]) {
  const map=new Map<string,{id:string;name:string;sessions:number;sets:number}>();
  for (const s of sessions) for (const e of s.entries) { const x=map.get(e.exerciseId) ?? {id:e.exerciseId,name:getExercise(e.exerciseId)?.name ?? e.exerciseId,sessions:0,sets:0}; x.sessions++; x.sets+=e.sets.length; map.set(e.exerciseId,x); }
  return [...map.values()].sort((a,b)=>b.sessions-a.sessions || b.sets-a.sets).slice(0,8);
}


function Comparison({ label, current, previous }: { label: string; current: number; previous: number }) {
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  return (
    <div className="rounded-xl bg-elevated p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{Math.round(current).toLocaleString("pt-BR")}</p>
      <p className={`text-[10px] font-semibold ${change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-muted-foreground"}`}>
        {change > 0 ? "+" : ""}{change}% vs. anterior
      </p>
    </div>
  );
}
