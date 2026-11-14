import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseSnakeDirection, createGame as createRectGame, finish, moveSnake, step, type GameState } from "../src/lib/game.ts";
const createGame=(arena=0,difficulty:Parameters<typeof createRectGame>[1]="normal",mode:Parameters<typeof createRectGame>[2]="levels")=>createRectGame(arena,difficulty,mode,{columns:20,rows:20});

// Wild Heart, Hard: fruit on the right of the root wall, matching the report.
const reportedState = (lunges = 0): GameState => ({
  ...createGame(4, "hard", "survival"), phase: "running", player: { x: 19, y: 11 },
  snake: [
    { x: 15, y: 10 }, { x: 15, y: 11 },
    ...Array.from({ length: 16 }, (_, i) => ({ x: 15 - i, y: 12 })),
    ...[11, 10, 9, 8].map(y => ({ x: 0, y })),
  ],
  snakeDirection: "up", lunges,
});

function pursue(game: GameState, limit = 30_000): GameState {
  for (let elapsed = 0; elapsed < limit && game.phase === "running"; elapsed += 20) game = step(game, null);
  return game;
}

test("the reported Wild Heart root wall cannot trap a hunter in an endless respawn route", () => {
  for (const lunges of [0, 1]) {
    const game = pursue(reportedState(lunges));
    assert.equal(game.phase, "lost", `lunge parity ${lunges}: ${game.escapes} resets without reaching the stationary fruit`);
    assert.equal(game.reason, "caught");
    assert.equal(game.escapes, 0, "the visible root wall is routed around rather than hit again");
  }
});

test("a stunned survival hunter resumes routing toward the current fruit position", () => {
  for (const player of [{ x: 19, y: 11 }, { x: 17, y: 14 }, { x: 19, y: 1 }]) {
    const respawn = finish({ ...reportedState(), player }, "won", "obstacle");
    const game = pursue(respawn);
    assert.equal(game.phase, "lost", `${player.x},${player.y}: ${game.escapes} resets`);
    assert.equal(game.reason, "caught");
    assert.equal(game.escapes, 1, "the fresh hunter catches the fruit without another reset");
  }
});

test("both modes plan a turn before a known wall and follow a moved target at the next lunge", () => {
  for (const mode of ["levels", "survival"] as const) {
    const corner = { ...reportedState(), mode, snake: [{ x: 18, y: 4 }, { x: 17, y: 4 }, { x: 16, y: 4 }], snakeDirection: "right" as const };
    const approaching = moveSnake(corner);
    assert.deepEqual(approaching.snake[0], { x: 19, y: 4 });
    assert.equal(approaching.committedMoves, 0, "replan at the route corner instead of overshooting the edge");
    assert.equal(chooseSnakeDirection(approaching), "down");
    assert.equal(chooseSnakeDirection({ ...approaching, player: { x: 19, y: 1 } }), "up");
  }
});

test("a mid-lunge dodge still baits a Survival crash and the stun clears the old commitment", () => {
  let game: GameState = { ...createGame(0, "easy", "survival"), phase: "running", player: { x: 19, y: 4 }, snake: [{ x: 17, y: 4 }, { x: 16, y: 4 }, { x: 15, y: 4 }], snakeDirection: "right" };
  game = moveSnake(game);
  assert.equal(game.committedMoves, 3);
  game = moveSnake({ ...game, player: { x: 19, y: 5 } });
  assert.deepEqual(game.snake[0], { x: 19, y: 4 });
  game = moveSnake(game);
  assert.equal(game.phase, "running"); assert.equal(game.escapes, 1);
  assert.equal(game.committedMoves, 0); assert(game.snakeStun > 0);
  assert.deepEqual(game.snake[0], { x: 19, y: 4 });
  assert.equal(pursue(game).phase, "lost", "the stunned hunter resumes pursuing the new fruit position");
});
