import assert from "node:assert/strict";
import test from "node:test";
import { allSnakes, createGame, equal, inside, movePack, obstaclesFor, resizeGame, SNAKE_STUN_DURATION, SPLIT_AFTER, step, type Direction, type GameState, type RivalSnake } from "../src/lib/game";
import { createHunter, hunterStep, resizeHunter, type HunterState } from "../src/lib/hunter";
import { connectedFloor, relocateWalls } from "../src/lib/moving-walls";
import { applyCommand, createRun, fingerprint, isHunter, parseReplay, Recorder, ReplayCursor, type Command, type RunMeta } from "../src/lib/replay";
import { DEFAULT_DATA, readSavedData, recordProgress } from "../src/lib/storage";
import * as orchard5 from "../src/lib/legacy/orchard5/game";

const line = (x: number, y: number, n: number, dx = -1) => Array.from({ length: n }, (_, i) => ({ x: x + dx * i, y }));
const rival = (body = line(5, 0, 4, 1)): RivalSnake => ({ body, direction: "left", clock: 100, stun: 0, committedMoves: 1, lunges: 0, pendingGrowth: 0 });
const running = (mode: "levels" | "survival" = "survival"): GameState => ({ ...createGame(0, "normal", mode), phase: "running", player: { x: 0, y: 10 } });
function legalPack(s: GameState) {
  const points = allSnakes(s), keys = points.map(p => `${p.x},${p.y}`);
  assert.equal(new Set(keys).size, keys.length, "snake bodies must never overlap");
  const walls = obstaclesFor(s.arena, s.board);
  for (const body of [s.snake, ...(s.rival ? [s.rival.body] : [])]) {
    for (const [i, p] of body.entries()) {
      assert(inside(p, s.board)); assert(!walls.some(q => equal(p, q)));
      if (i) assert.equal(Math.abs(p.x - body[i - 1].x) + Math.abs(p.y - body[i - 1].y), 1);
    }
  }
}

test("Food collisions retain the head, shorten only the tail, freeze and reverse after the stun", () => {
  for (const mode of ["levels", "survival"] as const) {
    const initial = { ...running(mode), snake: line(27, 0, 6), snakeDirection: "right" as const, committedMoves: 1, snakeClock: 100 };
    let s = movePack(initial);
    assert.equal(s.phase, "running"); assert.equal(s.snakeStun, SNAKE_STUN_DURATION);
    assert.deepEqual(s.snake, initial.snake.slice(0, -2));
    const stopped = s.snake;
    for (let i = 0; i < SNAKE_STUN_DURATION / 20 - 1; i++) { s = step(s, null); assert.deepEqual(s.snake, stopped); }
    s = step(s, null);
    assert.equal(s.snakeStun, 0); assert.deepEqual(s.snake, [...stopped].reverse());
    assert.equal(s.snakeDirection, "left");
    for (let i = 0; i < 5; i++) s = step(s, null);
    assert(!equal(s.snake[0], stopped.at(-1)!)); assert.equal(s.phase, "running");
  }
});

test("growth comes from active time; close misses trim one cell, not score milestones", () => {
  for (const difficulty of ["easy", "normal", "hard"] as const) {
    const duration = difficulty === "easy" ? 20000 : 10000;
    let s: GameState = { ...running(), difficulty, snake: line(5, 0, 5), snakeDirection: "right", snakeClock: -100000, growthClock: duration - 20 };
    s = step(s, null); assert.equal(s.pendingGrowth, 1); assert.equal(s.snake.length, 5);
    s = step({ ...s, snakeClock: 200, committedMoves: 1 }, null);
    assert.equal(s.snake.length, 6); assert.equal(s.pendingGrowth, 0);
    assert.equal(step({ ...s, phase: "paused" }, null).growthClock, s.growthClock);
  }
  const base = { ...running("levels"), score: 1000, snakeClock: -100000, snake: line(5, 0, 6, 1), player: { x: 4, y: 0 }, playerClock: 80 };
  const missed = step(base, "left");
  assert.equal(missed.snake.length, 5); assert.equal(missed.closeCalls, 1);
  const scored = step({ ...base, player: { x: 0, y: 10 } }, "right");
  assert.equal(scored.snake.length, 6);
});

test("both Food modes split one continuous body into two disjoint legal bodies", () => {
  for (const mode of ["levels", "survival"] as const) {
    const initial = { ...running(mode), board: { columns: 40, rows: 24 }, snake: line(20, 0, 18), snakeClock: -100000, elapsed: SPLIT_AFTER - 20 };
    const s = step(initial, null);
    assert(s.hasSplit && s.rival); assert.equal(allSnakes(s).length, initial.snake.length);
    assert.deepEqual(s.snake, initial.snake.slice(0, 9));
    assert.deepEqual(s.rival.body, initial.snake.slice(9).reverse());
    assert.equal(s.rival.direction, "left"); legalPack(s);
    const resized = resizeGame(s, { columns: 30, rows: 36 }); legalPack(resized);
    assert.equal(resized.elapsed, s.elapsed); assert(resized.hasSplit);
    assert.deepEqual(step({ ...s, elapsed: 120000, snakeClock: -100000 }, null).rival?.body, s.rival.body);
  }
});

test("converging heads, head swaps and simultaneous traps stun both and make both tails lead", () => {
  for (const scenario of ["converge", "swap", "trapped"] as const) {
    const first = scenario === "trapped" ? line(0, 0, 4, 1) : line(3, 0, 4);
    const second = scenario === "converge" ? line(5, 0, 4, 1) : scenario === "swap" ? line(4, 0, 4, 1) : line(27, 0, 4);
    const initial = { ...running(), snake: first, snakeDirection: (scenario === "trapped" ? "left" : "right") as Direction, committedMoves: 1, snakeClock: 100, hasSplit: true, rival: { ...rival(second), direction: (scenario === "trapped" ? "right" : "left") as Direction } };
    let s = movePack(initial);
    assert.equal(s.snakeStun, SNAKE_STUN_DURATION); assert.equal(s.rival?.stun, SNAKE_STUN_DURATION);
    assert.deepEqual(s.snake, first); assert.deepEqual(s.rival?.body, second); legalPack(s);
    for (let i = 0; i < 80; i++) s = step(s, null);
    assert.deepEqual(s.snake, [...first].reverse()); assert.deepEqual(s.rival?.body, [...second].reverse());
    assert.equal(s.phase, "running"); legalPack(s);
  }
});

test("Food contact with either body and either head produces a capture and bite", () => {
  for (const target of [{ x: 3, y: 0 }, { x: 7, y: 0 }]) {
    const s = step({ ...running(), snake: line(3, 0, 4), snakeClock: -100000, rival: { ...rival(line(7, 0, 4, 1)), clock: -100000 }, player: { x: target.x, y: 1 }, playerClock: 80 }, "up");
    assert.equal(s.phase, "lost"); assert.equal(s.reason, "caught"); assert.deepEqual(s.bite?.point, target);
  }
});

function perimeter(p: { x: number; y: number }, b: { columns: number; rows: number }): Direction {
  if (p.y === 0 && p.x < b.columns - 1) return "right";
  if (p.x === b.columns - 1 && p.y < b.rows - 1) return "down";
  if (p.y === b.rows - 1 && p.x > 0) return "left";
  if (p.x === 0 && p.y > 0) return "up";
  return "left";
}
test("an actual two-minute Food chase grows, splits, never overlaps and replays exactly", () => {
  for (const mode of ["levels", "survival"] as const) {
    const meta: RunMeta = { mode, arena: 0, difficulty: "easy", seed: 0, board: { columns: 80, rows: 60 } };
    let s = createRun(meta) as GameState; const recorder = new Recorder(meta);
    for (let i = 0; i < 6000 && s.phase === "running"; i++) {
      const heading = perimeter(s.player, s.board);
      const dashCommand: Command = { action: "dash", direction: heading };
      if (s.dashCooldown === 0 && applyCommand(s, dashCommand, meta).phase === "running") { recorder.add(dashCommand); s = applyCommand(s, dashCommand, meta) as GameState; }
      const command: Command = { action: "step", direction: perimeter(s.player, s.board), count: 1 };
      recorder.add(command); s = applyCommand(s, command, meta) as GameState; legalPack(s);
    }
    assert.equal(s.elapsed, 120000); assert(s.hasSplit && s.rival); assert.equal(s.phase, "running");
    recorder.add({ action: "finish" }); s = applyCommand(s, { action: "finish" }, meta) as GameState;
    const replay = parseReplay(recorder.finish(s)); assert(replay);
    const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance();
    assert(cursor.valid); assert.equal(fingerprint(cursor.state), fingerprint(s));
  }
});

test("Hunter Hard walls sink, activate safely and rise; other difficulties keep their walls", () => {
  for (const difficulty of ["easy", "normal", "hard"] as const) {
    let s: HunterState = { ...createHunter(28, difficulty, 39), phase: "running", elapsed: 44980, clock: -100000, fruitClock: -100000 };
    const original = s.walls; s = hunterStep(s);
    if (difficulty !== "hard") { assert.equal(s.wallAnimation, 0); assert.deepEqual(s.walls, original); continue; }
    assert.equal(s.wallAnimation, 1200); assert.equal(s.nextWallShift, 75000); assert.deepEqual(s.walls, original);
    assert.notDeepEqual(s.incomingWalls, original);
    for (let i = 0; i < 29; i++) s = hunterStep(s);
    assert.deepEqual(s.walls, original);
    s = hunterStep(s); assert.equal(s.wallAnimation, 600); assert.notDeepEqual(s.walls, original);
    const protectedCells = [...s.snake, s.food!, ...s.powerUps.map(p => p.position)];
    assert(!s.walls.some(p => protectedCells.some(q => equal(p, q)))); assert(connectedFloor(s.walls, s.board));
    const resized = resizeHunter(s, { columns: 40, rows: 30 });
    assert.equal(resized.wallAnimation, 600); assert.equal(resized.nextWallShift, 75000);
    assert(!resized.walls.some(p => [...resized.snake, resized.food!, ...resized.powerUps.map(p => p.position)].some(q => equal(p, q))));
    for (let i = 0; i < 30; i++) s = hunterStep(s); assert.equal(s.wallAnimation, 0);
  }
});

test("randomized powers and relocated walls are deterministic, varied and safe", () => {
  const positions = new Set<string>();
  for (let seed = 1; seed <= 20; seed++) {
    const s = createHunter(29, "hard", seed); assert.deepEqual(s, createHunter(29, "hard", seed));
    positions.add(JSON.stringify(s.powerUps.map(p => p.position)));
    for (const power of s.powerUps) assert(![...s.snake, s.food!, ...s.walls].some(p => equal(p, power.position)));
    const moved = relocateWalls(s.walls, s.board, [...s.snake, s.food!], seed);
    assert.deepEqual(moved, relocateWalls(s.walls, s.board, [...s.snake, s.food!], seed));
    assert(connectedFloor(moved, s.board));
  }
  assert(positions.size >= 15);
});

test("a real Hunter Hard chase relocates walls and replays without creating a second snake", () => {
  const meta: RunMeta = { mode: "hunter", arena: 0, difficulty: "hard", seed: 39, hunterMode: "survival" };
  let s = createRun(meta) as HunterState; const recorder = new Recorder(meta);
  for (let i = 0; i < 3000 && s.phase === "running"; i++) {
    const d = s.snake[0].y === 2 && s.elapsed === 0 ? "up" : s.snake[0].x === 6 && s.snake[0].y === 1 && s.elapsed < 1000 ? "up" : perimeter(s.snake[0], s.board);
    if (d !== s.direction && !s.turns.length) { const c: Command = { action: "steer", direction: d }; recorder.add(c); s = applyCommand(s, c, meta) as HunterState; }
    const c: Command = { action: "step", direction: null, count: 1 }; recorder.add(c); s = applyCommand(s, c, meta) as HunterState;
  }
  assert.equal(s.elapsed, 60000); assert.equal(s.nextWallShift, 75000); assert(!("rival" in s));
  recorder.add({ action: "finish" }); s = applyCommand(s, { action: "finish" }, meta) as HunterState;
  const replay = parseReplay(recorder.finish(s)); assert(replay);
  const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance();
  assert(cursor.valid); assert(isHunter(cursor.state)); assert.equal(fingerprint(cursor.state), fingerprint(s));
});

test("orchard-5 ending recordings and ten-map progress survive the thirty-map release", () => {
  const meta: RunMeta = { mode: "levels", arena: 4, difficulty: "normal", seed: 0 };
  let s = { ...orchard5.createGame(4), phase: "running" as orchard5.Phase }; const recorder = new Recorder(meta);
  for (let i = 0; i < 20; i++) { recorder.add({ action: "step", direction: "left", count: 1 }); s = orchard5.step(s, "left"); }
  recorder.add({ action: "finish" }); s = orchard5.endChase(s);
  const replay = parseReplay({ ...recorder.finish(s)!, version: "1.4.0", ruleset: "orchard-5" }); assert(replay);
  const cursor = new ReplayCursor(replay); while (!cursor.done) cursor.advance(); assert(cursor.valid);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => JSON.stringify({ ...DEFAULT_DATA, unlocked: 9, stars: Array(10).fill(2) }) } });
  try {
    const data = readSavedData(); assert.equal(data.unlocked, 9); assert.equal(data.stars.length, 30); assert.equal(data.stars[9], 2); assert.equal(data.stars[10], 0);
    assert.equal(recordProgress(data, { ...createGame(9), levelCleared: true, phase: "running", score: 1300 }).unlocked, 10);
  } finally { if (previous) Object.defineProperty(globalThis, "localStorage", previous); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
