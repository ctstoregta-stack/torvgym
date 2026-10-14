import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { keepScreenAwake } from "../src/lib/screen-wake-lock.ts";

type Listener = () => void;

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

function setup(options: { visible?: boolean; supported?: boolean } = {}) {
  const { visible = true, supported = true } = options;
  const documentListeners = new Map<string, Set<Listener>>();
  const doc = {
    visibilityState: visible ? "visible" : "hidden",
    addEventListener(type: string, listener: Listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, new Set());
      documentListeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: Listener) {
      documentListeners.get(type)?.delete(listener);
    },
  };
  const locks: {
    released: boolean;
    emitRelease: () => void;
  }[] = [];
  const nav = supported
    ? {
        wakeLock: {
          request: async () => {
            const releaseListeners = new Set<Listener>();
            const lock = {
              released: false,
              addEventListener: (_: string, listener: Listener) => releaseListeners.add(listener),
              release: async () => {
                lock.released = true;
              },
              emitRelease: () => {
                lock.released = true;
                releaseListeners.forEach((listener) => listener());
              },
            };
            locks.push(lock);
            return lock;
          },
        },
      }
    : {};
  setGlobal("document", doc);
  setGlobal("navigator", nav);
  return {
    doc,
    locks,
    fire(type: string) {
      documentListeners.get(type)?.forEach((listener) => listener());
    },
    listenerCount: () => documentListeners.get("visibilitychange")?.size ?? 0,
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "navigator");
});

test("sem suporte à Wake Lock, não faz nada e não lança erro", () => {
  setup({ supported: false });
  const release = keepScreenAwake();
  assert.equal(typeof release, "function");
  release();
});

test("pede o bloqueio de tela quando a página está visível e libera ao parar", async () => {
  const env = setup();
  const release = keepScreenAwake();
  await tick();
  assert.equal(env.locks.length, 1);
  assert.equal(env.locks[0]?.released, false);
  release();
  await tick();
  assert.equal(env.locks[0]?.released, true);
  assert.equal(env.listenerCount(), 0);
});

test("não pede o bloqueio enquanto a página está oculta", async () => {
  const env = setup({ visible: false });
  keepScreenAwake();
  await tick();
  assert.equal(env.locks.length, 0);
});

test("pede de novo ao voltar a ficar visível depois de o sistema liberar", async () => {
  const env = setup();
  keepScreenAwake();
  await tick();
  env.locks[0]?.emitRelease();
  env.doc.visibilityState = "visible";
  env.fire("visibilitychange");
  await tick();
  assert.equal(env.locks.length, 2);
  assert.equal(env.locks[1]?.released, false);
});

test("depois de parar, não pede mais o bloqueio ao voltar a ficar visível", async () => {
  const env = setup();
  const release = keepScreenAwake();
  await tick();
  release();
  await tick();
  env.fire("visibilitychange");
  await tick();
  assert.equal(env.locks.length, 1);
});
