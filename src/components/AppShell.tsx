import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGym } from "@/store/gym-store";

const NAV = [
  { to: "/", label: "Início", icon: HomeIcon },
  { to: "/rotinas", label: "Rotinas", icon: LayersIcon },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
] as const;

export function AppShell({
  children,
  title,
  back,
  action,
}: {
  children: ReactNode;
  title?: string;
  back?: { to: string; params?: Record<string, string> };
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useGym();
  const active = state.activeSession;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col bg-background">
      {(title || back) && (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          {back && (
            <Link
              to={back.to}
              params={back.params as never}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground tap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Voltar"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
          {action}
        </header>
      )}

      <main className="page-content min-w-0 flex-1 px-3 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8">{children}</main>

      {active && pathname !== "/" && !pathname.startsWith("/executar") && (
        <Link
          to="/executar/$workoutId"
          params={{ workoutId: active.workoutId }}
          className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-xl accent-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          Treino em andamento · {active.workoutName} →
        </Link>
      )}

      <nav aria-label="Navegação principal" className="fixed bottom-0 left-1/2 z-20 w-full max-w-6xl -translate-x-1/2 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <ul className="grid grid-cols-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/"
              ? pathname === "/"
              : to === "/perfil"
                ? pathname === "/perfil" || pathname.startsWith("/historico") || pathname.startsWith("/exercicios")
                : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium tap ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 9 5-9 5-9-5z" strokeLinejoin="round" />
      <path d="m3 14 9 5 9-5" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" strokeLinecap="round" />
    </svg>
  );
}
