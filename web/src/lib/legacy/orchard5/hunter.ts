import {
  ARENAS,
  DIFFICULTIES,
  STEP_MS,
  VECTORS,
  equal,
  inside,
  obstaclesFor,
  type GameMode,
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
} from "../../learning";
import { DEFAULT_APPEARANCE, type Appearance } from "../../appearance";

export const HUNTER_SPEED_DURATION = 10_000;
export const STUN_DURATION = 5_000;
export type PowerUp = { kind: "speed" | "stun"; position: Point };
export const hunterInterval = (s: HunterState) => DIFFICULTIES[s.difficulty].interval / (s.speedRemaining > 0 ? 2 : 1);
export const fruitInterval = (difficulty: Difficulty) => DIFFICULTIES[difficulty].interval / { easy: 0.5, normal: 0.75, hard: 1 }[difficulty];
export type HunterState = {
  mode: GameMode;
  levelCleared: boolean;
  powerUps: PowerUp[];
  powerUpClock: number;
  nextPowerUp: PowerUp["kind"];
  speedRemaining: number;
  stunRemaining: number;
  fruitTrail: Point[];
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
  extraBlocked: Point[] = [],
) {
  const blocked = new Set(
    [...snake, ...extraBlocked, ...obstaclesFor(arena, board)].map(
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
  mode: GameMode = "levels",
): HunterState {
  const snake = fitSnake(
    { x: Math.floor(board.columns * 0.25), y: Math.floor(board.rows * 0.15) },
    4,
    "right",
    board,
    obstaclesFor(arena, board),
  );
  let s: HunterState = {
    mode,
    levelCleared: false,
    powerUps: [],
    powerUpClock: 0,
    nextPowerUp: "speed",
    speedRemaining: 0,
    stunRemaining: 0,
    fruitTrail: [],
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
  s = spawnPowerUp(s);
  return spawnPowerUp(s);
}
export function spawnPowerUp(s: HunterState): HunterState {
  const spawned = spawnFood(s.arena, s.snake, s.seed, s.board, [...s.powerUps.map(p => p.position), ...(s.food ? [s.food] : [])]);
  return spawned.food ? { ...s, seed: spawned.seed, powerUps: [...s.powerUps, { kind: s.nextPowerUp, position: spawned.food }], nextPowerUp: s.nextPowerUp === "speed" ? "stun" : "speed", powerUpClock: 0 } : s;
}
export function endHunt(s: HunterState): HunterState {
  return ["running", "paused"].includes(s.phase) ? { ...s, phase: s.levelCleared ? "won" : "lost", turns: [], reason: "retired" } : s;
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
  let next = {
    ...s,
    speedRemaining: Math.max(0, s.speedRemaining - STEP_MS),
    stunRemaining: Math.max(0, s.stunRemaining - STEP_MS),
    powerUpClock: s.powerUpClock + STEP_MS,
    clock: s.clock + STEP_MS,
    fruitClock: s.stunRemaining > 0 ? 0 : s.fruitClock + STEP_MS,
    elapsed: s.elapsed + STEP_MS,
  };
  if (next.powerUps.length < 2 && next.powerUpClock >= 8000) next = spawnPowerUp(next);
  const interval = hunterInterval(s);
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
    let spawned = spawnFood(s.arena, next.snake, next.seed, s.board, next.powerUps.map(p => p.position));
    if (!spawned.food) spawned = spawnFood(s.arena, next.snake, next.seed, s.board);
    Object.assign(next, spawned);
    next.powerUps = next.powerUps.filter(p => !next.food || !equal(p.position, next.food));
    next.fruitClock = 0;
    next.fruitTrail = [];
    if (!next.food) {
      next.phase = "won";
      next.reason = "full board";
    }
  }
  const pickup = next.powerUps.find(p => equal(p.position, head));
  if (pickup) {
    next.powerUps = next.powerUps.filter(p => p !== pickup);
    next.powerUpClock = 0;
    if (pickup.kind === "speed") next.speedRemaining = HUNTER_SPEED_DURATION;
    else { next.stunRemaining = STUN_DURATION; next.fruitClock = 0; }
  }
  if (next.mode === "levels" && next.score >= ARENAS[next.arena].scoreTarget) next.levelCleared = true;
  return evadeFruit(next);
}

export function evadeFruit(s: HunterState): HunterState {
  if (
    s.phase !== "running" ||
    !s.food ||
    s.stunRemaining > 0 ||
    s.fruitClock + 0.000001 < fruitInterval(s.difficulty)
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
      ? { easy: 3, normal: 4, hard: 5 }[s.difficulty]
      : 0;
  const distances = new Map<string, number>();
  const occupied = new Set(blocked.map(p => `${p.x},${p.y}`));
  const queue = [s.snake[0]];
  distances.set(`${queue[0].x},${queue[0].y}`, 0);
  for (let i = 0; i < queue.length; i++) for (const d of MOVES) {
    const v = VECTORS[d], p = { x: queue[i].x + v.x, y: queue[i].y + v.y }, key = `${p.x},${p.y}`;
    if (!inside(p, s.board) || occupied.has(key) || distances.has(key)) continue;
    distances.set(key, distances.get(`${queue[i].x},${queue[i].y}`)! + 1);
    queue.push(p);
  }
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
        ? (distances.get(`${p.x},${p.y}`) ?? (s.board.columns + s.board.rows)) * 0.8 +
          (Math.abs(p.x - predicted.x) + Math.abs(p.y - predicted.y)) * 0.2 -
          s.fruitTrail.filter(q => equal(p, q)).length * 1.5 +
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
    fruitTrail: [...s.fruitTrail, s.food].slice(-8),
    fruitDirection: options[0].d,
    fruitClock: Math.max(0, s.fruitClock - fruitInterval(s.difficulty)),
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
  const blocked = [...obstacles, ...snake, ...(food ? [food] : [])];
  const powerUps = s.powerUps.map(power => {
    const position = nearestFree(project(power.position, s.board, board), board, blocked);
    blocked.push(position);
    return { ...power, position };
  });
  return { ...s, board, snake, food, powerUps, fruitTrail: [] };
}
