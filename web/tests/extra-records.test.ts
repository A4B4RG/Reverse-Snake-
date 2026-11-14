import test from "node:test";
import assert from "node:assert/strict";
import { recordExtra, readExtraRecords } from "../src/lib/extra-records";
import {
  createRun,
  Recorder,
  readReplays,
  saveReplay,
  type RunMeta,
} from "../src/lib/replay";
import {
  CHALLENGES,
  challengeStep,
  createChallenge,
} from "../src/lib/challenge";
import { createHunter, hunterStep } from "../src/lib/hunter";

test("new mode storage is bounded, tolerates corruption/quota and preserves mango saves", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>([
    ["reverse-snake:v1", '{"best":1234}'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  try {
    const meta: RunMeta = {
      mode: "hunter",
      arena: 0,
      difficulty: "normal",
      seed: 1,
    };
    const state = { ...createRun(meta), phase: "lost" as const };
    assert.equal(recordExtra(createRun(meta), meta), false);
    for (let i = 0; i < 40; i++) assert.ok(recordExtra(state, meta));
    assert.equal(readExtraRecords().length, 30);
    assert.equal(values.get("reverse-snake:v1"), '{"best":1234}');
    values.set("reverse-snake:extra-records:v1", "{");
    assert.deepEqual(readExtraRecords(), []);
    values.set("reverse-snake:replays:v1", '[{"version":"old"}]');
    assert.deepEqual(readReplays(), []);
    const replay = new Recorder(meta).finish(state)!;
    storage.setItem = () => {
      throw new Error("Quota exceeded");
    };
    assert.equal(recordExtra(state, meta), false);
    assert.equal(saveReplay(replay), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
test("Challenge target resolves after the exact active step and capture takes priority", () => {
  const c = CHALLENGES[0];
  const state = {
    ...createChallenge(c),
    phase: "running" as const,
    elapsed: c.target - 20,
  };
  assert.equal(challengeStep(state, null, c).phase, "won");
  const caught = {
    ...state,
    snake: [{ x: state.player.x, y: state.player.y - 1 }],
    snakeDirection: "down" as const,
    snakeClock: 180,
    committedMoves: 1,
  };
  assert.equal(challengeStep(caught, null, c).phase, "lost");
});
test("Hunter wins when the last free cell is collected", () => {
  const food = { x: 1, y: 0 };
  const snake = Array.from({ length: 400 }, (_, i) => ({
    x: i % 20,
    y: Math.floor(i / 20),
  })).filter((p) => p.x !== 1 || p.y !== 0);
  const state = {
    ...createHunter(0,"normal",1,{columns:20,rows:20}),
    phase: "running" as const,
    snake,
    food,
    direction: "right" as const,
    clock: 180,
  };
  const next = hunterStep(state);
  assert.equal(next.phase, "won");
  assert.equal(next.food, null);
  assert.equal(next.snake.length, 400);
});
