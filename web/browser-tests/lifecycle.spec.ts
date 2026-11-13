import { expect, test } from "@playwright/test";

test("repeated controls, modal focus, navigation and offline play retain one game", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const badAssets: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && /\.(js|css|woff2|svg)(\?|$)/.test(r.url()))
      badAssets.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  for (let i = 0; i < 3; i++) {
    if (i === 0) await page.getByRole("button", { name: "Let’s play" }).click();
    else await page.keyboard.press("r");
    await page.keyboard.press("Escape");
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "paused",
    );
    await page.keyboard.press("Enter");
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "running",
    );
  }
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open game menu" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.fullscreenElement?.classList.contains("arcade"),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Exit fullscreen" }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await page.getByRole("button", { name: "Back to the chase" }).click();
  await context.setOffline(true);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(150);
  await page.keyboard.up("ArrowLeft");
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
  await context.setOffline(false);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("link", { name: "Hunter · control the snake" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.getByRole("button", { name: "Start round" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Mango", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "ready",
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("reverse-snake:v1") ?? '{"attempts":0}')
          .attempts,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
  expect(badAssets).toEqual([]);
});

test("switching to another browser tab pauses the live chase", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.getByRole("button", { name: "Let’s play" }).click();
  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  test.skip(
    !(await page.evaluate(() => document.hidden)),
    "Headless Chrome keeps background pages visible; real tab switching requires a headed/device check.",
  );
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  await other.close();
  await page.bringToFront();
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "paused",
  );
});

test("the browser blur event pauses and remains paused until resume", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
  await page.getByRole("button", { name: "Let’s play" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  await page.getByRole("button", { name: "Back to the chase" }).click();
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "running",
  );
});
