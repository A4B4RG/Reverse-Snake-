/** Pure, fixed-step simulation. No DOM, timers, rendering, or storage lives here. */
import {
  DEFAULT_BOARD,
  fitSnake,
  inBoard,
  nearestFree,
  project,
  scaleObstacles,
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
/** Original authored terrain coordinates, never the live board dimensions. */
export const GRID = 20;
export const STEP_MS = 20;
export const PLAYER_INTERVAL = 100;
export const playerInterval = (difficulty: Difficulty) => difficulty === "hard" ? 120 : PLAYER_INTERVAL;
export const DASH_COOLDOWN = 4000;
export const BOOST_INTERVAL = PLAYER_INTERVAL / 2;
export const CLOSE_CALL_DURATION = { levels: 2000, survival: 5000 } as const;
export const CLOSE_CALL_FLASH = 600;

export type Point = { x: number; y: number };
export type Direction = "up" | "right" | "down" | "left";
export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "levels" | "survival";
export type Phase = "ready" | "running" | "paused" | "won" | "lost";
export type EndReason = "wall" | "body" | "obstacle" | "hunger" | "caught" | "target" | "retired";
export type Arena = {
  name: string;
  subtitle: string;
  description: string;
  length: number;
  duration: number;
  scoreTarget: number;
  obstacles: Point[];
};

export const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
const DIRECTIONS: Direction[] = ["up", "right", "down", "left"];
const line = (x: number, y: number, count: number, vertical = false): Point[] =>
  Array.from({ length: count }, (_, i) => ({
    x: x + (vertical ? 0 : i),
    y: y + (vertical ? i : 0),
  }));

export const ARENAS: Arena[] = [
  {
    name: "Canopy Clearing",
    subtitle: "Your first taste of the wild.",
    description:
      "Scattered root corners and open exits. Find your feet under the canopy.",
    length: 14,
    duration: 55_000,
    scoreTarget: 150,
    obstacles: [...line(6, 6, 5), ...line(6, 6, 3, true), ...line(12, 12, 4), ...line(15, 10, 3, true), ...line(8, 16, 4), ...line(3, 4, 3, true), ...line(12, 5, 5), ...line(3, 15, 3), ...line(16, 16, 2, true)],
  },
  {
    name: "Root Divide",
    subtitle: "Pick a side. Then change it.",
    description:
      "Two mossy root walls split the clearing. Slip through the gaps and let the hunter overcommit.",
    length: 16,
    duration: 60_000,
    scoreTarget: 250,
    obstacles: [...line(7, 4, 10, true), ...line(12, 7, 10, true), ...line(3, 8, 5), ...line(12, 12, 5), ...line(3, 16, 5)],
  },
  {
    name: "Orchard Grove",
    subtitle: "Take the wild way home.",
    description:
      "Four islands of mossy stone. Weave between them to break the pursuit.",
    length: 18,
    duration: 65_000,
    scoreTarget: 350,
    obstacles: [5, 12].flatMap((x) =>
      [6, 13].flatMap((y) => [0, 1, 2].flatMap((dy) => line(x, y + dy, 3))),
    ),
  },
  {
    name: "Temple Hollow",
    subtitle: "Make every turn count.",
    description:
      "Ancient stones and narrow openings. Draw the snake in, then find your way out.",
    length: 20,
    duration: 70_000,
    scoreTarget: 450,
    obstacles: [
      ...line(4, 5, 12), ...line(4, 15, 12),
      ...line(4, 6, 4, true), ...line(15, 11, 4, true),
      ...line(8, 9, 4), ...line(8, 10, 3, true),
    ],
  },
  {
    name: "Wild Heart",
    subtitle: "Deep in the hunter’s territory.",
    description:
      "A longer hunter and tangled blind corners. Put everything you have learned to the test.",
    length: 22,
    duration: 75_000,
    scoreTarget: 550,
    obstacles: [
      ...line(4, 5, 5, true),
      ...line(4, 9, 3),
      ...line(12, 9, 5),
      ...line(16, 10, 5, true),
      ...line(8, 15, 4),
      ...line(8, 4, 7), ...line(8, 4, 4, true), ...line(4, 13, 3, true), ...line(12, 12, 3, true),
    ],
  },
  { name: "Bamboo Lanes", subtitle: "Turn between the stems.", description: "Alternating bamboo walls form long lanes and quick corners.", length: 23, duration: 80_000, scoreTarget: 650, obstacles: [4, 8, 12, 16].flatMap((x, i) => line(x, i % 2 ? 8 : 4, 9, true)) },
  { name: "River Switchbacks", subtitle: "Follow the bends.", description: "Staggered river banks leave narrow crossings between broad turns.", length: 24, duration: 85_000, scoreTarget: 800, obstacles: [5, 9, 13, 17].flatMap((y, i) => line(i % 2 ? 7 : 3, y, 10)) },
  { name: "Ruined Courtyard", subtitle: "Find the broken gates.", description: "Broken outer walls surround a second courtyard with offset entrances.", length: 25, duration: 90_000, scoreTarget: 950, obstacles: [...line(3, 4, 13), ...line(3, 16, 13), ...line(3, 5, 7, true), ...line(16, 9, 8, true), ...line(7, 8, 6), ...line(7, 12, 6), ...line(12, 9, 3, true)] },
  { name: "Thorn Labyrinth", subtitle: "Every corner is a choice.", description: "Interlocking thorn walls reward sharp turns and planned exits.", length: 26, duration: 95_000, scoreTarget: 1100, obstacles: [...line(4, 4, 11, true), ...line(4, 4, 7), ...line(8, 8, 9), ...line(8, 8, 8, true), ...line(12, 4, 3, true), ...line(12, 12, 5), ...line(16, 12, 5, true), ...line(3, 17, 10)] },
  { name: "Crown Maze", subtitle: "Master the deep canopy.", description: "Nested broken walls and staggered baffles make the final chase a maze.", length: 28, duration: 100_000, scoreTarget: 1300, obstacles: [...line(3, 4, 14), ...line(3, 17, 14), ...line(3, 5, 8, true), ...line(16, 9, 8, true), ...line(7, 7, 6), ...line(7, 13, 6), ...line(7, 8, 3, true), ...line(12, 10, 3, true), ...line(10, 16, 3, true)] },
];

export const DIFFICULTIES: Record<
  Difficulty,
  {
    label: string;
    interval: number;
    commitment: number;
    multiplier: number;
    description: string;
  }
> = {
  easy: {
    label: "Easy",
    interval: 200,
    commitment: 4,
    multiplier: 1,
    description: "A slower snake. More time to find your feet.",
  },
  normal: {
    label: "Normal",
    interval: 100,
    commitment: 3,
    multiplier: 1.5,
    description: "A fair chase. Stay one turn ahead.",
  },
  hard: {
    label: "Hard",
    interval: 80,
    commitment: 2,
    multiplier: 2,
    description: "Faster, sharper, hungrier. You know the drill.",
  },
};

export interface GameState {
  displayObstacles?: Point[];
  displayPowerUps?: { kind: "speed" | "stun"; position: Point }[];
  displaySpeedRemaining?: number;
  displayStunRemaining?: number;
  levelCleared: boolean;
  board: Board;
  appearance: Appearance;
  learning: Learning;
  lastPlayerMove: number;
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
export const inside = (p: Point, board: Board = DEFAULT_BOARD) =>
  inBoard(p, board);
const terrainCache = new Map<string, Point[]>();
export function obstaclesFor(arena: number, board: Board): Point[] {
  const key = `${arena}:${board.columns}:${board.rows}`;
  let terrain = terrainCache.get(key);
  if (!terrain) {
    terrain = scaleObstacles(ARENAS[arena].obstacles, board);
    if (terrainCache.size >= 80) terrainCache.delete(terrainCache.keys().next().value!);
    terrainCache.set(key, terrain);
  }
  return terrain;
}
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const distance = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const occupied = (p: Point, points: Point[]) =>
  points.some((other) => equal(p, other));

export function createGame(
  arena = 0,
  difficulty: Difficulty = "normal",
  mode: GameMode = "levels",
  board: Board = DEFAULT_BOARD,
  learning: Learning = createLearning(),
  appearance: Appearance = DEFAULT_APPEARANCE,
): GameState {
  const safeArena = Math.min(ARENAS.length - 1, Math.max(0, Math.floor(arena)));
  const obstacles = obstaclesFor(safeArena, board);
  const x = Math.round(board.columns * 0.6),
    y = Math.floor(board.rows * 0.15),
    edge = board.columns - 3,
    bottom = board.rows - 4;
  const entry = [
    ...line(x, y, edge - x + 1),
    ...line(edge, y + 1, bottom - y, true),
    ...line(0, bottom, edge).reverse(),
  ];
  const path = entry
    .slice(0, ARENAS[safeArena].length)
    .some((p) => occupied(p, obstacles))
    ? fitSnake({ x, y }, ARENAS[safeArena].length, "left", board, obstacles)
    : entry.slice(0, ARENAS[safeArena].length);
  const player = nearestFree(
    { x: Math.floor(board.columns * 0.25), y: Math.floor(board.rows * 0.65) },
    board,
    [...obstacles, ...path],
  );
  return {
    board,
    learning,
    appearance,
    lastPlayerMove: -1000,
    levelCleared: false,
    phase: "ready",
    mode,
    arena: safeArena,
    difficulty,
    player,
    playerDirection: "up",
    snake: path.slice(0, ARENAS[safeArena].length),
    snakeDirection: "left",
    elapsed: 0,
    score: 0,
    playerClock: 0,
    snakeClock: 0,
    committedMoves: 0,
    lunges: 0,
    dashCooldown: 0,
    dashFlash: 0,
    trail: [],
    reason: null,
    pendingDirection: null,
    boostRemaining: 0,
    boostTrail: [],
    closeCalls: 0,
    closeCallFlash: 0,
    closeCallAt: null,
    escapes: 0,
  };
}

export function finish(
  state: GameState,
  phase: "won" | "lost",
  reason: EndReason,
): GameState {
  if (phase === "won" && (state.mode === "survival" || reason !== "target")) {
    const obstacles = obstaclesFor(state.arena, state.board);
    const head = nearestFree(
      {
        x:
          state.player.x < state.board.columns / 2
            ? state.board.columns - 1
            : 0,
        y: state.player.y < state.board.rows / 2 ? state.board.rows - 1 : 0,
      },
      state.board,
      [...obstacles, state.player],
    );
    const heading: Direction = head.y > state.board.rows / 2 ? "up" : "down";
    const snake = fitSnake(
      head,
      ARENAS[state.arena].length,
      heading,
      state.board,
      [...obstacles, state.player],
    );
    return {
      ...state,
      snake,
      snakeDirection: heading,
      snakeClock: 0,
      committedMoves: 0,
      lunges: 0,
      escapes: state.escapes + 1,
      reason: null,
    };
  }
  return {
    ...state,
    phase,
    reason,
    pendingDirection: null,
    score: Math.floor(state.score),
  };
}

function movePlayer(state: GameState, direction: Direction): GameState {
  const next = add(state.player, VECTORS[direction]);
  if (
    !inside(next, state.board) ||
    occupied(next, obstaclesFor(state.arena, state.board))
  )
    return { ...state, playerDirection: direction };
  const legal = MOVES.map((d) => {
    const p = add(state.player, VECTORS[d]);
    return (
      inside(p, state.board) &&
      !occupied(p, [...obstaclesFor(state.arena, state.board), ...state.snake])
    );
  });
  let moved = {
    ...state,
    player: next,
    playerDirection: direction,
    lastPlayerMove: state.elapsed,
    score: state.score,
  };
  if (!occupied(next, state.snake))
    moved = {
      ...moved,
      learning: {
        ...state.learning,
        fruit: train(
          state.learning.fruit,
          features(
            state.player,
            state.snake[0],
            state.playerDirection,
            state.board,
            legal,
          ),
          direction,
        ),
      },
    };
  // The whole snake is dangerous, including when the player moves into its body.
  if (occupied(next, state.snake)) return finish(moved, "lost", "caught");
  if (state.mode === "levels") moved.score += DIFFICULTIES[state.difficulty].multiplier;
  // A close call is a safe exit from the head's adjacent cell. Standing still,
  // brushing the tail, and blocked moves cannot award or refresh a boost.
  if (
    distance(state.player, state.snake[0]) === 1 &&
    distance(next, state.snake[0]) > 1
  ) {
    moved = {
      ...moved,
      boostRemaining: CLOSE_CALL_DURATION[state.mode],
      closeCalls: state.closeCalls + 1,
      closeCallFlash: CLOSE_CALL_FLASH,
      closeCallAt: state.player,
    };
  }
  if (moved.boostRemaining > 0)
    moved.boostTrail = [...state.boostTrail, state.player].slice(-6);
  return moved;
}

/** Buffer the latest press; taps and held inputs share the fixed movement budget. */
export function steer(state: GameState, direction: Direction): GameState {
  return state.phase === "running"
    ? { ...state, pendingDirection: direction }
    : state;
}

/** Shortest walking distances to the current fruit, avoiding stones and body.
 * The departing tail remains traversable, just as it is in collision handling.
 * Rebuild at each lunge so movement/respawns cannot retain an obsolete route.
 */
function pursuitDistances(
  state: GameState,
  target: Point = state.player,
): number[] {
  const index = (point: Point) => point.y * state.board.columns + point.x;
  const blocked = new Set(
    [
      ...obstaclesFor(state.arena, state.board),
      ...state.snake.slice(0, -1),
    ].map(index),
  );
  const distances = Array<number>(state.board.columns * state.board.rows).fill(
    Infinity,
  );
  const queue = [target];
  distances[index(target)] = 0;
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    for (const direction of DIRECTIONS) {
      const next = add(point, VECTORS[direction]);
      if (
        !inside(next, state.board) ||
        blocked.has(index(next)) ||
        distances[index(next)] !== Infinity
      )
        continue;
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
  const legal = MOVES.map((d) => {
    const p = add(state.snake[0], VECTORS[d]);
    return (
      inside(p, state.board) &&
      !occupied(p, [
        ...obstaclesFor(state.arena, state.board),
        ...state.snake.slice(0, -1),
      ])
    );
  });
  const learned = infer(
    state.learning.snake,
    features(
      state.snake[0],
      state.player,
      state.snakeDirection,
      state.board,
      legal,
    ),
  );
  const influence =
    state.lastPlayerMove + 600 >= state.elapsed &&
    state.learning.snake.samples >= 8
      ? { easy: 0.4, normal: 1.4, hard: 2.4 }[state.difficulty]
      : 0;
  const current = VECTORS[state.snakeDirection];
  return DIRECTIONS.filter((direction) => {
    const v = VECTORS[direction];
    return v.x !== -current.x || v.y !== -current.y;
  }).sort((a, b) => {
    const cost = (direction: Direction) => {
      const next = add(state.snake[0], VECTORS[direction]);
      const blocked =
        !inside(next, state.board) ||
        occupied(next, obstaclesFor(state.arena, state.board)) ||
        occupied(next, state.snake.slice(0, -1));
      if (blocked) return Infinity;
      const route = routes[next.y * state.board.columns + next.x];
      // If the moving body temporarily cuts off the fruit, keep moving through
      // legal cells until a route opens rather than choosing a blocked shortcut.
      const pursuit = Number.isFinite(route)
        ? route
        : state.board.columns * state.board.rows + distance(next, state.player);
      return (
        pursuit -
        learned[MOVES.indexOf(direction)] * influence +
        (direction === state.snakeDirection ? -0.2 : 0)
      );
    };
    return cost(a) - cost(b);
  })[0];
}

export function moveSnake(state: GameState): GameState {
  const config = DIFFICULTIES[state.difficulty];
  const planning = state.committedMoves <= 0;
  // Both modes must anticipate arena walls; an idle fruit is not a wall bait.
  let target = state.player;
  if (
    planning &&
    state.learning.fruit.samples >= 8 &&
    state.lastPlayerMove + 400 >= state.elapsed &&
    (state.difficulty !== "easy" || state.lunges % 3 === 0)
  ) {
    const legal = MOVES.map((d) => {
      const p = add(target, VECTORS[d]);
      return (
        inside(p, state.board) &&
        !occupied(p, [
          ...obstaclesFor(state.arena, state.board),
          ...state.snake,
        ])
      );
    });
    const probabilities = infer(
      state.learning.fruit,
      features(
        target,
        state.snake[0],
        state.playerDirection,
        state.board,
        legal,
      ),
    );
    const index = probabilities.indexOf(Math.max(...probabilities));
    if (
      legal[index] &&
      probabilities[index] >
        { easy: 0.55, normal: 0.4, hard: 0.3 }[state.difficulty]
    )
      target = add(target, VECTORS[MOVES[index]]);
  }
  const routes = planning ? pursuitDistances(state, target) : null;
  const direction = routes
    ? selectSnakeDirection(state, routes)
    : state.snakeDirection;
  // Alternate lunge lengths. One fixed length traps the hunter on a sub-grid;
  // stopping exactly at the target's row/column makes wall baits impossible.
  let commitment = planning
    ? config.commitment - (state.lunges % 2)
    : state.committedMoves;
  if (routes) {
    // Stop a newly planned lunge at a known route corner. Otherwise a longer
    // straight commitment can overshoot that corner into the same wall forever.
    // Reaching the target keeps the full lunge: a mid-lunge dodge can still bait
    // a crash, and an already committed hunter never redirects retroactively.
    let point = add(state.snake[0], VECTORS[direction]);
    for (let moves = 1; moves < commitment; moves++) {
      if (equal(point, target)) break;
      const following = add(point, VECTORS[direction]);
      const remaining = routes[point.y * state.board.columns + point.x];
      if (
        !inside(following, state.board) ||
        !Number.isFinite(remaining) ||
        routes[following.y * state.board.columns + following.x] !==
          remaining - 1
      ) {
        commitment = moves;
        break;
      }
      point = following;
    }
  }
  const head = add(state.snake[0], VECTORS[direction]);
  const next = {
    ...state,
    snakeDirection: direction,
    committedMoves: commitment - 1,
    lunges: state.lunges + Number(state.committedMoves <= 0),
  };
  if (!inside(head, state.board)) return finish(next, "won", "wall");
  if (occupied(head, obstaclesFor(state.arena, state.board)))
    return finish(next, "won", "obstacle");
  // Moving into the tail is legal: that cell is vacated in this same tick.
  if (occupied(head, state.snake.slice(0, -1)))
    return finish(next, "won", "body");
  next.snake = [head, ...state.snake.slice(0, -1)];
  return equal(head, state.player) ? finish(next, "lost", "caught") : next;
}

export function dash(state: GameState, direction: Direction | null): GameState {
  if (state.phase !== "running" || state.dashCooldown > 0) return state;
  const heading = direction ?? state.playerDirection;
  let next = {
    ...state,
    dashCooldown: DASH_COOLDOWN,
    dashFlash: 280,
    trail: [] as Point[],
  };
  for (let i = 0; i < 3; i++) {
    next.trail.push({ ...next.player });
    next = movePlayer(next, heading);
    if (next.phase !== "running") break;
  }
  return qualifyLevel(next);
}

export function qualifyLevel(state: GameState): GameState {
  return state.phase === "running" && state.mode === "levels" && !state.levelCleared && state.score >= ARENAS[state.arena].scoreTarget
    ? { ...state, levelCleared: true } : state;
}
export function endChase(state: GameState): GameState {
  if (!["running", "paused"].includes(state.phase)) return state;
  return { ...state, phase: state.levelCleared ? "won" : "lost", reason: "retired", pendingDirection: null };
}

/** Advance by one 20ms step. Pause/ready/end states are completely inert. */
export function step(state: GameState, direction: Direction | null): GameState {
  if (state.phase !== "running") return state;
  let next: GameState = {
    ...state,
    elapsed: state.elapsed + STEP_MS,
    playerClock: state.playerClock + STEP_MS,
    snakeClock: state.snakeClock + STEP_MS,
    dashCooldown: Math.max(0, state.dashCooldown - STEP_MS),
    dashFlash: Math.max(0, state.dashFlash - STEP_MS),
    boostRemaining: Math.max(0, state.boostRemaining - STEP_MS),
    closeCallFlash: Math.max(0, state.closeCallFlash - STEP_MS),
    boostTrail: state.boostRemaining > STEP_MS ? state.boostTrail : [],
  };
  next.score = state.mode === "levels" ? state.score : Math.floor(next.elapsed / 100) * DIFFICULTIES[next.difficulty].multiplier;
  const interval = playerInterval(state.difficulty) / (state.boostRemaining > 0 ? 2 : 1);
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
  next = qualifyLevel(next);
  const targetLength = Math.max(
    3,
    arena.length -
      Math.floor(Math.min(next.score, arena.scoreTarget) / (arena.scoreTarget / (arena.length - 3))),
  );
  if (next.snake.length > targetLength)
    next.snake = next.snake.slice(0, targetLength);
  return next;
}

export function resizeGame(state: GameState, board: Board): GameState {
  if (state.board.columns === board.columns && state.board.rows === board.rows)
    return state;
  const obstacles = obstaclesFor(state.arena, board);
  const player = nearestFree(
    project(state.player, state.board, board),
    board,
    obstacles,
  );
  const snake = fitSnake(
    project(state.snake[0], state.board, board),
    state.snake.length,
    state.snakeDirection,
    board,
    [...obstacles, player],
  );
  return {
    ...state,
    board,
    player,
    snake,
    committedMoves: 0,
    trail: [],
    boostTrail: [],
    closeCallAt: null,
  };
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
