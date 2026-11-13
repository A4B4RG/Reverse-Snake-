import { expect, test } from "@playwright/test";
test("a matching saved mango ghost is visible beneath a new moving run", async ({
  page,
}) => {
  const time = new Date("2026-11-14T00:00:00Z");
  await page.clock.install({ time });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(7000);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "lost",
  );
  await page
    .getByRole("button", { name: "Back to the jungle", exact: true })
    .dispatchEvent("click");
  await page
    .getByRole("button", { name: "Open game menu" })
    .dispatchEvent("click");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Close dialog" })
    .dispatchEvent("click");
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(300);
  await page.keyboard.up("ArrowLeft");
  const outlined = await page
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => {
      const scale = canvas.width / 600,
        cell = 552 / 20,
        x = (24 + 5.5 * cell) * scale,
        y = (24 + 13.5 * cell) * scale;
      const pixels = canvas
        .getContext("2d")!
        .getImageData(
          Math.floor(x - 16 * scale),
          Math.floor(y - 16 * scale),
          Math.floor(32 * scale),
          Math.floor(32 * scale),
        ).data;
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i + 1] > pixels[i] + 30 && pixels[i + 1] > pixels[i + 2] + 5)
          count++;
      return count;
    });
  expect(outlined).toBeGreaterThan(20);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
  await expect(page.locator(".boost-status")).toHaveCount(0);
  const runs = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reverse-snake:v1")!),
  );
  expect(runs.attempts).toBe(1);
});
