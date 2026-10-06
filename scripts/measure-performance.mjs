import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createWorkoutSession } from "../src/store/gym-session.ts";

const root = process.cwd();

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const buildCandidates = [".output/public", "dist/client", "dist"];
let buildDir = null;
for (const candidate of buildCandidates) {
  const dir = path.join(root, candidate);
  if (await exists(path.join(dir, "index.html"))) {
    buildDir = dir;
    break;
  }
}

if (!buildDir) throw new Error("Build web não encontrado para medição de performance.");

const files = await walk(buildDir);
const jsFiles = files.filter((file) => file.endsWith(".js"));
const jsBytes = (await Promise.all(jsFiles.map(async (file) => (await stat(file)).size))).reduce((a, b) => a + b, 0);
const largestJs = jsFiles.length
  ? Math.max(...await Promise.all(jsFiles.map(async (file) => (await stat(file)).size)))
  : 0;

const exerciseSource = await (await import("node:fs/promises")).readFile(path.join(root, "src/data/exercises.ts"), "utf8");
const gifUrls = [...exerciseSource.matchAll(/gif_url:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const uniqueGifUrls = new Set(gifUrls);

const workout = {
  id: "perf-workout",
  name: "Performance",
  days: [1],
  exerciseIds: ["exercise-a", "exercise-b", "exercise-c"],
  targetSets: { "exercise-a": 3, "exercise-b": 3, "exercise-c": 3 },
};

const routine = {
  id: "perf-routine",
  name: "Performance",
  createdAt: new Date().toISOString(),
  workouts: [],
};

const iterations = 5000;
const started = performance.now();
for (let i = 0; i < iterations; i += 1) {
  createWorkoutSession(routine, workout, String(i), "2026-10-06T00:00:00.000Z");
}
const sessionCreateMs = performance.now() - started;

console.log("=== TorvGym performance baseline ===");
console.log(`Web JS total: ${jsBytes} bytes (${(jsBytes / 1024 / 1024).toFixed(2)} MiB)`);
console.log(`Maior chunk JS: ${largestJs} bytes (${(largestJs / 1024).toFixed(1)} KiB)`);
console.log(`Arquivos JS: ${jsFiles.length}`);
console.log(`GIFs: ${gifUrls.length} referências / ${uniqueGifUrls.size} URLs únicas`);
console.log(`createWorkoutSession: ${(sessionCreateMs / iterations).toFixed(4)} ms/op (n=${iterations})`);

const apk = path.join(root, "android/app/build/outputs/apk/debug/app-debug.apk");
if (await exists(apk)) {
  const apkBytes = (await stat(apk)).size;
  console.log(`APK debug: ${apkBytes} bytes (${(apkBytes / 1024 / 1024).toFixed(2)} MiB)`);
}
