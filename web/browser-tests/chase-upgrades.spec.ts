import { expect, test, type Page } from "@playwright/test";
import { fruit, swipe, renderedBoard } from "./helpers";
import { obstaclesFor, type Direction } from "../src/lib/game";

async function snakeHead(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const color = [100, 201, 164], pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let x = 0, y = 0, n = 0;
    for (let i = 0; i < pixels.length; i += 4) if (color.every((v, j) => pixels[i + j] === v)) { x += i / 4 % canvas.width; y += Math.floor(i / 4 / canvas.width); n++; }
    if (!n) throw Error("Snake head artwork must be visible");
    return { x: Math.floor(x / n / canvas.width * Number(canvas.dataset.columns)), y: Math.floor(y / n / canvas.height * Number(canvas.dataset.rows)) };
  });
}

for (const mode of ["food", "hunter"] as const) for (const touch of [false, true]) {
  test(`${mode}: mid-chase fullscreen preserves ${touch ? "swipes" : "keyboard steering"} on entry and exit`, async ({ page }) => {
    if (touch) await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
    await page.goto(mode === "food" ? "/" : "/hunter");
    await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
    await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
    await page.getByRole("button", { name: mode === "food" ? "Let’s play" : "Start round" }).dispatchEvent("click");
    if (touch) await swipe(page, mode === "food" ? "left" : "right");
    else await page.keyboard.down(mode === "food" ? "ArrowLeft" : "ArrowRight");
    await page.clock.runFor(120);
    let foodDirection: Direction = "left";
    for (const full of [true, false]) {
      await page.getByRole("button", { name: mode === "hunter" ? "Toggle fullscreen" : full ? "Enter fullscreen" : "Exit fullscreen" }).click();
      await page.clock.runFor(60);
      expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(full);
      await expect(page.locator("canvas")).toBeFocused();
      await renderedBoard(page);
      await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
      if (mode === "hunter") {
        const before = await snakeHead(page);
        const direction = full ? "down" : "left";
        if (touch) await swipe(page, direction); else await page.keyboard.press(full ? "ArrowDown" : "ArrowLeft");
        await expect.poll(async () => {
          await page.clock.runFor(20);
          const after = await snakeHead(page);
          return full ? after.y > before.y : after.x < before.x;
        }, { intervals: [20, 50, 100] }).toBe(true);
      } else {
        const before = await fruit(page), board = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
        const walls = obstaclesFor(0, board);
        const delta = [{ d: "left", x: -1, y: 0 }, { d: "up", x: 0, y: -1 }, { d: "right", x: 1, y: 0 }, { d: "down", x: 0, y: 1 }] as const;
        const move = delta.find(v => { const x = before.x + v.x, y = before.y + v.y; return v.d !== foodDirection && x >= 0 && y >= 0 && x < board.columns && y < board.rows && !walls.some(p => p.x === x && p.y === y); })!;
        if (touch) await swipe(page, move.d); else { await page.keyboard.up(`Arrow${foodDirection[0].toUpperCase()}${foodDirection.slice(1)}`); await page.keyboard.down(`Arrow${move.d[0].toUpperCase()}${move.d.slice(1)}`); }
        foodDirection = move.d;
        await page.clock.runFor(40);
        const steeredFrom = await fruit(page);
        await expect.poll(async () => {
          await page.clock.runFor(20);
          const after = await fruit(page);
          return move.x ? after.y === steeredFrom.y && (after.x - steeredFrom.x) * move.x > 0 : after.x === steeredFrom.x && (after.y - steeredFrom.y) * move.y > 0;
        }, { intervals: [20, 50, 100] }).toBe(true);
      }
      await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
    }
  });
}

test("Hunter has separate Levels unlocks and freely selectable Survival maps", async ({ page }) => {
  await page.goto("/hunter");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await expect(page.locator(".level-milestone")).toContainText("150");
  await expect(page.getByLabel("Arena").locator('option[value="1"]')).toBeDisabled();
  await page.getByLabel("Hunter mode").filter({ visible: true }).selectOption("survival");
  await page.getByLabel("Arena").selectOption("9");
  await expect(page.locator(".round-progress")).toContainText("Crown Maze");
  await page.getByLabel("Hunter mode").filter({ visible: true }).selectOption("levels");
  await expect(page.locator(".round-progress")).toContainText("Canopy Clearing");
  await page.screenshot({ path: "docs/screenshots/hunter-levels-powerups.png" });
  await page.getByRole("button", { name: "Start round" }).click();
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  const colors = await page.locator("canvas").evaluate((c: HTMLCanvasElement) => {
    const pixels = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let speed = 0, stun = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      speed += Number(pixels[i] === 247 && pixels[i + 1] === 180 && pixels[i + 2] === 61);
      stun += Number(pixels[i] === 121 && pixels[i + 1] === 216 && pixels[i + 2] === 239);
    }
    return { speed, stun };
  });
  expect(colors.speed).toBeGreaterThan(20); expect(colors.stun).toBeGreaterThan(20);
  await page.screenshot({ path: "docs/screenshots/hunter-powerups-playing.png" });
});
