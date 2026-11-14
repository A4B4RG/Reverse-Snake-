import test from "node:test";
import assert from "node:assert/strict";
import {
  createHunter as createRectHunter,
  hunterStep,
  turnHunter,
  spawnFood,
  type HunterState,
} from "../src/lib/hunter";
import { ARENAS } from "../src/lib/game";
const createHunter=(arena=0,difficulty:Parameters<typeof createRectHunter>[1]="normal",seed=1)=>createRectHunter(arena,difficulty,seed,{columns:20,rows:20});

test("Hunter seeded food is reproducible and never occupies a wall or body", () => {
  for (let arena = 0; arena < 5; arena++)
    for (let seed = 1; seed <= 20; seed++) {
      const a = createHunter(arena, "normal", seed),
        b = createHunter(arena, "normal", seed);
      assert.deepEqual(a, b);
      assert.ok(
        ![...ARENAS[arena].obstacles, ...a.snake].some(
          (p) => p.x === a.food!.x && p.y === a.food!.y,
        ),
      );
    }
});
test("Hunter rejects reversals and buffers two successive corners", () => {
  let s: HunterState = { ...createHunter(), phase: "running" };
  assert.deepEqual(turnHunter(s, "left"), s);
  s = turnHunter(turnHunter(s, "up"), "left");
  assert.deepEqual(s.turns, ["up", "left"]);
  for (let i = 0; i < 5; i++) s = hunterStep(s);
  assert.equal(s.direction, "up");
  for (let i = 0; i < 5; i++) s = hunterStep(s);
  assert.equal(s.direction, "left");
});
test("Hunter grows on food, scores separately and resolves wall collisions", () => {
  const s = {
    ...createHunter(),
    phase: "running" as const,
    clock: 180,
    food: { x: 6, y: 3 },
  };
  const n = hunterStep(s);
  assert.equal(n.snake.length, 5);
  assert.equal(n.score, 150);
  assert.equal(
    hunterStep({
      ...n,
      snake: [{ x: 19, y: 3 }],
      direction: "right",
      clock: 180,
    }).phase,
    "lost",
  );
});
test("Hunter permits departing tail and loses to other body or obstacles", () => {
  const s = {
    ...createHunter(),
    phase: "running" as const,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
    ],
    direction: "left" as const,
    clock: 180,
  };
  assert.equal(hunterStep(s).phase, "running");
  assert.equal(
    hunterStep({ ...s, snake: [...s.snake, { x: 0, y: 2 }] }).phase,
    "lost",
  );
  assert.equal(
    hunterStep({ ...s, arena: 1, snake: [{ x: 6, y: 7 }], direction: "right" })
      .phase,
    "lost",
  );
});
test("Hunter pause is inert and a full board has no food", () => {
  const s = { ...createHunter(), phase: "paused" as const };
  assert.equal(hunterStep(s), s);
  const cells = Array.from({ length: 400 }, (_, i) => ({
    x: i % 20,
    y: Math.floor(i / 20),
  }));
  assert.equal(spawnFood(0,cells,1,{columns:20,rows:20}).food, null);
});
