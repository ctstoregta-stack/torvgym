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
}: {
  rest: RestState;
  onChange: (next: RestState) => void;
  onSkip: () => void;
}) {
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

  return (
    <div className="fixed bottom-[128px] left-1/2 z-30 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
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
