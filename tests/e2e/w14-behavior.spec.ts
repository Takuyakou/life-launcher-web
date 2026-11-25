import { expect, test, type Page } from "@playwright/test";

const key = "life-launcher-web-demo:v3";
const gold = "rgb(231, 185, 77)";
const victoryRest = "rgba(231, 185, 77, 0.5)";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

const saved = (page: Page) =>
  page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
const doNow = (page: Page) => page.locator(".dl-donow-card");
const doNowTitle = (page: Page) => doNow(page).locator(".dl-donow-title");
const card = (page: Page, label: string) =>
  page.getByRole("article", { name: label, exact: true });
// W21: 編集と「今日の3件から外す」は行の … メニューに入った。
const removeFromToday = async (page: Page, label: string) => {
  await card(page, label).locator(".dl-row-menu").click();
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
};
const finishAndConfirm = async (page: Page) => {
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.getByRole("button", { name: "終わる", exact: true }).click();
};
const rings = (page: Page, selector: string) =>
  page.locator(selector).evaluate(
    (root) =>
      [root, ...Array.from(root.querySelectorAll("*"))].filter((node) => {
        const style = getComputedStyle(node);
        return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
      }).length,
  );

test("Do Now puts the unfinished Today 3 NextStep first and reacts to Today 3 changes", async ({
  page,
}) => {
  await expect(doNowTitle(page)).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");
  // Windows 版と同じく、候補があるときは説明文を出さない。
  await expect(doNow(page)).not.toContainText("Web Demoでは");
  await expect(doNow(page)).not.toContainText("迷ったときに");

  await removeFromToday(page, "数分だけ読む");
  await removeFromToday(page, "ストレッチをする");
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("学習に次の一手が設定されているため");

  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "数分だけ読むを今日の3件に追加" })
    .click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "決定" })
    .click();
  await expect(doNowTitle(page)).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  await doNow(page).locator("[data-demo-do-now-short]").click();
  await finishAndConfirm(page);
  // W21: 今日の3件の状態は role="status" ではなくカードの data-complete で示す。
  await expect(card(page, "数分だけ読む")).toHaveAttribute("data-complete", "true");
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
});

test("Do Now and the Today 3 card share one timer in both directions", async ({
  page,
}) => {
  const reading = card(page, "数分だけ読む");
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(reading).toHaveAttribute("data-running", "true");
  await expect(doNow(page).getByText("実行中")).toBeVisible();

  await reading.getByRole("button", { name: "一時停止", exact: true }).click();
  await expect(reading.getByRole("button", { name: "再開", exact: true })).toBeVisible();
  await expect(doNow(page).getByText("一時停止")).toBeVisible();
  await doNow(page).getByRole("button", { name: "再開", exact: true }).click();
  await expect(reading.getByRole("button", { name: "一時停止", exact: true })).toBeVisible();

  await finishAndConfirm(page);
  await expect(card(page, "数分だけ読む")).toHaveAttribute("data-complete", "true");
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");

  await page.reload();
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await reading.getByRole("button", { name: "5分", exact: true }).click();
  await expect(doNow(page).getByText("実行中")).toBeVisible();
  await expect(doNowTitle(page)).toHaveText("数分だけ読む");
});

test("Do Now keeps the project chosen with Other Step and does not save it", async ({
  page,
}) => {
  const before = await saved(page);
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
  expect(await saved(page)).toBe(before);

  // W21: 「他の一手」はローカルの巡回位置なので、今日の3件が増えても選択は変わらない。
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "気になっていた本を読むを今日の3件に追加" })
    .click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "決定" })
    .click();
  await expect(card(page, "気になっていた本を読む")).toBeVisible();
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("学習に次の一手が設定されているため");
});

test("Today 3 heading reports the count and the completed total", async ({
  page,
}) => {
  const bar = page.locator(".dl-today > .dl-section-bar");
  await expect(bar.locator(".dl-section-count")).toHaveText("2件");
  await expect(bar.locator(".dl-section-summary")).toHaveText("1 / 2 完了");
  await removeFromToday(page, "数分だけ読む");
  await removeFromToday(page, "ストレッチをする");
  await expect(bar.locator(".dl-section-count")).toHaveText("0件");
  await expect(bar.locator(".dl-section-summary")).toHaveText("0 / 0 完了");
  await expect(page.locator(".dl-today-card")).toHaveCount(0);
});

test("NextStep button and dialog use 編集", async ({ page }) => {
  const next = page.locator(".dl-next");
  // 未完了の今日の3件に入っている行は編集ボタンの代わりにロックを出す。
  const reading = next.locator(".dl-next-row", { hasText: "読書" });
  await expect(reading.locator(".dl-lock")).toHaveAttribute(
    "title",
    "未完了の「今日の3件」に入っているため、完了または外すまで元の登録は変更できません",
  );
  await expect(reading.getByRole("button", { name: "編集" })).toHaveCount(0);
  await expect(next.getByRole("button", { name: "変更" })).toHaveCount(0);
  await next.locator(".dl-next-row", { hasText: "運動" }).locator(".dl-row-menu").click();
  await page.getByRole("menuitem", { name: "次の一手を編集" }).click();
  await expect(
    page.getByRole("dialog", { name: "次の一手を編集" }),
  ).toBeVisible();
});

test.describe("victory glow", () => {
  const border = (page: Page) =>
    page
      .locator(".dl-victory")
      .evaluate((node) => getComputedStyle(node).borderTopColor);

  test("filled card glows gold on hover, even when complete", async ({
    page,
  }) => {
    expect(await border(page)).toBe(victoryRest);
    await page.locator(".dl-victory").hover();
    await expect.poll(() => border(page)).toBe(gold);
    await page.mouse.move(0, 0);
    await expect.poll(() => border(page)).toBe(victoryRest);
    await page.getByRole("checkbox", { name: "勝利条件を達成" }).check();
    await expect(page.locator(".dl-victory-badge")).toBeVisible();
    await page.locator(".dl-victory").hover();
    await expect.poll(() => border(page)).toBe(gold);
  });

  test("empty card reacts with its border only, and editing is strong from the first moment", async ({
    page,
  }) => {
    await page.getByRole("checkbox", { name: "勝利条件を達成" }).check();
    await page.evaluate((storageKey) => {
      const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      state.victory = { text: "", completed: false };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, key);
    await page.reload();
    await page.locator("#screen").scrollIntoViewIfNeeded();
    const placeholder = page.locator(".dl-victory-text");
    const muted = "rgb(184, 176, 160)";
    await expect(placeholder).toHaveText("今日はこれができれば勝ち");
    await expect(placeholder).toHaveAttribute("data-empty", "true");
    await expect(placeholder).toHaveCSS("color", muted);
    await page.mouse.move(0, 0);
    // W21: 空でも枠は同じ金。面の色だけが控えめに動く。
    await expect(page.locator(".dl-victory")).toHaveCSS(
      "border-top-color",
      victoryRest,
    );
    await expect(page.locator(".dl-victory")).toHaveCSS(
      "background-color",
      "rgba(231, 185, 77, 0.06)",
    );
    await page.locator(".dl-victory").hover();
    await expect.poll(() => border(page)).toBe(gold);
    await expect(placeholder).toHaveCSS("color", muted);
    await expect(page.locator(".dl-victory")).toHaveCSS(
      "background-color",
      "rgba(231, 185, 77, 0.08)",
    );
    await page.mouse.move(0, 0);
    await expect.poll(() => border(page)).toBe(victoryRest);

    await placeholder.click();
    await page.mouse.move(0, 0);
    await expect.poll(() => border(page)).toBe(gold);
    await page.getByRole("textbox", { name: "今日の勝利条件" }).pressSequentially("あ");
    await expect.poll(() => border(page)).toBe(gold);
  });

  test("keyboard focus shows only the button ring, and editing keeps the strong border", async ({
    page,
  }) => {
    await page.getByRole("checkbox", { name: "勝利条件を達成" }).focus();
    await page.keyboard.press("Shift+Tab");
    // W21: 編集は「勝利条件を編集」ボタンではなく、文そのものを押して開く。
    const edit = page.locator(".dl-victory-text");
    await expect(edit).toBeFocused();
    expect(
      await edit.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    await expect.poll(() => rings(page, ".dl-victory")).toBe(1);

    await page.keyboard.press("Enter");
    await page.mouse.move(0, 0);
    await expect(page.getByRole("textbox", { name: "今日の勝利条件" })).toBeFocused();
    await expect.poll(() => border(page)).toBe(gold);
  });
});
