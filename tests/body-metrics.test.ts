import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bodyMetricChange,
  bodyMetricSeries,
  isValidDay,
  normalizeBodyEntries,
  parseMetricText,
  sanitizeMetricValue,
  todayLocalDay,
  upsertBodyEntry,
} from "../src/lib/body-metrics.ts";
import { createBackup, emptyState, parseBackup } from "../src/lib/storage.ts";
import type { BodyEntry } from "../src/lib/types.ts";

test("isValidDay aceita datas reais e rejeita inexistentes ou mal formatadas", () => {
  assert.equal(isValidDay("2026-02-28"), true);
  assert.equal(isValidDay("2024-02-29"), true);
  assert.equal(isValidDay("2026-02-30"), false);
  assert.equal(isValidDay("2026-13-01"), false);
  assert.equal(isValidDay("26-01-01"), false);
  assert.equal(isValidDay(20260101), false);
});

test("todayLocalDay usa o dia local, com zeros à esquerda", () => {
  assert.equal(todayLocalDay(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("sanitizeMetricValue arredonda para 1 casa e respeita os limites", () => {
  assert.equal(sanitizeMetricValue("weightKg", 80.46), 80.5);
  assert.equal(sanitizeMetricValue("weightKg", 19.9), null);
  assert.equal(sanitizeMetricValue("weightKg", 501), null);
  assert.equal(sanitizeMetricValue("bodyFatPct", 1), null);
  assert.equal(sanitizeMetricValue("armCm", Number.NaN), null);
  assert.equal(sanitizeMetricValue("armCm", "40"), null);
});

test("parseMetricText aceita vírgula, vazio vira null e texto inválido vira NaN", () => {
  assert.equal(parseMetricText("80,5"), 80.5);
  assert.equal(parseMetricText(" 72 "), 72);
  assert.equal(parseMetricText(""), null);
  assert.ok(Number.isNaN(parseMetricText("abc")));
  assert.ok(Number.isNaN(parseMetricText("-5")));
});

test("upsertBodyEntry cria um registro novo e rejeita entradas inválidas", () => {
  const created = upsertBodyEntry([], { date: "2026-03-01", weightKg: 80 }, "c1");
  assert.equal(created?.entries.length, 1);
  assert.deepEqual(created?.entry, { id: "c1", date: "2026-03-01", weightKg: 80 });

  assert.equal(upsertBodyEntry([], { date: "2026-03-01" }, "c2"), null);
  assert.equal(upsertBodyEntry([], { date: "2026-03-32", weightKg: 80 }, "c3"), null);
  assert.equal(upsertBodyEntry([], { date: "2026-03-01", weightKg: 1000 }, "c4"), null);
});

test("upsertBodyEntry mescla no mesmo dia e permite apagar uma medida com null", () => {
  const first = upsertBodyEntry([], { date: "2026-03-01", weightKg: 80 }, "c1")!;
  const merged = upsertBodyEntry(
    first.entries,
    { date: "2026-03-01", waistCm: 90, note: "  em jejum  " },
    "c2",
  )!;
  assert.equal(merged.entries.length, 1);
  assert.deepEqual(merged.entry, {
    id: "c1",
    date: "2026-03-01",
    weightKg: 80,
    waistCm: 90,
    note: "em jejum",
  });

  const cleared = upsertBodyEntry(merged.entries, { date: "2026-03-01", weightKg: null }, "c3")!;
  assert.equal(cleared.entry.weightKg, undefined);
  assert.equal(cleared.entry.waistCm, 90);

  // Apagar a única medida restante invalida o registro.
  const only = upsertBodyEntry([], { date: "2026-03-02", weightKg: 70 }, "c4")!;
  assert.equal(upsertBodyEntry(only.entries, { date: "2026-03-02", weightKg: null }, "c5"), null);
});

test("os registros ficam ordenados por data", () => {
  let entries: BodyEntry[] = [];
  for (const [id, date] of [
    ["a", "2026-03-10"],
    ["b", "2026-03-01"],
    ["c", "2026-03-05"],
  ] as const) {
    entries = upsertBodyEntry(entries, { date, weightKg: 80 }, id)!.entries;
  }
  assert.deepEqual(
    entries.map((entry) => entry.date),
    ["2026-03-01", "2026-03-05", "2026-03-10"],
  );
});

test("bodyMetricSeries e bodyMetricChange calculam a evolução", () => {
  const entries: BodyEntry[] = [
    { id: "1", date: "2026-03-01", weightKg: 82, waistCm: 95 },
    { id: "2", date: "2026-03-08", weightKg: 81.2 },
    { id: "3", date: "2026-03-15", weightKg: 80.1, waistCm: 92 },
  ];
  assert.deepEqual(
    bodyMetricSeries(entries, "weightKg").map((p) => p.value),
    [82, 81.2, 80.1],
  );
  assert.deepEqual(bodyMetricChange(entries, "weightKg"), {
    first: 82,
    last: 80.1,
    delta: -1.9,
    count: 3,
  });
  assert.equal(bodyMetricChange(entries, "waistCm")?.delta, -3);
  assert.equal(bodyMetricChange(entries, "armCm"), null);
});

test("normalizeBodyEntries descarta lixo, duplicatas e valores fora do intervalo", () => {
  const result = normalizeBodyEntries([
    { id: "1", date: "2026-03-01", weightKg: 80 },
    { id: "1", date: "2026-03-02", weightKg: 81 },
    { id: "2", date: "2026-03-03" },
    { id: "3", date: "data-ruim", weightKg: 80 },
    { id: "4", date: "2026-03-04", weightKg: 5000, waistCm: 88 },
    { date: "2026-03-05", weightKg: 80 },
    null,
    "texto",
  ]);
  assert.deepEqual(result, [
    { id: "1", date: "2026-03-01", weightKg: 80 },
    { id: "4", date: "2026-03-04", waistCm: 88 },
  ]);
  assert.deepEqual(normalizeBodyEntries(undefined), []);
  assert.deepEqual(normalizeBodyEntries("x"), []);
});

test("backup com registros corporais volta idêntico (ida e volta)", () => {
  const bodyMetrics: BodyEntry[] = [
    { id: "1", date: "2026-03-01", weightKg: 80, note: "início" },
    { id: "2", date: "2026-03-08", weightKg: 79.4, waistCm: 90 },
  ];
  const restored = parseBackup(createBackup({ ...emptyState, bodyMetrics }));
  assert.deepEqual(restored?.bodyMetrics, bodyMetrics);
});

test("backup antigo, sem o campo bodyMetrics, continua abrindo com lista vazia", () => {
  const legacy = JSON.stringify({
    format: "torvgym-backup",
    version: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    state: { routines: [], customExercises: [], sessions: [] },
  });
  const restored = parseBackup(legacy);
  assert.ok(restored);
  assert.deepEqual(restored.bodyMetrics, []);
});
