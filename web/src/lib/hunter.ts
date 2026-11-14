import {
  DIFFICULTIES,
  STEP_MS,
  VECTORS,
  equal,
  inside,
  obstaclesFor,
  type Difficulty,
  type Direction,
  type Phase,
  type Point,
} from "./game";

import {
  DEFAULT_BOARD,
  fitSnake,
  nearestFree,
  project,
  type Board,
} from "./board";
import {
  createLearning,
  features,
  infer,
  MOVES,
  train,
  type Learning,
} from "./learning";
import { DEFAULT_APPEARANCE, type Appearance } from "./appearance";

export type HunterState = {
  board: Board;
  learning: Learning;
  appearance: Appearance;
  fruitDirection: Direction;
  fruitClock: number;
  phase: Phase;
  arena: number;
  difficulty: Difficulty;
  seed: number;
  snake: Point[];
  direction: Direction;
  turns: Direction[];
  food: Point | null;
  clock: number;
  elapsed: number;
  score: number;
  collected: number;
  reason: string | null;
};
export function randomSeed(seed: number): number {
  return (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
}
export function spawnFood(
  arena: number,
  snake: Point[],
  seed: number,
  board: Board = DEFAULT_BOARD,
) {
  const blocked = new Set(
    [...snake, ...obstaclesFor(arena, board)].map(
      (p) => p.y * board.columns + p.x,
    ),
  );
  const free = Array.from(
    { length: board.columns * board.rows },
    (_, i) => i,
  ).filter((i) => !blocked.has(i));
  const nextSeed = randomSeed(seed);
  const cell = free[nextSeed % free.length];
  return {
    seed: nextSeed,
    food: free.length
      ? { x: cell % board.columns, y: Math.floor(cell / board.columns) }
      : null,
  };
}
export function createHunter(
  arena = 0,
  difficulty: Difficulty = "normal",
  seed = 1,
  board: Board = DEFAULT_BOARD,
  learning: Learning = createLearning(),
  appearance: Appearance = DEFAULT_APPEARANCE,
): HunterState {
  const snake = fitSnake(
    { x: Math.floor(board.columns * 0.25), y: Math.floor(board.rows * 0.15) },
    4,
    "right",
    board,
    obstaclesFor(arena, board),
  );
  return {
    board,
    learning,
    appearance,
    fruitDirection: "up",
    fruitClock: 0,
    phase: "ready",
    arena,
    difficulty,
    ...spawnFood(arena, snake, seed, board),
    snake,
    direction: "right",
    turns: [],
    clock: 0,
    elapsed: 0,
    score: 0,
    collected: 0,
    reason: null,
  };
}
export function turnHunter(s: HunterState, direction: Direction): HunterState {
  if (s.phase !== "running" || s.turns.length >= 2) return s;
  const heading = s.turns.at(-1) ?? s.direction;
  const a = VECTORS[heading],
    b = VECTORS[direction];
  if (heading === direction || (a.x === -b.x && a.y === -b.y)) return s;
  return { ...s, turns: [...s.turns, direction] };
}
export function hunterStep(s: HunterState): HunterState {
  if (s.phase !== "running") return s;
  const next = {
    ...s,
    clock: s.clock + STEP_MS,
    fruitClock: s.fruitClock + STEP_MS,
    elapsed: s.elapsed + STEP_MS,
  };
  const interval = DIFFICULTIES[s.difficulty].interval;
  if (next.clock < interval) return evadeFruit(next);
  next.clock -= interval;
  next.direction = s.turns[0] ?? s.direction;
  next.turns = s.turns.slice(1);
  const vector = VECTORS[next.direction],
    head = { x: s.snake[0].x + vector.x, y: s.snake[0].y + vector.y };
  const growing = !!s.food && equal(head, s.food);
  const body = growing ? s.snake : s.snake.slice(0, -1);
  const reason = !inside(head, s.board)
    ? "wall"
    : obstaclesFor(s.arena, s.board).some((p) => equal(p, head))
      ? "obstacle"
      : body.some((p) => equal(p, head))
        ? "body"
        : null;
  if (reason) return { ...next, phase: "lost", reason };
  const legal = MOVES.map((d) => {
    const v = VECTORS[d],
      p = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };
    return (
      inside(p, s.board) &&
      ![...obstaclesFor(s.arena, s.board), ...s.snake.slice(0, -1)].some((q) =>
        equal(p, q),
      )
    );
  });
  if (s.food)
    next.learning = {
      ...s.learning,
      snake: train(
        s.learning.snake,
        features(s.snake[0], s.food, s.direction, s.board, legal),
        next.direction,
      ),
    };
  next.snake = [head, ...(growing ? s.snake : s.snake.slice(0, -1))];
  if (growing) {
    next.collected++;
    next.score += 100 * DIFFICULTIES[s.difficulty].multiplier;
    Object.assign(next, spawnFood(s.arena, next.snake, s.seed, s.board));
    if (!next.food) {
      next.phase = "won";
      next.reason = "full board";
    }
  }
  return evadeFruit(next);
}

export function evadeFruit(s: HunterState): HunterState {
  if (
    s.phase !== "running" ||
    !s.food ||
    s.fruitClock < { easy: 520, normal: 340, hard: 220 }[s.difficulty]
  )
    return s;
  const blocked = [...obstaclesFor(s.arena, s.board), ...s.snake];
  const legal = MOVES.map((d) => {
    const v = VECTORS[d],
      p = { x: s.food!.x + v.x, y: s.food!.y + v.y };
    return inside(p, s.board) && !blocked.some((q) => equal(q, p));
  });
  const learned = infer(
    s.learning.fruit,
    features(s.food, s.snake[0], s.fruitDirection, s.board, legal),
  );
  const snakeLegal = MOVES.map((d) => {
    const v = VECTORS[d],
      p = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };
    return inside(p, s.board) && !blocked.slice(0, -1).some((q) => equal(q, p));
  });
  const prediction = infer(
    s.learning.snake,
    features(s.snake[0], s.food, s.direction, s.board, snakeLegal),
  );
  const v = VECTORS[MOVES[prediction.indexOf(Math.max(...prediction))]],
    predicted =
      s.learning.snake.samples >= 8
        ? { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y }
        : s.snake[0];
  const influence =
    s.learning.fruit.samples >= 8
      ? { easy: 0.6, normal: 1.8, hard: 3 }[s.difficulty]
      : 0;
  const options = MOVES.map((d, i) => {
    const v = VECTORS[d],
      p = { x: s.food!.x + v.x, y: s.food!.y + v.y };
    const exits = MOVES.filter((e) => {
      const w = VECTORS[e],
        q = { x: p.x + w.x, y: p.y + w.y };
      return inside(q, s.board) && !blocked.some((a) => equal(a, q));
    }).length;
    return {
      d,
      p,
      score: legal[i]
        ? Math.min(
            9,
            Math.abs(p.x - predicted.x) + Math.abs(p.y - predicted.y),
          ) *
            0.6 +
          exits * 0.5 +
          learned[i] * influence +
          (d === s.fruitDirection ? 0.15 : 0)
        : -Infinity,
    };
  }).sort((a, b) => b.score - a.score);
  if (!Number.isFinite(options[0].score)) return { ...s, fruitClock: 0 };
  return {
    ...s,
    food: options[0].p,
    fruitDirection: options[0].d,
    fruitClock: 0,
  };
}
export function resizeHunter(s: HunterState, board: Board): HunterState {
  if (s.board.columns === board.columns && s.board.rows === board.rows)
    return s;
  const obstacles = obstaclesFor(s.arena, board),
    snake = fitSnake(
      project(s.snake[0], s.board, board),
      s.snake.length,
      s.direction,
      board,
      obstacles,
    );
  const food = s.food
    ? nearestFree(project(s.food, s.board, board), board, [
        ...obstacles,
        ...snake,
      ])
    : null;
  return { ...s, board, snake, food, turns: [] };
}
