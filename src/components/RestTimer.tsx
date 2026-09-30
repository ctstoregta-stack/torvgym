import { useEffect } from "react";

export type RestState = { total: number; remaining: number; running: boolean } | null;

export function formatClock(secs: number) {
  const s = Math.max(0, Math.round(secs));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Barra de descanso não-bloqueante: o usuário continua o treino normalmente. */
export function RestTimer({
  rest,
  onChange,
  onSkip,
  nextLabel,
}: {
  rest: RestState;
  onChange: (next: RestState) => void;
  onSkip: () => void;
  nextLabel?: string | undefined;
}) {
  useEffect(() => {
    if (!rest || rest.remaining !== 0 || rest.running) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(120);
    }
  }, [rest?.remaining, rest?.running]);

  useEffect(() => {
    if (!rest || !rest.running) return;
    const t = setInterval(() => {
      onChange(
        rest.remaining <= 1
          ? { ...rest, remaining: 0, running: false }
          : { ...rest, remaining: rest.remaining - 1 },
      );
    }, 1000);
    return () => clearInterval(t);
  }, [rest, onChange]);

  if (!rest) return null;

  const pct = rest.total > 0 ? (rest.remaining / rest.total) * 100 : 0;

  const completed = rest.remaining === 0 && !rest.running;

  if (completed) {
    return (
      <div className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
        <div className="surface animate-pr-pop overflow-hidden border border-success/40 bg-card p-4 text-center shadow-[var(--shadow-glow)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-success">
            Descanso concluído
          </p>
          <p className="mt-1 text-base font-semibold">Hora de treinar</p>
          {nextLabel && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Próximo: {nextLabel}
            </p>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-success/15 px-4 text-xs font-semibold text-success tap active:scale-95"
          >
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
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Descanso
            </p>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {formatClock(rest.remaining)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <RestBtn
              label="-15s"
              onClick={() =>
                onChange({ ...rest, remaining: Math.max(0, rest.remaining - 15) })
              }
            />
            <RestBtn
              label="+30s"
              onClick={() =>
                onChange({
                  ...rest,
                  total: rest.total + 30,
                  remaining: rest.remaining + 30,
                  running: true,
                })
              }
            />
            <RestBtn
              label={rest.running ? "Pausar" : "Retomar"}
              onClick={() => onChange({ ...rest, running: !rest.running })}
            />
            <RestBtn label="Pular" onClick={onSkip} primary />
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
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
      onClick={onClick}
      className={`h-10 min-w-[48px] rounded-lg px-2 text-xs font-semibold tap active:scale-95 ${
        primary
          ? "bg-primary/20 text-primary"
          : "bg-elevated text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
