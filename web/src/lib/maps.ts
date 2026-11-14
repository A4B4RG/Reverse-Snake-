import type { Point, Arena } from "./game";

const line = (x: number, y: number, n: number, vertical = false): Point[] => Array.from({ length: n }, (_, i) => ({ x: x + (vertical ? 0 : i), y: y + (vertical ? i : 0) }));
const elbow = (x: number, y: number, w: number, h: number) => [...line(x, y, w), ...line(x, y, h, true)];
const layouts: Point[][] = [
  [3, 8, 13].flatMap((x, i) => [...line(x, 4 + i * 3, 6, true), ...line(x, 9 + i * 3, 4)]),
  [4, 9, 14].flatMap((y, i) => [...line(i % 2 ? 6 : 3, y, 10), ...line(i % 2 ? 15 : 3, y, 3, true)]),
  [4, 12].flatMap(x => [5, 13].flatMap(y => [...elbow(x, y, 4, 4), ...line(x + 3, y + 2, 2, true)])),
  [...line(3, 5, 12), ...line(5, 15, 12), ...line(6, 8, 8, true), ...line(13, 5, 7, true)],
  [4, 8, 12, 16].flatMap((x, i) => [...line(x, 3 + i % 2 * 5, 8, true), ...line(x - 1, 11 + i % 2 * 3, 3)]),
  [...elbow(3, 4, 12, 8), ...elbow(8, 10, 9, 7), ...line(15, 6, 4, true)],
  [4, 9, 14].flatMap(y => [...line(3, y, 4), ...line(10, y, 7), ...line(10, y, 3, true)]),
  [...line(3, 6, 14), ...line(3, 14, 14), ...line(6, 7, 4, true), ...line(13, 10, 4, true), ...line(9, 9, 4)],
  [4, 10, 16].flatMap((x, i) => [...line(x, 4, i === 1 ? 10 : 6, true), ...line(x, 13, 3), ...line(x - 1, 16, 3)]),
  [...elbow(3, 3, 13, 10), ...line(6, 16, 11), ...elbow(7, 7, 7, 6), ...line(14, 10, 5, true)],
  [4, 8, 12, 16].flatMap((y, i) => [...line(3 + i % 2 * 3, y, 9), ...line(15, y - 1, 3, true)]),
  [...line(4, 3, 13, true), ...line(15, 5, 12, true), ...line(5, 6, 7), ...line(8, 13, 7), ...line(9, 8, 3, true)],
  [4, 12].flatMap(x => [4, 12].flatMap(y => [0, 1, 2].flatMap(dy => line(x, y + dy, 4)))),
  [...elbow(3, 5, 9, 11), ...elbow(9, 9, 8, 8), ...line(14, 3, 5, true), ...line(5, 13, 3)],
  [...line(3, 5, 14), ...line(3, 15, 14), ...line(7, 7, 6, true), ...line(12, 9, 5, true), ...line(4, 10, 3)],
  [4, 8, 12, 16].flatMap((x, i) => [...line(x, i % 2 ? 8 : 3, 9, true), ...line(x - 1, i % 2 ? 16 : 4, 3)]),
  [...elbow(3, 4, 14, 6), ...line(3, 16, 14), ...line(16, 11, 5, true), ...line(7, 8, 7), ...line(8, 12, 7)],
  [...elbow(4, 4, 9, 12), ...elbow(8, 8, 9, 9), ...line(13, 3, 3, true), ...line(3, 17, 11)],
  [4, 9, 14].flatMap((y, i) => [...line(i % 2 ? 7 : 3, y, 10), ...line(5 + i * 5, y + 1, 3, true)]),
  [...elbow(3, 3, 14, 8), ...line(3, 17, 14), ...line(16, 9, 8, true), ...elbow(7, 7, 6, 7), ...line(12, 11, 4, true), ...line(9, 15, 5)],
];
const names = ["Fern Passage", "Monsoon Steps", "Emerald Ruins", "Vine Crossing", "Tiger Grass", "Sunken Shrine", "Firefly Marsh", "Lotus Basin", "Moss Columns", "Ancient Spiral", "Rainforest Rapids", "Serpent Gates", "Jade Gardens", "Orchid Tangle", "Moonlit Causeway", "Mangrove Channels", "Lost Sanctuary", "Jaguar's Labyrinth", "Thunder Canopy", "Jungle Citadel"];
export const EXTRA_ARENAS: Arena[] = names.map((name, i) => ({ name, subtitle: "A deeper path through the jungle.", description: ["Staggered corners and open crossings.", "Offset lanes and layered walls.", "Stone islands and narrow escapes.", "Broken gates and branching corridors."][i % 4], length: Math.min(30, 18 + Math.floor(i / 2)), duration: 110_000 + i * 5_000, scoreTarget: 1500 + i * 200, obstacles: [...new Map(layouts[i].map(p => [`${p.x},${p.y}`, p])).values()] }));
