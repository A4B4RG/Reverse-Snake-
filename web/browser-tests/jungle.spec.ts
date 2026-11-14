import { expect, test, type Page } from "@playwright/test";
import { fruit, renderedBoard, swipe } from "./helpers";
import { createHunter } from "../src/lib/hunter";
import { createGame, step, VECTORS, type Direction, type GameState } from "../src/lib/game";

async function settings(page: Page) {
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.locator(".play-settings-panel summary").click();
}
async function tap(page: Page, jitter = 4) {
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + jitter, y: y + 2, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach();
}

test("welcome offers both animated roles and the matching instructions before play", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".welcome-intro h1")).toContainText("Reverse");
  await expect(page.locator(".welcome-logo svg")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const hunter = page.getByRole("button", { name: "Hunter Lead the chase" });
  await hunter.hover(); await expect(hunter.locator(".wrap-snake")).toHaveCSS("opacity", "1");
  await hunter.click();
  await expect(page.locator(".welcome-guide")).toContainText("Your snake keeps moving");
  await expect(page.getByRole("link", { name: "Play as Hunter" })).toHaveAttribute("href", "/hunter");
  await page.getByRole("button", { name: "Choose again" }).click();
  const food = page.getByRole("button", { name: "Food Outsmart the hunter" });
  await food.hover(); await expect(food.locator(".hover-apple")).toHaveCSS("opacity", "1");
  await expect(food.locator(".role-title")).toHaveCSS("opacity", "0");
  await page.screenshot({ path: "docs/screenshots/welcome-role-food.png" });
  await food.click();
  await expect(page.locator(".welcome-guide")).toContainText("Double-tap to dash");
  await page.getByRole("link", { name: "Play as Food" }).click();
  await expect(page).toHaveURL(/\/food$/);
  await expect(page.getByRole("button", { name: "Easy", exact: true })).toHaveAttribute("aria-pressed", "true");
});

for (const size of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`welcome, selection and guide remain usable at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size); await page.goto("/");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    for (const card of await page.locator(".role-card").all()) {
      const b = (await card.boundingBox())!; expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(size.width);
    }
    await page.getByRole("button", { name: "Food Outsmart the hunter" }).click();
    await expect(page.getByRole("link", { name: "Play as Food" })).toBeVisible();
    const guide = (await page.locator(".welcome-guide-actions").boundingBox())!;
    expect(guide.y + guide.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({ path: `docs/screenshots/welcome-guide-${size.width}.png` });
    await page.getByRole("link", { name: "Play as Food" }).click();
    await settings(page);
    await expect(page.getByRole("combobox", { name: "Pace", exact: true })).toHaveValue("easy");
  });
}

test("Hunter begins on Easy, desktop offers 120 FPS and settings persist across routes", async ({ page }) => {
  await page.goto("/hunter"); await expect(page.getByRole("combobox", { name: "Difficulty", exact: true })).toHaveValue("easy");
  await settings(page);
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("30");
  await expect(page.locator('option[value="120"]')).toHaveCount(1);
  await page.getByRole("combobox", { name: "Frame rate" }).selectOption("120");
  await page.getByRole("slider", { name: "Touch sensitivity" }).fill("8");
  await page.getByRole("checkbox", { name: "Jungle music" }).uncheck();
  await page.getByRole("button", { name: "Close menu" }).click();
  await page.getByRole("link", { name: "Food", exact: true }).click();
  await settings(page);
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("120");
  await expect(page.getByRole("slider", { name: "Touch sensitivity" })).toHaveValue("8");
  await expect(page.getByRole("checkbox", { name: "Jungle music" })).not.toBeChecked();
  await page.reload(); await settings(page);
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("120");
});

test.describe("phone frame support", () => {
test.use({ hasTouch: true });
test("phone hides 120 FPS and gates 90 FPS on a 60 Hz display, even with saved desktop settings", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("reverse-snake:settings:v1", JSON.stringify({ fps: 120 })));
  await page.goto("/food"); await settings(page);
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("60");
  await expect(page.locator('option[value="120"]')).toHaveCount(0);
  await expect(page.locator('option[value="90"]')).toBeDisabled();
  await page.getByRole("combobox", { name: "Frame rate" }).selectOption("30");
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("30");
});

test("90 FPS becomes available when the phone reports a supported refresh cadence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(time => callback(time / 2));
  });
  await page.goto("/food"); await settings(page);
  await expect(page.locator('option[value="90"]')).toBeEnabled();
  await page.getByRole("combobox", { name: "Frame rate" }).selectOption("90");
  await expect(page.getByRole("combobox", { name: "Frame rate" })).toHaveValue("90");
});
});

test("selected FPS changes draw cadence while keeping the same active simulation speed", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as unknown as { draws: number }; probe.draws = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) { probe.draws++; return clear.apply(this, args); };
  });
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/hunter"); await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  const counts: number[] = [], elapsed: number[] = [];
  for (const fps of [30, 60]) {
    await settings(page); await page.getByRole("combobox", { name: "Frame rate" }).selectOption(String(fps));
    await page.getByRole("button", { name: "Close menu" }).click();
    await page.getByRole("button", { name: fps === 30 ? "Start round" : "Try again", exact: true }).dispatchEvent("click");
    await page.clock.runFor(40);
    await page.evaluate(() => { (window as unknown as { draws: number }).draws = 0; });
    await page.clock.runFor(1000);
    counts.push(await page.evaluate(() => (window as unknown as { draws: number }).draws));
    elapsed.push(Number(await page.locator("canvas").getAttribute("data-elapsed")));
    await page.keyboard.press("Escape"); await page.clock.runFor(40);
    if (fps === 30) { await page.getByRole("button", { name: "End chase", exact: true }).dispatchEvent("click"); await page.clock.runFor(40); }
  }
  // Hunter display state changes each simulation step; count real Canvas clears.
  expect(counts[0]).toBeGreaterThanOrEqual(25); expect(counts[0]).toBeLessThanOrEqual(32);
  expect(counts[1]).toBeGreaterThanOrEqual(45); expect(counts[1]).toBeGreaterThan(counts[0] * 1.4);
  expect(Math.abs(elapsed[0] - elapsed[1])).toBeLessThanOrEqual(20);
});

test("Survival on a phone accepts all four swipes and jittery double-taps at base frame rate", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/food"); await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await settings(page); await page.getByRole("combobox", { name: "Play mode" }).selectOption("survival");
  await page.getByRole("button", { name: "Close menu" }).click(); await renderedBoard(page);
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click"); await page.clock.runFor(40);
  for (const d of ["left", "up", "right", "down"] as const) {
    const before = await fruit(page); await swipe(page, d); await page.clock.runFor(d === "left" ? 200 : 100);
    const after = await fruit(page), v = VECTORS[d];
    expect((after.x - before.x) * v.x + (after.y - before.y) * v.y, `${d}: ${JSON.stringify({before,after,elapsed: await page.locator("canvas").getAttribute("data-elapsed")})}`).toBeGreaterThan(0);
  }
  await swipe(page, "left"); await page.clock.runFor(120);
  await swipe(page, "up"); await page.clock.runFor(120);
  const before = await fruit(page);
  await tap(page); await page.clock.runFor(60); await tap(page); await page.clock.runFor(40);
  const after = await fruit(page); expect(after.x).toBe(before.x); expect(after.y).toBeLessThanOrEqual(before.y - 3);
  await expect(page.locator(".dash-meter")).not.toHaveClass(/charged/);
  await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Dash", exact: true })).toHaveCount(0);
});

test("touch sensitivity changes the real swipe threshold", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/food"); await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await settings(page); await page.getByRole("slider", { name: "Touch sensitivity" }).fill("1");
  await page.getByRole("button", { name: "Close menu" }).click(); await renderedBoard(page);
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click"); await page.clock.runFor(60);
  const shortSwipe = async () => {
    const b = (await page.locator("canvas").boundingBox())!, x = b.x + b.width / 2, y = b.y + b.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 20, y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach();
  };
  const initial = await fruit(page); await shortSwipe(); await page.clock.runFor(120); expect(await fruit(page)).toEqual(initial);
  await settings(page); await page.getByRole("slider", { name: "Touch sensitivity" }).fill("10");
  await page.getByRole("button", { name: "Close menu" }).click();
  await page.getByRole("button", { name: "Back to the chase" }).dispatchEvent("click"); await page.clock.runFor(60);
  await shortSwipe(); await page.clock.runFor(120); expect((await fruit(page)).x).toBeLessThan(initial.x);
});

test("original jungle music loads after Start and responds to music and volume controls", async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalAudio = window.Audio;
    window.Audio = new Proxy(OriginalAudio, { construct(target, args) {
      const track = Reflect.construct(target, args) as HTMLAudioElement;
      (window as unknown as { musicTrack: HTMLAudioElement }).musicTrack = track; return track;
    } });
  });
  await page.goto("/");
  expect(await page.evaluate(() => Boolean((window as unknown as { musicTrack?: HTMLAudioElement }).musicTrack))).toBe(false);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const t = (window as unknown as { musicTrack: HTMLAudioElement }).musicTrack;
    return t && !t.paused && t.readyState >= 2 && t.duration > 42 && t.duration < 44;
  })).toBe(true);
  await settings(page); await page.getByRole("slider", { name: "Music volume" }).fill("20");
  expect(await page.evaluate(() => (window as unknown as { musicTrack: HTMLAudioElement }).musicTrack.volume)).toBe(.2);
  await page.getByRole("checkbox", { name: "Jungle music" }).uncheck();
  await expect.poll(() => page.evaluate(() => (window as unknown as { musicTrack: HTMLAudioElement }).musicTrack.paused)).toBe(true);
  await page.getByRole("checkbox", { name: "Jungle music" }).check();
  await expect.poll(() => page.evaluate(() => (window as unknown as { musicTrack: HTMLAudioElement }).musicTrack.paused)).toBe(false);
});

for (const kind of ["speed", "stun"] as const) {
  test(`a real Hunter ${kind} pickup renders its animation`, async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
    await page.goto("/hunter"); await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
    await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z")); await renderedBoard(page);
    const board = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
    let seed = 0, heading: Direction = "right";
    for (let candidate = 1; candidate < 10000 && !seed; candidate++) {
      const s = createHunter(0, "easy", candidate, board);
      for (const d of ["up", "right", "down"] as const) {
        const v = VECTORS[d];
        if (s.powerUps.some(p => p.kind === kind && p.position.x === s.snake[0].x + v.x && p.position.y === s.snake[0].y + v.y)) { seed = candidate; heading = d; break; }
      }
    }
    expect(seed).toBeGreaterThan(0);
    await page.evaluate(seed => Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: (array: Uint32Array) => { array[0] = seed; return array; } }), seed);
    await page.getByRole("button", { name: "Start round", exact: true }).dispatchEvent("click");
    await page.clock.runFor(40);
    await page.keyboard.press(`Arrow${heading[0].toUpperCase()}${heading.slice(1)}`); await page.clock.runFor(200);
    await page.keyboard.press("Escape"); await page.clock.runFor(40);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("reverse-snake:preview:v2")!).meta.seed)).toBe(seed);
    await page.getByRole("button", { name: "Resume round" }).dispatchEvent("click"); await page.clock.runFor(80);
    await expect(page.locator(".hunter-power-status")).toContainText(kind === "speed" ? "2× speed" : "Food stunned");
    const pixels = await page.locator("canvas").evaluate((c: HTMLCanvasElement, kind) => {
      const color = kind === "speed" ? [195,85,116] : [237,178,61], data = c.getContext("2d")!.getImageData(0,0,c.width,c.height).data;
      let count = 0; for (let i = 0; i < data.length; i += 4) if (color.every((v,j) => Math.abs(data[i+j] - v) < 3)) count++; return count;
    }, kind);
    expect(pixels).toBeGreaterThan(8);
    await page.screenshot({ path: `docs/screenshots/hunter-${kind}-animation.png` });
  });
}

for (const mode of ["levels", "survival"] as const) {
  test(`Food ${mode} shows a capture bite then releases the result controls`, async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
    await page.goto("/food"); await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
    await page.getByRole("button", { name: "Normal", exact: true }).dispatchEvent("click");
    await page.getByRole("button", { name: mode === "levels" ? "Levels" : "Survival", exact: true }).dispatchEvent("click");
    await renderedBoard(page);
    const board = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
    let s: GameState = { ...createGame(0, "normal", mode, board), phase: "running" };
    for (let i = 0; i < 3000 && s.phase === "running"; i++) s = step(s, null);
    expect(s.phase).toBe("lost");
    await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click"); await page.clock.runFor(40);
    const elapsed = Number(await page.locator("canvas").getAttribute("data-elapsed"));
    await page.clock.runFor(s.elapsed - elapsed + 40);
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "lost");
    await expect(page.locator("canvas")).toHaveAttribute("data-biting", "true");
    await expect(page.locator(".state-overlay")).toHaveCSS("opacity", "0");
    const before = await page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.clock.runFor(200);
    expect(await page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL()) === before).toBe(false);
    await page.screenshot({ path: `docs/screenshots/food-${mode}-bite.png` });
    await page.clock.runFor(650);
    await expect(page.locator("canvas")).toHaveAttribute("data-biting", "false");
    await expect(page.locator(".state-overlay")).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: "One more bite" }).dispatchEvent("click"); await page.clock.runFor(40);
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  });
}

test("a real Hunter catch shows and completes its bite while the hunt continues", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/hunter"); await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z")); await renderedBoard(page);
  const board = await page.locator("canvas").evaluate(c => ({ columns: Number(c.dataset.columns), rows: Number(c.dataset.rows) }));
  let seed = 0;
  for (let candidate = 1; candidate < 10000 && !seed; candidate++) {
    const s = createHunter(0, "easy", candidate, board);
    if (s.food?.x === s.snake[0].x + 1 && s.food.y === s.snake[0].y) seed = candidate;
  }
  expect(seed).toBeGreaterThan(0);
  await page.evaluate(seed => Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: (array: Uint32Array) => { array[0] = seed; return array; } }), seed);
  await page.getByRole("button", { name: "Start round", exact: true }).dispatchEvent("click"); await page.clock.runFor(280);
  await expect(page.locator("canvas")).toHaveAttribute("data-biting", "true");
  await expect(page.locator(".game-hud strong").first()).toHaveText("100");
  await page.screenshot({ path: "docs/screenshots/hunter-bite.png" });
  await page.clock.runFor(700);
  await expect(page.locator("canvas")).toHaveAttribute("data-biting", "false");
  await expect(page.getByRole("button", { name: "Pause game" })).toBeEnabled();
});
