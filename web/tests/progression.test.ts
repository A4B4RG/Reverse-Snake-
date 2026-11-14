import assert from "node:assert/strict";
import test from "node:test";
import { ARENAS, createGame, step, type GameState } from "../src/lib/game";
import { DEFAULT_DATA, readSavedData, recordRun, recordProgress, saveData } from "../src/lib/storage";
import { swipeDirection } from "../src/lib/input";
import { Recorder, ReplayCursor, fingerprint, parseReplay } from "../src/lib/replay";
import { displayRun } from "../src/lib/run-display";
import * as orchard from "../src/lib/legacy/orchard3/game";
import { obstaclesFor } from "../src/lib/game";

test("level targets increase; fullscreen walls retain their occupied area", () => {
  assert.equal(ARENAS.length, 10);
  for (let i = 0; i < ARENAS.length; i++) {
    assert(ARENAS[i].scoreTarget > (ARENAS[i - 1]?.scoreTarget ?? 0));
    const small = obstaclesFor(i, { columns: 20, rows: 20 }).length / 400;
    const large = obstaclesFor(i, { columns: 80, rows: 60 }).length / 4800;
    assert(small > 0.04);
    assert(Math.abs(large - small) < 0.001);
  }
});

test("a live qualified chase unlocks the next map and preserves stars through reload", () => {
  let data = { ...DEFAULT_DATA };
  const chase: GameState = { ...createGame(), phase: "running", levelCleared: true, score: ARENAS[0].scoreTarget };
  assert.equal(recordProgress(data, { ...chase, levelCleared: false }).unlocked, 0);
  assert.equal(recordProgress(data, { ...chase, mode: "survival" }).unlocked, 0);
  data = recordProgress(data, chase);
  assert.equal(data.unlocked, 1);
  assert.equal(recordProgress(data, chase), data);
  data = recordProgress(data, { ...chase, score: chase.score + 300 });
  assert.equal(data.stars[0], 2);
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let raw = "";
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => raw, setItem: (_k: string, v: string) => { raw = v; } } });
  try { assert(saveData(data)); assert.equal(readSavedData().unlocked, 1); assert.equal(readSavedData().stars[0], 2); }
  finally { if (old) Object.defineProperty(globalThis, "localStorage", old); else Reflect.deleteProperty(globalThis, "localStorage"); }
  assert.equal(recordRun(data, { ...chase, phase: "lost" }).unlocked, 1);
});

test("blocked or idle movement earns no Levels score; capture beats a target", () => {
  const base: GameState = { ...createGame(), phase: "running", snakeClock: -100000, playerClock: 80, player: { x: 0, y: 0 } };
  assert.equal(step(base, "left").score, 0);
  assert.equal(step(base, null).score, 0);
  const caught = step({ ...base, score: ARENAS[0].scoreTarget - 1, difficulty: "easy", snake: [{ x: 1, y: 0 }] }, "right");
  assert.equal(caught.phase, "lost");
});

test("swipes ignore taps and ambiguous diagonals but recognize all four directions", () => {
  assert.equal(swipeDirection(10, 0), null); assert.equal(swipeDirection(40, 40), null);
  assert.equal(swipeDirection(-40, 5), "left"); assert.equal(swipeDirection(40, -5), "right");
  assert.equal(swipeDirection(5, -40), "up"); assert.equal(swipeDirection(-5, 40), "down");
});

test("orchard-3 recordings keep the previous terrain, movement and fingerprints", () => {
  const meta = { arena: 0, mode: "levels" as const, difficulty: "normal" as const, seed: 0, board: { columns: 30, rows: 24 } };
  let state: orchard.GameState = { ...orchard.createGame(0, "normal", "levels", meta.board), phase: "running" };
  const recorder = new Recorder(meta);
  for (let i = 0; i < 2000 && state.phase === "running"; i++) { recorder.add({ action: "step", direction: null, count: 1 }); state = orchard.step(state, null); }
  const replay = parseReplay({ ...recorder.finish(state)!, version: "1.2.0", ruleset: "orchard-3" });
  assert(replay);
  const cursor = new ReplayCursor(replay);
  while (!cursor.done) cursor.advance();
  assert(cursor.valid); assert.equal(fingerprint(cursor.state), fingerprint(state));
  assert.deepEqual(displayRun(cursor.state, replay.ruleset).displayObstacles, []);
});
