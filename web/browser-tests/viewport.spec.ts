import { expect, test } from "@playwright/test";

const viewports = [
  [1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768],
  [768, 1024], [414, 896], [390, 844], [375, 667], [360, 640],
  [320, 568], [844, 390],
] as const;

for (const [width, height] of viewports) {
  test(`the game fits a single viewport at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "ready");
    const size = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    expect(size.width).toBeLessThanOrEqual(width);
    expect(size.height).toBeLessThanOrEqual(height);
    const board = (await page.locator("canvas").boundingBox())!;
    expect(board.width).toBeGreaterThanOrEqual(170);
    expect(Math.abs(board.width - board.height)).toBeLessThan(1);
    expect(board.y).toBeGreaterThanOrEqual(0);
    expect(board.y + board.height).toBeLessThanOrEqual(height);
    for (const selector of [".difficulty-options button", ".arena-arrows button", ".dark-icon-button"]) {
      for (const button of await page.locator(selector).all()) {
        const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    }
    await page.getByRole("button", { name: "Let’s play" }).click();
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "running");
    await page.getByRole("button", { name: "Pause game", exact: true }).click();
    await expect(page.locator(".board-stage")).toHaveAttribute("data-phase", "paused");
    await expect(page.getByRole("button", { name: "Back to the chase" })).toBeInViewport();
  });
}
