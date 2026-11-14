import type { Direction } from "./game";

const KEYS: Record<string, Direction> = { arrowup: "up", w: "up", arrowright: "right", d: "right", arrowdown: "down", s: "down", arrowleft: "left", a: "left" };
export const movementDirection = (key: string): Direction | null => KEYS[key.toLowerCase()] ?? null;
export function swipeDirection(dx: number, dy: number, threshold = 24): Direction | null {
  const x = Math.abs(dx), y = Math.abs(dy);
  if (Math.max(x, y) < threshold || Math.max(x, y) < Math.min(x, y) * 1.2) return null;
  return x > y ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up";
}
// Physical identity stays stable when Shift changes, while direction follows
// the printed WASD key on the user's keyboard layout.
export const keyboardSource = (event: { key: string; code: string }): string => `key:${event.code || event.key.toLowerCase()}`;

/** Last pressed source wins; releasing it restores the most recent held source. */
export class GameInput {
  private held = new Map<string, Direction>();
  press(source: string, direction: Direction): boolean {
    if (this.held.has(source)) return false;
    this.held.set(source, direction);
    return true;
  }
  release(source: string): boolean { return this.held.delete(source); }
  clear() { this.held.clear(); }
  get direction(): Direction | null { return [...this.held.values()].at(-1) ?? null; }
}
