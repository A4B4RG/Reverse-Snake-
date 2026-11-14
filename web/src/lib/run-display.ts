import { createGame, type GameState } from "./game";
import { isHunter, type RunState } from "./replay";

export function displayRun(s: RunState): GameState {
  const board = s.board ?? { columns: 20, rows: 20 },
    appearance = s.appearance ?? { fruit: "mango", snake: "amber" };
  return isHunter(s)
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
        score: s.score,
        elapsed: s.elapsed,
      }
    : { ...s, board, appearance };
}
