export type StarCount = 0 | 1 | 2 | 3;
export type LevelProgress = { unlocked: number; stars: number[] };
export const starTargets = (target: number) => [target + 100, target + 300, target + 701] as const;
export function starsFor(score: number, target: number): StarCount {
  return Math.floor(score) > target + 700 ? 3 : score >= target + 300 ? 2 : score >= target + 100 ? 1 : 0;
}
export const emptyProgress = (): LevelProgress => ({ unlocked: 0, stars: Array(10).fill(0) });
export function parseProgress(value: unknown): LevelProgress {
  const data = value as Partial<LevelProgress> | null;
  return {
    unlocked: Number.isInteger(data?.unlocked) && data!.unlocked! >= 0 && data!.unlocked! < 10 ? data!.unlocked! : 0,
    stars: Array.from({ length: 10 }, (_, i) => {
      const star = data?.stars?.[i];
      return Number.isInteger(star) && star! >= 0 && star! <= 3 ? star! : 0;
    }),
  };
}
export function earnProgress<T extends LevelProgress>(data: T, arena: number, score: number, target: number, qualified: boolean): T {
  if (!qualified || score < target || arena > data.unlocked) return data;
  const unlocked = Math.max(data.unlocked, Math.min(9, arena + 1));
  const stars = starsFor(score, target);
  if (unlocked === data.unlocked && stars <= (data.stars[arena] ?? 0)) return data;
  const nextStars = [...data.stars];
  nextStars[arena] = Math.max(nextStars[arena] ?? 0, stars);
  return { ...data, unlocked, stars: nextStars };
}
const HUNTER_KEY = "reverse-snake:hunter-progress:v1";
export function readHunterProgress(): LevelProgress {
  try { return parseProgress(JSON.parse(localStorage.getItem(HUNTER_KEY) ?? "null")); }
  catch { return emptyProgress(); }
}
export function saveHunterProgress(progress: LevelProgress): boolean {
  try { localStorage.setItem(HUNTER_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}
