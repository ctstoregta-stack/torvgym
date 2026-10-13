import test from "node:test";
import assert from "node:assert/strict";
import { getExerciseMediaSources } from "../src/lib/exercise-media-sources.ts";

test("tenta primeiro o proxy para GIFs do FitnessProgramer e mantém a URL original como fallback", () => {
  const original = "https://fitnessprogramer.com/wp-content/uploads/2021/05/Cable-Donkey-Kickback.gif";
  const sources = getExerciseMediaSources(original);
  assert.equal(sources.length, 3);
  assert.match(sources[0]!, /^https:\/\/wsrv\.nl\//);
  assert.equal(sources[1], original);
  assert.match(sources[2]!, /^https:\/\/images\.weserv\.nl\//);
  assert.ok(sources.every((source) => source.startsWith("https://")));
});

test("preserva a URL direta como primeira tentativa para outras fontes HTTPS", () => {
  const original = "https://example.com/exercise.gif";
  const sources = getExerciseMediaSources(original);
  assert.equal(sources[0], original);
  assert.equal(sources.length, 2);
});

test("não produz fontes para URL vazia ou insegura", () => {
  assert.deepEqual(getExerciseMediaSources(""), []);
  assert.deepEqual(getExerciseMediaSources("http://example.com/exercise.gif"), []);
});
