const FORMAT = "torvgym-protected-backup";
const VERSION = 1;
const ITERATIONS = 300000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type ProtectedBackupEnvelope = {
  format: typeof FORMAT;
  version: typeof VERSION;
  createdAt: string;
  salt: string;
  iv: string;
  ciphertext: string;
  algorithm: "AES-256-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: typeof ITERATIONS;
};

export async function createProtectedBackup(rawBackup: string, password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("A senha do backup protegido deve ter pelo menos 12 caracteres.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const createdAt = new Date().toISOString();
  const key = await deriveKey(password, salt);
  const aad = enc.encode(`${FORMAT}|${VERSION}|${createdAt}`);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource, additionalData: aad },
    key,
    enc.encode(rawBackup),
  );

  const envelope: ProtectedBackupEnvelope = {
    format: FORMAT,
    version: VERSION,
    createdAt,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptProtectedBackup(raw: string, password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("A senha do backup protegido deve ter pelo menos 12 caracteres.");
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Backup protegido inválido.");

  const envelope = parsed as Partial<ProtectedBackupEnvelope>;
  if (
    envelope.format !== FORMAT ||
    envelope.version !== VERSION ||
    envelope.algorithm !== "AES-256-GCM" ||
    envelope.kdf !== "PBKDF2-SHA256" ||
    envelope.iterations !== ITERATIONS ||
    typeof envelope.createdAt !== "string" ||
    typeof envelope.salt !== "string" ||
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new Error("Backup protegido incompatível.");
  }

  const key = await deriveKey(password, base64ToBytes(envelope.salt));
  const aad = enc.encode(`${FORMAT}|${VERSION}|${envelope.createdAt}`);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(envelope.iv) as unknown as BufferSource,
      additionalData: aad,
    },
    key,
    base64ToBytes(envelope.ciphertext),
  );

  return dec.decode(plaintext);
}
