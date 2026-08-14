import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("victory edit is plain text and the checkbox works", async ({ page }) => {
  await page.getByRole("button", { name: "勝利条件を編集" }).click();
  const input = page.getByRole("textbox", { name: "勝利条件" });
  const payload = '<script>alert(1)</script><img src=x onerror=alert(1)>';
  await input.fill(payload);
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(payload, { exact: true })).toBeVisible();
  await expect(page.locator("script", { hasText: "alert(1)" })).toHaveCount(0);
  await expect(page.locator("img[src='x']")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "今日の勝利条件を完了" }).check();
  await expect(page.getByText(payload, { exact: true })).toHaveClass(/is-complete/);
});

test("Do Now rotates through synthetic candidates", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "本を10分だけ読む" })).toBeVisible();
  await page.getByRole("button", { name: "別の候補" }).click();
  await expect(page.getByRole("heading", { name: "ストレッチを5分する" })).toBeVisible();
});

test("Today 3 toggles and timer stop appends Today Activity once", async ({ page }) => {
  const todayCheckbox = page.getByRole("checkbox", { name: "本を10分読むを完了" });
  await todayCheckbox.check();
  await expect(todayCheckbox).toBeChecked();

  await page.getByRole("button", { name: "本を10分読むを5分で開始" }).click();
  await expect(page.getByText("実行中", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /一時停止/ }).click();
  await expect(page.getByText("一時停止", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /再開/ }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: /終了/ }).click();
  await expect(page.getByText("今日の実行にサンプル記録を追加しました")).toBeVisible();
  const activity = page.getByRole("list").filter({ hasText: "本を10分読む" });
  await expect(activity.getByText("本を10分読む", { exact: true })).toHaveCount(1);
});

test("sections open and reset restores the seed", async ({ page }) => {
  await page.getByRole("button", { name: /やりたいこと/ }).click();
  await expect(page.getByText("気になっていた本を読む")).toBeVisible();
  await page.getByRole("button", { name: "勝利条件を編集" }).click();
  await page.getByRole("textbox", { name: "勝利条件" }).fill("変更した条件");
  await page.getByRole("button", { name: "保存" }).click();
  await page.getByRole("button", { name: /リセット/ }).click();
  await expect(page.getByRole("dialog", { name: "Web Demoをリセットしますか？" })).toBeVisible();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(page.getByText("後回しにしていたことを1つ終わらせる")).toBeVisible();
  await expect(page.locator("#demo")).toBeFocused();
});
