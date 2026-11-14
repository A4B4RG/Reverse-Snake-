export const FRUITS = [
  "apple",
  "mango",
  "pear",
  "orange",
  "strawberry",
] as const;
export const SNAKES = ["amber", "jade", "coral", "midnight"] as const;
export type FruitSkin = (typeof FRUITS)[number];
export type SnakeSkin = (typeof SNAKES)[number];
export type Appearance = { fruit: FruitSkin; snake: SnakeSkin };
export const DEFAULT_APPEARANCE: Appearance = { fruit: "apple", snake: "jade" };
export const validAppearance = (v: unknown): v is Appearance =>
  !!v &&
  typeof v === "object" &&
  FRUITS.includes((v as Appearance).fruit) &&
  SNAKES.includes((v as Appearance).snake);
const KEY = "reverse-snake:appearance:v1";
export function readAppearance(): Appearance {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (validAppearance(v)) return v;
  } catch {}
  return DEFAULT_APPEARANCE;
}
export function saveAppearance(v: Appearance) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}
