import type { AppState } from "./types";

const FORMAT = "torvgym-sync";
const VERSION = 1;
const ITERATIONS = 150000;
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
async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations:ITERATIONS, hash:"SHA-256" },
    material,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"],
  );
}

export type SyncEnvelope = {
  format: typeof FORMAT;
  version: typeof VERSION;
  createdAt: string;
  updatedAt: string;
  deviceId: string;
  salt: string;
  iv: string;
  ciphertext: string;
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
  if (password.length < 8) throw new Error("A senha de sincronização deve ter pelo menos 8 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const now = new Date().toISOString();
  const plaintext = enc.encode(JSON.stringify({ state, updatedAt: now }));
  const ciphertext = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, plaintext);
  const envelope: SyncEnvelope = {
    format: FORMAT,
    version: VERSION,
    createdAt: now,
    updatedAt: now,
    deviceId: getSyncDeviceId(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(envelope, null, 2);
}

export async function decryptEncryptedSyncPackage(raw: string, password: string): Promise<{ state: AppState; updatedAt: string }> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Pacote de sincronização inválido.");
  const envelope = parsed as Partial<SyncEnvelope>;
  if (envelope.format !== FORMAT || envelope.version !== VERSION || !envelope.salt || !envelope.iv || !envelope.ciphertext) {
    throw new Error("Pacote de sincronização incompatível.");
  }
  const key = await deriveKey(password, base64ToBytes(envelope.salt));
  const plaintext = await crypto.subtle.decrypt({ name:"AES-GCM", iv:base64ToBytes(envelope.iv) }, key, base64ToBytes(envelope.ciphertext));
  const payload: unknown = JSON.parse(dec.decode(plaintext));
  if (!payload || typeof payload !== "object" || !("state" in payload) || typeof (payload as { updatedAt?: unknown }).updatedAt !== "string") {
    throw new Error("Conteúdo de sincronização inválido.");
  }
  return { state: (payload as { state: AppState }).state, updatedAt: (payload as { updatedAt: string }).updatedAt };
}

export function syncPackageMetadata(raw: string) {
  const parsed = JSON.parse(raw) as Partial<SyncEnvelope>;
  if (parsed.format !== FORMAT || parsed.version !== VERSION) return null;
  return { deviceId: parsed.deviceId ?? "", createdAt: parsed.createdAt ?? "", updatedAt: parsed.updatedAt ?? "" };
}
