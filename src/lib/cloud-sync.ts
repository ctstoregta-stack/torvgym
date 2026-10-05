import type { AppState } from "./types";

const FORMAT = "torvgym-sync";
const VERSION = 2;
const ITERATIONS = 300000;
const LEGACY_VERSION = 1;
const LEGACY_ITERATIONS = 150000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
async function deriveKeyWithIterations(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt: salt as unknown as BufferSource, iterations, hash:"SHA-256" },
    material,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"],
  );
}

export type SyncEnvelope = {
  format: typeof FORMAT;
  version: typeof VERSION | typeof LEGACY_VERSION;
  createdAt: string;
  updatedAt: string;
  deviceId: string;
  salt: string;
  iv: string;
  ciphertext: string;
  algorithm: "AES-256-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: number;
};

export function getSyncDeviceId() {
  const key = "torvgym.sync.device-id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function createEncryptedSyncPackage(state: AppState, password: string): Promise<string> {
  if (password.length < 12) throw new Error("A senha de sincronização deve ter pelo menos 12 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyWithIterations(password, salt, ITERATIONS);
  const now = new Date().toISOString();
  const aadText = `${FORMAT}|${VERSION}|${now}|${now}|${getSyncDeviceId()}`;
  const aad = enc.encode(aadText);
  const plaintext = enc.encode(JSON.stringify({ state, updatedAt: now }));
  const ciphertext = await crypto.subtle.encrypt({ name:"AES-GCM", iv, additionalData: aad }, key, plaintext);
  const envelope: SyncEnvelope = {
    format: FORMAT,
    version: VERSION,
    createdAt: now,
    updatedAt: now,
    deviceId: getSyncDeviceId(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
  };
  return JSON.stringify(envelope, null, 2);
}

export async function decryptEncryptedSyncPackage(raw: string, password: string): Promise<{ state: AppState; updatedAt: string }> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Pacote de sincronização inválido.");
  const envelope = parsed as Partial<SyncEnvelope>;
  const legacy = envelope.version === LEGACY_VERSION;
  const current = envelope.version === VERSION && envelope.algorithm === "AES-256-GCM" && envelope.kdf === "PBKDF2-SHA256" && envelope.iterations === ITERATIONS;
  if (envelope.format !== FORMAT || (!legacy && !current) || !envelope.salt || !envelope.iv || !envelope.ciphertext || !envelope.deviceId || !envelope.createdAt || !envelope.updatedAt) {
    throw new Error("Pacote de sincronização incompatível.");
  }
  const iterations = envelope.version === LEGACY_VERSION ? LEGACY_ITERATIONS : ITERATIONS;
  const key = await deriveKeyWithIterations(password, base64ToBytes(envelope.salt), iterations);
  const aadText = `${FORMAT}|${VERSION}|${envelope.createdAt}|${envelope.updatedAt}|${envelope.deviceId}`;
  const aad = enc.encode(aadText);
  const decryptParams = envelope.version === LEGACY_VERSION
    ? { name:"AES-GCM" as const, iv:base64ToBytes(envelope.iv) as unknown as BufferSource }
    : { name:"AES-GCM" as const, iv:base64ToBytes(envelope.iv) as unknown as BufferSource, additionalData: aad };
  const plaintext = await crypto.subtle.decrypt(decryptParams, key, base64ToBytes(envelope.ciphertext));
  const payload: unknown = JSON.parse(dec.decode(plaintext));
  if (!payload || typeof payload !== "object" || !("state" in payload) || typeof (payload as { updatedAt?: unknown }).updatedAt !== "string") {
    throw new Error("Conteúdo de sincronização inválido.");
  }
  const data = payload as { state?: AppState; updatedAt?: string };
  if (!data.state || typeof data.updatedAt !== "string") throw new Error("Conteúdo de sincronização inválido.");
  return { state: data.state, updatedAt: data.updatedAt };
}

export function syncPackageMetadata(raw: string) {
  const parsed = JSON.parse(raw) as Partial<SyncEnvelope>;
  if (parsed.format !== FORMAT || (parsed.version !== VERSION && parsed.version !== LEGACY_VERSION)) return null;
  if (parsed.version === LEGACY_VERSION) return {
    deviceId: parsed.deviceId ?? "", createdAt: parsed.createdAt ?? "", updatedAt: parsed.updatedAt ?? "",
  };
  if (parsed.algorithm !== "AES-256-GCM" || parsed.kdf !== "PBKDF2-SHA256" || parsed.iterations !== ITERATIONS) return null;
  return { deviceId: parsed.deviceId ?? "", createdAt: parsed.createdAt ?? "", updatedAt: parsed.updatedAt ?? "" };
}
