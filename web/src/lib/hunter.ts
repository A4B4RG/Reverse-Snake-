import {
  ARENAS,
  DIFFICULTIES,
  GRID,
  STEP_MS,
  VECTORS,
  equal,
  inside,
  type Difficulty,
  type Direction,
  type Phase,
  type Point,
} from "./game";

export type HunterState = {
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
export function spawnFood(arena: number, snake: Point[], seed: number) {
  const blocked = new Set(
    [...snake, ...ARENAS[arena].obstacles].map((p) => p.y * GRID + p.x),
  );
  const free = Array.from({ length: GRID * GRID }, (_, i) => i).filter(
    (i) => !blocked.has(i),
  );
  const nextSeed = randomSeed(seed);
  const cell = free[nextSeed % free.length];
  return {
    seed: nextSeed,
    food: free.length ? { x: cell % GRID, y: Math.floor(cell / GRID) } : null,
  };
}
export function createHunter(
  arena = 0,
  difficulty: Difficulty = "normal",
  seed = 1,
): HunterState {
  const snake = [5, 4, 3, 2].map((x) => ({ x, y: 3 }));
  return {
    phase: "ready",
    arena,
    difficulty,
    ...spawnFood(arena, snake, seed),
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
  const next = { ...s, clock: s.clock + STEP_MS, elapsed: s.elapsed + STEP_MS };
  const interval = DIFFICULTIES[s.difficulty].interval;
  if (next.clock < interval) return next;
  next.clock -= interval;
  next.direction = s.turns[0] ?? s.direction;
  next.turns = s.turns.slice(1);
  const vector = VECTORS[next.direction],
    head = { x: s.snake[0].x + vector.x, y: s.snake[0].y + vector.y };
  const growing = !!s.food && equal(head, s.food);
  const body = growing ? s.snake : s.snake.slice(0, -1);
  const reason = !inside(head)
    ? "wall"
    : ARENAS[s.arena].obstacles.some((p) => equal(p, head))
      ? "obstacle"
      : body.some((p) => equal(p, head))
        ? "body"
        : null;
  if (reason) return { ...next, phase: "lost", reason };
  next.snake = [head, ...(growing ? s.snake : s.snake.slice(0, -1))];
  if (growing) {
    next.collected++;
    next.score += 100 * DIFFICULTIES[s.difficulty].multiplier;
    Object.assign(next, spawnFood(s.arena, next.snake, s.seed));
    if (!next.food) {
      next.phase = "won";
      next.reason = "full board";
    }
  }
  return next;
}
