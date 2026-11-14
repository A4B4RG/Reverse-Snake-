import assert from "node:assert/strict";
import test from "node:test";
import { boardForSize, inBoard, type Board } from "../src/lib/board";
import {
  ARENAS,
  chooseSnakeDirection,
  createGame,
  dash,
  equal,
  obstaclesFor,
  resizeGame,
  step,
  type GameState,
} from "../src/lib/game";
import {
  createHunter,
  evadeFruit,
  hunterStep,
  resizeHunter,
} from "../src/lib/hunter";
import {
  createLearning,
  features,
  infer,
  readLearning,
  saveLearning,
  train,
} from "../src/lib/learning";
import {
  applyCommand,
  createRun,
  fingerprint,
  parseReplay,
  Recorder,
  ReplayCursor,
} from "../src/lib/replay";
import * as legacy from "../src/lib/legacy/game";

const boards: Board[] = [
  { columns: 12, rows: 24 },
  { columns: 24, rows: 12 },
  { columns: 35, rows: 19 },
  { columns: 56, rows: 30 },
];
function legalEntities(s: GameState) {
  const obstacles = obstaclesFor(s.arena, s.board);
  assert(
    s.snake.every(
      (p) => inBoard(p, s.board) && !obstacles.some((q) => equal(p, q)),
    ),
  );
  assert(
    inBoard(s.player, s.board) && !obstacles.some((q) => equal(s.player, q)),
  );
  assert(!s.snake.some((p) => equal(p, s.player)));
  assert.equal(
    new Set(s.snake.map((p) => `${p.x},${p.y}`)).size,
    s.snake.length,
  );
  s.snake
    .slice(1)
    .forEach((p, i) =>
      assert.equal(
        Math.abs(p.x - s.snake[i].x) + Math.abs(p.y - s.snake[i].y),
        1,
      ),
    );
}
test("geometry follows both available axes and fullscreen adds playable cells", () => {
  const a = boardForSize(980, 540),
    b = boardForSize(1920, 1000),
    c = boardForSize(310, 370);
  assert(a.columns !== a.rows);
  assert(b.columns > a.columns && b.rows > a.rows);
  assert(c.rows > c.columns);
});
test("all rectangular arenas spawn legal actors and catch idle fruit without reset wins", () => {
  for (const board of boards)
    for (let arena = 0; arena < ARENAS.length; arena++)
      for (const difficulty of ["easy", "normal", "hard"] as const) {
        let s = {
          ...createGame(arena, difficulty, "survival", board),
          phase: "running" as GameState["phase"],
        };
        legalEntities(s);
        const player = s.player;
        for (let i = 0; i < 2500 && s.phase === "running"; i++)
          s = step(s, null);
        assert.equal(
          s.phase,
          "lost",
          JSON.stringify({
            board,
            arena,
            difficulty,
            head: s.snake[0],
            escapes: s.escapes,
          }),
        );
        assert.equal(s.reason, "caught");
        assert.equal(s.escapes, 0);
        assert.deepEqual(s.player, player);
      }
});
test("active resizing preserves time, score, length, models and connected actors", () => {
  for (let arena = 0; arena < ARENAS.length; arena++) {
    let s = {
      ...createGame(arena, "hard", "survival", boards[2]),
      phase: "running" as GameState["phase"],
      elapsed: 3480,
      score: 348,
      boostRemaining: 2300,
    };
    for (const board of boards) {
      s = resizeGame(s, board);
      legalEntities(s);
      assert.equal(s.phase, "running");
      assert.equal(s.elapsed, 3480);
      assert.equal(s.score, 348);
      assert.equal(s.boostRemaining, 2300);
      assert.equal(s.snake.length, ARENAS[arena].length);
      assert.equal(moveSafe(s).phase, "running");
    }
    const h = createHunter(arena, "normal", 4, boards[2]),
      r = resizeHunter(h, boards[0]);
    assert.equal(r.snake.length, h.snake.length);
    assert(r.snake.every((p) => inBoard(p, r.board)));
    assert(r.food && !r.snake.some((p) => equal(p, r.food!)));
  }
});
function moveSafe(s: GameState) {
  return step({ ...s, snakeClock: 0, playerClock: 0 }, null);
}
test("backprop changes predictions; only actual successful human moves train each policy", () => {
  const l = createLearning(),
    x = features({ x: 5, y: 5 }, { x: 10, y: 8 }, "left", boards[2], [
      true,
      true,
      true,
      true,
    ]);
  let policy = l.fruit;
  const before = infer(policy, x)[1];
  for (let i = 0; i < 100; i++) policy = train(policy, x, "right");
  assert(infer(policy, x)[1] > before + 0.6);
  assert.deepEqual(l, createLearning());
  let s = {
    ...createGame(),
    phase: "running" as GameState["phase"],
    snakeClock: -10000,
  };
  for (let i = 0; i < 5; i++) s = step(s, "left");
  assert.equal(s.learning.fruit.samples, 1);
  assert.equal(s.learning.snake.samples, 0);
  const blocked = dash({ ...s, player: { x: 0, y: 0 } }, "left");
  assert.equal(blocked.learning.fruit.samples, 1);
  let h = { ...createHunter(), phase: "running" as const, clock: 180 };
  h = hunterStep(h) as typeof h;
  assert.equal(h.learning.snake.samples, 1);
  assert.equal(h.learning.fruit.samples, 0);
});
test("learned snake moves and learned fruit evasion change opponent decisions", () => {
  const board = { columns: 30, rows: 24 },
    legal = [true, true, true, true];
  for (const difficulty of ["easy", "normal", "hard"] as const) {
    const base = {
      ...createGame(0, difficulty, "levels", board),
      snake: [
        { x: 12, y: 2 },
        { x: 13, y: 2 },
        { x: 14, y: 2 },
      ],
      player: { x: 9, y: 5 },
      snakeDirection: "left" as const,
      lastPlayerMove: 0,
    };
    const x = features(
      base.snake[0],
      base.player,
      base.snakeDirection,
      board,
      legal,
    );
    let p = base.learning.snake;
    for (let i = 0; i < 200; i++) p = train(p, x, "down");
    assert.equal(chooseSnakeDirection(base), "left");
    assert.equal(
      chooseSnakeDirection({
        ...base,
        learning: { ...base.learning, snake: p },
      }),
      "down",
    );
    const h = {
      ...createHunter(0, difficulty, 1, board),
      phase: "running" as const,
      food: { x: 20, y: 16 },
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      fruitClock: 1000,
    };
    const f = features(h.food, h.snake[0], h.fruitDirection, board, legal);
    let left = h.learning.fruit,
      right = h.learning.fruit;
    for (let i = 0; i < 200; i++) {
      left = train(left, f, "left");
      right = train(right, f, "right");
    }
    assert.equal(
      evadeFruit({ ...h, learning: { ...h.learning, fruit: left } })
        .fruitDirection,
      "left",
    );
    assert.equal(
      evadeFruit({ ...h, learning: { ...h.learning, fruit: right } })
        .fruitDirection,
      "right",
    );
  }
});
test("model persistence survives reload, rejects malformed weights and tolerates blocked storage", () => {
  const memory = new Map<string, string>(),
    old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
    },
  });
  try {
    const l = createLearning();
    l.snake = train(
      l.snake,
      features({ x: 1, y: 2 }, { x: 8, y: 4 }, "right", boards[2], [
        true,
        true,
        true,
        true,
      ]),
      "up",
    );
    assert(saveLearning(l));
    assert.deepEqual(readLearning(), l);
    memory.set(
      "reverse-snake:learning:v1",
      JSON.stringify({ ...l, fruit: { ...l.fruit, input: [NaN] } }),
    );
    assert.deepEqual(readLearning(), createLearning());
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw Error("blocked");
      },
    });
    assert(!saveLearning(l));
    assert.deepEqual(readLearning(), createLearning());
  } finally {
    if (old) Object.defineProperty(globalThis, "localStorage", old);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
test("neural snapshots, cosmetics, resizes and actual training replay deterministically", () => {
  for (const mode of ["levels", "hunter"] as const) {
    const meta = {
      mode,
      arena: 0,
      difficulty: "normal" as const,
      seed: 7,
      board: boards[2],
      learning: createLearning(),
      appearance: { fruit: "pear" as const, snake: "coral" as const },
    };
    const recorder = new Recorder(meta);
    let s = createRun(meta);
    for (let i = 0; i < 15; i++) {
      const c = {
        action: "step" as const,
        direction: "down" as const,
        count: 1,
      };
      recorder.add(c);
      s = applyCommand(s, c, meta);
    }
    const c = { action: "resize" as const, board: boards[1] };
    recorder.add(c);
    s = applyCommand(s, c, meta);
    for (let i = 0; i < 2500 && s.phase === "running"; i++) {
      const c = { action: "step" as const, direction: null, count: 1 };
      recorder.add(c);
      s = applyCommand(s, c, meta);
    }
    const r = recorder.finish(s)!;
    assert(r);
    assert(parseReplay(r));
    const cursor = new ReplayCursor(r);
    while (!cursor.done) cursor.advance();
    assert(cursor.valid);
    assert.equal(fingerprint(cursor.state), fingerprint(s));
    assert(s.learning[mode === "hunter" ? "snake" : "fruit"].samples > 0);
  }
});
test("legacy canopy-2 recordings preserve their original rules and final fingerprints", () => {
  let s = {
    ...legacy.createGame(),
    phase: "running" as legacy.GameState["phase"],
  };
  let count = 0;
  while (s.phase === "running") {
    s = legacy.step(s, null);
    count++;
  }
  const r = {
    format: 1 as const,
    version: "1.1.0",
    ruleset: "canopy-2",
    meta: {
      mode: "levels" as const,
      arena: 0,
      difficulty: "normal" as const,
      seed: 0,
    },
    commands: [{ action: "step" as const, direction: null, count }],
    final: fingerprint(s as unknown as GameState),
    elapsed: s.elapsed,
    score: s.score,
    won: false,
  };
  assert(parseReplay(r));
  const cursor = new ReplayCursor(r);
  while (!cursor.done) cursor.advance();
  assert(cursor.valid);
});
test("pause preview advances a recorded prefix independently from the live frozen state", () => {
  const meta = {
    mode: "levels" as const,
    arena: 0,
    difficulty: "normal" as const,
    seed: 0,
  };
  const recorder = new Recorder(meta);
  let s = createRun(meta);
  for (let i = 0; i < 25; i++) {
    const c = { action: "step" as const, direction: "left" as const, count: 1 };
    recorder.add(c);
    s = applyCommand(s, c, meta);
  }
  const preview = recorder.finish(s, true)!;
  assert(preview && parseReplay(preview));
  const frozen = fingerprint(s),
    cursor = new ReplayCursor(preview);
  for (let i = 0; i < 12; i++) cursor.advance();
  assert.equal(cursor.state.elapsed, 240);
  assert.equal(fingerprint(s), frozen);
  assert.notDeepEqual(cursor.state.snake, s.snake);
});

test("scaled solid islands never create inaccessible food pockets", () => {
  for (const board of [
    ...boards,
    { columns: 12, rows: 12 },
    { columns: 96, rows: 96 },
  ])
    for (let arena = 0; arena < ARENAS.length; arena++) {
      const blocked = new Set(
        obstaclesFor(arena, board).map((p) => p.y * board.columns + p.x),
      );
      const queue = [{ x: 0, y: 0 }],
        visited = new Set([0]);
      for (let i = 0; i < queue.length; i++)
        for (const v of [
          { x: 0, y: 1 },
          { x: 1, y: 0 },
          { x: 0, y: -1 },
          { x: -1, y: 0 },
        ]) {
          const p = { x: queue[i].x + v.x, y: queue[i].y + v.y },
            index = p.y * board.columns + p.x;
          if (!inBoard(p, board) || blocked.has(index) || visited.has(index))
            continue;
          visited.add(index);
          queue.push(p);
        }
      assert.equal(
        visited.size,
        board.columns * board.rows - blocked.size,
        JSON.stringify({ board, arena }),
      );
    }
});
