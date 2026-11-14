import { expect, type Page } from "@playwright/test";
export async function chooseAppearance(page: Page, food?: string, snake?: string) {
  await page.getByRole("button", { name: "Open game menu" }).dispatchEvent("click");
  if (food) await page.getByRole("combobox", { name: "Food character" }).selectOption(food);
  if (snake) await page.getByRole("combobox", { name: "Snake design" }).selectOption(snake);
  await page.getByRole("button", { name: "Close menu" }).dispatchEvent("click");
}
export async function swipe(page: Page, d: Direction) {
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const delta = { up: [0, -60], right: [60, 0], down: [0, 60], left: [-60, 0] }[d];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + delta[0], y: y + delta[1], id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
import {
  createGame,
  dash,
  equal,
  step,
  type Direction,
  type GameMode,
  type GameState,
} from "../src/lib/game";

export async function fruit(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const colors = {
        apple: [230, 82, 82],
        mango: [255, 197, 94],
        pear: [171, 208, 89],
        orange: [250, 152, 46],
        strawberry: [233, 71, 109],
      },
      skin = canvas.dataset.fruit as keyof typeof colors;
    const color = colors[skin],
      pixels = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
    let x = 0,
      y = 0,
      n = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (color.every((v, j) => pixels[i + j] === v)) {
        x += (i / 4) % canvas.width;
        y += Math.floor(i / 4 / canvas.width);
        n++;
      }
    if (!n) throw Error("The full fruit artwork must be visible");
    const r = canvas.getBoundingClientRect(),
      sx = canvas.width / r.width,
      sy = canvas.height / r.height;
    return {
      x: Math.round(
        (x / n - sx) /
          ((canvas.width - 2 * sx) / Number(canvas.dataset.columns)) -
          0.5,
      ),
      y: Math.round(
        (y / n - sy) /
          ((canvas.height - 2 * sy) / Number(canvas.dataset.rows)) -
          0.5,
      ),
    };
  });
}
/** Plan a real adjacent-head dodge for the measured board, then perform it through keyboard input. */
export async function closeCall(page: Page, mode: GameMode = "levels") {
  const initial = await page
    .locator("canvas")
    .evaluate((c) => ({
      board: {
        columns: Number((c as HTMLElement).dataset.columns),
        rows: Number((c as HTMLElement).dataset.rows),
      },
      elapsed: Number((c as HTMLElement).dataset.elapsed),
    }));
  let s: GameState = {
      ...createGame(0, "normal", mode, initial.board),
      phase: "running",
    },
    heading: Direction | null = null;
  for (let i = 0; i < 1500 && s.phase === "running"; i++) {
    const head = s.snake[0];
    if (
      s.elapsed >= initial.elapsed &&
      Math.abs(head.x - s.player.x) + Math.abs(head.y - s.player.y) === 1
    ) {
      heading =
        (["left", "down", "right", "up"] as Direction[]).find((d) => {
          const n = dash(s, d);
          return (
            n.phase === "running" &&
            n.closeCalls > 0 &&
            !equal(n.player, s.player)
          );
        }) ?? null;
      if (heading) break;
    }
    s = step(s, null);
  }
  expect(
    heading,
    "the measured arena must allow an adjacent-head dodge",
  ).not.toBeNull();
  await page.clock.runFor(s.elapsed - initial.elapsed);
  const actual = Number(await page.locator("canvas").getAttribute("data-elapsed"));
  if (actual < s.elapsed) await page.clock.runFor(s.elapsed - actual);
  const aligned = Number(await page.locator("canvas").getAttribute("data-elapsed"));
  expect(aligned, "the real chase has reached the planned lunge").toBeGreaterThanOrEqual(s.elapsed);
  expect(aligned).toBeLessThan(s.elapsed + 100);
  const key = `Arrow${heading![0].toUpperCase()}${heading!.slice(1)}`;
  await page.keyboard.down(key);
  await page.keyboard.press("Space");
  await page.keyboard.up(key);
  await page.clock.runFor(80);
}
