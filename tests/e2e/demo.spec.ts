import { expect, test, type Locator } from "@playwright/test";

const openRowMenu = async (trigger: Locator) => {
  // The menu is position: fixed and opens under its trigger, so centre the
  // trigger first: one sitting on the bottom edge pushes the menu out of view.
  await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await trigger.click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

// W21-05: 「やりたいこと」と「今日の実行」は、最初は閉じている。中を確かめる前に開く。
const openSection = async (
  page: import("@playwright/test").Page,
  name: "wishlist" | "activity",
) => {
  const toggle = page.locator(`.dl-${name} .dl-section-disclosure`);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
};

test("victory edit is plain text and the checkbox works", async ({ page }) => {
  const victoryText = page.locator(".dl-victory .dl-victory-text");
  await victoryText.click();
  const input = page.getByRole("textbox", { name: "今日の勝利条件" });
  const payload = "<script>alert(1)</script><img src=x onerror=alert(1)>";
  await input.fill(payload);
  await input.press("Enter");
  await expect(victoryText).toHaveText(payload);
  await expect(page.locator("script", { hasText: "alert(1)" })).toHaveCount(0);
  await expect(page.locator("img[src='x']")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "勝利条件を達成" }).check();
  await expect(victoryText).toHaveAttribute("data-done", "true");
  await expect(page.locator(".dl-victory-badge")).toHaveText(
    "✓ 今日の勝利、達成",
  );
});

test("unchanged victory edit closes on Enter and restores its edit button", async ({
  page,
}) => {
  const original = "後回しにしていたことを1つ終わらせる";
  const victoryText = page.locator(".dl-victory .dl-victory-text");
  await expect(victoryText).toHaveText(original);
  await victoryText.click();
  const input = page.getByRole("textbox", { name: "今日の勝利条件" });
  await expect(input).toHaveValue(original);
  await input.press("Enter");
  await expect(input).toHaveCount(0);
  await expect(victoryText).toHaveText(original);
  await expect(victoryText).toBeVisible();
});

test("Do Now rotates text, project and explainable reason together", async ({
  page,
}) => {
  const doNow = page.locator(".dl-donow-card");
  await expect(doNow.locator(".dl-donow-title")).toHaveText("数分だけ読む");
  await expect(doNow.locator(".dl-chip")).toHaveText("読書");
  await expect(doNow.locator(".dl-donow-reason")).toHaveText(
    "今日の3件に入っている一手です",
  );
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNow.locator(".dl-donow-title")).toHaveText(
    "参考書を10ページ進める",
  );
  await expect(doNow.locator(".dl-chip")).toHaveText("学習");
  await expect(doNow.locator(".dl-donow-reason")).toHaveText(
    "学習に次の一手が設定されているため",
  );
});

test("Today Picker enforces the three-item limit and closes on 決定", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
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
  await expect(page.locator("article.dl-today-card")).toHaveCount(3);
  await expect(
    page
      .locator(".dl-today-grid")
      .getByText("参考書を10ページ進める", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "今日やるものを選ぶ", exact: true }),
  ).toHaveCount(0);
});

test("removing in Today Picker removes its snapshot but keeps its source", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .locator(".today-picker-slot", { hasText: "ストレッチをする" })
    .getByRole("button", { name: "ストレッチをするを今日から外す" })
    .click();
  // The draft is not saved until 決定.
  await expect(
    page.locator(".dl-today-grid").getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(1);
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(
    page.locator(".dl-today-grid").getByText("ストレッチをする", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(".dl-next").getByText("ストレッチをする", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("今日の3件を決定しました", { exact: true }),
  ).toBeVisible();
});

test("timer start shows the running state and stop appends Today Activity once", async ({
  page,
}) => {
  const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await card.getByRole("button", { name: "5分", exact: true }).click();
  const timer = page.locator(".dl-timer");
  await expect(timer.locator(".dl-pill--state")).toHaveText("実行中");
  await expect(timer.locator(".dl-timer-title")).toHaveText("数分だけ読む");
  await timer.getByRole("button", { name: "一時停止" }).click();
  await expect(timer.locator(".dl-pill--state")).toHaveText("一時停止");
  await timer.getByRole("button", { name: "再開" }).click();
  await expect(timer.locator(".dl-pill--state")).toHaveText("実行中");
  await page.waitForTimeout(1100);
  await timer.getByRole("button", { name: "終了" }).click();
  await expect(
    page.getByText("今日の実行にサンプル記録を追加しました"),
  ).toBeVisible();
  await openSection(page, "activity");
  await expect(
    page.locator(".dl-activity-row").filter({ hasText: "数分だけ読む" }),
  ).toHaveCount(1);
});

test("demo completion saves 次はここから for a Do Now start", async ({
  page,
}) => {
  const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await openRowMenu(card.locator(".dl-row-menu"));
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
  await expect(card).toHaveCount(0);
  await page.locator(".dl-donow").getByRole("button", { name: "5分で始める" }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("予定 5分");
  const input = dialog.getByRole("textbox", { name: "次はここから(任意)" });
  await expect(input).toHaveValue("");
  await input.fill("2章の続きから");
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(page.getByText("次はここからを保存しました")).toBeVisible();
  await expect(page.locator(".dl-donow-resume-label")).toHaveText("次はここから");
  await expect(page.locator(".dl-donow-resume-text")).toHaveText("2章の続きから");
});

test("demo completion can be skipped without updating the project", async ({
  page,
}) => {
  await page.locator(".dl-donow").getByRole("button", { name: "5分で始める" }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".dl-donow-title")).toHaveText(
    "参考書を10ページ進める",
  );
  await expect(page.locator(".dl-donow-card")).not.toContainText("次はここから");
});

test("sections open and reset restores every v2 seed field", async ({
  page,
}) => {
  // W21-05: やりたいことは、最初は閉じている。
  const wishlistToggle = page.locator(".dl-wishlist .dl-section-disclosure");
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByText("気になっていた本を読む", { exact: true }),
  ).toHaveCount(0);
  await wishlistToggle.click();
  await expect(
    page.getByText("気になっていた本を読む", { exact: true }),
  ).toHaveCount(1);
  await wishlistToggle.click();
  await expect(
    page.getByText("気になっていた本を読む", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await page.locator(".dl-victory .dl-victory-text").click();
  const input = page.getByRole("textbox", { name: "今日の勝利条件" });
  await input.fill("変更した条件");
  await input.press("Enter");
  await expect(page.locator(".dl-victory .dl-victory-text")).toHaveText(
    "変更した条件",
  );
  const resetButton = page.getByRole("button", {
    name: "リセット",
    exact: true,
  });
  await resetButton.click();
  await expect(
    page.getByRole("dialog", { name: "Web Demoをリセットしますか？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(page.locator(".dl-victory .dl-victory-text")).toHaveText(
    "後回しにしていたことを1つ終わらせる",
  );
  await expect(page.locator("article.dl-today-card")).toHaveCount(2);
  await expect(resetButton).toBeFocused();
  await expect(page.locator(".dl-app")).not.toBeFocused();
});
