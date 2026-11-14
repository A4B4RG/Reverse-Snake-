import type { Point, Direction } from "./game";

export type Board = { columns: number; rows: number };
export const DEFAULT_BOARD: Board = { columns: 28, rows: 18 };
export const validBoard = (b: unknown): b is Board =>
  !!b &&
  typeof b === "object" &&
  Number.isInteger((b as Board).columns) &&
  Number.isInteger((b as Board).rows) &&
  (b as Board).columns >= 12 &&
  (b as Board).columns <= 96 &&
  (b as Board).rows >= 12 &&
  (b as Board).rows <= 96;
export function boardForSize(width: number, height: number): Board {
  const cell = Math.max(18, Math.min(30, Math.min(width, height) / 12));
  return {
    columns: Math.max(12, Math.min(96, Math.round(width / cell))),
    rows: Math.max(12, Math.min(96, Math.round(height / cell))),
  };
}
export function project(p: Point, from: Board, to: Board): Point {
  return {
    x: Math.round((p.x / (from.columns - 1)) * (to.columns - 1)),
    y: Math.round((p.y / (from.rows - 1)) * (to.rows - 1)),
  };
}
const key = (p: Point) => `${p.x},${p.y}`;
export const inBoard = (p: Point, b: Board) =>
  p.x >= 0 && p.y >= 0 && p.x < b.columns && p.y < b.rows;
export const boardCells = (b: Board): Point[] =>
  Array.from({ length: b.columns * b.rows }, (_, i) => ({
    x: i % b.columns,
    y: Math.floor(i / b.columns),
  }));
export function nearestFree(p: Point, b: Board, blocked: Point[]): Point {
  const occupied = new Set(blocked.map(key));
  return (
    boardCells(b)
      .filter((q) => !occupied.has(key(q)))
      .sort(
        (a, c) =>
          Math.abs(a.x - p.x) +
          Math.abs(a.y - p.y) -
          Math.abs(c.x - p.x) -
          Math.abs(c.y - p.y),
      )[0] ?? { x: 0, y: 0 }
  );
}
/** Reconstruct a contiguous body when a viewport shrinks; score and clocks belong to the caller. */
export function fitSnake(
  head: Point,
  length: number,
  heading: Direction,
  b: Board,
  blocked: Point[],
): Point[] {
  const start = nearestFree(head, b, blocked),
    path = [start],
    occupied = new Set([...blocked, start].map(key));
  const vectors = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  const front = { up: 0, right: 1, down: 2, left: 3 }[heading];
  let attempts = 0;
  const extend = (): boolean => {
    if (path.length >= length) return true;
    if (++attempts > 20000) return false;
    const p = path.at(-1)!;
    const order =
      path.length === 1
        ? [(front + 2) % 4, (front + 1) % 4, (front + 3) % 4, front]
        : [0, 1, 2, 3];
    for (const i of order) {
      const v = vectors[i],
        q = { x: p.x + v.x, y: p.y + v.y };
      if (!inBoard(q, b) || occupied.has(key(q))) continue;
      path.push(q);
      occupied.add(key(q));
      if (extend()) return true;
      path.pop();
      occupied.delete(key(q));
    }
    return false;
  };
  extend();
  if (path.length < length) {
    while (path.length < length) {
      const p = path.at(-1)!;
      const q = vectors
        .map((v) => ({ x: p.x + v.x, y: p.y + v.y }))
        .find((q) => inBoard(q, b) && !occupied.has(key(q)));
      if (!q) break;
      path.push(q);
      occupied.add(key(q));
    }
  }
  return path;
}
/** Scale authored terrain and fill between adjacent stones, retaining continuous walls. */
export function scaleObstacles(points: Point[], b: Board): Point[] {
  const template = { columns: 20, rows: 20 },
    result = new Map<string, Point>();
  const authored = new Set(points.map(key));
  for (const p of points) {
    const a = project(p, template, b);
    result.set(key(a), a);
    for (const q of points) {
      if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) !== 1) continue;
      const c = project(q, template, b),
        count = Math.max(Math.abs(a.x - c.x), Math.abs(a.y - c.y));
      for (let i = 1; i < count; i++) {
        const v = {
          x: Math.round(a.x + ((c.x - a.x) * i) / count),
          y: Math.round(a.y + ((c.y - a.y) * i) / count),
        };
        result.set(key(v), v);
      }
    }
    // A scaled solid island must stay solid rather than enclosing unreachable food.
    if (
      authored.has(key({ x: p.x + 1, y: p.y })) &&
      authored.has(key({ x: p.x, y: p.y + 1 })) &&
      authored.has(key({ x: p.x + 1, y: p.y + 1 }))
    ) {
      const end = project({ x: p.x + 1, y: p.y + 1 }, template, b);
      for (let y = a.y; y <= end.y; y++) {
        for (let x = a.x; x <= end.x; x++) {
          const cell = { x, y };
          result.set(key(cell), cell);
        }
      }
    }
  }
  return [...result.values()];
}
