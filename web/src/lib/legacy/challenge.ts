import { createGame, step, type Direction, type GameState } from "./game";

export const CHALLENGES = [
  {
    id: "canopy-sprint",
    name: "Canopy Sprint",
    arena: 0,
    difficulty: "normal",
    seed: 1227,
    target: 15_000,
  },
  {
    id: "root-runner",
    name: "Root Runner",
    arena: 1,
    difficulty: "hard",
    seed: 8636,
    target: 20_000,
  },
  {
    id: "wild-escape",
    name: "Wild Escape",
    arena: 4,
    difficulty: "normal",
    seed: 2026,
    target: 25_000,
  },
] as const;
export type Challenge = (typeof CHALLENGES)[number];
export function createChallenge(challenge: Challenge): GameState {
  const game = createGame(challenge.arena, challenge.difficulty, "survival");
  const starts = [
    { x: 5, y: 13 },
    { x: 2, y: 13 },
    { x: 18, y: 18 },
  ];
  return { ...game, player: starts[challenge.seed % starts.length] };
}
export function challengeStep(
  s: GameState,
  direction: Direction | null,
  challenge: Challenge,
): GameState {
  const next = step(s, direction);
  return next.phase === "running" && next.elapsed >= challenge.target
    ? { ...next, phase: "won", reason: "hunger", pendingDirection: null }
    : next;
}
