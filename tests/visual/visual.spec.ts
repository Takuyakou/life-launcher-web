import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test("captures expanded desktop states and layout metrics", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({ path: path.join(output, "landing-top-1440x900.png"), fullPage: false });

  const metrics = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { top: rect.top, height: rect.height, bottom: rect.bottom, width: rect.width } : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollHeight: document.documentElement.scrollHeight,
      header: box(".site-header"),
      hero: box(".hero"),
      primaryCta: box(".hero-primary"),
      demo: box("#demo"),
    };
  });
  await writeFile(path.join(output, "layout-metrics.json"), JSON.stringify(metrics, null, 2));

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, "demo-default-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await page.screenshot({ path: path.join(output, "launch-simulation-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.screenshot({ path: path.join(output, "completion-dialog-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: "今は変更しない" }).click();
  await page.getByRole("button", { name: "机の上を片付けるを今日の3件に追加" }).click();
  await page.getByRole("button", { name: "少し散歩するを今日の3件に追加" }).click();
  await page.screenshot({ path: path.join(output, "today3-limit-1440x900.png"), fullPage: false });
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  await page.screenshot({ path: path.join(output, "dictionary-open-1440x900.png"), fullPage: false });
  await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(output, "full-page-1440x900.png"), fullPage: true });

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
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.screenshot({
      path: path.join(output, `landing-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    });
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
