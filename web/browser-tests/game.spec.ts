import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function openGame(page: Page) {
  await page.clock.install({ time: new Date("2026-11-11T12:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-11T12:00:01Z"));
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "ready");
}

async function start(page: Page) {
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
}

// Read the fruit's visible pixels, without exposing or mutating game state.
async function fruit(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let x = 0, y = 0, n = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === 255 && pixels[i + 1] === 197 && pixels[i + 2] === 94) {
        x += (i / 4) % canvas.width; y += Math.floor(i / 4 / canvas.width); n++;
      }
    }
    if (!n) throw new Error("The mango is not visible");
    const dpr = canvas.width / 600, cell = 552 / 20;
    return { x: Math.round((x / n / dpr - 24) / cell - 0.5), y: Math.round((y / n / dpr - 24) / cell - 0.5) };
  });
}

test("rapid taps respect the same movement budget as held input", async ({ page }) => {
  await openGame(page); await start(page);
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowLeft");
  expect(await fruit(page)).toEqual({ x: 5, y: 13 });
  await page.clock.runFor(100); expect(await fruit(page)).toEqual({ x: 4, y: 13 });
  await page.keyboard.down("ArrowLeft"); await page.clock.runFor(400);
  await page.keyboard.up("ArrowLeft"); expect(await fruit(page)).toEqual({ x: 0, y: 13 });
});

test("releasing Shift before W stops movement and pause/resume clears held keys", async ({ page }) => {
  await openGame(page); await start(page);
  await page.keyboard.down("Shift"); await page.keyboard.down("KeyW");
  await page.clock.runFor(300); await page.keyboard.up("Shift"); await page.keyboard.up("KeyW");
  const stopped = await fruit(page); await page.clock.runFor(300);
  expect(await fruit(page)).toEqual(stopped);
  await page.keyboard.down("ArrowLeft"); await page.keyboard.press("Escape");
  await page.clock.runFor(1000); expect(await fruit(page)).toEqual(stopped);
  await page.keyboard.up("ArrowLeft"); await page.keyboard.press("Enter"); await page.clock.runFor(300);
  expect(await fruit(page)).toEqual(stopped);
});

test("two touch contacts and a held key retain independent ownership", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page); await start(page);
  await page.locator(".touch-controls").evaluate(el => el.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.keyboard.down("ArrowUp");
  const left = (await page.getByRole("button", { name: "Move left", exact: true }).boundingBox())!;
  const down = (await page.getByRole("button", { name: "Move down", exact: true }).boundingBox())!;
  const one = { x: left.x + left.width / 2, y: left.y + left.height / 2, id: 1 };
  const two = { x: down.x + down.width / 2, y: down.y + down.height / 2, id: 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [one] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [one, two] });
  await page.clock.runFor(100); expect(await fruit(page)).toEqual({ x: 5, y: 14 });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [one] });
  await page.clock.runFor(100); expect(await fruit(page)).toEqual({ x: 5, y: 15 });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await page.clock.runFor(100); expect(await fruit(page)).toEqual({ x: 5, y: 14 });
  await page.keyboard.up("ArrowUp");
});

// A reproducible real chase, ending in an adjacent-head dodge at 2.8 seconds.
const route = ["left", "right", "down", "left", "down", "up", "up", "right", "up", "left", "up", "left", "right", "up", "up", "right", "down", "down", "right", "left", "up", "up", "down", "left", "left", "up", "up", "left"];
for (const mode of ["Levels", "Survival"] as const) {
  test(`${mode}: a real close call shows the boost and pausing freezes its timer`, async ({ page }) => {
    await openGame(page);
    await page.getByRole("button", { name: mode, exact: true }).dispatchEvent("click");
    await start(page);
    for (const direction of route) {
      const key = `Arrow${direction[0].toUpperCase()}${direction.slice(1)}`;
      await page.keyboard.down(key); await page.clock.runFor(100); await page.keyboard.up(key);
    }
    // The canvas reads the current simulation directly; React's HUD publishes
    // at an 80ms cadence. Advance that cadence before asserting HUD feedback.
    await page.clock.runFor(80);
    await expect(page.locator(".boost-status")).toContainText("CLOSE CALL!");
    await expect(page.locator(".boost-status")).toContainText(mode === "Levels" ? /1\.9s|2\.0s/ : /4\.9s|5\.0s/);
    await mkdir("docs/screenshots", { recursive: true });
    await page.screenshot({ path: `docs/screenshots/jungle-${mode.toLowerCase()}-boost.png`, fullPage: true });
    const timer = await page.locator(".boost-status").textContent();
    await page.keyboard.press("Escape"); await page.clock.runFor(1200);
    await page.keyboard.press("Enter"); await page.clock.runFor(40);
    await expect(page.locator(".boost-status")).toContainText(timer!.includes("5.0s") ? /4\.9s|5\.0s/ : mode === "Levels" ? /1\.9s|2\.0s/ : /4\.8s|4\.9s/);
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

test("reduced motion retains the boost timer and safe keyboard control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openGame(page); await start(page);
  for (const direction of route) {
    const key = `Arrow${direction[0].toUpperCase()}${direction.slice(1)}`;
    await page.keyboard.down(key); await page.clock.runFor(100); await page.keyboard.up(key);
  }
  await page.clock.runFor(80);
  await expect(page.locator(".boost-status")).toContainText("CLOSE CALL!");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  await expect(page.locator("[role='status']").first()).toContainText("Double speed for 2 seconds");
});

test("jungle layout, text contrast and control sizes at desktop and mobile widths", async ({ page }) => {
  await openGame(page); await mkdir("docs/screenshots", { recursive: true });
  for (const width of [1440, 900, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await page.clock.runFor(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const selector of [".dark-icon-button", ".difficulty-options button", ".arena-arrows button"]) {
      const boxes = await page.locator(selector).evaluateAll(els => els.map(el => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
      expect(boxes.every(b => b.w >= 44 && b.h >= 44)).toBe(true);
    }
    if (width <= 900) {
      const box = (await page.getByRole("button", { name: "Move up" }).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    }
    if (width === 1440 || width === 390) await page.screenshot({ path: `docs/screenshots/jungle-${width === 1440 ? "desktop" : "mobile"}.png`, fullPage: true });
  }
  const contrast = await page.evaluate(() => {
    const luminance = (rgb: string) => {
      const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(n => Number(n) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    return [".hero p", ".difficulty-caption", ".hud-stat > span"].map(selector => {
      const el = document.querySelector(selector)!; const fg = luminance(getComputedStyle(el).color);
      const bg = luminance(selector.startsWith(".hud") ? "rgb(12, 41, 46)" : "rgb(28, 74, 66)");
      return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
    });
  });
  expect(contrast.every(ratio => ratio >= 4.5)).toBe(true);
  await page.getByRole("button", { name: "Your best runs", exact: true }).last().dispatchEvent("click");
  const scoreContrast = await page.locator(".score-note").evaluate(el => {
    const luminance = (rgb: string) => {
      const c = rgb.match(/[\d.]+/g)!.slice(0, 3).map(n => Number(n) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
      return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
    };
    return (luminance(getComputedStyle(el).color) + .05) / (luminance(getComputedStyle(el.closest("dialog")!).backgroundColor) + .05);
  });
  expect(scoreContrast).toBeGreaterThanOrEqual(4.5);
});
