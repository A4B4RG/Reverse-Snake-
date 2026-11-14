import test from "node:test";
import assert from "node:assert/strict";
import { ARENAS, createGame, endChase, step, type GameState } from "../src/lib/game";
import { createHunter, hunterStep, evadeFruit, resizeHunter, type HunterState } from "../src/lib/hunter";
import { starsFor, emptyProgress, earnProgress, parseProgress } from "../src/lib/level-progress";
import { applyCommand, createRun, type RunState, Recorder, ReplayCursor, parseReplay } from "../src/lib/replay";
import * as old from "../src/lib/legacy/orchard4/game";

test("stars are cumulative at +100, +300 and strictly above +700", () => {
  const target = 150;
  for (const [extra, stars] of [[0, 0], [99, 0], [100, 1], [299, 1], [300, 2], [700, 2], [701, 3], [1000, 3]]) {
    assert.equal(starsFor(target + extra, target), stars);
  }
  const earned = earnProgress(emptyProgress(), 0, 851, target, true);
  assert.equal(earned.unlocked, 1); assert.equal(earned.stars[0], 3);
  assert.equal(earnProgress(earned, 0, target, target, true), earned);
  assert.deepEqual(parseProgress({ unlocked: 9, stars: [99, -1, 2] }).stars.slice(0, 3), [0, 0, 2]);
});

test("Levels keeps scoring and chasing after unlock; a player can end it explicitly", () => {
  let s: GameState = { ...createGame(), phase: "running", score: ARENAS[0].scoreTarget - 1, difficulty: "easy", playerClock: 80, player: { x: 1, y: 1 }, snakeClock: -100000 };
  s = step(s, "right");
  assert.equal(s.phase, "running"); assert(s.levelCleared);
  for (let i = 0; i < 5; i++) s = step(s, "right");
  assert(s.score > ARENAS[0].scoreTarget);
  assert.equal(endChase(s).phase, "won");
  assert.equal(endChase({ ...s, levelCleared: false }).phase, "lost");
  const caught = step({ ...s, levelCleared: false, score: 149, playerClock: 80, snake: [{ x: s.player.x + 1, y: s.player.y }] }, "right");
  assert.equal(caught.phase, "lost"); assert.equal(caught.levelCleared, false);
});

test("actual base movement follows the requested Food and Hunter speed ratios", () => {
  for (const difficulty of ["easy", "normal", "hard"] as const) {
    let food: GameState = { ...createGame(0, difficulty, "levels", { columns: 96, rows: 96 }), phase: "running", player: { x: 1, y: 1 }, snake: [{ x: 90, y: 90 }], snakeDirection: "left" };
    let h: HunterState = { ...createHunter(0, difficulty, 1, { columns: 96, rows: 96 }), phase: "running", snake: [{ x: 1, y: 1 }], food: { x: 90, y: 30 }, powerUps: [] };
    let fMoves = 0, aiMoves = 0, hMoves = 0, preyMoves = 0;
    for (let i = 0; i < 100; i++) {
      const fNext = step(food, "right"), hNext = hunterStep(h);
      fMoves += Number(fNext.player !== food.player); aiMoves += Number(fNext.snake !== food.snake);
      hMoves += Number(hNext.snake !== h.snake); preyMoves += Number(hNext.food !== h.food);
      food = fNext; h = hNext;
    }
    assert.equal(food.phase, "running"); assert.equal(h.phase, "running");
    assert.equal(fMoves, difficulty === "hard" ? 16 : 20);
    assert.equal(aiMoves, { easy: 10, normal: 20, hard: 25 }[difficulty]);
    assert.equal(hMoves, { easy: 10, normal: 20, hard: 25 }[difficulty]);
    assert.equal(preyMoves, { easy: 5, normal: 15, hard: 25 }[difficulty]);
  }
});

test("Hunter power-ups are collected, pause safely, expire, and survive resizing", () => {
  const start: HunterState = { ...createHunter(), phase: "running", snake: [{ x: 1, y: 1 }], food: { x: 20, y: 12 }, clock: 80, powerUps: [{ kind: "speed", position: { x: 2, y: 1 } }] };
  let s = hunterStep(start);
  assert.equal(s.speedRemaining, 10000); assert.equal(s.powerUps.length, 0);
  const before = s.snake[0];
  s = hunterStep(hunterStep(s)); assert.deepEqual(s.snake[0], before);
  s = hunterStep(s); assert.equal(s.snake[0].x, before.x + 1);
  s = hunterStep({ ...s, clock: 40, powerUps: [{ kind: "stun", position: { x: s.snake[0].x + 1, y: 1 } }] });
  assert.equal(s.stunRemaining, 5000);
  assert.deepEqual(evadeFruit({ ...s, fruitClock: 10000 }).food, s.food);
  const paused = { ...s, phase: "paused" as const };
  assert.equal(hunterStep(paused), paused);
  const resized = resizeHunter(s, { columns: 40, rows: 30 });
  assert.equal(resized.speedRemaining, s.speedRemaining); assert.equal(resized.stunRemaining, 5000);
  const ended = hunterStep({ ...s, speedRemaining: 20, stunRemaining: 20, clock: -100000 });
  assert.equal(ended.speedRemaining, 0); assert.equal(ended.stunRemaining, 0);
});

test("Hunter Levels unlocks without ending; Survival does not qualify a level", () => {
  const base: HunterState = { ...createHunter(), phase: "running", clock: 80, food: { x: 8, y: 2 }, snake: [{ x: 7, y: 2 }], powerUps: [] };
  const s = hunterStep(base);
  assert(s.levelCleared); assert.equal(s.phase, "running"); assert.equal(s.score, 150);
  assert.equal(hunterStep({ ...base, mode: "survival" }).levelCleared, false);
});

test("voluntary chase endings and Hunter powers replay with exact final state", () => {
  for (const mode of ["levels", "hunter"] as const) {
    const meta = { mode, hunterMode: mode === "hunter" ? "levels" as const : undefined, arena: 0, difficulty: "normal" as const, seed: 1 };
    const recorder = new Recorder(meta);
    let s: RunState = mode === "hunter" ? { ...createHunter(), phase: "running" as const } : { ...createGame(), phase: "running" as const };
    for (let i = 0; i < 5; i++) {
      recorder.add({ action: "step", direction: "left", count: 1 });
      s = "turns" in s ? hunterStep(s) : step(s, "left");
    }
    recorder.add({ action: "finish" });
    s = applyCommand(s, { action: "finish" }, meta);
    const replay = parseReplay(recorder.finish(s)); assert(replay);
    const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance();
    assert(cursor.valid);
  }
});

test("orchard-4 recordings retain the earlier target-ending rules", () => {
  const meta = { mode: "levels" as const, arena: 0, difficulty: "normal" as const, seed: 0 };
  const recorder = new Recorder(meta);
  let s: old.GameState = { ...old.createGame(), phase: "running" };
  for (let i = 0; i < 2000 && s.phase === "running"; i++) { recorder.add({ action: "step", direction: null, count: 1 }); s = old.step(s, null); }
  const replay = parseReplay({ ...recorder.finish(s)!, version: "1.3.0", ruleset: "orchard-4" }); assert(replay);
  const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance(); assert(cursor.valid);
});

test("a real seeded Hunter pickup, pause, resize and ending replay deterministically", () => {
  let seed = 0, direction: "up" | "right" | "down" = "right";
  for (let candidate = 1; candidate < 4000 && !seed; candidate++) {
    const s = createHunter(0, "normal", candidate);
    for (const power of s.powerUps) {
      const dx = power.position.x - s.snake[0].x, dy = power.position.y - s.snake[0].y;
      if ((dx === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1)) {
        seed = candidate; direction = dx ? "right" : dy < 0 ? "up" : "down"; break;
      }
    }
  }
  assert(seed, "a deterministic seed has an adjacent collectible");
  const meta = { mode: "hunter" as const, hunterMode: "levels" as const, arena: 0, difficulty: "normal" as const, seed };
  let s = createRun(meta);
  const recorder = new Recorder(meta);
  const commands = [{ action: "steer", direction }, { action: "step", direction: null, count: 5 }, { action: "pause" }, { action: "step", direction: null, count: 20 }, { action: "resume" }, { action: "resize", board: { columns: 40, rows: 30 } }] as const;
  for (const c of commands) { recorder.add(c); for (let i = 0; i < (c.action === "step" ? c.count : 1); i++) s = applyCommand(s, c, meta); }
  assert("turns" in s && (s.speedRemaining === 10000 || s.stunRemaining === 5000));
  recorder.add({ action: "finish" }); s = applyCommand(s, { action: "finish" }, meta);
  const replay = parseReplay(recorder.finish(s)); assert(replay);
  const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance(); assert(cursor.valid);
});
