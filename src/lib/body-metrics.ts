import type { BodyEntry, BodyMetricKey } from "./types";

export type BodyMetricField = {
  key: BodyMetricKey;
  label: string;
  unit: string;
  min: number;
  max: number;
};

export const BODY_METRIC_FIELDS: readonly BodyMetricField[] = [
  { key: "weightKg", label: "Peso corporal", unit: "kg", min: 20, max: 500 },
  { key: "bodyFatPct", label: "Gordura corporal", unit: "%", min: 2, max: 70 },
  { key: "waistCm", label: "Cintura", unit: "cm", min: 20, max: 300 },
  { key: "chestCm", label: "Peito", unit: "cm", min: 20, max: 300 },
  { key: "armCm", label: "Braço", unit: "cm", min: 10, max: 150 },
  { key: "thighCm", label: "Coxa", unit: "cm", min: 10, max: 200 },
];

export type BodyEntryInput = {
  date: string;
  note?: string | null;
} & Partial<Record<BodyMetricKey, number | null>>;

const MAX_ENTRIES = 5000;
const MAX_NOTE_LENGTH = 200;

export function fieldFor(key: BodyMetricKey): BodyMetricField {
  const field = BODY_METRIC_FIELDS.find((item) => item.key === key);
  if (!field) throw new Error(`Medida desconhecida: ${key}`);
  return field;
}

/** Dia local no formato AAAA-MM-DD. */
export function todayLocalDay(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Arredonda para 1 casa decimal e valida o intervalo da medida. Retorna null se inválido. */
export function sanitizeMetricValue(key: BodyMetricKey, value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const field = fieldFor(key);
  const rounded = Math.round(value * 10) / 10;
  return rounded >= field.min && rounded <= field.max ? rounded : null;
}

function sanitizeNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_NOTE_LENGTH);
  return trimmed ? trimmed : undefined;
}

function hasAnyMetric(entry: BodyEntry): boolean {
  return BODY_METRIC_FIELDS.some((field) => entry[field.key] != null);
}

function sortEntries(entries: BodyEntry[]): BodyEntry[] {
  return [...entries].sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  );
}

export function normalizeBodyEntry(input: unknown): BodyEntry | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const { id, date } = raw;
  if (typeof id !== "string" || !id.trim() || !isValidDay(date)) return null;
  const entry: BodyEntry = { id, date };
  for (const field of BODY_METRIC_FIELDS) {
    const value = sanitizeMetricValue(field.key, raw[field.key]);
    if (value != null) entry[field.key] = value;
  }
  const note = sanitizeNote(raw["note"]);
  if (note) entry.note = note;
  return hasAnyMetric(entry) ? entry : null;
}

/** Normaliza uma lista vinda do armazenamento ou de um backup; descarta itens inválidos. */
export function normalizeBodyEntries(input: unknown): BodyEntry[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const entries: BodyEntry[] = [];
  for (const item of input) {
    const entry = normalizeBodyEntry(item);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }
  return sortEntries(entries).slice(-MAX_ENTRIES);
}

/**
 * Grava um registro por dia: se já existe um registro na data, as medidas informadas
 * são mescladas nele (um valor null apaga aquela medida). Retorna null se a entrada for inválida.
 */
export function upsertBodyEntry(
  entries: BodyEntry[],
  input: BodyEntryInput,
  newId: string,
): { entries: BodyEntry[]; entry: BodyEntry } | null {
  if (!isValidDay(input.date)) return null;
  const existing = entries.find((item) => item.date === input.date);
  const entry: BodyEntry = existing ? { ...existing } : { id: newId, date: input.date };

  for (const field of BODY_METRIC_FIELDS) {
    const provided = input[field.key];
    if (provided === undefined) continue;
    if (provided === null) {
      delete entry[field.key];
      continue;
    }
    const value = sanitizeMetricValue(field.key, provided);
    if (value == null) return null;
    entry[field.key] = value;
  }

  if (input.note !== undefined) {
    const note = sanitizeNote(input.note);
    if (note) entry.note = note;
    else delete entry.note;
  }

  if (!hasAnyMetric(entry)) return null;
  const rest = entries.filter((item) => item.id !== entry.id);
  return { entries: sortEntries([...rest, entry]).slice(-MAX_ENTRIES), entry };
}

export function bodyMetricSeries(
  entries: BodyEntry[],
  key: BodyMetricKey,
): { date: string; value: number }[] {
  return sortEntries(entries).flatMap((entry) => {
    const value = entry[key];
    return value != null ? [{ date: entry.date, value }] : [];
  });
}

export function bodyMetricChange(entries: BodyEntry[], key: BodyMetricKey) {
  const series = bodyMetricSeries(entries, key);
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last) return null;
  return {
    first: first.value,
    last: last.value,
    delta: Math.round((last.value - first.value) * 10) / 10,
    count: series.length,
  };
}

/** Converte texto digitado (aceita vírgula decimal) em número; vazio vira null, inválido vira NaN. */
export function parseMetricText(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!cleaned) return null;
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}
