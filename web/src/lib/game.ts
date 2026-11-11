/** Pure, fixed-step simulation. No DOM, timers, rendering, or storage lives here. */
export const GRID = 20;
export const STEP_MS = 20;
export const PLAYER_INTERVAL = 100;
export const DASH_COOLDOWN = 4000;

export type Point = { x: number; y: number };
export type Direction = "up" | "right" | "down" | "left";
export type Difficulty = "easy" | "normal" | "hard";
export type Phase = "ready" | "running" | "paused" | "won" | "lost";
export type EndReason = "wall" | "body" | "obstacle" | "hunger" | "caught";
export type Arena = { name: string; subtitle: string; description: string; length: number; duration: number; obstacles: Point[] };

export const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};
const DIRECTIONS: Direction[] = ["up", "right", "down", "left"];
const line = (x: number, y: number, count: number, vertical = false): Point[] =>
  Array.from({ length: count }, (_, i) => ({ x: x + (vertical ? 0 : i), y: y + (vertical ? i : 0) }));

export const ARENAS: Arena[] = [
  { name: "The Garden", subtitle: "A little room to grow.", description: "Open ground. A hungry snake. Get a feel for the chase and make your first great escape.", length: 14, duration: 55_000, obstacles: [] },
  { name: "Split Decision", subtitle: "Pick a side. Then change it.", description: "Twin hedges split the garden. Slip through the gaps and let the hunter overcommit.", length: 16, duration: 60_000, obstacles: [...line(7, 6, 7, true), ...line(12, 8, 7, true)] },
  { name: "The Orchard", subtitle: "Take the scenic route.", description: "Four little islands. Plenty of sharp turns. Weave between them to break the pursuit.", length: 18, duration: 65_000, obstacles: [6, 12].flatMap(x => [7, 13].flatMap(y => [...line(x, y, 2), ...line(x, y + 1, 2)])) },
  { name: "Close Quarters", subtitle: "Make every turn count.", description: "A sheltered center and narrow openings. Draw the snake in, then find your way out.", length: 20, duration: 70_000, obstacles: [...line(7, 7, 6), ...line(7, 13, 6), ...line(7, 8, 2, true), ...line(12, 11, 2, true)] },
  { name: "The Last Bite", subtitle: "One very hungry finale.", description: "A longer hunter and a garden of blind corners. Put everything you have learned to the test.", length: 22, duration: 75_000, obstacles: [...line(4, 5, 5, true), ...line(4, 9, 3), ...line(12, 9, 5), ...line(16, 10, 5, true), ...line(8, 15, 4)] },
];

export const DIFFICULTIES: Record<Difficulty, { label: string; interval: number; commitment: number; multiplier: number; description: string }> = {
  easy: { label: "Easy", interval: 260, commitment: 4, multiplier: 1, description: "A slower snake. More time to find your feet." },
  normal: { label: "Normal", interval: 200, commitment: 3, multiplier: 1.5, description: "A fair chase. Stay one turn ahead." },
  hard: { label: "Hard", interval: 140, commitment: 2, multiplier: 2, description: "Faster, sharper, hungrier. You know the drill." },
};

export interface GameState {
  phase: Phase;
  arena: number;
  difficulty: Difficulty;
  player: Point;
  playerDirection: Direction;
  snake: Point[];
  snakeDirection: Direction;
  elapsed: number;
  score: number;
  playerClock: number;
  snakeClock: number;
  committedMoves: number;
  lunges: number;
  dashCooldown: number;
  dashFlash: number;
  trail: Point[];
  reason: EndReason | null;
}

export const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const inside = (p: Point) => p.x >= 0 && p.x < GRID && p.y >= 0 && p.y < GRID;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const occupied = (p: Point, points: Point[]) => points.some(other => equal(p, other));

export function createGame(arena = 0, difficulty: Difficulty = "normal"): GameState {
  const safeArena = Math.min(ARENAS.length - 1, Math.max(0, Math.floor(arena)));
  // Body extends behind the left-facing head; the original prototype faced into its own neck.
  const path = [...line(12, 3, 6), ...line(17, 4, 13, true), ...line(11, 16, 6).reverse()];
  return {
    phase: "ready", arena: safeArena, difficulty, player: { x: 5, y: 13 }, playerDirection: "up",
    snake: path.slice(0, ARENAS[safeArena].length), snakeDirection: "left",
    elapsed: 0, score: 0, playerClock: 0, snakeClock: 0, committedMoves: 0, lunges: 0,
    dashCooldown: 0, dashFlash: 0, trail: [], reason: null,
  };
}

export function finish(state: GameState, phase: "won" | "lost", reason: EndReason): GameState {
  return { ...state, phase, reason, score: state.score + (phase === "won" ? Math.round((1000 + state.arena * 250) * DIFFICULTIES[state.difficulty].multiplier) : 0) };
}

function movePlayer(state: GameState, direction: Direction): GameState {
  const next = add(state.player, VECTORS[direction]);
  if (!inside(next) || occupied(next, ARENAS[state.arena].obstacles)) return { ...state, playerDirection: direction };
  const moved = { ...state, player: next, playerDirection: direction };
  // The whole snake is dangerous, including when the player moves into its body.
  return occupied(next, state.snake) ? finish(moved, "lost", "caught") : moved;
}

/** A fresh key or touch press moves immediately; holding then repeats at the normal rate. */
export function steer(state: GameState, direction: Direction): GameState {
  return state.phase === "running" ? movePlayer({ ...state, playerClock: 0 }, direction) : state;
}

/** A lunge targets the food, then commits for several cells. It cannot reverse into its neck. */
export function chooseSnakeDirection(state: GameState): Direction {
  const current = VECTORS[state.snakeDirection];
  return DIRECTIONS.filter(direction => {
    const v = VECTORS[direction];
    return v.x !== -current.x || v.y !== -current.y;
  }).sort((a, b) => {
    const cost = (direction: Direction) => {
      const next = add(state.snake[0], VECTORS[direction]);
      const blocked = !inside(next) || occupied(next, ARENAS[state.arena].obstacles) || occupied(next, state.snake.slice(0, -1));
      return distance(next, state.player) + (blocked ? 100 : 0) + (direction === state.snakeDirection ? -0.2 : 0);
    };
    return cost(a) - cost(b);
  })[0];
}

export function moveSnake(state: GameState): GameState {
  const config = DIFFICULTIES[state.difficulty];
  const direction = state.committedMoves <= 0 ? chooseSnakeDirection(state) : state.snakeDirection;
  // Alternate lunge lengths. One fixed length traps the hunter on a sub-grid;
  // stopping exactly at the target's row/column makes wall baits impossible.
  const commitment = state.committedMoves <= 0 ? config.commitment - state.lunges % 2 : state.committedMoves;
  const head = add(state.snake[0], VECTORS[direction]);
  const next = { ...state, snakeDirection: direction, committedMoves: commitment - 1, lunges: state.lunges + Number(state.committedMoves <= 0) };
  if (!inside(head)) return finish(next, "won", "wall");
  if (occupied(head, ARENAS[state.arena].obstacles)) return finish(next, "won", "obstacle");
  // Moving into the tail is legal: that cell is vacated in this same tick.
  if (occupied(head, state.snake.slice(0, -1))) return finish(next, "won", "body");
  next.snake = [head, ...state.snake.slice(0, -1)];
  return equal(head, state.player) ? finish(next, "lost", "caught") : next;
}

export function dash(state: GameState, direction: Direction | null): GameState {
  if (state.phase !== "running" || state.dashCooldown > 0) return state;
  const heading = direction ?? state.playerDirection;
  let next = { ...state, dashCooldown: DASH_COOLDOWN, dashFlash: 280, trail: [] as Point[] };
  for (let i = 0; i < 3; i++) {
    next.trail.push({ ...next.player });
    next = movePlayer(next, heading);
    if (next.phase !== "running") break;
  }
  return next;
}

/** Advance by one 20ms step. Pause/ready/end states are completely inert. */
export function step(state: GameState, direction: Direction | null): GameState {
  if (state.phase !== "running") return state;
  let next: GameState = {
    ...state, elapsed: state.elapsed + STEP_MS,
    playerClock: state.playerClock + STEP_MS, snakeClock: state.snakeClock + STEP_MS,
    dashCooldown: Math.max(0, state.dashCooldown - STEP_MS), dashFlash: Math.max(0, state.dashFlash - STEP_MS),
  };
  next.score = Math.floor(next.elapsed / 100) * DIFFICULTIES[next.difficulty].multiplier;
  if (next.playerClock >= PLAYER_INTERVAL) {
    next.playerClock -= PLAYER_INTERVAL;
    if (direction) next = movePlayer(next, direction);
    if (next.phase !== "running") return next;
  }
  if (next.snakeClock >= DIFFICULTIES[next.difficulty].interval) {
    next.snakeClock -= DIFFICULTIES[next.difficulty].interval;
    next = moveSnake(next);
    if (next.phase !== "running") return next;
  }
  const arena = ARENAS[next.arena];
  if (next.elapsed >= arena.duration) return finish(next, "won", "hunger");
  const targetLength = Math.max(3, arena.length - Math.floor(next.elapsed / (arena.duration / (arena.length - 3))));
  if (next.snake.length > targetLength) next.snake = next.snake.slice(0, targetLength);
  return next;
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
