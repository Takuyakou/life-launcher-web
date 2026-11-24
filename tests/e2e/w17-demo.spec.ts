import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};

const timerPanel = (page: Page) =>
  page.getByRole("complementary", { name: "デモタイマー" });

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

test("the demo jump button names its minutes and only shows when it can be used", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "本を読むを5分で開始", exact: true }).click();
  await expect(timerPanel(page).getByRole("button", { name: /満了まで進める/ })).toBeVisible();
  await expect(timerPanel(page).getByRole("button", { name: /経過まで進める/ })).toHaveCount(0);
  await timerPanel(page).getByRole("button", { name: "終了", exact: true }).click();

  await open(page);
  await page.getByRole("button", { name: "本を読むを25分で開始", exact: true }).click();
  const jump = timerPanel(page).getByRole("button", { name: /5分経過まで進める/ });
  await expect(jump).toBeVisible();
  await jump.click();
  await expect(page.getByRole("timer")).toHaveText("20:00");
  await expect(jump).toHaveCount(0);
  await expect(timerPanel(page)).not.toContainText("短時間分");
});

test("the do-now card shows no explanation lines when it has a step", async ({ page }) => {
  await open(page);
  const card = page.locator(".do-now-card");
  await expect(card.locator("h2")).toHaveText("数分だけ読む");
  await expect(card).toContainText("今日の3件に入っている一手です");
  await expect(card.locator("p")).toHaveCount(2);
});

for (const width of [1440, 1000, 390]) {
  test(`notices sit inside the demo window at ${width}`, async ({ page }) => {
    await open(page, width, 844);
    await page.locator(".demo-sidebar, .lp-demo-window").first().scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "ブラウザ", exact: true }).click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    const [box, frame] = await Promise.all([
      toast.boundingBox(),
      page.locator(".lp-demo-window").boundingBox(),
    ]);
    expect(box && frame).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(Math.round(box!.x + box!.width)).toBeLessThanOrEqual(
      Math.round(frame!.x + frame!.width),
    );
  });
}

test("while a dialog is open, notices move to the top centre", async ({ page }) => {
  await open(page, 1000, 800);
  await page.getByRole("button", { name: "ブラウザ", exact: true }).click();
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".toast")).toBeVisible();
  const box = await page.locator(".toast-region").boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y).toBeLessThan(40);
  expect(Math.abs(box!.x + box!.width / 2 - 500)).toBeLessThanOrEqual(2);
});
