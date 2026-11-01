import { expect, test, type Page } from "@playwright/test";

const key = "life-launcher-web-demo:v3";
const gold = "rgb(239, 200, 74)";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

const saved = (page: Page) =>
  page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
const doNow = (page: Page) => page.locator(".do-now-card");
const card = (page: Page, label: string) =>
  page.getByRole("article", { name: label, exact: true });
const removeFromToday = async (page: Page, label: string) =>
  card(page, label).getByRole("button", { name: "今日の3件から外す" }).click();
const finishAndConfirm = async (page: Page) => {
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.getByRole("button", { name: "終わる", exact: true }).click();
};

test("Do Now puts the unfinished Today 3 NextStep first and reacts to Today 3 changes", async ({
  page,
}) => {
  await expect(doNow(page).locator("h2")).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");
  await expect(doNow(page)).toContainText(
    "Web Demoでは、今日の3件に入っている一手を先に、ほかは登録順で表示",
  );

  await removeFromToday(page, "本を読む");
  await removeFromToday(page, "ストレッチをする");
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("学習に次の一手が設定されているため");

  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "数分だけ読むを今日の3件に追加" })
    .click();
  await page.keyboard.press("Escape");
  await expect(doNow(page).locator("h2")).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  await doNow(page).locator("[data-demo-do-now-short]").click();
  await finishAndConfirm(page);
  await expect(
    page.getByRole("status", { name: "数分だけ読む：完了" }),
  ).toBeVisible();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
});

test("Do Now and the Today 3 card share one timer in both directions", async ({
  page,
}) => {
  const reading = card(page, "本を読む");
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(reading.getByText("実行中")).toBeVisible();
  await expect(doNow(page).getByText("実行中")).toBeVisible();

  await reading.getByRole("button", { name: "本を読むを一時停止" }).click();
  await expect(reading.getByText("一時停止")).toBeVisible();
  await expect(doNow(page).getByText("一時停止")).toBeVisible();
  await doNow(page).getByRole("button", { name: "数分だけ読むを再開" }).click();
  await expect(reading.getByText("実行中")).toBeVisible();

  await finishAndConfirm(page);
  await expect(
    page.getByRole("status", { name: "本を読む：完了" }),
  ).toBeVisible();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await expect(doNow(page).getByRole("status")).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await reading.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await expect(doNow(page).getByText("実行中")).toBeVisible();
  await expect(doNow(page).locator("h2")).toHaveText("数分だけ読む");
});

test("Do Now keeps the project chosen with Other Step and does not save it", async ({
  page,
}) => {
  const before = await saved(page);
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  expect(await saved(page)).toBe(before);

  await removeFromToday(page, "本を読む");
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "数分だけ読むを今日の3件に追加" })
    .click();
  await page.keyboard.press("Escape");
  await expect(card(page, "数分だけ読む")).toBeVisible();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("学習に次の一手が設定されているため");
});

test("Today 3 heading shows only the count, or only 0件", async ({ page }) => {
  const heading = page.locator(".sync-heading");
  await expect(heading).toContainText("1 / 2 完了");
  await expect(heading).not.toContainText("2件");
  await removeFromToday(page, "本を読む");
  await removeFromToday(page, "ストレッチをする");
  await expect(heading).toContainText("0件");
  await expect(heading).not.toContainText("完了");
});

test("NextStep button and dialog use 編集", async ({ page }) => {
  const next = page.locator(".next-section");
  const reading = next.locator(".source-row", { hasText: "読書" });
  await expect(reading.getByRole("button", { name: "編集" })).toHaveAttribute(
    "title",
    "今日の3件を完了するか外してから編集できます",
  );
  await expect(next.getByRole("button", { name: "変更" })).toHaveCount(0);
  await next
    .locator(".source-row", { hasText: "運動" })
    .getByRole("button", { name: "編集" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "次の一手を編集" }),
  ).toBeVisible();
});

test.describe("victory glow", () => {
  const border = (page: Page) =>
    page
      .locator(".victory-card")
      .evaluate((node) => getComputedStyle(node).borderTopColor);

  test("filled card glows gold on hover, even when complete", async ({
    page,
  }) => {
    const rest = await border(page);
    expect(rest).not.toBe(gold);
    await page.locator(".victory-card").hover();
    await expect.poll(() => border(page)).toBe(gold);
    await page.mouse.move(0, 0);
    await expect.poll(() => border(page)).toBe(rest);
    await page.getByRole("checkbox", { name: "今日の勝利条件を完了" }).check();
    await page.locator(".victory-card").hover();
    await expect.poll(() => border(page)).toBe(gold);
  });

  test("empty card does not glow", async ({ page }) => {
    await page.getByRole("checkbox", { name: "今日の勝利条件を完了" }).check();
    await page.evaluate((storageKey) => {
      const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      state.victory = { text: "", completed: false };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, key);
    await page.reload();
    const rest = await border(page);
    await page.locator(".victory-card").hover();
    await page.waitForTimeout(300);
    expect(await border(page)).toBe(rest);
  });

  test("keyboard focus shows only the button ring, and editing keeps the strong border", async ({
    page,
  }) => {
    const rest = await border(page);
    await page.getByRole("checkbox", { name: "今日の勝利条件を完了" }).focus();
    await page.keyboard.press("Tab");
    const edit = page.getByRole("button", { name: "勝利条件を編集" });
    await expect(edit).toBeFocused();
    await page.waitForTimeout(300);
    expect(await border(page)).toBe(rest);
    expect(
      await edit.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");

    await page.keyboard.press("Enter");
    await page.mouse.move(0, 0);
    await expect(page.getByRole("textbox", { name: "勝利条件" })).toBeFocused();
    await expect.poll(() => border(page)).toBe(gold);
  });
});
