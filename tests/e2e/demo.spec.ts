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

test("Do Now rotates text, project and explainable reason together", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "数分だけ読む" }),
  ).toBeVisible();
  await expect(page.getByText("今日の3件に入っている一手です")).toBeVisible();
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(
    page.getByRole("heading", { name: "参考書を10ページ進める" }),
  ).toBeVisible();
  await expect(
    page.getByText("学習に次の一手が設定されているため"),
  ).toBeVisible();
});

test("Today Picker is the only Today adoption surface and enforces the three-item limit", async ({
  page,
}) => {
  await expect(page.locator(".builder-section")).toHaveCount(0);
  await expect(
    page.locator(".next-section").getByText("今日へ", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(".simple-list").getByText("今日へ", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(picker.getByRole("heading", { name: "次の一手" })).toBeVisible();
  await expect(
    picker.getByRole("heading", { name: "やりたいこと" }),
  ).toBeVisible();
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await expect(
    picker.getByRole("button", { name: "近所をゆっくり歩くを今日の3件に追加" }),
  ).toBeDisabled();
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(3);
  await expect(
    page
      .locator(".today-list")
      .getByText("参考書を10ページ進める", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "今日やるものを選ぶ" }),
  ).toHaveCount(0);
});

test("removing in Today Picker removes its snapshot but keeps its source", async ({
  page,
}) => {
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .locator(".today-picker-slot", { hasText: "ストレッチをする" })
    .getByRole("button", { name: "ストレッチをするを今日から外す" })
    .click();
  // The draft is not saved until 決定.
  await expect(
    page.locator(".today-list").getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(1);
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(
    page.locator(".today-list").getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".next-section")
      .getByText("ストレッチをする", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("今日の3件を決定しました", { exact: true }),
  ).toBeVisible();
});

test("timer start shows launch simulation and stop appends Today Activity once", async ({
  page,
}) => {
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await expect(page.locator(".demo-timer .timer-status")).toHaveText("実行中");
  await expect(page.getByText("環境を準備", { exact: true })).toBeVisible();
  await expect(page.getByText("読書メモを開く", { exact: true })).toBeVisible();
  await expect(
    page.getByText("参考ページを開く", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("タイマーを開始", { exact: true })).toHaveCount(
    1,
  );
  await page
    .locator(".demo-timer")
    .getByRole("button", { name: /一時停止/ })
    .click();
  await expect(page.locator(".demo-timer .timer-status")).toHaveText(
    "一時停止",
  );
  await page
    .locator(".demo-timer")
    .getByRole("button", { name: /再開/ })
    .click();
  await page.waitForTimeout(1100);
  await page
    .locator(".demo-timer")
    .getByRole("button", { name: /終了/ })
    .click();
  await expect(
    page.getByText("今日の実行にサンプル記録を追加しました"),
  ).toBeVisible();
  const activity = page.getByRole("list").filter({ hasText: "本を読む" });
  await expect(activity.getByText("本を読む", { exact: true })).toHaveCount(1);
  await expect(page.getByText("環境を準備", { exact: true })).toHaveCount(0);
});

test("demo completion saves 次はここから for a Do Now start", async ({
  page,
}) => {
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "今日の3件から外す" })
    .click();
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("予定 5分");
  const input = dialog.getByRole("textbox", { name: "次はここから(任意)" });
  await expect(input).toHaveValue("");
  await input.fill("2章の続きから");
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(page.getByText("次はここからを保存しました")).toBeVisible();
  await expect(page.locator(".do-now-card")).toContainText(
    "次はここから: 2章の続きから",
  );
  await expect(page.locator(".next-section")).toContainText(
    "次はここから: 2章の続きから",
  );
});

test("demo completion can be skipped without updating the project", async ({
  page,
}) => {
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "参考書を10ページ進める" }),
  ).toBeVisible();
  await expect(page.locator(".do-now-card")).not.toContainText("次はここから:");
});

test("sections open and reset restores every v2 seed field", async ({
  page,
}) => {
  await page.locator(".wishlist-section .section-toggle").click();
  await expect(
    page.getByText("気になっていた本を読む", { exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "決定" })
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
  await expect(page.locator(".today-row")).toHaveCount(2);
  await expect(resetButton).toBeFocused();
  await expect(page.locator("#demo")).not.toBeFocused();
});
