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
  if (!ready) return <AppShell title="Perfil"><div className="h-40 animate-pulse rounded-xl bg-card" /></AppShell>;
  return (
    <AppShell title="Perfil">
      <div className="space-y-4">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Meu perfil
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Tudo do seu treino em um só lugar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico e exercícios agora ficam organizados dentro do Perfil.
          </p>
        </section>

        <Card className="p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-[11px] text-muted-foreground">Treinos</p><p className="mt-1 text-lg font-bold">{dashboard.totalSessions}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Volume</p><p className="mt-1 text-lg font-bold">{Math.round(dashboard.totalVolume).toLocaleString("pt-BR")} kg</p></div>
            <div><p className="text-[11px] text-muted-foreground">Sequência</p><p className="mt-1 text-lg font-bold">{dashboard.streakDays}d</p></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Esta semana</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {dashboard.sessionsLast7Days} treinos · {Math.round(dashboard.volumeLast7Days).toLocaleString("pt-BR")} kg
              </p>
            </div>
            <Link to="/progresso" className="text-xs font-semibold text-primary">Ver progresso</Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: Math.min(100, state.goals.weeklySessionsTarget > 0 ? (dashboard.sessionsLast7Days / state.goals.weeklySessionsTarget) * 100 : 0) + "%" }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Meta: {state.goals.weeklySessionsTarget} treinos nesta semana
          </p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileLink
            to="/historico"
            title="Histórico"
            description="Veja treinos concluídos, volume, séries e recordes pessoais."
            icon={<ChartIcon />}
          />
          <ProfileLink
            to="/exercicios"
            title="Exercícios"
            description="Consulte a biblioteca, busque movimentos e gerencie exercícios personalizados."
            icon={<DumbbellIcon />}
          />
        </div>

        <section className="pt-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Mais opções
          </p>
          <div className="space-y-2">
            <SecondaryLink to="/progresso" title="Progresso" description="Acompanhe sua evolução ao longo do tempo." />
            <SecondaryLink to="/conquistas" title="Conquistas" description="Consulte suas metas e marcos alcançados." />
            <SecondaryLink to="/configuracoes" title="Configurações" description="Backup, recuperação e segurança dos seus dados." />
            <SecondaryLink to="/relatorios" title="Relatórios" description="Análises detalhadas e exportação dos seus treinos." />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ProfileLink({
  to,
  title,
  description,
  icon,
}: {
  to: "/historico" | "/exercicios";
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link to={to} className="block">
      <Card className="h-full p-4 tap active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
          <span className="ml-auto pt-1 text-muted-foreground" aria-hidden="true">›</span>
        </div>
      </Card>
    </Link>
  );
}

function SecondaryLink({
  to,
  title,
  description,
}: {
  to: "/progresso" | "/conquistas" | "/configuracoes" | "/relatorios";
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-14 items-center gap-3 rounded-xl bg-card px-4 py-3 tap active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-muted-foreground" aria-hidden="true">›</span>
    </Link>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" strokeLinecap="round" />
    </svg>
  );
}
