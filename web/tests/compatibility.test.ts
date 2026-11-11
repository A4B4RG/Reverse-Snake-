import assert from "node:assert/strict";
import { test } from "node:test";
import { GameAudio } from "../src/lib/audio.ts";
import { createGame } from "../src/lib/game.ts";
import { DEFAULT_DATA, readSavedData, recordRun } from "../src/lib/storage.ts";

test("terminal records get distinct local IDs when UUID is absent or throws", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  try {
    for (const crypto of [undefined, {}, { randomUUID() { throw new Error("unavailable"); } }]) {
      Object.defineProperty(globalThis, "crypto", { configurable: true, value: crypto });
      const game = { ...createGame(1, "hard", "survival"), phase: "lost" as const, score: 123, closeCalls: 4 };
      const first = recordRun(DEFAULT_DATA, game), second = recordRun(first, game);
      assert(first.runs[0].id); assert.notEqual(first.runs[0].id, second.runs[0].id);
      assert.equal(second.attempts, 2); assert.equal(second.best, 123);
      assert.equal(second.runs[0].mode, "survival"); assert.equal(second.runs[0].closeCalls, 4);
    }
  } finally {
    if (previous) Object.defineProperty(globalThis, "crypto", previous); else Reflect.deleteProperty(globalThis, "crypto");
  }
});

test("existing v1 scores survive without newly introduced mode and close-call fields", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const legacy = { id: "legacy", arena: 0, difficulty: "normal", score: 1500, elapsed: 2600, won: true, date: "2026-11-04T00:00:00Z" };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => JSON.stringify({ ...DEFAULT_DATA, best: 1500, runs: [legacy] }) } });
  try {
    const data = readSavedData();
    assert.equal(data.best, 1500); assert.deepEqual(data.runs[0], { ...legacy, mode: "levels", closeCalls: 0 });
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous); else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("optional audio failures never throw into input or terminal handling", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Object.defineProperty(globalThis, "AudioContext", { configurable: true, value: class {
    state = "running";
    createOscillator() { throw new Error("device unavailable"); }
    close() { return Promise.resolve(); }
  } });
  try {
    const audio = new GameAudio();
    assert.doesNotThrow(() => audio.unlock());
    for (const kind of ["start", "dash", "won", "lost", "click"] as const) assert.doesNotThrow(() => audio.play(kind));
    audio.close();
  } finally {
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous); else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});
