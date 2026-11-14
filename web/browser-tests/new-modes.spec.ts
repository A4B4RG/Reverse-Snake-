import { expect, test } from "@playwright/test";
test.setTimeout(45000);

for (const mode of ["hunter", "challenge"] as const) {
  test(`${mode} supports keyboard, pause, restart and verified saved replay`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
    await page.goto(`/${mode}`);
    await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "ready",
    );
    await page
      .getByRole("button", { name: "Start round" })
      .dispatchEvent("click");
    await page.clock.runFor(40);
    await page.keyboard.down("ArrowUp");
    await page.clock.runFor(300);
    await page.keyboard.up("ArrowUp");
    await page.keyboard.press("Escape");
    await page.clock.runFor(40);
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "paused",
    );
    await page.clock.runFor(1000);
    await page.keyboard.press("Enter");
    await page.clock.runFor(40);
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "running",
    );
    await page.keyboard.press("r");
    await page.clock.runFor(40);
    await page.clock.runFor(30_000);
    await expect(page.locator(".board-stage")).toHaveAttribute(
      "data-phase",
      "lost",
    );
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("reverse-snake:extra-records:v1")!),
    );
    expect(saved).toHaveLength(1);
    expect(saved[0].meta.mode).toBe(mode);
    expect(
      await page.evaluate(() => localStorage.getItem("reverse-snake:v1")),
    ).toBeNull();
    await page.goto("/replays");
    await page.clock.runFor(100);
    await page
      .getByRole("button", { name: "Play replay" })
      .dispatchEvent("click");
    await page.clock.runFor(1000);
    await page.getByRole("button", { name: "Open game menu" }).dispatchEvent("click");
    const replayTime = await page.locator(".hud-stat > strong").innerText();
    await page.getByRole("button", { name: "Dark", exact: true }).dispatchEvent("click");
    await page.clock.runFor(1000);
    await expect(page.locator("canvas")).toHaveAttribute("data-theme", "dark");
    expect(await page.locator(".hud-stat > strong").innerText()).toBe(replayTime);
    await page.getByRole("button", { name: "Close menu" }).dispatchEvent("click");
    await page.getByRole("button", { name: "Play replay" }).dispatchEvent("click");
    await page.clock.runFor(30_000);
    await expect(page.getByRole("status")).toContainText(
      "Final state verified",
    );
    expect(errors).toEqual([]);
  });
  test(`${mode} fits a phone and short landscape with working touch and help`, async ({
    page,
  }) => {
    for (const [width, height] of [
      [320, 568],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(`/${mode}`);
      await expect(page.locator("canvas")).toHaveAttribute("data-mounted", "true");
      await expect(page.locator(".board-stage")).toHaveAttribute(
        "data-phase",
        "ready",
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      const canvas = (await page.locator("canvas").boundingBox())!;
      expect(canvas.width).toBeGreaterThanOrEqual(170);
      const outer=(await page.locator(".board-stage").boundingBox())!;
      expect(canvas.width).toBeCloseTo(outer.width,0);expect(canvas.height).toBeCloseTo(outer.height,0);
      await page.getByRole("button", { name: "How to play" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.getByRole("button", { name: "Start round" }).click();
      await page
        .getByRole("button", { name: "Move down" })
        .dispatchEvent("click", { detail: 0 });
      await expect(page.locator(".board-stage")).toHaveAttribute(
        "data-phase",
        "running",
      );
    }
  });
}
test("mango recording replays real ordered dash and pause input without a mismatch", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-14T00:00:01Z"));
  await page.getByRole("button", { name: "Let’s play" }).dispatchEvent("click");
  await page.clock.runFor(40);
  await page.keyboard.down("ArrowDown");
  await page.clock.runFor(200);
  await page.keyboard.press("Space");
  await page.keyboard.up("ArrowDown");
  await page.keyboard.press("Escape");
  await page.clock.runFor(300);
  await page.keyboard.press("Enter");
  await page.clock.runFor(20_000);
  await expect(page.locator(".board-stage")).toHaveAttribute(
    "data-phase",
    "lost",
  );
  await page.goto("/replays");
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Play replay" })
    .dispatchEvent("click");
  await page.clock.runFor(20_000);
  await expect(page.getByRole("status")).toContainText("Final state verified");
});
