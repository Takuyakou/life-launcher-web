import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("natural expiry waits for confirmation and restores keyboard focus", async ({
  page,
}) => {
  await page.clock.install();
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await page.clock.runFor(300000);
  await expect(
    page.getByRole("dialog", { name: "おつかれさまでした" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "本を読む：未完了", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await page.clock.runFor(50);
  await expect(page.locator(".today-section")).toBeFocused();
  await expect(
    page.getByRole("status", { name: "本を読む：完了", exact: true }),
  ).toHaveCount(1);
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
    name: "やりたいことを追加",
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

test("Today3 finishes only after confirmation, next batch is manual, and reset restores seed", async ({
  page,
}) => {
  await expect(page.locator('.today-row input[type="checkbox"]')).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "今日やるものを選ぶ" })
    .click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
    .click();
  for (const label of ["本を読む", "机の上だけ片付ける"]) {
    await page.getByRole("button", { name: `${label}を5分で開始` }).click();
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await expect(
      page.getByRole("status", { name: `${label}：未完了`, exact: true }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "終わる", exact: true }).click();
    await expect(
      page.getByRole("status", { name: `${label}：完了`, exact: true }),
    ).toHaveCount(1);
  }
  await expect(page.locator(".today-row")).toHaveCount(3);
  await expect(page.locator(".sync-heading")).toContainText("3 / 3 完了");
  const records = await page.locator(".activity-list li").count();
  await page.getByRole("button", { name: "次の3件を選ぶ" }).click();
  await expect(page.locator(".today-row")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "今日やるものを選ぶを閉じる" }),
  ).toBeFocused();
  await expect(page.locator(".activity-list li")).toHaveCount(records);
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "数分だけ読むを今日の3件に追加" })
    .click();
  await expect(page.locator(".today-row")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(page.locator(".today-row")).toHaveCount(2);
});

test("paused replacement removes the old active state without completing it", async ({
  page,
}) => {
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await page
    .locator(".today-section")
    .getByRole("button", { name: "本を読むを一時停止" })
    .click();
  await expect(
    page.getByRole("button", { name: "本を読むを再開" }),
  ).toBeVisible();
  await page.locator("[data-demo-do-now-short]").click();
  await expect(
    page.getByRole("button", { name: "本を読むを再開" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "本を読むを5分で開始" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "本を読む：未完了", exact: true }),
  ).toHaveCount(1);
});

test("Today Picker separates next steps and Wishlist without duplicate selected sources", async ({
  page,
}) => {
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(picker.locator(".today-picker-source-row")).toHaveCount(2);
  await expect(
    picker.getByRole("button", { name: "ストレッチをするを今日の3件に追加" }),
  ).toHaveCount(0);
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
  await expect(picker.locator(".today-picker-source-row")).toHaveCount(3);
  await expect(
    picker.getByText("近所をゆっくり歩く", { exact: true }),
  ).toHaveCount(1);
});

test("Wishlist modal is keyboard operable, text-only, and its add action does not toggle the section", async ({
  page,
}) => {
  const toggle = page.locator(".wishlist-section .section-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const add = page.getByRole("button", {
    name: "やりたいことを追加",
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
  await expect(
    page
      .locator(".wishlist-row")
      .getByText("<img src=x onerror=alert(1)>", { exact: true }),
  ).toHaveCount(1);
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  await page.reload();
  await expect(
    page
      .locator(".wishlist-row")
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
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await expect(page.locator(".demo-timer .timer-status")).toHaveText("待機中");
  await page
    .getByRole("button", { name: "やりたいことを追加", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  await dialog.getByRole("textbox").fill("保持する入力");
  await dialog.getByRole("button", { name: "追加", exact: true }).click();
  await expect(dialog.getByRole("textbox")).toHaveValue("保持する入力");
  await expect(dialog.getByRole("alert")).toBeVisible();
});

test("disclosure right edge toggles and dictionary arrows stay in the dialog", async ({
  page,
}) => {
  const toggle = page.locator(".next-section .section-toggle");
  const box = await toggle.boundingBox();
  if (!box) throw new Error("Missing disclosure");
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
  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
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
  const clock = page.locator(".timer-clock");
  await expect(clock).not.toHaveText("05:00", { timeout: 4000 });
  await expect(
    page.getByText("保存できませんでした。変更前の状態を保持しています。"),
  ).toHaveCount(0);
});
