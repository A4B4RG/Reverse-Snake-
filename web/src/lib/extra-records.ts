import {
  GAME_VERSION,
  RULESET,
  isRunMeta,
  type RunMeta,
  type RunState,
} from "./replay";
export type ExtraRecord = {
  meta: RunMeta;
  elapsed: number;
  score: number;
  closeCalls: number;
  won: boolean;
  version: string;
  ruleset: string;
};
const KEY = "reverse-snake:extra-records:v1";
export function readExtraRecords(): ExtraRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > 40_000) return [];
    const values = JSON.parse(raw);
    return Array.isArray(values)
      ? values
          .filter(
            (r) =>
              r &&
              ((r.version === GAME_VERSION && r.ruleset === RULESET)||(r.version === "1.1.0" && r.ruleset === "canopy-2")) &&
              ["hunter", "challenge"].includes(r.meta?.mode) &&
              isRunMeta(r.meta) &&
              Number.isFinite(r.elapsed) &&
              r.elapsed >= 0 &&
              Number.isFinite(r.score) &&
              r.score >= 0 &&
              Number.isFinite(r.closeCalls) &&
              r.closeCalls >= 0 &&
              typeof r.won === "boolean",
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
export function recordExtra(s: RunState, meta: RunMeta): boolean {
  if (s.phase !== "won" && s.phase !== "lost") return false;
  const record: ExtraRecord = {
    meta: {mode:meta.mode,arena:meta.arena,difficulty:meta.difficulty,seed:meta.seed,challenge:meta.challenge,board:meta.board,appearance:meta.appearance},
    elapsed: s.elapsed,
    score: s.score,
    closeCalls: "closeCalls" in s ? s.closeCalls : 0,
    won: s.phase === "won",
    version: GAME_VERSION,
    ruleset: RULESET,
  };
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([record, ...readExtraRecords()].slice(0, 30)),
    );
    return true;
  } catch {
    return false;
  }
}
