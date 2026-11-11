import assert from "node:assert/strict";
import { test } from "node:test";
import { ARENAS, CLOSE_CALL_DURATION, createGame, dash, equal, finish, step, steer, type GameState } from "../src/lib/game.ts";

const running = (overrides: Partial<GameState> = {}): GameState => ({ ...createGame(), phase: "running", snakeClock: -1000000, ...overrides });
const nearHead = (overrides: Partial<GameState> = {}) => running({ player: { x: 11, y: 3 }, playerClock: 80, ...overrides });

test("rapid taps and a held direction get the same movement budget", () => {
  let tapped = running(), held = running();
  for (let tick = 0; tick < 25; tick++) {
    for (let press = 0; press < 10; press++) tapped = steer(tapped, "left");
    tapped = step(tapped, null); held = step(held, "left");
    assert.deepEqual(tapped.player, held.player);
  }
  assert.equal(tapped.elapsed, 500); assert.equal(tapped.player.x, 0);
});

test("idle time cannot be banked for a burst, and the latest tap wins", () => {
  let game = running();
  for (let i = 0; i < 23; i++) game = step(game, null);
  game = steer(steer(game, "left"), "up");
  game = step(game, null); assert.deepEqual(game.player, { x: 5, y: 13 });
  game = step(game, null); assert.deepEqual(game.player, { x: 5, y: 12 });
  for (let i = 0; i < 10; i++) game = step(game, null);
  assert.deepEqual(game.player, { x: 5, y: 12 });
});

test("a safe head dodge grants 2s in levels and 5s in survival, with feedback", () => {
  for (const mode of ["levels", "survival"] as const) {
    const game = step(nearHead({ mode }), "left");
    assert.equal(game.phase, "running"); assert.equal(game.closeCalls, 1);
    assert.equal(game.boostRemaining, CLOSE_CALL_DURATION[mode]);
    assert.equal(game.closeCallFlash, 600); assert.deepEqual(game.closeCallAt, { x: 11, y: 3 });
    assert.deepEqual(game.boostTrail, [{ x: 11, y: 3 }]);
  }
});

test("every qualifying dodge refreshes the full timer, even during an existing boost or dash recharge", () => {
  for (const mode of ["levels", "survival"] as const) {
    let game = step(nearHead({ mode, boostRemaining: 1000, closeCalls: 2, dashCooldown: 3000, playerClock: 40 }), "left");
    assert.equal(game.boostRemaining, CLOSE_CALL_DURATION[mode]); assert.equal(game.closeCalls, 3);
    // Return adjacent, then immediately dodge again: there is no cooldown.
    game = step({ ...game, playerClock: 40 }, "right");
    game = step({ ...game, playerClock: 40 }, "left");
    assert.equal(game.boostRemaining, CLOSE_CALL_DURATION[mode]); assert.equal(game.closeCalls, 4);
  }
});

test("boost doubles sustained movement and expires after exactly the mode's active time", () => {
  for (const mode of ["levels", "survival"] as const) {
    let game = running({ mode, boostRemaining: CLOSE_CALL_DURATION[mode] });
    let moves = 0;
    for (let i = 0; i < CLOSE_CALL_DURATION[mode] / 20; i++) {
      const old = game.player;
      game = step(game, game.player.x > 5 ? "left" : "right");
      moves += Number(!equal(old, game.player));
    }
    assert.equal(moves, CLOSE_CALL_DURATION[mode] / 50);
    assert.equal(game.boostRemaining, 0); assert.deepEqual(game.boostTrail, []);
    for (let i = 0; i < 50; i++) {
      const old = game.player; game = step(game, game.player.x > 5 ? "left" : "right");
      moves += Number(!equal(old, game.player));
    }
    assert.equal(moves, CLOSE_CALL_DURATION[mode] / 50 + 10);
  }
});

test("pause freezes all boost state and restart clears it", () => {
  const game = { ...step(nearHead(), "left"), phase: "paused" as const };
  assert.equal(step(game, "left"), game); assert.equal(dash(game, "left"), game);
  const restarted = createGame(game.arena, game.difficulty, game.mode);
  assert.equal(restarted.boostRemaining, 0); assert.equal(restarted.closeCalls, 0);
  assert.equal(restarted.closeCallFlash, 0); assert.equal(restarted.closeCallAt, null);
});

test("standing near the head, blocked exits, body proximity, and collisions give no boost", () => {
  assert.equal(step(nearHead(), null).closeCalls, 0);
  assert.equal(step(running({ player: { x: 0, y: 5 }, snake: [{ x: 1, y: 5 }], playerClock: 80 }), "left").closeCalls, 0);
  assert.equal(step(running({ arena: 1, player: { x: 6, y: 6 }, snake: [{ x: 5, y: 6 }], playerClock: 80 }), "right").closeCalls, 0);
  assert.equal(step(running({ player: { x: 16, y: 5 }, playerClock: 80 }), "left").closeCalls, 0);
  const caught = step(nearHead(), "right");
  assert.equal(caught.phase, "lost"); assert.equal(caught.closeCalls, 0);
  const crossedBody = step(nearHead({ snake: [{ x: 12, y: 3 }, { x: 12, y: 4 }, { x: 11, y: 4 }] }), "down");
  assert.equal(crossedBody.phase, "lost"); assert.equal(crossedBody.closeCalls, 0);
});

test("a safe dash can trigger a close call; it still cannot cross the snake", () => {
  const game = dash(nearHead(), "left");
  assert.equal(game.boostRemaining, 2000); assert.equal(game.closeCalls, 1);
  assert.equal(game.dashCooldown, 4000); assert.equal(game.player.x, 8);
  assert.equal(dash(nearHead(), "right").phase, "lost");
});

test("survival keeps the hunter's length beyond a level's hunger deadline", () => {
  let game = running({ mode: "survival", elapsed: ARENAS[0].duration - 20 });
  for (let i = 0; i < 100; i++) game = step(game, null);
  assert.equal(game.phase, "running"); assert.equal(game.snake.length, ARENAS[0].length);
});

test("every survival respawn is connected, clear of fruit/obstacles, and carries the active boost", () => {
  ARENAS.forEach((arena, index) => {
    for (const player of [{ x: 0, y: 0 }, { x: 0, y: 19 }, { x: 19, y: 1 }, { x: 5, y: 13 }]) {
      const game = finish(running({ arena: index, mode: "survival", player, boostRemaining: 1234 }), "won", "wall");
      assert.equal(game.phase, "running"); assert.equal(game.escapes, 1); assert.equal(game.reason, null);
      assert.equal(game.boostRemaining, 1234); assert.equal(game.snake.length, arena.length);
      assert(!game.snake.some(p => equal(p, player) || arena.obstacles.some(o => equal(o, p))));
      game.snake.slice(1).forEach((p, i) => assert.equal(Math.abs(p.x - game.snake[i].x) + Math.abs(p.y - game.snake[i].y), 1));
    }
  });
});
