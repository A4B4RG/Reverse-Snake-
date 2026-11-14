import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fruit } from "./helpers";

for (const route of ["/", "/hunter", "/challenge"]) {
  test(`${route}: skins persist, freeze during the match and are recorded`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
    await page.goto(route);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-mounted",
      "true",
    );
    await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
    await page
      .getByRole("button", { name: "Pear fruit", exact: true })
      .dispatchEvent("click");
    await page
      .getByRole("button", { name: "Coral snake", exact: true })
      .dispatchEvent("click");
    await page.clock.runFor(40);
    await expect(page.locator("canvas")).toHaveAttribute("data-fruit", "pear");
    await expect(page.locator("canvas")).toHaveAttribute("data-snake", "coral");
    await page
      .getByRole("button", {
        name: route === "/" ? "Let’s play" : "Start round",
      })
      .dispatchEvent("click");
    await page.clock.runFor(40);
    await expect(
      page.getByRole("button", { name: "Apple fruit", exact: true }),
    ).toBeDisabled();
    await page.clock.runFor(30000);
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "lost",
    );
    const replay = await page.evaluate(
      () => JSON.parse(localStorage.getItem("reverse-snake:replays:v1")!)[0],
    );
    expect(replay.meta.appearance).toEqual({ fruit: "pear", snake: "coral" });
    expect(replay.meta.board.columns).toBeGreaterThan(20);
    await page.reload();
    await page.clock.runFor(100);
    await expect(page.locator("canvas")).toHaveAttribute("data-fruit", "pear");
  });
}
test("real moves train both persistent policies across mode changes", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(500);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("Escape");
  const a = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reverse-snake:learning:v1")!),
  );
  expect(a.fruit.samples).toBeGreaterThanOrEqual(4);
  expect(a.snake.samples).toBe(0);
  await page.goto("/hunter");
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Start round" })
    .dispatchEvent("click");
  await page.clock.runFor(500);
  await page.keyboard.press("Escape");
  const b = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reverse-snake:learning:v1")!),
  );
  expect(b.fruit).toEqual(a.fruit);
  expect(b.snake.samples).toBeGreaterThan(0);
  expect(b.snake.input).not.toEqual(a.snake.input);
  await page.reload();
  await page.clock.runFor(100);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("reverse-snake:learning:v1")!),
    ),
  ).toEqual(b);
});
test("pause loops the last recorded fruit-and-snake match without advancing live progress", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.keyboard.down("ArrowDown");
  await page.clock.runFor(200);
  await page.keyboard.up("ArrowDown");
  // Let the renderer catch up after releasing movement before sampling pixels.
  await page.clock.runFor(40);
  const before = await fruit(page);
  await page.clock.runFor(120);
  expect(await fruit(page)).toEqual(before);
  await page.keyboard.press("Escape");
  await page.clock.runFor(40);
  const time = await page.locator("canvas").getAttribute("data-elapsed"),
    hud = await page.locator(".game-hud").innerText();
  const hash = () =>
    page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const a = await hash();
  await page.clock.runFor(120);
  expect(await hash()).not.toBe(a);
  expect(await page.locator("canvas").getAttribute("data-elapsed")).toBe(time);
  expect(await page.locator(".game-hud").innerText()).toBe(hud);
  const style = await page.locator(".pause-overlay").evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    blur: getComputedStyle(el).backdropFilter,
  }));
  expect(Number(style.bg.match(/[\d.]+/g)!.at(-1))).toBeLessThan(0.6);
  expect(style.blur).toContain("blur(6px)");
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/adaptive-pause.png" });
  await page.keyboard.press("Enter");
  await page.clock.runFor(40);
  expect(await fruit(page)).toEqual(before);
});
test("the outer rectangle is fully playable and fullscreen grows the board", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-columns", /\d+/);
  const geometry = () =>
    page.locator("canvas").evaluate((c) => ({
      columns: Number((c as HTMLElement).dataset.columns),
      rows: Number((c as HTMLElement).dataset.rows),
    }));
  const normal = await geometry();
  const control = (await page.locator(".controls-section").boundingBox())!,
    sidebar = (await page.locator(".game-sidebar").boundingBox())!;
  expect(
    Math.abs(control.y + control.height - sidebar.y - sidebar.height),
  ).toBeLessThan(2);
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect
    .poll(async () => {
      const b = await geometry();
      return b.columns * b.rows;
    })
    .toBeGreaterThan(normal.columns * normal.rows);
  const c = (await page.locator("canvas").boundingBox())!,
    b = (await page.locator(".board-stage").boundingBox())!;
  expect(c.width).toBeCloseTo(b.width, 0);
  expect(c.height).toBeCloseTo(b.height, 0);
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/adaptive-fullscreen.png" });
  await page.getByRole("button", { name: "Exit fullscreen" }).click();
});
test("every fruit and snake design produces distinct artwork", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  const hashes = new Set<string>();
  for (const skin of ["Apple", "Mango", "Pear", "Orange", "Strawberry"]) {
    await page
      .getByRole("button", { name: `${skin} fruit`, exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-fruit",
      skin.toLowerCase(),
    );
    hashes.add(
      await page
        .locator("canvas")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    );
  }
  expect(hashes.size).toBe(5);
  hashes.clear();
  for (const skin of ["Amber", "Jade", "Coral", "Midnight"]) {
    await page
      .getByRole("button", { name: `${skin} snake`, exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-snake",
      skin.toLowerCase(),
    );
    hashes.add(
      await page
        .locator("canvas")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    );
  }
  expect(hashes.size).toBe(4);
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/adaptive-desktop.png" });
});

test("learning stays in memory for another round when storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "reverse-snake:learning:v1") throw Error("blocked");
      set.call(this, k, v);
    };
  });
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(400);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("r");
  await page.clock.runFor(40);
  await page.clock.runFor(15000);
  const replay = await page.evaluate(
    () => JSON.parse(localStorage.getItem("reverse-snake:replays:v1")!)[0],
  );
  expect(replay.meta.learning.fruit.samples).toBeGreaterThanOrEqual(4);
});
test("Hunter loads saved skins and learning even when started before its first frame", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "reverse-snake:appearance:v1",
      JSON.stringify({ fruit: "orange", snake: "midnight" }),
    ),
  );
  const time = new Date("2026-11-14T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/hunter");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page
    .getByRole("button", { name: "Start round" })
    .dispatchEvent("click");
  await page.clock.runFor(100);
  await expect(page.locator("canvas")).toHaveAttribute("data-fruit", "orange");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-snake",
    "midnight",
  );
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
});
