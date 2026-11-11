import assert from "node:assert/strict";
import { test } from "node:test";
import { GameInput, keyboardSource, movementDirection } from "../src/lib/input.ts";

test("mixed-case release uses the same physical key, with a normalized fallback", () => {
  const input = new GameInput();
  input.press(keyboardSource({ key: "W", code: "KeyW" }), movementDirection("W")!);
  input.release(keyboardSource({ key: "w", code: "KeyW" }));
  assert.equal(input.direction, null);
  assert.equal(keyboardSource({ key: "W", code: "" }), keyboardSource({ key: "w", code: "" }));
  assert.equal(movementDirection("ArrowLeft"), "left"); assert.equal(movementDirection("q"), null);
});

test("keyboard and multiple pointers restore the latest remaining owner", () => {
  const input = new GameInput();
  input.press("key:KeyW", "up"); input.press("pointer:1", "left"); input.press("pointer:2", "down");
  assert.equal(input.direction, "down");
  input.release("pointer:1"); assert.equal(input.direction, "down");
  input.release("pointer:2"); assert.equal(input.direction, "up");
  assert.equal(input.release("pointer:2"), false); assert.equal(input.direction, "up");
  input.clear(); assert.equal(input.direction, null);
});

test("auto-repeat cannot steal ownership from a more recently pressed source", () => {
  const input = new GameInput();
  assert(input.press("key:KeyW", "up")); assert(input.press("key:KeyA", "left"));
  assert.equal(input.press("key:KeyW", "up"), false); assert.equal(input.direction, "left");
  input.release("key:KeyA"); assert.equal(input.direction, "up");
});
