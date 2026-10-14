import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REST_ALERT,
  loadRestAlertPrefs,
  playRestAlert,
  saveRestAlertPrefs,
} from "../src/lib/rest-alert.ts";

const KEY = "torvgym.rest-alert.v1";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

let storage: MemoryStorage;
let vibrations: unknown[];

beforeEach(() => {
  storage = new MemoryStorage();
  vibrations = [];
  setGlobal("window", { localStorage: storage });
  setGlobal("navigator", {
    vibrate: (pattern: unknown) => {
      vibrations.push(pattern);
      return true;
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "navigator");
});

test("sem preferências salvas, usa o padrão (vibrar ligado, som desligado)", () => {
  assert.deepEqual(loadRestAlertPrefs(), DEFAULT_REST_ALERT);
  assert.equal(DEFAULT_REST_ALERT.vibrate, true);
  assert.equal(DEFAULT_REST_ALERT.sound, false);
});

test("salva e recarrega as preferências", () => {
  saveRestAlertPrefs({ vibrate: false, sound: true });
  assert.deepEqual(loadRestAlertPrefs(), { vibrate: false, sound: true });
});

test("JSON inválido ou campos com tipo errado voltam ao padrão", () => {
  storage.setItem(KEY, "{quebrado");
  assert.deepEqual(loadRestAlertPrefs(), DEFAULT_REST_ALERT);
  storage.setItem(KEY, JSON.stringify({ vibrate: "sim", sound: 1 }));
  assert.deepEqual(loadRestAlertPrefs(), DEFAULT_REST_ALERT);
});

test("playRestAlert vibra quando a vibração está ativa", () => {
  const result = playRestAlert({ vibrate: true, sound: false });
  assert.equal(vibrations.length, 1);
  assert.equal(result.vibrated, true);
  assert.equal(result.sounded, false);
});

test("playRestAlert não vibra quando a vibração está desligada", () => {
  const result = playRestAlert({ vibrate: false, sound: false });
  assert.equal(vibrations.length, 0);
  assert.equal(result.vibrated, false);
});

test("pedir som sem suporte a áudio não lança erro", () => {
  const result = playRestAlert({ vibrate: false, sound: true });
  assert.equal(result.sounded, false);
});
