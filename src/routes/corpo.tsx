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
        <Card>
          <h2 className="text-base font-semibold">Novo registro</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preencha só o que quiser. Se já houver registro na data, as medidas são somadas a ele.
          </p>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground">
            Data
            <Input
              type="date"
              value={date}
              max={todayLocalDay()}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {BODY_METRIC_FIELDS.map((field) => (
              <label key={field.key} className="block text-xs font-semibold text-muted-foreground">
                {field.label} ({field.unit})
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={texts[field.key]}
                  placeholder="0"
                  onChange={(event) =>
                    setTexts((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className="mt-1"
                />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground">
            Observação (opcional)
            <Input
              type="text"
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1"
            />
          </label>
          <Button className="mt-4 w-full" onClick={handleSave}>
            Salvar registro
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {BODY_METRIC_FIELDS.filter((field) => entry[field.key] != null)
                        .map(
                          (field) => `${field.label} ${formatValue(entry[field.key]!, field.unit)}`,
                        )
                        .join(" · ")}
                    </p>
                    {entry.note && <p className="mt-1 text-xs">{entry.note}</p>}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevated p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
