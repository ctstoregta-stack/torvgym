import { test } from "node:test";
import assert from "node:assert/strict";
import { createProtectedBackup, decryptProtectedBackup } from "../src/lib/protected-backup.ts";

test("backup protegido faz round-trip", async () => {
  const raw = JSON.stringify({
    format: "torvgym-backup",
    version: 1,
    exportedAt: "2026-10-04T00:00:00.000Z",
    state: { routines: [], activeRoutineId: null, customExercises: [], sessions: [], activeSession: null },
  });

  const encrypted = await createProtectedBackup(raw, "uma-senha-protegida-segura");
  const parsed = JSON.parse(encrypted);

  assert.equal(parsed.format, "torvgym-protected-backup");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.algorithm, "AES-256-GCM");
  assert.equal(parsed.kdf, "PBKDF2-SHA256");
  assert.equal(parsed.iterations, 300000);
  assert.notEqual(parsed.ciphertext, raw);

  assert.equal(await decryptProtectedBackup(encrypted, "uma-senha-protegida-segura"), raw);
});

test("backup protegido detecta senha incorreta e adulteração", async () => {
  const encrypted = await createProtectedBackup("conteudo privado", "uma-senha-protegida-segura");
  await assert.rejects(() => decryptProtectedBackup(encrypted, "outra-senha-protegida"));

  const parsed = JSON.parse(encrypted);
  parsed.ciphertext = parsed.ciphertext.slice(0, -2) + "AA";
  await assert.rejects(() => decryptProtectedBackup(JSON.stringify(parsed), "uma-senha-protegida-segura"));
});

test("backup protegido rejeita senha curta", async () => {
  await assert.rejects(() => createProtectedBackup("conteudo", "123456789"));
  await assert.rejects(() => decryptProtectedBackup("{}", "123456789"));
});

test("backup protegido detecta alteração dos metadados autenticados", async () => {
  const encrypted = await createProtectedBackup("conteudo privado", "uma-senha-protegida-segura");
  const parsed = JSON.parse(encrypted);
  parsed.createdAt = "2026-10-05T00:00:00.000Z";
  await assert.rejects(() => decryptProtectedBackup(JSON.stringify(parsed), "uma-senha-protegida-segura"));
});
