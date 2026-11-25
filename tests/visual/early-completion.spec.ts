import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

for (const width of [1366, 1440, 1920, 390]) {
  test(`early completion dialog at ${width}`, async ({ page }) => {
    const height = width === 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page
      .getByRole("article", { name: "数分だけ読む", exact: true })
      .getByRole("button", { name: "25分", exact: true })
      .click();
    await page.getByRole("button", { name: /5分経過まで進める/ }).click();
    await page
      .getByRole("region", { name: "デモタイマー" })
      .getByRole("button", { name: "終了", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "今日の分は完了にしますか？",
    });
    await expect(dialog).toBeVisible();
    const right = dialog.getByRole("button", { name: "未完了のまま終了" });
    await expect(right).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(right).toBeFocused();
    expect(
      await right.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    for (const button of await dialog.getByRole("button").all()) {
      expect(
        await button.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
    }
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await page.screenshot({
      path: path.join(output, `early-dialog-${width}.png`),
    });
  });
}
