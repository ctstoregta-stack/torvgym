import { test } from "node:test";
import assert from "node:assert/strict";
import { syncPackageMetadata } from "../src/lib/cloud-sync.ts";

test("identifica pacote de sincronização compatível", () => {
  const raw = JSON.stringify({format:"torvgym-sync",version:1,deviceId:"device-1",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-02T00:00:00.000Z"});
  assert.deepEqual(syncPackageMetadata(raw), {
    deviceId:"device-1",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-02T00:00:00.000Z",
  });
});
test("rejeita versão de sincronização incompatível", () => {
  assert.equal(syncPackageMetadata(JSON.stringify({format:"other",version:1})), null);
});
