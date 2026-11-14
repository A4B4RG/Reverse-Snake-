import assert from "node:assert/strict";
import test from "node:test";
import { effectiveFrameRate, touchThreshold, type FrameRate } from "../src/lib/settings";
import { swipeDirection } from "../src/lib/input";
import { readExtraRecords } from "../src/lib/extra-records";
import { GAME_VERSION, RULESET } from "../src/lib/replay";

test("phone frame limits respect display support and retain universal base/smooth choices", () => {
  for (const rate of [30,60] as FrameRate[]) for (const hz of [30,60,90,120]) assert.equal(effectiveFrameRate(rate, true, hz), rate);
  for (const requested of [90,120] as FrameRate[]) {
    assert.equal(effectiveFrameRate(requested, true, 60), 60);
    assert.equal(effectiveFrameRate(requested, true, 90), 90);
    assert.equal(effectiveFrameRate(requested, true, 120), 90);
    assert.equal(effectiveFrameRate(requested, false, 120), requested);
  }
});

test("sensitivity affects steering while taps and ambiguous diagonals remain inert", () => {
  assert.equal(swipeDirection(20, 0, touchThreshold(1)), null);
  assert.equal(swipeDirection(20, 0, touchThreshold(10)), "right");
  assert.equal(swipeDirection(-20, 0, touchThreshold(10)), "left");
  assert.equal(swipeDirection(0, -20, touchThreshold(10)), "up");
  assert.equal(swipeDirection(0, 20, touchThreshold(10)), "down");
  for (let sensitivity = 1; sensitivity <= 10; sensitivity++) {
    assert.equal(swipeDirection(8, 3, touchThreshold(sensitivity)), null);
    assert.equal(swipeDirection(50, 50, touchThreshold(sensitivity)), null);
  }
});

test("record migration admits supported version pairs and rejects unknown or mismatched rules", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const base = { meta: { mode: "hunter", arena: 0, difficulty: "easy", seed: 1 }, elapsed: 1000, score: 100, closeCalls: 0, won: false };
  const pairs = [[GAME_VERSION,RULESET],["1.4.0","orchard-5"],["1.3.0","orchard-4"],["1.2.0","orchard-3"],["1.1.0","canopy-2"],["unknown","unknown"],["1.4.0","orchard-4"]];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => JSON.stringify(pairs.map(([version,ruleset]) => ({ ...base, version, ruleset }))) } });
  try { const records = readExtraRecords(); assert.equal(records.length, 5); assert.equal(records[1].ruleset, "orchard-5"); }
  finally { if (previous) Object.defineProperty(globalThis, "localStorage", previous); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
