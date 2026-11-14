import { ARENAS, type Difficulty, type GameMode, type GameState } from "./game";

export type Run = { id: string; arena: number; difficulty: Difficulty; mode: GameMode; closeCalls: number; score: number; elapsed: number; won: boolean; date: string };
export type SavedData = { sound: boolean; difficulty: Difficulty; runs: Run[]; attempts: number; wins: number; best: number; unlocked: number };
const KEY = "reverse-snake:v1";
export const DEFAULT_DATA: SavedData = { sound: true, difficulty: "normal", runs: [], attempts: 0, wins: 0, best: 0, unlocked: 0 };
const validDifficulty = (v: unknown): v is Difficulty => v === "easy" || v === "normal" || v === "hard";
const nonnegative = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

export function readSavedData(): SavedData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!data || typeof data !== "object") return { ...DEFAULT_DATA };
    const runs = Array.isArray(data.runs) ? data.runs.filter((run: Run) => run && typeof run.id === "string" && Number.isInteger(run.arena) && run.arena >= 0 && run.arena < ARENAS.length && validDifficulty(run.difficulty) && nonnegative(run.score) && nonnegative(run.elapsed) && typeof run.won === "boolean" && typeof run.date === "string").slice(0, 30).map((run: Run) => ({ ...run, mode: run.mode === "survival" ? "survival" : "levels", closeCalls: nonnegative(run.closeCalls) ? Math.floor(run.closeCalls) : 0 })) : [];
    return {
      sound: typeof data.sound === "boolean" ? data.sound : true,
      difficulty: validDifficulty(data.difficulty) ? data.difficulty : "normal",
      runs, attempts: nonnegative(data.attempts) ? data.attempts : 0,
      wins: nonnegative(data.wins) ? data.wins : 0, best: nonnegative(data.best) ? data.best : 0,
      unlocked: Number.isInteger(data.unlocked) && data.unlocked >= 0 && data.unlocked < ARENAS.length ? data.unlocked : Math.min(ARENAS.length - 1, runs.reduce((n: number, r: Run) => r.mode === "levels" && r.won ? Math.max(n, r.arena + 1) : n, 0)),
    };
  } catch { return { ...DEFAULT_DATA }; }
}

export function saveData(data: SavedData): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

let localId = 0;
function runId(): string {
  try { if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID(); } catch { /* Local IDs also work on insecure HTTP and older browsers. */ }
  return `run-${Date.now().toString(36)}-${(++localId).toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function recordRun(data: SavedData, game: GameState): SavedData {
  const run: Run = {
    id: runId(), arena: game.arena, difficulty: game.difficulty, mode: game.mode, closeCalls: game.closeCalls,
    score: Math.floor(game.score), elapsed: game.elapsed, won: game.phase === "won", date: new Date().toISOString(),
  };
  const cleared = game.mode === "levels" && run.won && game.reason === "target" && run.score >= ARENAS[game.arena].scoreTarget && game.arena <= data.unlocked;
  return { ...data, runs: [run, ...data.runs].slice(0, 30), attempts: data.attempts + 1, wins: data.wins + Number(run.won), best: Math.max(data.best, run.score), unlocked: cleared ? Math.max(data.unlocked, Math.min(ARENAS.length - 1, game.arena + 1)) : data.unlocked };
}
