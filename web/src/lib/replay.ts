import {
  createGame,
  dash,
  steer,
  step,
  type Difficulty,
  type Direction,
  type GameMode,
  type GameState,
} from "./game";
import { CHALLENGES, challengeStep, createChallenge } from "./challenge";
import {
  createHunter,
  hunterStep,
  turnHunter,
  type HunterState,
} from "./hunter";

export const GAME_VERSION = "1.1.0";
export const RULESET = "canopy-2";
export type RunMode = GameMode | "hunter" | "challenge";
export type RunMeta = {
  mode: RunMode;
  arena: number;
  difficulty: Difficulty;
  seed: number;
  challenge?: string;
};
export function isRunMeta(value: unknown): value is RunMeta {
  if (!value || typeof value !== "object") return false;
  const m = value as RunMeta;
  if (
    !["levels", "survival", "hunter", "challenge"].includes(m.mode) ||
    !Number.isInteger(m.arena) ||
    m.arena < 0 ||
    m.arena > 4 ||
    !["easy", "normal", "hard"].includes(m.difficulty) ||
    !Number.isInteger(m.seed) ||
    m.seed < 0 ||
    m.seed > 0xffffffff
  )
    return false;
  if (m.mode === "challenge") {
    const c = CHALLENGES.find((c) => c.id === m.challenge);
    return (
      !!c &&
      c.arena === m.arena &&
      c.difficulty === m.difficulty &&
      c.seed === m.seed
    );
  }
  return true;
}
export type RunState = GameState | HunterState;
export type Command =
  | { action: "step"; direction: Direction | null; count: number }
  | { action: "steer" | "dash"; direction: Direction | null }
  | { action: "clear" | "pause" | "resume" };
export type Replay = {
  format: 1;
  version: string;
  ruleset: string;
  meta: RunMeta;
  commands: Command[];
  final: string;
  elapsed: number;
  score: number;
  won: boolean;
};
const KEY = "reverse-snake:replays:v1";
const MAX_BYTES = 250_000,
  MAX_GROUPS = 20_000,
  MAX_STEPS = 180_000;
const direction = (v: unknown): v is Direction | null =>
  v === null || ["up", "down", "left", "right"].includes(v as string);
export const isHunter = (s: RunState): s is HunterState => "turns" in s;
export function createRun(meta: RunMeta): RunState {
  if (meta.mode === "hunter")
    return {
      ...createHunter(meta.arena, meta.difficulty, meta.seed),
      phase: "running",
    };
  if (meta.mode === "challenge") {
    const challenge = CHALLENGES.find((c) => c.id === meta.challenge)!;
    return { ...createChallenge(challenge), phase: "running" };
  }
  return {
    ...createGame(meta.arena, meta.difficulty, meta.mode),
    phase: "running",
  };
}
export function applyCommand(
  s: RunState,
  command: Command,
  meta: RunMeta,
): RunState {
  if (command.action === "step") {
    if (isHunter(s)) return hunterStep(s);
    const challenge = CHALLENGES.find((c) => c.id === meta.challenge);
    return meta.mode === "challenge" && challenge
      ? challengeStep(s, command.direction, challenge)
      : step(s, command.direction);
  }
  if (command.action === "steer")
    return command.direction
      ? isHunter(s)
        ? turnHunter(s, command.direction)
        : steer(s, command.direction)
      : s;
  if (command.action === "dash")
    return isHunter(s) ? s : dash(s, command.direction);
  if (command.action === "pause" && s.phase === "running")
    return {
      ...s,
      phase: "paused",
      ...(isHunter(s) ? { turns: [] } : { pendingDirection: null }),
    };
  if (command.action === "resume" && s.phase === "paused")
    return {
      ...s,
      phase: "running",
      ...(isHunter(s) ? { turns: [] } : { pendingDirection: null }),
    };
  if (command.action === "clear")
    return {
      ...s,
      ...(isHunter(s) ? { turns: [] } : { pendingDirection: null }),
    };
  return s;
}
export function fingerprint(s: RunState): string {
  const raw = JSON.stringify(s);
  let value = 2166136261;
  for (let i = 0; i < raw.length; i++)
    value = Math.imul(value ^ raw.charCodeAt(i), 16777619);
  return (value >>> 0).toString(16);
}
export class Recorder {
  commands: Command[] = [];
  overflow = false;
  steps = 0;
  constructor(public meta: RunMeta) {}
  add(command: Command) {
    if (this.overflow) return;
    if (
      command.action === "step" &&
      (this.steps += command.count) > MAX_STEPS
    ) {
      this.overflow = true;
      return;
    }
    const previous = this.commands.at(-1);
    if (
      command.action === "step" &&
      previous?.action === "step" &&
      previous.direction === command.direction
    )
      previous.count += command.count;
    else this.commands.push({ ...command });
    if (this.commands.length > MAX_GROUPS) this.overflow = true;
  }
  finish(s: RunState): Replay | null {
    if (this.overflow || (s.phase !== "won" && s.phase !== "lost")) return null;
    const replay: Replay = {
      format: 1,
      version: GAME_VERSION,
      ruleset: RULESET,
      meta: this.meta,
      commands: this.commands,
      final: fingerprint(s),
      elapsed: s.elapsed,
      score: s.score,
      won: s.phase === "won",
    };
    return JSON.stringify(replay).length <= MAX_BYTES ? replay : null;
  }
}
export function parseReplay(value: unknown): Replay | null {
  try {
    if (
      !value ||
      typeof value !== "object" ||
      JSON.stringify(value).length > MAX_BYTES
    )
      return null;
    const r = value as Replay,
      m = r.meta;
    if (
      r.format !== 1 ||
      r.version !== GAME_VERSION ||
      r.ruleset !== RULESET ||
      !m ||
      !["levels", "survival", "hunter", "challenge"].includes(m.mode) ||
      !Number.isInteger(m.arena) ||
      m.arena < 0 ||
      m.arena > 4 ||
      !["easy", "normal", "hard"].includes(m.difficulty) ||
      !Number.isInteger(m.seed) ||
      m.seed < 0 ||
      m.seed > 0xffffffff ||
      !Array.isArray(r.commands) ||
      r.commands.length > MAX_GROUPS ||
      typeof r.final !== "string" ||
      !/^[a-f0-9]{1,8}$/.test(r.final) ||
      !Number.isFinite(r.elapsed) ||
      r.elapsed < 0 ||
      r.elapsed > MAX_STEPS * 20 ||
      !Number.isFinite(r.score) ||
      r.score < 0 ||
      typeof r.won !== "boolean"
    )
      return null;
    if (m.mode === "challenge") {
      const c = CHALLENGES.find((c) => c.id === m.challenge);
      if (
        !c ||
        c.arena !== m.arena ||
        c.difficulty !== m.difficulty ||
        c.seed !== m.seed
      )
        return null;
    }
    let steps = 0;
    for (const c of r.commands) {
      if (!c || typeof c !== "object") return null;
      if (c.action === "step") {
        if (
          !direction(c.direction) ||
          !Number.isInteger(c.count) ||
          c.count <= 0 ||
          (steps += c.count) > MAX_STEPS
        )
          return null;
      } else if (c.action === "dash" || c.action === "steer") {
        if (!direction(c.direction) || (c.action === "steer" && !c.direction))
          return null;
      } else if (!["clear", "pause", "resume"].includes(c.action)) return null;
    }
    return r;
  } catch {
    return null;
  }
}
export class ReplayCursor {
  state: RunState;
  index = 0;
  remaining = 0;
  done = false;
  valid = true;
  constructor(public replay: Replay) {
    this.state = createRun(replay.meta);
  }
  advance() {
    if (this.done) return this.state;
    while (this.index < this.replay.commands.length) {
      const command = this.replay.commands[this.index];
      if (command.action === "step") {
        if (!this.remaining) this.remaining = command.count;
        this.state = applyCommand(this.state, command, this.replay.meta);
        if (!--this.remaining) this.index++;
        return this.state;
      }
      this.state = applyCommand(this.state, command, this.replay.meta);
      this.index++;
    }
    this.done = true;
    this.valid =
      fingerprint(this.state) === this.replay.final &&
      this.state.elapsed === this.replay.elapsed &&
      this.state.score === this.replay.score &&
      (this.state.phase === "won") === this.replay.won;
    return this.state;
  }
}
export function readReplays(): Replay[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > MAX_BYTES * 3 + 10) return [];
    const values = JSON.parse(raw);
    return Array.isArray(values)
      ? values
          .slice(0, 3)
          .map(parseReplay)
          .filter((r): r is Replay => !!r)
      : [];
  } catch {
    return [];
  }
}
export function saveReplay(replay: Replay): boolean {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([replay, ...readReplays()].slice(0, 3)),
    );
    return true;
  } catch {
    return false;
  }
}
export function compatibleGhost(r: Replay, m: RunMeta) {
  return (
    r.meta.mode === m.mode &&
    r.meta.arena === m.arena &&
    r.meta.difficulty === m.difficulty &&
    r.meta.seed === m.seed &&
    r.meta.challenge === m.challenge
  );
}
