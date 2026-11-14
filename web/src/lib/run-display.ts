import { createGame, type GameState } from "./game";
import { isHunter, type RunState } from "./replay";
import * as orchard4Game from "./legacy/orchard4/game";
import * as orchardGame from "./legacy/orchard3/game";
import * as originalGame from "./legacy/game";

export function displayRun(s: RunState, ruleset?: string): GameState {
  const board = s.board ?? { columns: 20, rows: 20 },
    appearance = s.appearance ?? { fruit: "mango", snake: "amber" };
  const display = isHunter(s)
    ? {
        ...createGame(
          s.arena,
          s.difficulty,
          "levels",
          board,
          s.learning,
          appearance,
        ),
        phase: s.phase,
        snake: s.snake,
        snakeDirection: s.direction,
        player: s.food ?? { x: -2, y: -2 },
        displayPowerUps: s.powerUps,
        displaySpeedRemaining: s.speedRemaining,
        displayStunRemaining: s.stunRemaining,
        score: s.score,
        elapsed: s.elapsed,
      }
    : { ...s, board, appearance };
  return ruleset === "orchard-4" ? { ...display, displayObstacles: orchard4Game.obstaclesFor(s.arena, board) } : ruleset === "orchard-3" ? { ...display, displayObstacles: orchardGame.obstaclesFor(s.arena, board) } : ruleset === "canopy-2" ? { ...display, displayObstacles: originalGame.ARENAS[s.arena].obstacles } : display;
}
