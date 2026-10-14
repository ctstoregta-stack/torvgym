import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildReportImageData,
  describeChange,
  formatDurationLabel,
  formatVolumeKg,
} from "../src/lib/report-image.ts";

const baseInput = {
  periodLabel: "Últimos 30 dias",
  now: new Date(2026, 9, 3),
  sessions: 12,
  volume: 12500,
  sets: 180,
  prs: 4,
  durationSeconds: 12 * 3000,
  averageDurationSeconds: 3000,
  previous: { sessions: 10, volume: 10000, sets: 200 },
  weeks: Array.from({ length: 10 }, (_, index) => ({
    label: `0${index}/10`,
    volume: 1000 * (index + 1),
  })),
  workouts: [
    { name: "Treino A", volume: 5000, sessions: 4, sets: 60 },
    { name: "Treino B", volume: 4000, sessions: 1, sets: 20 },
    { name: "Treino C", volume: 3000, sessions: 3, sets: 40 },
    { name: "Treino D", volume: 500, sessions: 2, sets: 10 },
  ],
};

test("formatVolumeKg arredonda e usa separador de milhar pt-BR", () => {
  assert.match(formatVolumeKg(12499.6), /^12\D?500 kg$/);
  assert.equal(formatVolumeKg(0), "0 kg");
});

test("formatDurationLabel mostra minutos e horas", () => {
  assert.equal(formatDurationLabel(0), "0 min");
  assert.equal(formatDurationLabel(45 * 60), "45 min");
  assert.equal(formatDurationLabel(65 * 60), "1h 05min");
  assert.equal(formatDurationLabel(-10), "0 min");
});

test("describeChange calcula variação, trata base zero e valores iguais", () => {
  assert.deepEqual(describeChange("Volume", 125, 100), {
    label: "Volume",
    text: "+25%",
    direction: "up",
  });
  assert.deepEqual(describeChange("Séries", 90, 100), {
    label: "Séries",
    text: "-10%",
    direction: "down",
  });
  assert.equal(describeChange("Treinos", 5, 5).direction, "flat");
  assert.equal(describeChange("Treinos", 3, 0).text, "novo");
  assert.equal(describeChange("Treinos", 0, 0).text, "0%");
});

test("buildReportImageData monta métricas, comparações e limita semanas e treinos", () => {
  const data = buildReportImageData(baseInput);
  assert.equal(data.generatedAt, "03/10/2026");
  assert.equal(data.periodLabel, "Últimos 30 dias");
  assert.deepEqual(
    data.metrics.map((metric) => metric.label),
    ["Treinos", "Volume", "Séries", "Recordes (PR)", "Tempo total", "Média por treino"],
  );
  assert.equal(data.metrics[0]?.value, "12");
  assert.equal(data.metrics[4]?.value, "10h 00min");
  assert.equal(data.metrics[5]?.value, "50 min");
  assert.deepEqual(
    data.comparisons.map((item) => item.text),
    ["+20%", "+25%", "-10%"],
  );
  assert.equal(data.weeks.length, 8);
  assert.equal(data.weeks[0]?.label, "02/10");
  assert.equal(data.topWorkouts.length, 3);
  assert.equal(data.topWorkouts[0]?.detail, "4 sessões · 60 séries");
  assert.equal(data.topWorkouts[1]?.detail, "1 sessão · 20 séries");
});

test("sem período anterior (todo o período), não há comparações", () => {
  const data = buildReportImageData({ ...baseInput, previous: null });
  assert.deepEqual(data.comparisons, []);
});
