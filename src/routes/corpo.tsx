import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button, Card, EmptyState, Input } from "@/components/ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BODY_METRIC_FIELDS,
  bodyMetricChange,
  bodyMetricSeries,
  fieldFor,
  parseMetricText,
  todayLocalDay,
  type BodyEntryInput,
} from "@/lib/body-metrics";
import type { BodyEntry, BodyMetricKey } from "@/lib/types";
import { useGym } from "@/store/gym-store";

export const Route = createFileRoute("/corpo")({
  head: () => ({
    meta: [
      { title: "Peso e medidas · TorvGym" },
      {
        name: "description",
        content: "Registre peso corporal e medidas e acompanhe a evolução em gráficos.",
      },
    ],
  }),
  component: BodyPage,
});

function formatDay(day: string, withYear = false) {
  const [year, month, date] = day.split("-");
  return withYear ? `${date}/${month}/${year}` : `${date}/${month}`;
}

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unit}`;
}

function BodyPage() {
  const { ready, state, addBodyEntry, deleteBodyEntry } = useGym();
  const [date, setDate] = useState(() => todayLocalDay());
  const [texts, setTexts] = useState<Record<BodyMetricKey, string>>(() => emptyTexts());
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<BodyMetricKey>("weightKg");
  const [pendingDelete, setPendingDelete] = useState<BodyEntry | null>(null);

  const entries = state.bodyMetrics;
  const availableKeys = useMemo(
    () => BODY_METRIC_FIELDS.filter((field) => entries.some((e) => e[field.key] != null)),
    [entries],
  );
  const chartKey = availableKeys.some((field) => field.key === selected)
    ? selected
    : (availableKeys[0]?.key ?? "weightKg");
  const chartField = fieldFor(chartKey);
  const series = useMemo(() => bodyMetricSeries(entries, chartKey), [entries, chartKey]);
  const change = useMemo(() => bodyMetricChange(entries, chartKey), [entries, chartKey]);
  const history = useMemo(() => [...entries].reverse(), [entries]);
  const weightEntries = useMemo(
    () => entries.filter((entry) => entry.weightKg != null),
    [entries],
  );
  const latestWeight = weightEntries[weightEntries.length - 1]?.weightKg;
  const previousWeight = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2]?.weightKg : undefined;
  const weightDelta =
    latestWeight != null && previousWeight != null
      ? Math.round((latestWeight - previousWeight) * 10) / 10
      : null;
  const filledCount = BODY_METRIC_FIELDS.filter((field) => texts[field.key].trim() !== "").length;
  const yesterday = (() => {
    const day = new Date();
    day.setDate(day.getDate() - 1);
    return todayLocalDay(day);
  })();

  function handleSave() {
    const input: BodyEntryInput = { date };
    let filled = 0;
    for (const field of BODY_METRIC_FIELDS) {
      const parsed = parseMetricText(texts[field.key]);
      if (parsed === null) continue;
      if (Number.isNaN(parsed) || parsed < field.min || parsed > field.max) {
        toast.error(
          `${field.label}: informe um valor entre ${field.min} e ${field.max} ${field.unit}.`,
        );
        return;
      }
      input[field.key] = parsed;
      filled += 1;
    }
    if (!filled) {
      toast.error("Preencha ao menos uma medida.");
      return;
    }
    if (note.trim()) input.note = note;
    if (!addBodyEntry(input)) {
      toast.error("Não foi possível salvar. Confira a data e os valores.");
      return;
    }
    toast.success("Registro salvo.");
    setTexts(emptyTexts());
    setNote("");
  }

  if (!ready) {
    return (
      <AppShell title="Peso e medidas" back={{ to: "/perfil" }}>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Peso e medidas" back={{ to: "/perfil" }}>
      <div className="space-y-4">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-0">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ScaleIcon />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Minha evolução
                </p>
                <h2 className="text-lg font-bold tracking-tight">Peso e medidas</h2>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Último peso registrado</p>
                <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                  {latestWeight != null ? latestWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"}
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">kg</span>
                </p>
                {weightDelta != null ? (
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {weightDelta > 0 ? "+" : ""}{weightDelta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg desde o registro anterior
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {latestWeight == null ? "Registre seu peso para começar a acompanhar." : "Adicione outro registro para comparar sua evolução."}
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-background/60 p-3 text-primary">
                <TrendIcon />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3">
              <MiniSummary label="Registros" value={String(entries.length)} />
              <MiniSummary label="Medidas" value={String(availableKeys.length)} />
              <MiniSummary label="Último dia" value={entries.length ? formatDay(entries[entries.length - 1]!.date) : "—"} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Novo registro</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Registre apenas o que quiser hoje. Os dados ficam salvos no seu TorvGym.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {filledCount}/6 preenchidos
            </span>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Quando você mediu?</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Hoje", value: todayLocalDay() },
                { label: "Ontem", value: yesterday },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDate(option.value)}
                  aria-pressed={date === option.value}
                  className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${date === option.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs font-semibold text-muted-foreground">
              Data personalizada
              <Input
                type="date"
                value={date}
                max={todayLocalDay()}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1"
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Peso corporal</p>
              <span className="text-[11px] text-muted-foreground">kg</span>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WeightIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Peso atual</span>
                <span className="block text-[11px] text-muted-foreground">Ex.: 72,5</span>
              </span>
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label="Peso corporal em quilogramas"
                value={texts.weightKg}
                placeholder="0,0"
                onChange={(event) => setTexts((current) => ({ ...current, weightKg: event.target.value }))}
                className="h-12 w-24 text-right text-lg font-bold tabular-nums"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Medidas complementares</p>
            <div className="grid grid-cols-2 gap-2">
              {BODY_METRIC_FIELDS.filter((field) => field.key !== "weightKg").map((field) => (
                <label key={field.key} className="rounded-xl bg-elevated p-3">
                  <span className="block text-xs font-semibold text-foreground">{field.label}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={texts[field.key]}
                      placeholder="—"
                      aria-label={`${field.label} em ${field.unit}`}
                      onChange={(event) => setTexts((current) => ({ ...current, [field.key]: event.target.value }))}
                      className="h-10 min-w-0 text-base font-semibold tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">{field.unit}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            Observação (opcional)
            <Input
              type="text"
              maxLength={200}
              value={note}
              placeholder="Como você está se sentindo?"
              onChange={(event) => setNote(event.target.value)}
              className="mt-1"
            />
          </label>
          <Button className="mt-4 w-full" onClick={handleSave}>
            <SaveIcon />
            <span className="ml-2">{filledCount ? `Salvar registro · ${filledCount} medida${filledCount === 1 ? "" : "s"}` : "Salvar registro"}</span>
          </Button>
        </Card>

        {entries.length === 0 ? (
          <EmptyState
            title="Nenhum registro ainda"
            description="Salve seu peso ou suas medidas para acompanhar a evolução em gráficos."
          />
        ) : (
          <>
            <Card>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">Sua evolução</p>
                  <p className="mt-1 text-xs text-muted-foreground">Toque em uma medida para explorar o histórico.</p>
                </div>
                <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {series.length} ponto{series.length === 1 ? "" : "s"}
                </span>
              </div>
              <div
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                role="group"
                aria-label="Medida do gráfico"
              >
                {availableKeys.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    aria-pressed={chartKey === field.key}
                    onClick={() => setSelected(field.key)}
                    className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      chartKey === field.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-elevated text-muted-foreground"
                    }`}
                  >
                    {field.label}
                  </button>
                ))}
              </div>

              {change && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Atual" value={formatValue(change.last, chartField.unit)} />
                  <Stat label="Inicial" value={formatValue(change.first, chartField.unit)} />
                  <Stat
                    label="Variação"
                    value={`${change.delta > 0 ? "+" : ""}${change.delta.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })} ${chartField.unit}`}
                  />
                </div>
              )}

              {series.length >= 2 ? (
                <div
                  className="mt-3 h-48 w-full"
                  role="img"
                  aria-label={`Gráfico de ${chartField.label.toLowerCase()} ao longo do tempo`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={series.map((p) => ({ name: formatDay(p.date), value: p.value }))}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          background: "#000",
                          border: "none",
                          borderRadius: "12px",
                          padding: "10px 14px",
                        }}
                        labelStyle={{ color: "#a1a1aa", fontSize: "11px", marginBottom: "5px" }}
                        itemStyle={{ color: "#fff", fontSize: "16px", fontWeight: 700, padding: 0 }}
                        formatter={(value) => [formatValue(Number(value), chartField.unit), ""]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "var(--primary)" }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Salve mais um registro de {chartField.label.toLowerCase()} para ver o gráfico.
                </p>
              )}
            </Card>

            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Histórico
              </p>
              <div className="space-y-2">
                {history.map((entry) => (
                  <Card key={entry.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{formatDay(entry.date, true)}</p>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(entry)}
                        aria-label={`Excluir registro de ${formatDay(entry.date, true)}`}
                        className="min-h-9 rounded-lg px-2 text-xs font-semibold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        Excluir
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {BODY_METRIC_FIELDS.filter((field) => entry[field.key] != null).map((field) => (
                        <span key={field.key} className={`rounded-lg px-2 py-1 text-[11px] font-semibold tabular-nums ${field.key === "weightKg" ? "bg-primary/10 text-primary" : "bg-elevated text-foreground"}`}>
                          {field.label}: {formatValue(entry[field.key]!, field.unit)}
                        </span>
                      ))}
                    </div>
                    {entry.note && <p className="mt-2 rounded-lg bg-elevated px-3 py-2 text-xs text-muted-foreground">{entry.note}</p>}
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="text-left">
            <DialogTitle>Excluir registro?</DialogTitle>
            <DialogDescription>
              O registro de {pendingDelete ? formatDay(pendingDelete.date, true) : ""} será
              removido. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setPendingDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                if (pendingDelete) deleteBodyEntry(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function emptyTexts(): Record<BodyMetricKey, string> {
  return {
    weightKg: "",
    bodyFatPct: "",
    waistCm: "",
    chestCm: "",
    armCm: "",
    thighCm: "",
  };
}

function ScaleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16l-2 13H6L4 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0M12 10l2 2" strokeLinecap="round" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 4h10l3 4v11H4V8l3-4Z" strokeLinejoin="round" />
      <path d="M9 9a3 3 0 0 1 6 0M12 9l2 2" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 17l6-6 4 3 6-7M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 4h12l3 3v13H4V4h1Z" strokeLinejoin="round" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" strokeLinejoin="round" />
    </svg>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevated p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
