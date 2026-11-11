import { ARENAS, type Difficulty, type GameState } from "./game";

export type Run = { id: string; arena: number; difficulty: Difficulty; score: number; elapsed: number; won: boolean; date: string };
export type SavedData = { sound: boolean; difficulty: Difficulty; runs: Run[]; attempts: number; wins: number; best: number };
const KEY = "reverse-snake:v1";
export const DEFAULT_DATA: SavedData = { sound: true, difficulty: "normal", runs: [], attempts: 0, wins: 0, best: 0 };
const validDifficulty = (v: unknown): v is Difficulty => v === "easy" || v === "normal" || v === "hard";
const nonnegative = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

export function readSavedData(): SavedData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!data || typeof data !== "object") return { ...DEFAULT_DATA };
    const runs = Array.isArray(data.runs) ? data.runs.filter((run: Run) => run && typeof run.id === "string" && Number.isInteger(run.arena) && run.arena >= 0 && run.arena < ARENAS.length && validDifficulty(run.difficulty) && nonnegative(run.score) && nonnegative(run.elapsed) && typeof run.won === "boolean" && typeof run.date === "string").slice(0, 30) : [];
    return {
      sound: typeof data.sound === "boolean" ? data.sound : true,
      difficulty: validDifficulty(data.difficulty) ? data.difficulty : "normal",
      runs, attempts: nonnegative(data.attempts) ? data.attempts : 0,
      wins: nonnegative(data.wins) ? data.wins : 0, best: nonnegative(data.best) ? data.best : 0,
    };
  } catch { return { ...DEFAULT_DATA }; }
}

export function saveData(data: SavedData): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

export function recordRun(data: SavedData, game: GameState): SavedData {
  const run: Run = {
    id: crypto.randomUUID(), arena: game.arena, difficulty: game.difficulty,
    score: Math.floor(game.score), elapsed: game.elapsed, won: game.phase === "won", date: new Date().toISOString(),
  };
  return { ...data, runs: [run, ...data.runs].slice(0, 30), attempts: data.attempts + 1, wins: data.wins + Number(run.won), best: Math.max(data.best, run.score) };
}
