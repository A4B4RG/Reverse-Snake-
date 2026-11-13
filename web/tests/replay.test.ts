import test from "node:test";
import assert from "node:assert/strict";
import { CHALLENGES, createChallenge } from "../src/lib/challenge";
import {
  applyCommand,
  createRun,
  Recorder,
  ReplayCursor,
  parseReplay,
  fingerprint,
  type RunMeta,
} from "../src/lib/replay";

test("local challenges reproduce fixed starts and fail to an idle hunter", () => {
  for (const c of CHALLENGES) {
    assert.deepEqual(createChallenge(c), createChallenge(c));
    const m: RunMeta = {
      mode: "challenge",
      arena: c.arena,
      difficulty: c.difficulty,
      seed: c.seed,
      challenge: c.id,
    };
    let s = createRun(m);
    for (let i = 0; i < 2000 && s.phase === "running"; i++)
      s = applyCommand(s, { action: "step", direction: null, count: 1 }, m);
    assert.equal(s.phase, "lost");
  }
});
test("all modes replay ordered inputs, pause/resume and terminal states exactly", () => {
  const c = CHALLENGES[0];
  const configs: RunMeta[] = [
    { mode: "levels", arena: 4, difficulty: "hard", seed: 0 },
    { mode: "survival", arena: 4, difficulty: "normal", seed: 0 },
    { mode: "hunter", arena: 0, difficulty: "normal", seed: 77 },
    {
      mode: "challenge",
      arena: c.arena,
      difficulty: c.difficulty,
      seed: c.seed,
      challenge: c.id,
    },
  ];
  for (const m of configs) {
    let s = createRun(m);
    const r = new Recorder(m);
    for (const command of [
      { action: "steer", direction: "down" },
      { action: "dash", direction: "down" },
      { action: "pause" },
      { action: "resume" },
      { action: "clear" },
    ] as const) {
      r.add(command);
      s = applyCommand(s, command, m);
    }
    for (let i = 0; i < 2000 && s.phase === "running"; i++) {
      const command = { action: "step" as const, direction: null, count: 1 };
      r.add(command);
      s = applyCommand(s, command, m);
    }
    const replay = r.finish(s)!;
    assert.ok(replay);
    assert.ok(replay.commands.length < 10);
    const parsed = parseReplay(JSON.parse(JSON.stringify(replay)))!;
    assert.ok(parsed);
    for (let pass = 0; pass < 3; pass++) {
      const cursor = new ReplayCursor(parsed);
      while (!cursor.done) cursor.advance();
      assert.ok(cursor.valid);
      assert.equal(fingerprint(cursor.state), fingerprint(s));
    }
    assert.equal(parseReplay({ ...replay, version: "old" }), null);
    assert.equal(
      parseReplay({
        ...replay,
        commands: [{ action: "step", direction: null, count: Infinity }],
      }),
      null,
    );
    const tampered = new ReplayCursor({ ...replay, final: "0" });
    while (!tampered.done) tampered.advance();
    assert.equal(tampered.valid, false);
  }
});
test("replays exclude abandoned and excessive recordings", () => {
  const m: RunMeta = {
    mode: "hunter",
    arena: 0,
    difficulty: "normal",
    seed: 1,
  };
  const r = new Recorder(m);
  assert.equal(r.finish(createRun(m)), null);
  r.add({ action: "step", direction: null, count: 180001 });
  assert.equal(r.overflow, true);
  assert.equal(parseReplay(null), null);
});
