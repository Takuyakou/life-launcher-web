import { expect, test, type Page } from "@playwright/test";

const readingCard = (page: Page) =>
  page.getByRole("article", { name: "数分だけ読む", exact: true });

const readingStart = (page: Page) =>
  readingCard(page).getByRole("button", { name: "25分", exact: true });

const demoTimer = (page: Page) =>
  page.getByRole("region", { name: "デモタイマー" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await readingStart(page).click();
  await page.getByRole("button", { name: /5分経過まで進める/ }).click();
  await demoTimer(page).getByRole("button", { name: "終了", exact: true }).click();
});

test("safe initial focus, escape and frozen clock", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "未完了のまま終了" }),
  ).toBeFocused();
  await expect(page.getByRole("timer")).toHaveText("20:00");
  await page.waitForTimeout(1100);
  await expect(page.getByRole("timer")).toHaveText("20:00");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(readingStart(page)).toBeVisible();
});

test("failed save keeps confirmation, retry persists completion", async ({
  page,
}) => {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      throw new Error(`test storage failure ${key.length + value.length}`);
    };
  });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "今日の分は完了", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  await expect(
    page.getByText("保存できませんでした。変更前の状態を保持しています。"),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "今日の分は完了", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(readingStart(page)).toHaveCount(0);
  await page.reload();
  await expect(readingStart(page)).toHaveCount(0);
});
