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
  const payload = "<script>alert(1)</script><img src=x onerror=alert(1)>";
  await input.fill(payload);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText(payload, { exact: true })).toBeVisible();
  await expect(page.locator("script", { hasText: "alert(1)" })).toHaveCount(0);
  await expect(page.locator("img[src='x']")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "今日の勝利条件を完了" }).check();
  await expect(page.getByText(payload, { exact: true })).toHaveClass(
    /is-complete/,
  );
});

test("unchanged victory edit closes on Enter and restores its edit button", async ({
  page,
}) => {
  await page.getByRole("button", { name: "勝利条件を編集" }).click();
  await page.getByRole("textbox", { name: "勝利条件" }).press("Enter");
  await expect(
    page.getByRole("button", { name: "勝利条件を編集" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "勝利条件を編集" }),
  ).toBeFocused();
});

test("Do Now rotates text, project and fixed reason together", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "数分だけ読む" }),
  ).toBeVisible();
  await expect(page.getByText("今日まだ実行していないため")).toBeVisible();
  await page.getByRole("button", { name: "別の候補" }).click();
  await expect(
    page.getByRole("heading", { name: "ストレッチをする" }),
  ).toBeVisible();
  await expect(page.getByText("今週の重点にある次の一手")).toBeVisible();
});

test("Builder is the only Today adoption surface and enforces the three-item limit", async ({
  page,
}) => {
  const builder = page.locator(".builder-section");
  await expect(builder.getByText("次の一手", { exact: true })).toBeVisible();
  await expect(
    builder.getByText("やりたいこと", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("今日へ", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(".simple-list").getByText("今日へ", { exact: true }),
  ).toHaveCount(0);
  await builder
    .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
    .click();
  await expect(page.getByText("3/3", { exact: true })).toBeVisible();
  await expect(
    page
      .locator(".today-list")
      .getByText("机の上だけ片付ける", { exact: true }),
  ).toBeVisible();
  await expect(
    builder.getByRole("button", {
      name: "気になっていたことを調べるを今日の3件に追加",
    }),
  ).toBeDisabled();
});

test("excluding a candidate removes its Today snapshot but keeps its source", async ({
  page,
}) => {
  const builder = page.locator(".builder-section");
  await builder
    .getByRole("button", { name: "ストレッチをするを今日の候補から外す" })
    .click();
  await expect(
    page.locator(".today-list").getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(0);
  await expect(
    builder.getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".next-section")
      .getByText("ストレッチをする", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("今日の候補から外しました。登録元は残っています。"),
  ).toBeVisible();
});

test("timer start shows launch simulation and stop appends Today Activity once", async ({
  page,
}) => {
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await expect(page.getByText("実行中", { exact: true })).toBeVisible();
  await expect(page.getByText("環境を準備", { exact: true })).toBeVisible();
  await expect(page.getByText("読書メモを開く", { exact: true })).toBeVisible();
  await expect(
    page.getByText("参考ページを開く", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("タイマーを開始", { exact: true })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: /一時停止/ }).click();
  await expect(page.getByText("一時停止", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /再開/ }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: /終了/ }).click();
  await expect(
    page.getByText("今日の実行にサンプル記録を追加しました"),
  ).toBeVisible();
  const activity = page.getByRole("list").filter({ hasText: "本を読む" });
  await expect(activity.getByText("本を読む", { exact: true })).toHaveCount(1);
  await expect(page.getByText("環境を準備", { exact: true })).toHaveCount(0);
});

test("demo completion can update the project next step", async ({ page }) => {
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "おつかれさまでした" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("textbox", { name: "次の一手" });
  await expect(input).toHaveValue("数分だけ読む");
  await input.fill("次の章を読む");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("次の一手を更新しました")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "次の章を読む" }),
  ).toBeVisible();
  await expect(page.getByText("次の章を読む", { exact: true })).toHaveCount(3);
});

test("demo completion can be skipped without updating the project", async ({
  page,
}) => {
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.getByRole("button", { name: "今は変更しない" }).click();
  await expect(
    page.getByRole("dialog", { name: "おつかれさまでした" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "数分だけ読む" }),
  ).toBeVisible();
});

test("sections open and reset restores every v2 seed field", async ({
  page,
}) => {
  await page.getByRole("button", { name: /やりたいこと/ }).click();
  await expect(
    page.getByText("気になっていた本を読む", { exact: true }),
  ).toHaveCount(2);
  await page
    .locator(".builder-section")
    .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
    .click();
  await page.getByRole("button", { name: "勝利条件を編集" }).click();
  await page.getByRole("textbox", { name: "勝利条件" }).fill("変更した条件");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  const resetButton = page.getByRole("button", {
    name: "リセット",
    exact: true,
  });
  await resetButton.click();
  await expect(
    page.getByRole("dialog", { name: "Web Demoをリセットしますか？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(
    page.getByText("後回しにしていたことを1つ終わらせる"),
  ).toBeVisible();
  await expect(page.getByText("2/3", { exact: true })).toBeVisible();
  await expect(resetButton).toBeFocused();
  await expect(page.locator("#demo")).not.toBeFocused();
});
