import type { Point } from "./game";
import type { Board } from "./board";
const key = (p: Point) => `${p.x},${p.y}`;
export function rescaleWalls(points: Point[], from: Board, to: Board): Point[] {
  const cells = new Map<string, Point>();
  for (const p of points) {
    const x1 = Math.floor(p.x * to.columns / from.columns), x2 = Math.max(x1, Math.floor((p.x + 1) * to.columns / from.columns) - 1);
    const y1 = Math.floor(p.y * to.rows / from.rows), y2 = Math.max(y1, Math.floor((p.y + 1) * to.rows / from.rows) - 1);
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) cells.set(`${x},${y}`, { x, y });
  }
  return [...cells.values()];
}
export function connectedFloor(walls: Point[], board: Board): boolean {
  const blocked = new Set(walls.map(key)), floor: Point[] = [];
  for (let y = 0; y < board.rows; y++) for (let x = 0; x < board.columns; x++) if (!blocked.has(`${x},${y}`)) floor.push({ x, y });
  if (!floor.length) return false;
  const queue = [floor[0]], seen = new Set([key(floor[0])]);
  for (let i = 0; i < queue.length; i++) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const p = { x: queue[i].x + dx, y: queue[i].y + dy }, id = key(p);
    if (p.x < 0 || p.y < 0 || p.x >= board.columns || p.y >= board.rows || seen.has(id) || blocked.has(id)) continue;
    seen.add(id); queue.push(p);
  }
  return seen.size === floor.length;
}
export function relocateWalls(walls: Point[], board: Board, protectedCells: Point[], seed: number): Point[] {
  const protectedSet = new Set(protectedCells.map(key)), original = new Set(walls.map(key));
  for (let i = 0; i < 24; i++) {
    const transform = (seed + i) % 8, shift = ((seed >>> 8) + i) % 5 - 2;
    const candidate = walls.map(p => ({ x: transform & 1 ? board.columns - 1 - p.x : p.x + shift, y: transform & 2 ? board.rows - 1 - p.y : p.y - shift }))
      .filter(p => p.x >= 1 && p.y >= 1 && p.x < board.columns - 1 && p.y < board.rows - 1 && !protectedSet.has(key(p)));
    const unique = [...new Map(candidate.map(p => [key(p),p])).values()];
    if (unique.length >= walls.length * .5 && unique.some(p => !original.has(key(p))) && connectedFloor(unique, board)) return unique;
  }
  return walls;
}
