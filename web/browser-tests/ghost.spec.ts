import { expect, test } from "@playwright/test";
import { createGame } from "../src/lib/game";

test("the full recorded fruit ghost stays below 45% opacity", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("reverse-snake:theme:v1", "dark"),
  );
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(15000);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "lost",
  );
  const meta = await page.evaluate(
    () => JSON.parse(localStorage.getItem("reverse-snake:replays:v1")!)[0].meta,
  );
  const position = createGame(
    meta.arena,
    meta.difficulty,
    meta.mode,
    meta.board,
  ).player;
  const crop = () =>
    page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) =>
        Array.from(
          c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data,
        ),
      );
  await page
    .getByRole("button", { name: "Back to the jungle", exact: true })
    .dispatchEvent("click");
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(300);
  await page.keyboard.up("ArrowLeft");
  const baseline = await crop();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "End round" }).dispatchEvent("click");
  await page
    .getByRole("button", { name: "Open game menu" })
    .dispatchEvent("click");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Close menu" }).dispatchEvent("click");
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(300);
  await page.keyboard.up("ArrowLeft");
  const ghost = await crop(),
    size = await page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) => ({
        width: c.width,
        height: c.height,
        columns: Number(c.dataset.columns),
        rows: Number(c.dataset.rows),
      }));
  const x = ((position.x + 0.5) * size.width) / size.columns,
    y = ((position.y + 0.5) * size.height) / size.rows,
    radius = Math.min(size.width / size.columns, size.height / size.rows) * 0.4;
  const alphas: number[] = [];
  for (let row = Math.ceil(y - radius); row < y + radius; row++)
    for (let col = Math.ceil(x - radius); col < x + radius; col++) {
      const i = (row * size.width + col) * 4,
        alpha = (ghost[i] - baseline[i]) / (230 - baseline[i]);
      if (ghost[i] > baseline[i] + 20) alphas.push(alpha);
    }
  expect(
    alphas.length,
    "a filled fruit sprite must cover the ghost’s interior",
  ).toBeGreaterThan(60);
  expect(Math.max(...alphas)).toBeLessThan(0.45);
  expect(Math.max(...alphas)).toBeGreaterThan(0.28);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("reverse-snake:v1")!).attempts,
    ),
  ).toBe(1);
});
