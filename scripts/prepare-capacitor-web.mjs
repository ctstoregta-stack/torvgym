import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const destination = path.join(projectRoot, ".capacitor-web");
const candidates = [
  path.join(projectRoot, ".output", "public"),
  path.join(projectRoot, "dist", "client"),
  path.join(projectRoot, "dist"),
];

async function runWebBuild() {
  await new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(command, ["vite", "build"], {
      cwd: projectRoot,
      env: { ...process.env, CAPACITOR_BUILD: "1" },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `O build web para o Capacitor falhou com código ${code ?? "desconhecido"}.`,
        ),
      );
    });
  });
}

async function isDirectoryWithIndex(candidate) {
  try {
    const candidateStat = await stat(candidate);
    if (!candidateStat.isDirectory()) return false;
    await stat(path.join(candidate, "index.html"));
    return true;
  } catch {
    return false;
  }
}

await runWebBuild();

let source;
for (const candidate of candidates) {
  if (await isDirectoryWithIndex(candidate)) {
    source = candidate;
    break;
  }
}

if (!source) {
  throw new Error(
    "O build do Capacitor terminou, mas não foi encontrado um diretório de build com index.html.",
  );
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

console.log(
  `Assets do Capacitor preparados em ${path.relative(projectRoot, destination)} a partir de ${path.relative(projectRoot, source)}.`,
);
