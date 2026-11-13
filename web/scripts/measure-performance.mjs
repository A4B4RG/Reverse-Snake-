import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.env.REVERSE_SNAKE_BROWSER || undefined,
});
const results = [];
for (const [width, height] of [
  [1440, 900],
  [320, 568],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(process.argv[2] || "http://127.0.0.1:599");
  await page.getByRole("button", { name: "Let’s play" }).click();
  const result = await page.evaluate(async () => {
    const samples = [];
    let previous = performance.now();
    await new Promise((resolve) => {
      const begin = performance.now();
      function frame(now) {
        samples.push(now - previous);
        previous = now;
        if (now - begin < 5000) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    samples.sort((a, b) => a - b);
    const navigation = performance.getEntriesByType("navigation")[0];
    return {
      frames: samples.length,
      medianFrameMs: samples[Math.floor(samples.length * 0.5)],
      p95FrameMs: samples[Math.floor(samples.length * 0.95)],
      maxFrameMs: samples.at(-1),
      domContentLoadedMs: navigation.domContentLoadedEventEnd,
      firstContentfulPaintMs:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
        null,
    };
  });
  results.push({ viewport: { width, height }, ...result });
  await page.close();
}
await browser.close();
const report = {
  date: new Date().toISOString(),
  browser: "Headless Chromium/Chrome",
  scope:
    "Local production build, five seconds per viewport, idle mango; includes terminal rendering. No physical-device claim.",
  results,
};
await writeFile(
  "docs/performance-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
