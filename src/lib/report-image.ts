export type ReportChange = {
  label: string;
  text: string;
  direction: "up" | "down" | "flat";
};

export type ReportImageData = {
  title: string;
  periodLabel: string;
  generatedAt: string;
  metrics: { label: string; value: string }[];
  comparisons: ReportChange[];
  weeks: { label: string; volume: number }[];
  topWorkouts: { name: string; volume: string; detail: string }[];
};

export type ReportImageInput = {
  periodLabel: string;
  now?: Date;
  sessions: number;
  volume: number;
  sets: number;
  prs: number;
  durationSeconds: number;
  averageDurationSeconds: number;
  previous: { sessions: number; volume: number; sets: number } | null;
  weeks: { label: string; volume: number }[];
  workouts: { name: string; volume: number; sessions: number; sets: number }[];
};

export function formatVolumeKg(volume: number): string {
  return `${Math.round(volume).toLocaleString("pt-BR")} kg`;
}

export function formatDurationLabel(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}min`;
}

/** Variação percentual textual; retorna "novo" quando não há base de comparação. */
export function describeChange(label: string, current: number, previous: number): ReportChange {
  if (previous <= 0) {
    return current > 0
      ? { label, text: "novo", direction: "up" }
      : { label, text: "0%", direction: "flat" };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { label, text: "0%", direction: "flat" };
  return {
    label,
    text: `${percent > 0 ? "+" : ""}${percent}%`,
    direction: percent > 0 ? "up" : "down",
  };
}

function formatDate(date: Date): string {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()),
  ].join("/");
}

export function buildReportImageData(input: ReportImageInput): ReportImageData {
  const now = input.now ?? new Date();
  return {
    title: "Resumo de treinos",
    periodLabel: input.periodLabel,
    generatedAt: formatDate(now),
    metrics: [
      { label: "Treinos", value: String(input.sessions) },
      { label: "Volume", value: formatVolumeKg(input.volume) },
      { label: "Séries", value: String(input.sets) },
      { label: "Recordes (PR)", value: String(input.prs) },
      { label: "Tempo total", value: formatDurationLabel(input.durationSeconds) },
      { label: "Média por treino", value: formatDurationLabel(input.averageDurationSeconds) },
    ],
    comparisons: input.previous
      ? [
          describeChange("Treinos", input.sessions, input.previous.sessions),
          describeChange("Volume", input.volume, input.previous.volume),
          describeChange("Séries", input.sets, input.previous.sets),
        ]
      : [],
    weeks: input.weeks.slice(-8).map((week) => ({ label: week.label, volume: week.volume })),
    topWorkouts: input.workouts.slice(0, 3).map((workout) => ({
      name: workout.name,
      volume: formatVolumeKg(workout.volume),
      detail: `${workout.sessions} ${workout.sessions === 1 ? "sessão" : "sessões"} · ${workout.sets} séries`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Desenho em canvas (somente no navegador)
// ---------------------------------------------------------------------------

const WIDTH = 1080;
const PAD = 56;
const GAP = 24;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const COLOR = {
  background: "#151518",
  card: "#26262b",
  text: "#fafafa",
  muted: "#a1a1aa",
  primary: "#3b82f6",
  success: "#22c55e",
  danger: "#ef4444",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}…`;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight: 400 | 600 | 700 = 400) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, text: string, y: number): number {
  setFont(ctx, 32, 700);
  ctx.fillStyle = COLOR.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, PAD, y + 32);
  return y + 56;
}

function drawMetrics(ctx: CanvasRenderingContext2D, data: ReportImageData, startY: number): number {
  const columns = 3;
  const cellW = (WIDTH - PAD * 2 - GAP * (columns - 1)) / columns;
  const cellH = 150;
  data.metrics.forEach((metric, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = PAD + col * (cellW + GAP);
    const y = startY + row * (cellH + GAP);
    ctx.fillStyle = COLOR.card;
    roundRect(ctx, x, y, cellW, cellH, 24);
    ctx.fill();
    ctx.textAlign = "left";
    setFont(ctx, 26, 400);
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(fitText(ctx, metric.label, cellW - 48), x + 24, y + 46);
    setFont(ctx, 44, 700);
    ctx.fillStyle = COLOR.text;
    ctx.fillText(fitText(ctx, metric.value, cellW - 48), x + 24, y + 106);
  });
  const rows = Math.ceil(data.metrics.length / columns);
  return startY + rows * (cellH + GAP);
}

function drawComparisons(
  ctx: CanvasRenderingContext2D,
  data: ReportImageData,
  startY: number,
): number {
  if (!data.comparisons.length) return startY;
  let y = drawSectionTitle(ctx, "Vs. período anterior", startY + 16);
  const columns = data.comparisons.length;
  const cellW = (WIDTH - PAD * 2 - GAP * (columns - 1)) / columns;
  const cellH = 120;
  data.comparisons.forEach((item, index) => {
    const x = PAD + index * (cellW + GAP);
    ctx.fillStyle = COLOR.card;
    roundRect(ctx, x, y, cellW, cellH, 24);
    ctx.fill();
    ctx.textAlign = "left";
    setFont(ctx, 26, 400);
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(item.label, x + 24, y + 44);
    setFont(ctx, 42, 700);
    ctx.fillStyle =
      item.direction === "up"
        ? COLOR.success
        : item.direction === "down"
          ? COLOR.danger
          : COLOR.text;
    ctx.fillText(item.text, x + 24, y + 96);
  });
  y += cellH + GAP;
  return y;
}

function drawWeeks(ctx: CanvasRenderingContext2D, data: ReportImageData, startY: number): number {
  if (!data.weeks.length) return startY;
  let y = drawSectionTitle(ctx, "Volume por semana", startY + 16);
  const chartH = 240;
  const innerW = WIDTH - PAD * 2;
  const slot = innerW / data.weeks.length;
  const barW = Math.min(72, slot * 0.6);
  const maxVolume = Math.max(...data.weeks.map((week) => week.volume), 1);
  const baseline = y + chartH;
  data.weeks.forEach((week, index) => {
    const cx = PAD + slot * index + slot / 2;
    const barH = Math.max(6, (week.volume / maxVolume) * (chartH - 40));
    ctx.fillStyle = COLOR.primary;
    roundRect(ctx, cx - barW / 2, baseline - barH, barW, barH, 10);
    ctx.fill();
    ctx.textAlign = "center";
    setFont(ctx, 22, 600);
    ctx.fillStyle = COLOR.text;
    ctx.fillText(Math.round(week.volume).toLocaleString("pt-BR"), cx, baseline - barH - 10);
    setFont(ctx, 22, 400);
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(week.label, cx, baseline + 34);
  });
  ctx.textAlign = "left";
  y = baseline + 34 + GAP;
  return y;
}

function drawTopWorkouts(
  ctx: CanvasRenderingContext2D,
  data: ReportImageData,
  startY: number,
): number {
  if (!data.topWorkouts.length) return startY;
  let y = drawSectionTitle(ctx, "Treinos de maior volume", startY + 16);
  const rowH = 108;
  for (const workout of data.topWorkouts) {
    ctx.fillStyle = COLOR.card;
    roundRect(ctx, PAD, y, WIDTH - PAD * 2, rowH, 24);
    ctx.fill();
    ctx.textAlign = "right";
    setFont(ctx, 32, 700);
    ctx.fillStyle = COLOR.text;
    const volumeWidth = ctx.measureText(workout.volume).width;
    ctx.fillText(workout.volume, WIDTH - PAD - 28, y + 62);
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR.text;
    setFont(ctx, 32, 600);
    ctx.fillText(
      fitText(ctx, workout.name, WIDTH - PAD * 2 - 28 * 3 - volumeWidth),
      PAD + 28,
      y + 50,
    );
    setFont(ctx, 24, 400);
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(workout.detail, PAD + 28, y + 86);
    y += rowH + 16;
  }
  return y + 8;
}

/** Desenha o relatório e devolve a altura usada. Usado em duas passadas (medir e desenhar). */
function drawReport(ctx: CanvasRenderingContext2D, data: ReportImageData): number {
  ctx.fillStyle = COLOR.background;
  ctx.fillRect(0, 0, WIDTH, ctx.canvas.height);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, 28, 700);
  ctx.fillStyle = COLOR.primary;
  ctx.fillText("TORVGYM", PAD, PAD + 28);
  setFont(ctx, 60, 700);
  ctx.fillStyle = COLOR.text;
  ctx.fillText(data.title, PAD, PAD + 106);
  setFont(ctx, 28, 400);
  ctx.fillStyle = COLOR.muted;
  ctx.fillText(`${data.periodLabel} · gerado em ${data.generatedAt}`, PAD, PAD + 154);

  let y = PAD + 154 + 48;
  y = drawMetrics(ctx, data, y);
  y = drawComparisons(ctx, data, y);
  y = drawWeeks(ctx, data, y);
  y = drawTopWorkouts(ctx, data, y);

  setFont(ctx, 24, 400);
  ctx.fillStyle = COLOR.muted;
  ctx.textAlign = "center";
  ctx.fillText("Gerado pelo TorvGym", WIDTH / 2, y + 40);
  ctx.textAlign = "left";
  return y + 40 + PAD;
}

/** Gera o PNG do resumo. Não usa bibliotecas externas. */
export async function renderReportImage(data: ReportImageData): Promise<Blob> {
  const measure = document.createElement("canvas");
  measure.width = WIDTH;
  measure.height = 1;
  const measureCtx = measure.getContext("2d");
  if (!measureCtx) throw new Error("Canvas indisponível neste aparelho.");
  const height = Math.ceil(drawReport(measureCtx, data));

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste aparelho.");
  drawReport(ctx, data);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível gerar a imagem."))),
      "image/png",
    );
  });
}

/** Compartilha a imagem (quando o aparelho permite) ou baixa o arquivo. */
export async function shareOrDownloadImage(
  blob: Blob,
  filename: string,
  title: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Qualquer outra falha cai no download normal abaixo.
    }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
