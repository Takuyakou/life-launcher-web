import { expect, test, type Page } from "@playwright/test";

const todayCard = (page: Page, label: string) =>
  page.getByRole("article", { name: label, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("natural expiry waits for confirmation and completes the item on 終わる", async ({
  page,
}) => {
  await page.clock.install();
  const card = todayCard(page, "本を読む");
  await card.getByRole("button", { name: "5分", exact: true }).click();
  await page.clock.runFor(300000);
  await expect(
    page.getByRole("dialog", { name: "予定時間になりました" }),
  ).toBeVisible();
  await expect(card.locator(".dl-today-status")).toHaveText("○");
  await expect(card).not.toHaveAttribute("data-complete", "true");
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(card.locator(".dl-today-status")).toHaveText("✓");
  await expect(card).toHaveAttribute("data-complete", "true");
});

test("reset and Wishlist modals trap Tab and cancel restores the opener", async ({
  page,
}) => {
  const reset = page.getByRole("button", { name: "リセット", exact: true });
  await reset.click();
  await expect(
    page.getByRole("button", { name: "キャンセル", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "リセットする" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "キャンセル", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(reset).toBeFocused();
  const add = page.getByRole("button", {
    name: "＋ やりたいこと",
    exact: true,
  });
  await add.click();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "キャンセル", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
});

test("Today3 finishes only after confirmation and reset restores seed", async ({
  page,
}) => {
  await expect(page.locator("article.dl-today-card input")).toHaveCount(0);
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  for (const label of ["本を読む", "参考書を10ページ進める"]) {
    const card = todayCard(page, label);
    await card.getByRole("button", { name: "5分", exact: true }).click();
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await expect(card.locator(".dl-today-status")).toHaveText("○");
    await page.getByRole("button", { name: "終わる", exact: true }).click();
    await expect(card.locator(".dl-today-status")).toHaveText("✓");
  }
  await expect(page.locator("article.dl-today-card")).toHaveCount(3);
  await expect(page.locator(".dl-today .dl-section-summary")).toHaveText(
    "3 / 3 完了",
  );
  await expect(page.locator(".dl-activity-row")).toHaveCount(3);
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(page.locator("article.dl-today-card")).toHaveCount(2);
});

test("paused replacement removes the old active state without completing it", async ({
  page,
}) => {
  const reading = todayCard(page, "本を読む");
  await reading.getByRole("button", { name: "5分", exact: true }).click();
  await reading
    .locator(".dl-today-timer")
    .getByRole("button", { name: "一時停止" })
    .click();
  await expect(page.locator(".dl-timer .dl-pill--state")).toHaveText(
    "一時停止",
  );
  await expect(
    reading.locator(".dl-today-timer").getByRole("button", { name: "再開" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  const study = todayCard(page, "参考書を10ページ進める");
  await study.getByRole("button", { name: "5分", exact: true }).click();
  await expect(page.locator(".dl-timer .dl-pill--state")).toHaveText("実行中");
  await expect(reading.locator(".dl-today-timer")).toHaveCount(0);
  await expect(
    reading.getByRole("button", { name: "5分", exact: true }),
  ).toBeVisible();
  await expect(reading.locator(".dl-today-status")).toHaveText("○");
});

test("Today Picker shows both source groups without duplicate selected sources", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(picker.locator(".today-picker-source-row")).toHaveCount(6);
  await expect(
    picker.getByRole("button", { name: "ストレッチをするを今日の3件に追加" }),
  ).toHaveCount(0);
  await expect(
    picker.getByText("近所をゆっくり歩く", { exact: true }),
  ).toHaveCount(1);
});

test("Wishlist modal is keyboard operable, text-only, and its add action does not toggle the section", async ({
  page,
}) => {
  const toggle = page.locator(".dl-wishlist .dl-section-disclosure");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const add = page.getByRole("button", {
    name: "＋ やりたいこと",
    exact: true,
  });
  await add.click();
  const dialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  const input = dialog.getByRole("textbox", {
    name: "やりたいこと",
    exact: true,
  });
  await expect(input).toBeFocused();
  await input.fill("<img src=x onerror=alert(1)>");
  await input.press("Enter");
  await expect(add).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(
    page
      .locator(".dl-wishlist-row")
      .getByText("<img src=x onerror=alert(1)>", { exact: true }),
  ).toHaveCount(1);
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  await page.reload();
  await expect(
    page
      .locator(".dl-wishlist-row")
      .getByText("<img src=x onerror=alert(1)>", { exact: true }),
  ).toHaveCount(1);
});

test("save failure keeps the candidate and modal draft instead of optimistic loss", async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  const card = todayCard(page, "本を読む");
  await card.getByRole("button", { name: "5分", exact: true }).click();
  // The start is refused, not shown as running until a save succeeds.
  await expect(page.locator(".dl-timer .dl-pill--state")).toHaveText("待機中");
  await expect(
    page.getByText("保存できませんでした。変更前の状態を保持しています。"),
  ).toBeVisible();
  await expect(
    card.getByRole("button", { name: "5分", exact: true }),
  ).toBeVisible();

  // A refused Wishlist add leaves no phantom row behind.
  await page
    .getByRole("button", { name: "＋ やりたいこと", exact: true })
    .click();
  const addDialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  await addDialog.getByRole("textbox").fill("保持する入力");
  await addDialog.getByRole("button", { name: "追加", exact: true }).click();
  await expect(
    page
      .locator(".dl-wishlist-row")
      .getByText("保持する入力", { exact: true }),
  ).toHaveCount(0);
  // The dialog keeps the draft open when the save is refused.
  await expect(addDialog.getByRole("textbox")).toHaveValue("保持する入力");
  await page.keyboard.press("Escape");
  await expect(addDialog).toHaveCount(0);

  // A dialog that reports the failure keeps its draft and the stored value.
  const study = page.locator(".dl-next-row", { hasText: "学習" });
  await study.getByRole("button", { name: "編集", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "次の一手を編集" });
  const input = editDialog.getByRole("textbox", { name: "次の一手" });
  await input.fill("保持する下書き");
  await editDialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect(input).toHaveValue("保持する下書き");
  await expect(editDialog.getByRole("alert")).toBeVisible();
  await expect(study).toContainText("参考書を10ページ進める");
});

test("disclosure right edge toggles and dictionary arrows stay in the dialog", async ({
  page,
}) => {
  const toggle = page.locator(".dl-next .dl-section-disclosure");
  const box = await toggle.boundingBox();
  if (!box) throw new Error("Missing disclosure");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click({ position: { x: box.width - 10, y: box.height / 2 } });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  const search = page.getByRole("searchbox", { name: "辞書を検索" });
  await search.press("ArrowDown");
  const tiles = page.locator(".dictionary-tile");
  await expect(tiles.first()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(tiles.nth(1)).toBeFocused();
  await page.keyboard.press("End");
  await expect(tiles.last()).toBeFocused();
  await page.keyboard.press("Escape");
  const opener = page.getByRole("button", { name: /辞書を開く/ });
  await expect(opener).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(opener).toBeFocused();
});

test("running Today item cannot be removed and persistence is not written on timer ticks", async ({
  page,
}) => {
  await todayCard(page, "本を読む")
    .getByRole("button", { name: "5分", exact: true })
    .click();
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .locator(".today-picker-slot", { hasText: "本を読む" })
      .getByRole("button", { name: "今日から外す" }),
  ).toBeDisabled();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("unexpected tick save");
    };
  });
  const clock = page.locator(".dl-timer-clock");
  await expect(clock).not.toHaveText("05:00", { timeout: 4000 });
  await expect(
    page.getByText("保存できませんでした。変更前の状態を保持しています。"),
  ).toHaveCount(0);
});
