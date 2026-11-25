import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};

const timerPanel = (page: Page) =>
  page.getByRole("region", { name: "デモタイマー" });

test("starting and pausing a timer shows no notice, like the Windows app", async ({
  page,
}) => {
  await open(page);
  await page.locator("[data-demo-do-now-short]").click();
  await expect(timerPanel(page)).toContainText("実行中");
  await page.waitForTimeout(300);
  await expect(page.locator(".toast")).toHaveCount(0);

  await timerPanel(page).getByRole("button", { name: "一時停止" }).click();
  await expect(timerPanel(page)).toContainText("一時停止");
  await page.waitForTimeout(300);
  await expect(page.locator(".toast")).toHaveCount(0);
});
