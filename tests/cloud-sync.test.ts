import { test } from "node:test";
import assert from "node:assert/strict";
import { createEncryptedRecoveryPackage, createEncryptedSyncPackage, decryptEncryptedRecoveryPackage, decryptEncryptedSyncPackage, generateRecoveryCode, syncPackageMetadata } from "../src/lib/cloud-sync.ts";

test("identifica pacote de sincronização compatível", () => {
  const raw = JSON.stringify({format:"torvgym-sync",version:1,deviceId:"device-1",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-02T00:00:00.000Z"});
  assert.deepEqual(syncPackageMetadata(raw), {
    deviceId:"device-1",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-02T00:00:00.000Z",
  });
});
test("rejeita versão de sincronização incompatível", () => {
  assert.equal(syncPackageMetadata(JSON.stringify({format:"other",version:1})), null);
});


test("metadados E2EE exigem algoritmo, KDF e iterações corretos", () => {
  const valid = JSON.stringify({
    format:"torvgym-sync", version:2, deviceId:"device-1",
    createdAt:"2026-10-01T00:00:00.000Z", updatedAt:"2026-10-02T00:00:00.000Z",
    algorithm:"AES-256-GCM", kdf:"PBKDF2-SHA256", iterations:300000,
  });
  assert.deepEqual(syncPackageMetadata(valid), {
    deviceId:"device-1",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-02T00:00:00.000Z",
  });
  const tampered = JSON.stringify({...JSON.parse(valid), iterations:150000});
  assert.equal(syncPackageMetadata(tampered), null);
});


test("criptografa e descriptografa um estado E2EE e detecta adulteração", async () => {
  const state = {
    routines: [], activeRoutineId: null, customExercises: [],
    sessions: [], activeSession: null,
  };
  const raw = await createEncryptedSyncPackage(state, "uma-senha-e2ee-segura");
  const parsed = JSON.parse(raw);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.algorithm, "AES-256-GCM");
  assert.equal(parsed.kdf, "PBKDF2-SHA256");
  assert.equal(parsed.iterations, 300000);
  const restored = await decryptEncryptedSyncPackage(raw, "uma-senha-e2ee-segura");
  assert.deepEqual(restored.state, state);

  parsed.ciphertext = parsed.ciphertext.slice(0, -2) + "AA";
  await assert.rejects(() => decryptEncryptedSyncPackage(JSON.stringify(parsed), "uma-senha-e2ee-segura"));
});

test("recusa senha E2EE curta", async () => {
  const state = { routines: [], activeRoutineId: null, customExercises: [], sessions: [], activeSession: null };
  await assert.rejects(() => createEncryptedSyncPackage(state, "12345678"));
});


test("código de recuperação tem alta entropia e formato estável", () => {
  const code = generateRecoveryCode();
  assert.match(code, /^(?:[0-9a-f]{4}-){11}[0-9a-f]{4}$/i);
  assert.equal(code.replaceAll("-", "").length, 48);
});

test("pacote de recuperação restaura dados em outro dispositivo e detecta adulteração", async () => {
  const state = {
    routines: [{ id: "r1", name: "Rotina", createdAt: "2026-10-04T00:00:00.000Z", workouts: [] }],
    activeRoutineId: "r1",
    customExercises: [],
    sessions: [],
    activeSession: null,
  };
  const recovery = await createEncryptedRecoveryPackage(state);
  const parsed = JSON.parse(recovery.raw);
  assert.equal(parsed.format, "torvgym-recovery");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.algorithm, "AES-256-GCM");
  assert.equal(parsed.kdf, "PBKDF2-SHA256");
  assert.equal(parsed.iterations, 300000);

  const restored = await decryptEncryptedRecoveryPackage(recovery.raw, recovery.code);
  assert.deepEqual(restored.state, state);

  await assert.rejects(() => decryptEncryptedRecoveryPackage(recovery.raw, "0000-0000-0000-0000-0000-0000-0000-0000-0000-0000-0000-0000"));
  parsed.createdAt = "2026-10-05T00:00:00.000Z";
  await assert.rejects(() => decryptEncryptedRecoveryPackage(JSON.stringify(parsed), recovery.code));
});

test("código de recuperação inválido é rejeitado antes da descriptografia", async () => {
  await assert.rejects(() => decryptEncryptedRecoveryPackage("{}", "curto"));
});
