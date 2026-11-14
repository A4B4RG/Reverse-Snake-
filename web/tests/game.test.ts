import assert from "node:assert/strict";
import { test } from "node:test";
import { ARENAS, createGame as createRectGame, dash, DIFFICULTIES, equal, inside, moveSnake, step, steer, type Difficulty, type GameState } from "../src/lib/game.ts";
import { DEFAULT_DATA, readSavedData, recordRun, saveData } from "../src/lib/storage.ts";
const createGame=(arena=0,difficulty:Parameters<typeof createRectGame>[1]="normal",mode:Parameters<typeof createRectGame>[2]="levels")=>createRectGame(arena,difficulty,mode,{columns:20,rows:20});

const running = (overrides: Partial<GameState> = {}): GameState => ({ ...createGame(), phase: "running", ...overrides });

test("every arena has valid, connected, non-overlapping starting entities", () => {
  ARENAS.forEach((arena, index) => {
    const game = createGame(index);
    assert.equal(game.snake.length, arena.length);
    assert(game.snake.every(p=>inside(p,game.board)));
    assert(inside(game.player));
    assert(!game.snake.some(p => equal(p, game.player)));
    assert(!arena.obstacles.some(p => equal(p, game.player)));
    assert(!game.snake.some(p => arena.obstacles.some(obstacle => equal(p, obstacle))));
    assert.equal(new Set(game.snake.map(p => `${p.x},${p.y}`)).size, game.snake.length);
    game.snake.slice(1).forEach((segment, i) => assert.equal(Math.abs(segment.x - game.snake[i].x) + Math.abs(segment.y - game.snake[i].y), 1));
    assert.equal(moveSnake({ ...game, phase: "running" }).phase, "running", "no immediate self-collision");
  });
});

test("ready, paused, won, and lost states do not advance or charge a dash", () => {
  for (const phase of ["ready", "paused", "won", "lost"] as const) {
    const game = running({ phase, dashCooldown: 1000 });
    assert.equal(step(game, "up"), game);
    assert.equal(dash(game, "up"), game);
  }
});

test("every arena and difficulty catches idle food in both modes without an automatic crash win", () => {
  for (const mode of ["levels", "survival"] as const) {
    for (const arena of ARENAS.keys()) {
      for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
        let game: GameState = { ...createGame(arena, difficulty, mode), phase: "running" };
        for (let i = 0; i < 1500 && game.phase === "running"; i++) game = step(game, null);
        const label = `${ARENAS[arena].name}, ${difficulty}, ${mode}`;
        assert.equal(game.phase, "lost", label);
        assert.equal(game.reason, "caught", label);
        assert.equal(game.escapes, 0, label);
        assert.deepEqual(game.player, { x: 5, y: 13 }, "the player never moved");
      }
    }
  }
});

test("a committed lunge into a wall, hedge, or body awards a win", () => {
  const wall = moveSnake(running({ snake: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], snakeDirection: "left", committedMoves: 1 }));
  assert.equal(wall.phase, "won"); assert.equal(wall.reason, "wall"); assert(wall.score > 0);
  const hedge = moveSnake(running({ arena: 1, snake: [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }], snakeDirection: "right", committedMoves: 1 }));
  assert.equal(hedge.reason, "obstacle");
  const body = moveSnake(running({ snake: [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], snakeDirection: "down", committedMoves: 1 }));
  assert.equal(body.phase, "won"); assert.equal(body.reason, "body");
});

test("a real mid-lunge dodge at the left boundary still baits a crash win", () => {
  let game = running({ player: { x: 0, y: 3 } });
  let dodged = false;
  for (let i = 0; i < 1000 && game.phase === "running"; i++) {
    game = step(game, null);
    if (!dodged && game.snake[0].x === 1 && game.snake[0].y === game.player.y && game.snakeDirection === "left" && game.committedMoves > 0) {
      game = dash(game, "down");
      dodged = true;
    }
  }
  assert(dodged, "the player dodges after the AI starts its lunge");
  assert.deepEqual(game.player, { x: 0, y: 6 });
  assert.equal(game.closeCalls, 1);
  assert.equal(game.phase, "won");
  assert.equal(game.reason, "wall");
});

test("the snake may enter its departing tail cell", () => {
  const game = moveSnake(running({ snake: [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 4, y: 5 }], snakeDirection: "down", committedMoves: 1 }));
  assert.equal(game.phase, "running");
  assert.deepEqual(game.snake[0], { x: 4, y: 5 });
});

test("the player cannot cross walls or hedges, including during a dash", () => {
  const wall = dash(running({ player: { x: 0, y: 10 } }), "left");
  assert.deepEqual(wall.player, { x: 0, y: 10 }); assert.equal(wall.phase, "running");
  const hedge = dash(running({ arena: 1, player: { x: 5, y: 10 } }), "right");
  assert.deepEqual(hedge.player, { x: 6, y: 10 });
});

test("moving or dashing into any snake segment loses immediately", () => {
  const game = running({ player: { x: 10, y: 3 }, playerClock: 80 });
  assert.equal(step(game, "right").phase, "running");
  assert.equal(step(running({ player: { x: 11, y: 3 }, playerClock: 80 }), "right").reason, "caught");
  assert.equal(dash(game, "right").reason, "caught");
  assert.equal(dash(running({ player: { x: 18, y: 5 } }), "left").reason, "caught");
});

test("dash covers three cells and recharges in four active seconds", () => {
  let game = dash(running(), "left");
  assert.deepEqual(game.player, { x: 2, y: 13 });
  assert.equal(game.dashCooldown, 4000);
  assert.equal(dash(game, "up"), game);
  game = { ...game, snakeClock: -100000 };
  for (let i = 0; i < 200; i++) game = step(game, null);
  assert.equal(game.dashCooldown, 0);
});

test("hunger shrinks the hunter and surviving the arena duration wins", () => {
  let game = running({ snakeClock: -1000000 });
  for (let i = 0; i < 500; i++) game = step(game, null);
  assert(game.snake.length < ARENAS[0].length);
  while (game.phase === "running") game = step(game, null);
  assert.equal(game.reason, "hunger"); assert.equal(game.elapsed, ARENAS[0].duration);
});

test("restarting creates a fresh round with selected arena and difficulty", () => {
  const game = createGame(3, "hard");
  assert.equal(game.phase, "ready"); assert.equal(game.elapsed, 0); assert.equal(game.score, 0);
  assert.equal(game.arena, 3); assert.equal(game.difficulty, "hard");
});

test("a short press is buffered until the movement tick, respects collision, and never advances a paused game", () => {
  let game = steer(running(), "left");
  assert.deepEqual(game.player, { x: 5, y: 13 });
  for (let i = 0; i < 5; i++) game = step(game, null);
  assert.deepEqual(game.player, { x: 4, y: 13 });
  assert.equal(step(steer(running({ player: { x: 11, y: 3 }, playerClock: 80 }), "right"), null).phase, "lost");
  const paused = running({ phase: "paused" });
  assert.equal(steer(paused, "up"), paused);
});

test("saved scores survive a round trip and malformed storage is tolerated", () => {
  const memory = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    assert.deepEqual(readSavedData(), DEFAULT_DATA);
    const saved = recordRun(DEFAULT_DATA, running({ phase: "won", score: 2000, elapsed: 3400 }));
    assert.equal(saveData(saved), true);
    assert.deepEqual(readSavedData(), saved);
    assert.equal(saved.wins, 1); assert.equal(saved.attempts, 1); assert.equal(saved.best, 2000);
    memory.set("reverse-snake:v1", "invalid json");
    assert.deepEqual(readSavedData(), DEFAULT_DATA);
    memory.set("reverse-snake:v1", JSON.stringify({ difficulty: "impossible", runs: [{ arena: 99 }], best: -10 }));
    assert.deepEqual(readSavedData(), DEFAULT_DATA);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("disabled"); } });
    assert.deepEqual(readSavedData(), DEFAULT_DATA); assert.equal(saveData(saved), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
