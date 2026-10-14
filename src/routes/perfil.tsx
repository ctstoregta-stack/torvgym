import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui-kit";
import { buildDashboardAnalytics } from "@/store/gym-analytics";
import { useGym } from "@/store/gym-store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · TorvGym" },
      {
        name: "description",
        content: "Acesse seu histórico, exercícios e recursos do seu perfil no TorvGym.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { ready, state } = useGym();
  const dashboard = buildDashboardAnalytics(state.sessions);
  const target = Math.max(1, state.goals.weeklySessionsTarget);
  const weeklyProgress = Math.min(100, Math.round((dashboard.sessionsLast7Days / target) * 100));
  const encouragement =
    dashboard.streakDays >= 7
      ? "Uma semana ou mais mantendo o ritmo. Continue assim!"
      : dashboard.streakDays >= 3
        ? "Você está criando consistência. Cada treino conta!"
        : dashboard.totalSessions > 0
          ? "Cada sessão é um passo à frente. Vamos manter o ritmo!"
          : "Seu próximo capítulo começa com o primeiro treino.";

  if (!ready) {
    return (
      <AppShell title="Perfil">
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Perfil">
      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-5">
        <section className="relative isolate overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card to-card p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-10 -z-10 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 right-24 -z-10 h-28 w-28 rounded-full bg-primary/10 blur-xl" />
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ProfileSparkIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Seu espaço</p>
              <h2 className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">Evolua no seu ritmo.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{encouragement}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeroStat icon={<DumbbellIcon />} label="Treinos" value={dashboard.totalSessions.toLocaleString("pt-BR")} />
            <HeroStat icon={<FlameIcon />} label="Sequência" value={`${dashboard.streakDays} dias`} />
            <HeroStat icon={<ChartIcon />} label="Volume total" value={`${Math.round(dashboard.totalVolume).toLocaleString("pt-BR")} kg`} />
          </div>
        </section>

        <Card className="min-w-0 overflow-hidden p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarIcon /></span>
                <div>
                  <p className="text-sm font-bold">Seu ritmo nesta semana</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dashboard.sessionsLast7Days} de {target} treinos concluídos
                  </p>
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">{weeklyProgress}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-label="Meta semanal de treinos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weeklyProgress}>
            <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-500" style={{ width: weeklyProgress + "%" }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {weeklyProgress >= 100 ? "Meta semanal concluída! 🎉" : `${Math.max(0, target - dashboard.sessionsLast7Days)} para bater a meta`}
            </p>
            <Link to="/progresso" className="shrink-0 text-xs font-bold text-primary underline-offset-4 hover:underline">Ver progresso →</Link>
          </div>
        </Card>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Central de treino</p>
              <h3 className="mt-1 text-lg font-extrabold tracking-tight">Para onde vamos hoje?</h3>
            </div>
            <span className="text-xl" aria-hidden="true">✨</span>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <ProfileLink to="/historico" title="Histórico" description="Reviva suas sessões e confira séries, volume e recordes." eyebrow="SEU CAMINHO" icon={<ChartIcon />} accent="bg-sky-500/10 text-sky-400" />
            <ProfileLink to="/exercicios" title="Exercícios" description="Explore movimentos e organize seus exercícios personalizados." eyebrow="BIBLIOTECA" icon={<DumbbellIcon />} accent="bg-primary/10 text-primary" />
            <SecondaryLink to="/corpo" title="Peso e medidas" description="Acompanhe seus registros e mudanças ao longo do tempo." icon={<ScaleIcon />} />
            <SecondaryLink to="/progresso" title="Progresso" description="Veja seus números e sua consistência." icon={<TrendIcon />} />
          </div>
        </section>

        <section className="pb-1">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Seu TorvGym</p>
          <div className="space-y-2">
            <SecondaryLink to="/conquistas" title="Conquistas" description="Celebre metas e marcos alcançados." icon={<TrophyIcon />} />
            <SecondaryLink to="/configuracoes" title="Configurações e segurança" description="Backup, recuperação e proteção dos seus dados." icon={<SettingsIcon />} />
            <SecondaryLink to="/relatorios" title="Relatórios" description="Análises detalhadas e exportação dos treinos." icon={<ReportIcon />} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-background/50 p-2.5 sm:p-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <p className="mt-2 text-[10px] font-medium text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-0.5 break-words text-sm font-extrabold tabular-nums sm:text-base">{value}</p>
    </div>
  );
}

function ProfileLink({ to, title, description, eyebrow, icon, accent }: {
  to: "/historico" | "/exercicios";
  title: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Link to={to} className="group block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
      <Card className="h-full min-w-0 overflow-hidden p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent} transition-transform duration-200 group-hover:scale-105`}>{icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold tracking-[0.12em] text-muted-foreground">{eyebrow}</span>
            <span className="mt-1 block text-base font-extrabold">{title}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
          </span>
          <span className="pt-0.5 text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true">›</span>
        </div>
      </Card>
    </Link>
  );
}

function SecondaryLink({ to, title, description, icon }: {
  to: "/progresso" | "/conquistas" | "/configuracoes" | "/relatorios" | "/corpo";
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link to={to} className="group flex min-h-[68px] min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3 transition duration-200 hover:border-primary/30 hover:bg-elevated/70 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true">›</span>
    </Link>
  );
}

function ProfileSparkIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" strokeLinejoin="round"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" strokeLinejoin="round"/></svg>;
}
function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" strokeLinecap="round"/></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round"/></svg>;
}
function FlameIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-3-2-5-4-7 0 3-1 4-2 5 0-5-3-8-5-10 0 5-3 7-3 12a7 7 0 0 0 7 7Z" strokeLinejoin="round"/></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round"/></svg>;
}
function ScaleIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16l-2 13H6L4 7Z" strokeLinejoin="round"/><path d="M9 7a3 3 0 0 1 6 0M12 10l2 2" strokeLinecap="round"/></svg>;
}
function TrendIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 17l6-6 4 3 6-7M14 7h6v6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TrophyIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 7H4v2a4 4 0 0 0 4 4M17 7h3v2a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ReportIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round"/><path d="M14 3v5h5M8 13h8M8 17h8" strokeLinecap="round"/></svg>;
}
