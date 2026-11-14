/** Pure, fixed-step simulation. No DOM, timers, rendering, or storage lives here. */
export const GRID = 20;
export const STEP_MS = 20;
export const PLAYER_INTERVAL = 100;
export const DASH_COOLDOWN = 4000;
export const BOOST_INTERVAL = PLAYER_INTERVAL / 2;
export const CLOSE_CALL_DURATION = { levels: 2000, survival: 5000 } as const;
export const CLOSE_CALL_FLASH = 600;

export type Point = { x: number; y: number };
export type Direction = "up" | "right" | "down" | "left";
export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "levels" | "survival";
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
  { name: "Canopy Clearing", subtitle: "Your first taste of the wild.", description: "Open jungle floor. A hungry snake. Find your feet under the canopy.", length: 14, duration: 55_000, obstacles: [] },
  { name: "Root Divide", subtitle: "Pick a side. Then change it.", description: "Two mossy root walls split the clearing. Slip through the gaps and let the hunter overcommit.", length: 16, duration: 60_000, obstacles: [...line(7, 6, 7, true), ...line(12, 8, 7, true)] },
  { name: "Mango Grove", subtitle: "Take the wild way home.", description: "Four islands of mossy stone. Weave between them to break the pursuit.", length: 18, duration: 65_000, obstacles: [6, 12].flatMap(x => [7, 13].flatMap(y => [...line(x, y, 2), ...line(x, y + 1, 2)])) },
  { name: "Temple Hollow", subtitle: "Make every turn count.", description: "Ancient stones and narrow openings. Draw the snake in, then find your way out.", length: 20, duration: 70_000, obstacles: [...line(7, 7, 6), ...line(7, 13, 6), ...line(7, 8, 2, true), ...line(12, 11, 2, true)] },
  { name: "Wild Heart", subtitle: "Deep in the hunter’s territory.", description: "A longer hunter and tangled blind corners. Put everything you have learned to the test.", length: 22, duration: 75_000, obstacles: [...line(4, 5, 5, true), ...line(4, 9, 3), ...line(12, 9, 5), ...line(16, 10, 5, true), ...line(8, 15, 4)] },
];

export const DIFFICULTIES: Record<Difficulty, { label: string; interval: number; commitment: number; multiplier: number; description: string }> = {
  easy: { label: "Easy", interval: 260, commitment: 4, multiplier: 1, description: "A slower snake. More time to find your feet." },
  normal: { label: "Normal", interval: 200, commitment: 3, multiplier: 1.5, description: "A fair chase. Stay one turn ahead." },
  hard: { label: "Hard", interval: 140, commitment: 2, multiplier: 2, description: "Faster, sharper, hungrier. You know the drill." },
};

export interface GameState {
  phase: Phase;
  mode: GameMode;
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
  pendingDirection: Direction | null;
  boostRemaining: number;
  boostTrail: Point[];
  closeCalls: number;
  closeCallFlash: number;
  closeCallAt: Point | null;
  escapes: number;
  reason: EndReason | null;
}

export const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const inside = (p: Point) => p.x >= 0 && p.x < GRID && p.y >= 0 && p.y < GRID;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const occupied = (p: Point, points: Point[]) => points.some(other => equal(p, other));

export function createGame(arena = 0, difficulty: Difficulty = "normal", mode: GameMode = "levels"): GameState {
  const safeArena = Math.min(ARENAS.length - 1, Math.max(0, Math.floor(arena)));
  // Body extends behind the left-facing head; the original prototype faced into its own neck.
  const path = [...line(12, 3, 6), ...line(17, 4, 13, true), ...line(11, 16, 6).reverse()];
  return {
    phase: "ready", mode, arena: safeArena, difficulty, player: { x: 5, y: 13 }, playerDirection: "up",
    snake: path.slice(0, ARENAS[safeArena].length), snakeDirection: "left",
    elapsed: 0, score: 0, playerClock: 0, snakeClock: 0, committedMoves: 0, lunges: 0,
    dashCooldown: 0, dashFlash: 0, trail: [], reason: null,
    pendingDirection: null, boostRemaining: 0, boostTrail: [], closeCalls: 0,
    closeCallFlash: 0, closeCallAt: null, escapes: 0,
  };
}

export function finish(state: GameState, phase: "won" | "lost", reason: EndReason): GameState {
  if (phase === "won" && state.mode === "survival") {
    // Endless survival: a crash buys time, then a fresh hunter enters at a clear edge.
    // Both entry paths avoid every arena obstacle and are disjoint at these lengths.
    const top = [...line(0, 0, GRID), ...line(GRID - 1, 1, 2, true)].slice(0, ARENAS[state.arena].length);
    const bottom = top.map(p => ({ x: p.x, y: GRID - 1 - p.y }));
    const useBottom = occupied(state.player, top);
    return { ...state, snake: useBottom ? bottom : top, snakeDirection: useBottom ? "up" : "down", snakeClock: 0, committedMoves: 0, lunges: 0, escapes: state.escapes + 1, reason: null };
  }
  return { ...state, phase, reason, pendingDirection: null, score: state.score + (phase === "won" ? Math.round((1000 + state.arena * 250) * DIFFICULTIES[state.difficulty].multiplier) : 0) };
}

function movePlayer(state: GameState, direction: Direction): GameState {
  const next = add(state.player, VECTORS[direction]);
  if (!inside(next) || occupied(next, ARENAS[state.arena].obstacles)) return { ...state, playerDirection: direction };
  let moved = { ...state, player: next, playerDirection: direction };
  // The whole snake is dangerous, including when the player moves into its body.
  if (occupied(next, state.snake)) return finish(moved, "lost", "caught");
  // A close call is a safe exit from the head's adjacent cell. Standing still,
  // brushing the tail, and blocked moves cannot award or refresh a boost.
  if (distance(state.player, state.snake[0]) === 1 && distance(next, state.snake[0]) > 1) {
    moved = { ...moved, boostRemaining: CLOSE_CALL_DURATION[state.mode], closeCalls: state.closeCalls + 1, closeCallFlash: CLOSE_CALL_FLASH, closeCallAt: state.player };
  }
  if (moved.boostRemaining > 0) moved.boostTrail = [...state.boostTrail, state.player].slice(-6);
  return moved;
}

/** Buffer the latest press; taps and held inputs share the fixed movement budget. */
export function steer(state: GameState, direction: Direction): GameState {
  return state.phase === "running" ? { ...state, pendingDirection: direction } : state;
}

/** Shortest walking distances to the current fruit, avoiding stones and body.
 * The departing tail remains traversable, just as it is in collision handling.
 * Rebuild at each lunge so movement/respawns cannot retain an obsolete route.
 */
function pursuitDistances(state: GameState): number[] {
  const index = (point: Point) => point.y * GRID + point.x;
  const blocked = new Set([...ARENAS[state.arena].obstacles, ...state.snake.slice(0, -1)].map(index));
  const distances = Array<number>(GRID * GRID).fill(Infinity);
  const queue = [state.player];
  distances[index(state.player)] = 0;
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    for (const direction of DIRECTIONS) {
      const next = add(point, VECTORS[direction]);
      if (!inside(next) || blocked.has(index(next)) || distances[index(next)] !== Infinity) continue;
      distances[index(next)] = distances[index(point)] + 1;
      queue.push(next);
    }
  }
  return distances;
}

/** A lunge targets the food, then commits for several cells. It cannot reverse into its neck. */
export function chooseSnakeDirection(state: GameState): Direction {
  return selectSnakeDirection(state, pursuitDistances(state));
}

function selectSnakeDirection(state: GameState, routes: number[]): Direction {
  const current = VECTORS[state.snakeDirection];
  return DIRECTIONS.filter(direction => {
    const v = VECTORS[direction];
    return v.x !== -current.x || v.y !== -current.y;
  }).sort((a, b) => {
    const cost = (direction: Direction) => {
      const next = add(state.snake[0], VECTORS[direction]);
      const blocked = !inside(next) || occupied(next, ARENAS[state.arena].obstacles) || occupied(next, state.snake.slice(0, -1));
      if (blocked) return Infinity;
      const route = routes[next.y * GRID + next.x];
      // If the moving body temporarily cuts off the fruit, keep moving through
      // legal cells until a route opens rather than choosing a blocked shortcut.
      const pursuit = Number.isFinite(route) ? route : GRID * GRID + distance(next, state.player);
      return pursuit + (direction === state.snakeDirection ? -0.2 : 0);
    };
    return cost(a) - cost(b);
  })[0];
}

export function moveSnake(state: GameState): GameState {
  const config = DIFFICULTIES[state.difficulty];
  const planning = state.committedMoves <= 0;
  // Both modes must anticipate arena walls; an idle fruit is not a wall bait.
  const routes = planning ? pursuitDistances(state) : null;
  const direction = routes ? selectSnakeDirection(state, routes) : state.snakeDirection;
  // Alternate lunge lengths. One fixed length traps the hunter on a sub-grid;
  // stopping exactly at the target's row/column makes wall baits impossible.
  let commitment = planning ? config.commitment - state.lunges % 2 : state.committedMoves;
  if (routes) {
    // Stop a newly planned lunge at a known route corner. Otherwise a longer
    // straight commitment can overshoot that corner into the same wall forever.
    // Reaching the target keeps the full lunge: a mid-lunge dodge can still bait
    // a crash, and an already committed hunter never redirects retroactively.
    let point = add(state.snake[0], VECTORS[direction]);
    for (let moves = 1; moves < commitment; moves++) {
      if (equal(point, state.player)) break;
      const following = add(point, VECTORS[direction]);
      const remaining = routes[point.y * GRID + point.x];
      if (!inside(following) || !Number.isFinite(remaining) || routes[following.y * GRID + following.x] !== remaining - 1) {
        commitment = moves;
        break;
      }
      point = following;
    }
  }
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
    boostRemaining: Math.max(0, state.boostRemaining - STEP_MS), closeCallFlash: Math.max(0, state.closeCallFlash - STEP_MS),
    boostTrail: state.boostRemaining > STEP_MS ? state.boostTrail : [],
  };
  next.score = Math.floor(next.elapsed / 100) * DIFFICULTIES[next.difficulty].multiplier;
  const interval = state.boostRemaining > 0 ? BOOST_INTERVAL : PLAYER_INTERVAL;
  if (next.playerClock >= interval) {
    const heading = next.pendingDirection ?? direction;
    // Consume unused time too: an idle player cannot bank a burst of moves.
    next.playerClock %= interval;
    next.pendingDirection = null;
    if (heading) next = movePlayer(next, heading);
    if (next.phase !== "running") return next;
  }
  if (next.snakeClock >= DIFFICULTIES[next.difficulty].interval) {
    next.snakeClock -= DIFFICULTIES[next.difficulty].interval;
    next = moveSnake(next);
    if (next.phase !== "running") return next;
  }
  const arena = ARENAS[next.arena];
  if (next.mode === "survival") return next;
  if (next.elapsed >= arena.duration) return finish(next, "won", "hunger");
  const targetLength = Math.max(3, arena.length - Math.floor(next.elapsed / (arena.duration / (arena.length - 3))));
  if (next.snake.length > targetLength) next.snake = next.snake.slice(0, targetLength);
  return next;
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
