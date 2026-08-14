import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test("captures required visual states without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({ path: path.join(output, "landing-top-1440x900.png"), fullPage: false });

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, "demo-default-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: "本を10分読むを5分で開始" }).click();
  await page.screenshot({ path: path.join(output, "demo-timer-running-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  await page.screenshot({ path: path.join(output, "dictionary-open-1440x900.png"), fullPage: false });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`captures ${viewport.width}x${viewport.height} with no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator("#demo").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, `demo-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    if (viewport.width === 390) {
      await expect(page.getByText("PCで開くとデモをより操作しやすく確認できます。")).toBeVisible();
    }
  });
}
