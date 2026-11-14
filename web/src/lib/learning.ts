import type { Board } from "./board";
import type { Direction, Point } from "./game";

export const MOVES: Direction[] = ["up", "right", "down", "left"];
const INPUTS = 14,
  HIDDEN = 12,
  OUTPUTS = 4;
export type Policy = { samples: number; input: number[]; output: number[] };
export type Learning = { fruit: Policy; snake: Policy };
function policy(seed: number): Policy {
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed / 4294967296 - 0.5) * 0.16;
  };
  return {
    samples: 0,
    input: Array.from({ length: (INPUTS + 1) * HIDDEN }, random),
    output: Array.from({ length: (HIDDEN + 1) * OUTPUTS }, random),
  };
}
export const createLearning = (): Learning => ({
  fruit: policy(137),
  snake: policy(991),
});
export function validLearning(v: unknown): v is Learning {
  if (!v || typeof v !== "object") return false;
  return ["fruit", "snake"].every((k) => {
    const p = (v as Record<string, Policy>)[k];
    return (
      p &&
      Number.isSafeInteger(p.samples) &&
      p.samples >= 0 &&
      p.samples <= 1e9 &&
      Array.isArray(p.input) &&
      p.input.length === (INPUTS + 1) * HIDDEN &&
      Array.isArray(p.output) &&
      p.output.length === (HIDDEN + 1) * OUTPUTS &&
      [...p.input, ...p.output].every(
        (x) => Number.isFinite(x) && Math.abs(x) <= 12,
      )
    );
  });
}
/** Relative target, actor heading, local exits and distance to every board edge. */
export function features(
  actor: Point,
  target: Point,
  heading: Direction,
  board: Board,
  legal: boolean[],
): number[] {
  return [
    (target.x - actor.x) / board.columns,
    (target.y - actor.y) / board.rows,
    ...MOVES.map((d) => Number(d === heading)),
    ...legal.map(Number),
    actor.x / board.columns,
    (board.columns - 1 - actor.x) / board.columns,
    actor.y / board.rows,
    (board.rows - 1 - actor.y) / board.rows,
  ];
}
function forward(p: Policy, x: number[]) {
  const hidden = Array.from({ length: HIDDEN }, (_, j) =>
    Math.tanh(
      p.input[j * (INPUTS + 1) + INPUTS] +
        x.reduce((n, v, i) => n + v * p.input[j * (INPUTS + 1) + i], 0),
    ),
  );
  const logits = Array.from(
    { length: OUTPUTS },
    (_, j) =>
      p.output[j * (HIDDEN + 1) + HIDDEN] +
      hidden.reduce((n, v, i) => n + v * p.output[j * (HIDDEN + 1) + i], 0),
  );
  const exp = logits.map((v) => Math.exp(v - Math.max(...logits))),
    total = exp.reduce((a, b) => a + b, 0);
  return { hidden, probabilities: exp.map((v) => v / total) };
}
export const infer = (p: Policy, x: number[]) => forward(p, x).probabilities;
/** Online backpropagation of a human's successful movement, with bounded weights. */
export function train(p: Policy, x: number[], move: Direction): Policy {
  const { hidden, probabilities } = forward(p, x),
    error = probabilities.map((v, i) => v - Number(MOVES[i] === move));
  const input = [...p.input],
    output = [...p.output],
    rate = 0.045;
  const clamp = (v: number) => Math.max(-12, Math.min(12, v));
  for (let j = 0; j < HIDDEN; j++) {
    const delta =
      error.reduce((n, e, k) => n + e * p.output[k * (HIDDEN + 1) + j], 0) *
      (1 - hidden[j] * hidden[j]);
    for (let i = 0; i <= INPUTS; i++)
      input[j * (INPUTS + 1) + i] = clamp(
        input[j * (INPUTS + 1) + i] - rate * delta * (i === INPUTS ? 1 : x[i]),
      );
  }
  for (let k = 0; k < OUTPUTS; k++)
    for (let j = 0; j <= HIDDEN; j++)
      output[k * (HIDDEN + 1) + j] = clamp(
        output[k * (HIDDEN + 1) + j] -
          rate * error[k] * (j === HIDDEN ? 1 : hidden[j]),
      );
  return { samples: Math.min(1e9, p.samples + 1), input, output };
}
const KEY = "reverse-snake:learning:v1";
export function readLearning(): Learning {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && raw.length < 40000) {
      const l = JSON.parse(raw);
      if (validLearning(l)) return l;
    }
  } catch {}
  return createLearning();
}
export function saveLearning(l: Learning): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
    return true;
  } catch {
    return false;
  }
}
