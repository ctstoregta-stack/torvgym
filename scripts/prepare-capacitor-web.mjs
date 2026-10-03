import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const destination = path.join(projectRoot, ".capacitor-web");
const candidates = [
  path.join(projectRoot, ".output", "public"),
  path.join(projectRoot, "dist", "client"),
  path.join(projectRoot, "dist"),
];

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

let source;
for (const candidate of candidates) {
  if (await isDirectoryWithIndex(candidate)) {
    source = candidate;
    break;
  }
}

if (!source) {
  throw new Error(
    "Não foi encontrado um diretório de build com index.html. Execute o build do projeto antes de sincronizar o Capacitor.",
  );
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

console.log(`Assets do Capacitor preparados em ${path.relative(projectRoot, destination)} a partir de ${path.relative(projectRoot, source)}.`);
