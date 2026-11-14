import { expect, test } from "@playwright/test";
import { fruit, swipe } from "./helpers";
test("mobile steering comes from swipes, double-tap dashes the last direction, and pause clears motion", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("reverse-snake:settings:v1", JSON.stringify({ fps: 60 })));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/food");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Dash", exact: true })).toHaveCount(0);
  await expect(page.locator(".game-sidebar")).toBeHidden();
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  const initial = await fruit(page);
  await swipe(page, "left"); await page.clock.runFor(100);
  expect(await fruit(page)).toEqual({ x: initial.x - 1, y: initial.y });
  await page.clock.runFor(100);
  expect(await fruit(page)).toEqual({ x: initial.x - 2, y: initial.y });
  await swipe(page, "up"); await page.clock.runFor(100);
  expect(await fruit(page)).toEqual({ x: initial.x - 2, y: initial.y - 1 });
  await swipe(page, "right"); await page.clock.runFor(100);
  expect(await fruit(page)).toEqual({ x: initial.x - 1, y: initial.y - 1 });
  await swipe(page, "down"); await page.clock.runFor(100);
  expect(await fruit(page)).toEqual({ x: initial.x - 1, y: initial.y });
  await swipe(page, "left"); await page.clock.runFor(100);
  await swipe(page, "up"); await page.clock.runFor(100);
  const before = await fruit(page);
  expect(before).toEqual({ x: initial.x - 2, y: initial.y - 1 });
  const box = (await page.locator("canvas").boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  for (let i = 0; i < 2; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    if (!i) await page.clock.runFor(60);
  }
  await cdp.detach(); await page.clock.runFor(40);
  const after = await fruit(page);
  expect(after.x).toBe(before.x); expect(after.y).toBeLessThanOrEqual(before.y - 3);
  await page.keyboard.press("Escape"); await page.clock.runFor(40);
  await page.getByRole("button", { name: "Back to the chase" }).dispatchEvent("click");
  await page.clock.runFor(40); const stopped = await fruit(page);
  await page.clock.runFor(300); expect(await fruit(page)).toEqual(stopped);
});

test("all thirty maps can be played in Survival and the complex map expands in fullscreen", async ({ page }) => {
  const { ARENAS } = await import("../src/lib/game");
  await page.goto("/food");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.getByRole("button", { name: "Survival", exact: true }).click();
  for (const arena of ARENAS) {
    await page.getByRole("button", { name: `Choose ${arena.name}`, exact: true }).click();
    await expect(page.locator(".round-progress")).toContainText(arena.name);
  }
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect.poll(async () => (await page.locator(".arcade").boundingBox())?.width).toBe(page.viewportSize()!.width);
  await page.screenshot({ path: "docs/screenshots/maps-crown-fullscreen.png" });
  await page.getByRole("button", { name: "Exit fullscreen" }).click();
});

test("real safe movement unlocks the next map without stopping the chase", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/food"); await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await expect(page.getByRole("button", { name: "Next arena", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click"); await page.clock.runFor(40);
  const p = await fruit(page), b = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
  const perimeter = [["Right", b.columns - 1], ["Down", b.rows - 1], ["Left", b.columns - 1], ["Up", b.rows - 1]] as const;
  const route = [["Left", p.x], ["Up", p.y], ...Array.from({ length: 3 }, () => perimeter).flat()] as const;
  let remaining = 152;
  for (const [d, cells] of route) {
    const count = Math.min(remaining, cells);
    await page.keyboard.down(`Arrow${d}`); await page.clock.runFor(count * 100); await page.keyboard.up(`Arrow${d}`);
    remaining -= count; if (!remaining) break;
  }
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  await expect.poll(async () => Number((await page.locator(".round-progress strong").innerText()).replace(/[^\d]/g, ""))).toBeGreaterThanOrEqual(150);
  await expect(page.locator(".level-milestone")).toContainText("Next map unlocked");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("reverse-snake:v1")!).unlocked)).toBe(1);
  await page.getByRole("button", { name: "Next map" }).dispatchEvent("click"); await page.clock.runFor(40);
  await expect(page.locator(".round-progress")).toContainText("Root Divide");
  await page.reload(); await page.clock.runFor(100);
  await expect(page.getByRole("button", { name: "Choose Root Divide", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Choose Orchard Grove", exact: true })).toBeDisabled();
});

test("continuing an Easy chase earns a visible star and saves the rating", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/food"); await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Easy", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click"); await page.clock.runFor(40);
  const p = await fruit(page), b = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
  const perimeter = [["Right", b.columns - 1], ["Down", b.rows - 1], ["Left", b.columns - 1], ["Up", b.rows - 1]] as const;
  const route = [["Left", p.x], ["Up", p.y], ...Array.from({ length: 5 }, () => perimeter).flat()] as const;
  let remaining = 250;
  for (const [d, cells] of route) {
    const count = Math.min(remaining, cells);
    await page.keyboard.down(`Arrow${d}`); await page.clock.runFor(count * 100); await page.keyboard.up(`Arrow${d}`);
    remaining -= count; if (!remaining) break;
  }
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  await expect(page.locator(".score-star.earned")).toHaveCount(1);
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("reverse-snake:v1")!));
  expect(progress.unlocked).toBe(1); expect(progress.stars[0]).toBe(1);
  await page.screenshot({ path: "docs/screenshots/level-star-earned.png" });
  await page.keyboard.press("Escape"); await page.clock.runFor(40);
  await page.getByRole("button", { name: "End chase", exact: true }).dispatchEvent("click");
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "won");
  await expect(page.getByRole("button", { name: "Next map", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Next map", exact: true }).dispatchEvent("click");
  await page.clock.runFor(40);
  await expect(page.locator(".round-progress")).toContainText("Root Divide");
  await page.reload(); await page.clock.runFor(100);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("reverse-snake:v1")!).stars[0])).toBe(1);
});
