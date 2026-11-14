import { expect, test, type Page } from "@playwright/test";
import { fruit, closeCall, renderedBoard } from "./helpers";
import { mkdir } from "node:fs/promises";

async function openGame(page: Page) {
  await page.addInitScript(() => localStorage.setItem("reverse-snake:theme:v1", "dark"));
  await page.clock.install({ time: new Date("2026-11-11T12:00:00Z") });
  await page.goto("/food");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-11T12:00:01Z"));
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "ready");
  await page.getByRole("button", { name: "Normal", exact: true }).dispatchEvent("click");
}

async function start(page: Page) {
  await renderedBoard(page);
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
}

test("starting before the first animation frame cannot reset the round", async ({page}) => {
  const time = new Date("2026-11-14T00:00:00Z");
  await page.clock.install({time}); await page.clock.pauseAt(time);
  await page.goto("/food");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.getByRole("button", {name: "Let’s play"}).dispatchEvent("click");
  await page.clock.runFor(100);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  await page.clock.runFor(100);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
});

test("rapid taps respect the same movement budget as held input", async ({ page }) => {
  await openGame(page); await start(page);
  const initial=await fruit(page);
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowLeft");
  expect(await fruit(page)).toEqual(initial);
  await page.clock.runFor(100); expect(await fruit(page)).toEqual({x:initial.x-1,y:initial.y});
  await page.keyboard.down("ArrowLeft"); await page.clock.runFor(400);
  await page.keyboard.up("ArrowLeft"); expect(await fruit(page)).toEqual({x:Math.max(0,initial.x-5),y:initial.y});
});

test("releasing Shift before W stops movement and pause/resume clears held keys", async ({ page }) => {
  await openGame(page); await start(page);
  await page.keyboard.down("Shift"); await page.keyboard.down("KeyW");
  await page.clock.runFor(300); await page.keyboard.up("Shift"); await page.keyboard.up("KeyW");
  const stopped = await fruit(page); await page.clock.runFor(300);
  expect(await fruit(page)).toEqual(stopped);
  await page.keyboard.down("ArrowLeft"); await page.keyboard.press("Escape");
  await page.clock.runFor(40);await expect(page.locator(".board-stage")).toHaveAttribute("data-phase","paused");
  const elapsed=await page.locator("canvas").getAttribute("data-elapsed");
  await page.clock.runFor(1000); expect(await page.locator("canvas").getAttribute("data-elapsed")).toBe(elapsed);
  await page.keyboard.up("ArrowLeft"); await page.keyboard.press("Enter"); await page.clock.runFor(300);
  expect(await fruit(page)).toEqual(stopped);
});


for (const mode of ["Levels", "Survival"] as const) {
  test(`${mode}: a real close call shows the boost and pausing freezes its timer`, async ({ page }) => {
    await openGame(page);
    await page.getByRole("button", { name: mode, exact: true }).dispatchEvent("click");
    await start(page);
    await closeCall(page,mode.toLowerCase() as "levels"|"survival");
    await page.clock.runFor(80);
    await expect(page.locator(".boost-status")).toContainText("CLOSE CALL!");
    await expect(page.locator(".boost-status")).toContainText(mode === "Levels" ? /1\.9s|2\.0s/ : /4\.9s|5\.0s/);
    await mkdir("docs/screenshots", { recursive: true });
    await page.screenshot({ path: `docs/screenshots/jungle-${mode.toLowerCase()}-boost.png`, fullPage: true });
    const remaining=()=>page.locator(".boost-status").innerText().then(t=>Number(t.match(/([\d.]+)s/)![1]));
    const timer = await remaining();
    await page.keyboard.press("Escape"); await page.clock.runFor(1200);
    await page.keyboard.press("Enter"); await page.clock.runFor(40);
    expect(await remaining()).toBeGreaterThanOrEqual(timer-.2);expect(await remaining()).toBeLessThanOrEqual(timer);
    await page.keyboard.press("r"); await page.clock.runFor(40);
    await expect(page.locator(".boost-status")).toHaveCount(0);
    await expect(page.getByRole("button", { name: mode, exact: true })).toHaveAttribute("aria-pressed", "true");
  });
}

test("missing UUID, failed audio and blocked persistence cannot prevent results or restarting", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined, configurable: true });
    Object.defineProperty(window, "AudioContext", { value: class { state = "running"; createOscillator() { throw new Error("No audio device"); } close() { return Promise.resolve(); } } });
    Storage.prototype.setItem = () => { throw new Error("Storage disabled"); };
  });
  await openGame(page); await start(page); await page.clock.runFor(7000);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "lost");
  await expect(page.getByRole("button", { name: "One more bite" })).toBeVisible();
  await expect(page.locator(".storage-notice")).toBeVisible();
  await page.getByRole("button", { name: "One more bite" }).dispatchEvent("click"); await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
});

test("a survival result and its new fields survive a browser reload", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Survival", exact: true }).dispatchEvent("click");
  await start(page); await page.clock.runFor(7000);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "lost");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("reverse-snake:v1")!));
  expect(saved.runs).toHaveLength(1); expect(saved.runs[0].mode).toBe("survival");
  expect(saved.runs[0].closeCalls).toBe(0); expect(saved.attempts).toBe(1);
  await page.reload(); await page.clock.runFor(100);
  await page.getByRole("button", { name: "Your best runs", exact: true }).first().dispatchEvent("click");
  await expect(page.locator(".score-list")).toContainText("Survival");
  await expect(page.locator(".score-list")).toContainText(`${saved.runs[0].score}`);
});

for (const difficulty of ["Easy", "Normal", "Hard"] as const) {
  test(`Wild Heart Levels ${difficulty}: standing still loses instead of awarding an automatic win`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("reverse-snake:v1", JSON.stringify({ unlocked: 4 })));
    await openGame(page);
    await page.getByRole("button", { name: "Choose Wild Heart", exact: true }).dispatchEvent("click");
    await page.getByRole("button", { name: difficulty, exact: true }).dispatchEvent("click");
    await page.getByRole("button", { name: "Levels", exact: true }).dispatchEvent("click");
    await start(page);
    const initial=await fruit(page);
    // Start only: no movement key, pointer input, or dash baits the hunter.
    await page.clock.runFor(20_000);
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "lost");
    expect(await fruit(page)).toEqual(initial);
    await expect(page.getByRole("button", { name: "One more bite" })).toBeVisible();
  });
}

test("Wild Heart Survival keeps chasing fruit on the far side of its root wall", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("reverse-snake:v1", JSON.stringify({ unlocked: 4 })));
  await openGame(page);
  await page.getByRole("button", { name: "Choose Wild Heart", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Hard", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Survival", exact: true }).dispatchEvent("click");
  await start(page);
  await page.keyboard.down("ArrowDown");await page.clock.runFor(200);await page.keyboard.up("ArrowDown");
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase","running");
  await page.clock.runFor(18_000);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "lost");
  await expect(page.getByRole("button", { name: "One more bite" })).toBeVisible();
});

test("reduced motion retains the boost timer and safe keyboard control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openGame(page); await start(page);
  await closeCall(page);
  await expect(page.locator(".boost-status")).toContainText("CLOSE CALL!");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  await expect(page.locator(".sr-only[role='status']").first()).toContainText("Double speed for 2 seconds");
});

test("jungle layout, text contrast and control sizes at desktop and mobile widths", async ({ page }) => {
  await openGame(page); await mkdir("docs/screenshots", { recursive: true });
  for (const width of [1440, 900, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await page.clock.runFor(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const selector of [".dark-icon-button", ".difficulty-options button", ".arena-arrows button"]) {
      const boxes = await page.locator(selector).evaluateAll(els => els.filter(el => el.getBoundingClientRect().width > 0).map(el => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
      expect(boxes.every(b => b.w >= 44 && b.h >= 44)).toBe(true);
    }
    if (width <= 900) {
      await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
      const box = (await page.getByRole("button", { name: "Open game menu" }).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    }
    if (width === 1440 || width === 390) await page.screenshot({ path: `docs/screenshots/jungle-${width === 1440 ? "desktop" : "mobile"}.png`, fullPage: true });
  }
  const contrast = await page.evaluate(() => {
    const luminance = (rgb: string) => {
      const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(n => Number(n) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    return [".hero p", ".control-row > span", ".hud-stat > span"].map(selector => {
      const el = document.querySelector(selector)!; const fg = luminance(getComputedStyle(el).color);
      const bg = luminance(selector.startsWith(".hud") ? "rgb(12, 41, 46)" : "rgb(28, 74, 66)");
      return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
    });
  });
  expect(contrast.every(ratio => ratio >= 4.5)).toBe(true);
  await page.getByRole("button", { name: "Open game menu", exact: true }).click();
  await page.getByRole("button", { name: "Your best runs", exact: true }).click();
  const scoreContrast = await page.locator(".score-note").evaluate(el => {
    const luminance = (rgb: string) => {
      const c = rgb.match(/[\d.]+/g)!.slice(0, 3).map(n => Number(n) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
      return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
    };
    return (luminance(getComputedStyle(el).color) + .05) / (luminance(getComputedStyle(el.closest("dialog")!).backgroundColor) + .05);
  });
  expect(scoreContrast).toBeGreaterThanOrEqual(4.5);
});
