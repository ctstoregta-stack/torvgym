import { useEffect, useState } from "react";

export type RestState = {
  total: number;
  remaining: number;
  running: boolean;
  startedAt?: number | null;
} | null;

export function formatClock(secs: number) {
  const s = Math.max(0, Math.round(secs));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Barra de descanso não-bloqueante baseada em timestamp, resistente à suspensão do app. */
export function RestTimer({
  rest,
  onChange,
  onSkip,
  nextLabel,
  nextLabelPrefix,
}: {
  rest: RestState;
  onChange: (next: RestState) => void;
  onSkip: () => void;
  nextLabel?: string | undefined;
  nextLabelPrefix?: string | undefined;
}) {
  const [displayRemaining, setDisplayRemaining] = useState(rest?.remaining ?? 0);

  useEffect(() => {
    if (!rest) {
      setDisplayRemaining(0);
      return;
    }

    if (!rest.running || !rest.startedAt) {
      setDisplayRemaining(rest.remaining);
      return;
    }

    const update = () => {
      const elapsed = Math.floor((Date.now() - rest.startedAt!) / 1000);
      const remaining = Math.max(0, rest.total - elapsed);
      setDisplayRemaining(remaining);
      // Enquanto corre, o timestamp é a fonte de verdade. Não persistimos
      // cada tick para evitar gravações contínuas no localStorage.
      if (remaining === 0) {
        onChange({ ...rest, remaining: 0, running: false, startedAt: null });
      }
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [rest, onChange]);

  useEffect(() => {
    if (!rest || rest.remaining !== 0 || rest.running) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(120);
    }
  }, [rest?.remaining, rest?.running]);

  if (!rest) return null;

  const remaining = rest.running && rest.startedAt ? displayRemaining : rest.remaining;
  const pct = rest.total > 0 ? (remaining / rest.total) * 100 : 0;
  const completed = remaining === 0 && !rest.running;

  const updateRemaining = (nextRemaining: number, nextTotal = rest.total, running = rest.running) => {
    const safeRemaining = Math.max(0, nextRemaining);
    const startedAt = running
      ? Date.now() - Math.max(0, nextTotal - safeRemaining) * 1000
      : null;
    onChange({
      ...rest,
      total: nextTotal,
      remaining: safeRemaining,
      running: running && safeRemaining > 0,
      startedAt,
    });
  };

  if (completed) {
    return (
      <div className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
        <div className="surface animate-pr-pop overflow-hidden border border-success/40 bg-card p-4 text-center shadow-[var(--shadow-glow)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-success">Descanso concluído</p>
          <p className="mt-1 text-base font-semibold">Hora de treinar</p>
          {nextLabel && <p className="mt-1 truncate text-xs text-muted-foreground">{nextLabelPrefix ?? "Próximo"}: {nextLabel}</p>}
          <button type="button" onClick={onSkip} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-success/15 px-4 text-xs font-semibold text-success tap active:scale-95">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
      <div className="surface overflow-hidden border border-primary/30 p-3 shadow-[var(--shadow-glow)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Descanso</p>
            <p className="text-2xl font-bold tabular-nums text-primary">{formatClock(remaining)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <RestBtn label="-15s" onClick={() => updateRemaining(remaining - 15)} />
            <RestBtn label="+30s" onClick={() => updateRemaining(remaining + 30, rest.total + 30, true)} />
            <RestBtn
              label={rest.running ? "Pausar" : "Retomar"}
              onClick={() => {
                if (rest.running) updateRemaining(remaining, rest.total, false);
                else updateRemaining(remaining, rest.total, remaining > 0);
              }}
            />
            <RestBtn label="Pular" onClick={onSkip} primary />
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function RestBtn({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 min-w-[48px] rounded-lg px-2 text-xs font-semibold tap active:scale-95 ${primary ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}
