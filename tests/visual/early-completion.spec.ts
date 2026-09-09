import { expect, test } from "@playwright/test";

for (const width of [1366, 1440, 1920, 390]) {
  test(`early completion dialog at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page
      .getByRole("button", { name: "本を読むを25分で開始", exact: true })
      .click();
    await page.getByRole("button", { name: /短時間分まで進める/ }).click();
    await page
      .getByRole("complementary", { name: "デモタイマー" })
      .getByRole("button", { name: "終了", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await page.screenshot({ path: testInfo.outputPath("early-dialog.png") });
  });
}
