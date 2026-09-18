import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("remove persists without confirmation or loss of sources and sessions", async ({ page }) => {
  const card = page.getByRole("article", { name: "本を読む", exact: true });
  await card.getByRole("button", { name: "今日の3件から外す" }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("今日の3件から外しました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByText("数分だけ読む", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".today-row")).toHaveCount(1);
  await page.reload();
  await expect(card).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(1);
});

test("active and paused target is disabled, another card remains removable", async ({ page }) => {
  const card = page.getByRole("article", { name: "本を読む", exact: true });
  const remove = card.getByRole("button", { name: "今日の3件から外す" });
  await card.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await expect(remove).toBeDisabled();
  await remove.evaluate((button: HTMLButtonElement) => button.click());
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: /一時停止/ }).click();
  await expect(remove).toBeDisabled();
  await page.getByRole("article", { name: "ストレッチをする", exact: true }).getByRole("button", { name: "今日の3件から外す" }).click();
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: /終了/ }).click();
  await expect(remove).toBeEnabled();
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(card).toHaveCount(0);
});

test("failed storage retains Today3 unchanged and does not report success", async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("storage unavailable"); }; });
  await page.getByRole("article", { name: "本を読む", exact: true }).getByRole("button", { name: "今日の3件から外す" }).click();
  await expect(page.locator(".today-row")).toHaveCount(2);
  await expect(page.getByText("保存できませんでした。変更前の状態を保持しています。")).toBeVisible();
  await expect(page.getByText("今日の3件から外しました", { exact: true })).toHaveCount(0);
});
