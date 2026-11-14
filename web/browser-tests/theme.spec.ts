import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const key = "reverse-snake:theme:v1";
const menu = (page: Page) => page.getByRole("dialog", { name: "Game menu" });
async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(menu(page)).toBeVisible();
}
async function canvasHash(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (const byte of pixels) hash = Math.imul(hash ^ byte, 16777619);
    return hash >>> 0;
  });
}

async function landmarks(page: Page) {
  return page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    const mango = { x: 0, y: 0, n: 0 }, snake = { x: 0, y: 0, n: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
      const target = pixels[i] === 255 && pixels[i + 1] === 197 && pixels[i + 2] === 94 ? mango : pixels[i] === 220 && pixels[i + 1] === 152 && pixels[i + 2] === 69 ? snake : null;
      if (target) { target.x += (i / 4) % canvas.width; target.y += Math.floor(i / 4 / canvas.width); target.n++; }
    }
    if (!mango.n || !snake.n) throw new Error("The live characters must remain visible");
    return { mango: { x: mango.x / mango.n, y: mango.y / mango.n }, snake: { x: snake.x / snake.n, y: snake.y / snake.n } };
  });
}

test("light is the fresh default, dark persists across reload and every route", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await openMenu(page);
  await expect(menu(page).getByRole("button", { name: "Light", exact: true })).toHaveAttribute("aria-pressed", "true");
  await menu(page).getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe("dark");
  for (const route of ["/", "/hunter", "/challenge", "/replays"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#091f25");
    await openMenu(page);
    await expect(menu(page).getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
  }
  await openMenu(page);
  await menu(page).getByRole("button", { name: "Light", exact: true }).click();
  await page.reload();
  await expect(page.locator("canvas")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f4f6ed");
  expect(errors).toEqual([]);
});

test("a palette switch redraws a paused board without advancing or resetting it", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T12:00:00Z") });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T12:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(300);
  await page.keyboard.up("ArrowLeft");
  await page.getByRole("button", { name: "Open game menu" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
  const light = await canvasHash(page);
  const positions = await landmarks(page);
  const hud = await page.locator(".game-hud").innerText();
  const scoreData = await page.evaluate(() => localStorage.getItem("reverse-snake:v1"));
  await menu(page).getByRole("button", { name: "Dark", exact: true }).click();
  await page.clock.runFor(1000);

  await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
  expect(await canvasHash(page)).not.toBe(light);
  expect(await page.locator(".game-hud").innerText()).toBe(hud);
  await menu(page).getByRole("button", { name: "Light", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.locator("canvas")).toHaveAttribute("data-theme", "light");
  const after = await landmarks(page);
  for (const name of ["mango", "snake"] as const) {
    expect(after[name].x).toBeCloseTo(positions[name].x, 0);
    expect(after[name].y).toBeCloseTo(positions[name].y, 0);
  }
  expect(await page.evaluate(() => localStorage.getItem("reverse-snake:v1"))).toBe(scoreData);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
});

test("hover leaves gameplay running; click and keyboard open, Escape and outside click close", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open game menu" });
  await trigger.hover();
  await expect(menu(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Let’s play" }).click();
  await trigger.hover();
  await expect(menu(page)).toHaveCount(0);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
  await trigger.click();
  await expect(menu(page)).toBeVisible();
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toHaveCount(0);
  await trigger.press("Enter");
  await expect(menu(page)).toBeVisible();
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
  const light = menu(page).getByRole("button", { name: "Light", exact: true });
  const dark = menu(page).getByRole("button", { name: "Dark", exact: true });
  const background = await dark.evaluate(el => getComputedStyle(el).backgroundColor);
  await dark.hover();
  await expect.poll(() => dark.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(background);
  await expect(light).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(5, 200);
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await openMenu(page);
  await page.locator(".hero h1").click();
  await expect(menu(page)).toHaveCount(0);
  await openMenu(page);
  await menu(page).getByRole("button", { name: "How to play", exact: true }).click();
  await expect(page.locator("dialog.modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("the menu offers Hunter from Mango and Mango from Hunter, including during a round", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await expect(menu(page).getByRole("link", { name: "Mango · escape the hunter" })).toHaveCount(0);
  await expect(menu(page).getByRole("link", { name: "Hunter · control the snake" })).toBeVisible();
  await menu(page).getByRole("link", { name: "Hunter · control the snake" }).click();
  await expect(page).toHaveURL(/\/hunter$/);
  await page.getByRole("button", { name: "Start round" }).click();
  await openMenu(page);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
  await expect(menu(page).getByRole("link", { name: "Hunter · control the snake" })).toHaveCount(0);
  await expect(menu(page).getByRole("link", { name: "Mango · escape the hunter" })).toBeVisible();
  await menu(page).getByRole("link", { name: "Mango · escape the hunter" }).click();
  await page.getByRole("button", { name: "Let’s play" }).click();
  await openMenu(page);
  await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
  await expect(menu(page).getByRole("link", { name: "Mango · escape the hunter" })).toHaveCount(0);
  await expect(menu(page).getByRole("link", { name: "Hunter · control the snake" })).toBeVisible();
});

for (const unavailable of [false, true]) {
  test(`${unavailable ? "blocked" : "invalid"} theme storage falls back to light and keeps switching usable`, async ({ page }) => {
    await page.addInitScript(({ key, unavailable }) => {
      if (unavailable) {
        const get = Storage.prototype.getItem;
        const set = Storage.prototype.setItem;
        Storage.prototype.getItem = function (name) { if (name === key) throw new Error("blocked"); return get.call(this, name); };
        Storage.prototype.setItem = function (name, value) { if (name === key) throw new Error("blocked"); return set.call(this, name, value); };
      } else localStorage.setItem(key, "unsupported");
    }, { key, unavailable });
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveAttribute("data-theme", "light");
    await openMenu(page);
    await menu(page).getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
    if (unavailable) await expect(menu(page).getByRole("status")).toContainText("for this visit");
  });
}

test("theme changes synchronize between open tabs", async ({ page, context }) => {
  await page.goto("/");
  const second = await context.newPage();
  await second.goto("/hunter");
  await openMenu(second);
  await menu(second).getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(key => localStorage.removeItem(key), key);
  await expect(second.locator("canvas")).toHaveAttribute("data-theme", "light");
});

test("both palettes keep every route and the open menu inside desktop, phone and landscape viewports", async ({ page }) => {
  await mkdir("docs/screenshots", { recursive: true });
  for (const theme of ["light", "dark"] as const) {
    for (const [width, height] of [[1440, 900], [320, 568], [844, 390]]) {
      await page.setViewportSize({ width, height });
      for (const route of ["/", "/hunter", "/challenge", "/replays"]) {
        await page.goto(route);
        await openMenu(page);
        await menu(page).getByRole("button", { name: theme === "light" ? "Light" : "Dark", exact: true }).click();
        await expect(page.locator("canvas")).toHaveAttribute("data-theme", theme);
        const panel = (await menu(page).boundingBox())!;
        expect(panel.x).toBeGreaterThanOrEqual(0);
        expect(panel.x + panel.width).toBeLessThanOrEqual(width);
        expect(panel.y + panel.height).toBeLessThanOrEqual(height);
        const toggle = (await menu(page).getByRole("button", { name: "Light", exact: true }).boundingBox())!;
        expect(toggle.height).toBeGreaterThanOrEqual(44);
        if (route === "/" && height !== 390) await page.screenshot({ path: `docs/screenshots/theme-${theme}-menu-${width === 1440 ? "desktop" : "phone"}.png`, animations: "disabled" });
        await page.keyboard.press("Escape");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
        if (route === "/" && height !== 390) await page.screenshot({ path: `docs/screenshots/theme-${theme}-${width === 1440 ? "desktop" : "phone"}.png`, animations: "disabled" });
      }
    }
  }
});

test("supporting text and theme selections have readable contrast in both palettes", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark"] as const) {
    await openMenu(page);
    await menu(page).getByRole("button", { name: theme === "light" ? "Light" : "Dark", exact: true }).click();
    const contrast = () => page.evaluate(() => {
      const luminance = (rgb: string) => {
        const c = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
        return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
      };
      return [".hud-stat > span", ".theme-toggle button[aria-pressed='true']", ".game-menu > a", ".ghost-option", ".menu-panel .score-note", ".theme-option legend"].map(selector => {
        const el = document.querySelector(selector)!;
        let bg = getComputedStyle(el).backgroundColor;
        let ancestor = el.parentElement;
        while ((bg === "rgba(0, 0, 0, 0)" || bg === "transparent") && ancestor) {
          bg = getComputedStyle(ancestor).backgroundColor;
          ancestor = ancestor.parentElement;
        }
        const fg = luminance(getComputedStyle(el).color), background = luminance(bg);
        return { selector, ratio: (Math.max(fg, background) + .05) / (Math.min(fg, background) + .05) };
      });
    });
    await expect.poll(async () => (await contrast()).every(({ ratio }) => ratio >= 4.5)).toBe(true);
    for (const { ratio, selector } of await contrast()) expect(ratio, `${theme} ${selector}`).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Escape");
  }
});

test.describe("touch menu", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 568 } });
  test("tap toggles the menu and its theme without requiring hover", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open game menu" });
    await trigger.tap();
    await expect(menu(page)).toBeVisible();
    await menu(page).getByRole("button", { name: "Dark", exact: true }).tap();
    await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
    await trigger.tap();
    await expect(menu(page)).toHaveCount(0);
    await trigger.tap();
    await page.getByRole("button", { name: "Close menu" }).tap();
    await expect(menu(page)).toHaveCount(0);
  });
});
