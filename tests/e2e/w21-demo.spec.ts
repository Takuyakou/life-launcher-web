import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, width = 1440, height = 1000) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#screen").scrollIntoViewIfNeeded();
};

const todayCard = (page: Page, name: string) =>
  page.getByRole("article", { name, exact: true });

test("the main screen follows the v1.6.4 order", async ({ page }) => {
  await open(page);

  // 上の帯: ロゴ・検索欄・WEB DEMO・リセット
  await expect(page.locator(".dl-brand-name")).toHaveText("Life Launcher");
  await expect(page.locator(".dl-search-button")).toContainText("検索");
  await expect(page.locator(".dl-demo-pill")).toHaveText("WEB DEMO");
  await expect(page.locator(".dl-pill-button")).toHaveText("リセット");

  // 左の列: 辞書・ショートカット・タイマー
  const sidebar = page.locator(".dl-sidebar");
  await expect(sidebar.locator(".dl-dictionary-button")).toContainText("辞書を開く");
  await expect(sidebar.locator(".dl-quick-head")).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar.locator(".dl-timer")).toBeVisible();

  // 本文: 日付と今日の勝利条件が同じ行
  const date = await page.locator(".dl-date").boundingBox();
  const victory = await page.locator(".dl-victory").boundingBox();
  const sameRow = await page.evaluate(() => {
    const row = document.querySelector(".dl-header-row")!;
    const dateNode = row.querySelector(".dl-date")!;
    const victoryNode = row.querySelector(".dl-victory")!;
    const a = dateNode.getBoundingClientRect();
    const b = victoryNode.getBoundingClientRect();
    return {
      siblings: dateNode.parentElement === row && victoryNode.parentElement === row,
      overlap: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
      smaller: Math.min(a.height, b.height),
    };
  });
  expect(date).not.toBeNull();
  expect(victory).not.toBeNull();
  expect(sameRow.siblings).toBe(true);
  expect(sameRow.overlap).toBeGreaterThan(sameRow.smaller * 0.8);
  await expect(page.locator(".dl-victory-label")).toHaveText("今日の勝利条件");
  await expect(page.locator(".dl-victory-text")).toHaveText(
    "後回しにしていたことを1つ終わらせる",
  );

  // 今やる一手は大きな札
  await expect(page.locator(".dl-donow-title")).toHaveCSS("font-size", "32px");
  await expect(page.locator(".dl-donow-reason")).toHaveText("今日の3件に入っている一手です");
  await expect(page.locator(".dl-donow-resume")).toContainText("次はここから");
  await expect(page.locator(".dl-donow-resume")).toContainText("3章のp.84から");
  for (const name of ["5分で始める", "通常25分", "計測", "他の一手"]) {
    await expect(page.getByRole("button", { name, exact: true }).first()).toBeVisible();
  }

  // 今日の3件は札に印とメニュー
  const stretch = todayCard(page, "ストレッチをする");
  await expect(stretch.locator(".dl-today-status")).toHaveText("✓");
  const reading = todayCard(page, "本を読む");
  await expect(reading.locator(".dl-pill--project")).toHaveText("今やる一手");
  await expect(reading.locator(".dl-row-menu")).toHaveAttribute("aria-label", "操作メニュー");

  // 次の一手は鍵と今日の3件の印
  await expect(page.locator(".dl-next-row")).toHaveCount(3);
  const readingRow = page.locator(".dl-next-row").filter({ hasText: "数分だけ読む" });
  await expect(readingRow.locator(".dl-lock")).toBeVisible();
  await expect(readingRow.locator(".dl-today-chip")).toHaveText("✓ 今日の3件");
  const studyRow = page.locator(".dl-next-row").filter({ hasText: "参考書を10ページ進める" });
  await expect(studyRow.locator(".dl-lock")).toHaveCount(0);

  // やりたいことはプロジェクト別の件数
  await expect(page.locator(".dl-wishlist-group").first().locator(".dl-wishlist-count")).toHaveText(
    "1件",
  );

  await expect(page.locator(".dl-activity-row")).toHaveCount(1);
});

test("the timer sits in the left column at the demo size and never overflows it", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".dl-timer-clock")).toHaveCSS("font-size", "42px");
  await expect(page.locator(".dl-timer-title")).toHaveCSS("font-size", "17px");
  await expect(page.locator(".dl-timer")).toHaveCSS("padding", "16px 14px 14px");
  await expect(page.locator(".dl-preset-button").first()).toHaveCSS("height", "40px");
  await expect(page.locator(".dl-preset-input input")).toHaveCSS("font-size", "15px");
  await expect(page.locator(".dl-timer-clock")).toHaveText("25分");

  const fits = () =>
    page.locator(".dl-timer").evaluate((node) => {
      const sidebar = node.closest(".dl-sidebar")!;
      const box = node.getBoundingClientRect();
      const column = sidebar.getBoundingClientRect();
      return {
        overflow: node.scrollWidth - node.clientWidth,
        inside: box.right <= column.right + 0.5 && box.left >= column.left - 0.5,
      };
    });
  expect(await fits()).toEqual({ overflow: 0, inside: true });

  // − / ＋ と入力。1〜240 の外は丸める。
  await page.getByRole("button", { name: "通常タイマーを5分増やす" }).click();
  await expect(page.locator(".dl-timer-clock")).toHaveText("30分");
  await page.getByRole("button", { name: "通常タイマーを5分減らす" }).click();
  await expect(page.locator(".dl-timer-clock")).toHaveText("25分");
  const input = page.getByRole("spinbutton", { name: "通常タイマーの分数" });
  await input.fill("7");
  await input.blur();
  await expect(page.locator(".dl-timer-clock")).toHaveText("7分");
  await input.fill("999");
  await input.blur();
  await expect(page.locator(".dl-timer-clock")).toHaveText("240分");

  // 動いている間も 42px で、左の列からはみ出さない。
  await page.locator(".dl-donow-card .dl-start--normal").click();
  await expect(page.locator(".dl-pill--state")).toHaveText("実行中");
  await expect(page.locator(".dl-timer-clock")).toHaveCSS("font-size", "42px");
  expect(await fits()).toEqual({ overflow: 0, inside: true });
});

test("Today 3 stays on one row inside the landing page and folds the Windows way below", async ({
  page,
}) => {
  await open(page, 1440);
  // 3件そろえて、1行に3つ並ぶことを確かめる。
  await page.locator(".dl-next-row").first().locator(".dl-row-menu--next").click();
  await page
    .getByRole("menu", { name: "操作メニュー" })
    .getByRole("menuitem", { name: "今日の3件に入れる" })
    .click();
  await expect(page.locator(".dl-today-card")).toHaveCount(3);

  const columns = () =>
    page.locator(".dl-today-grid").evaluate((node) => getComputedStyle(node).gridTemplateColumns);
  expect((await columns()).split(" ")).toHaveLength(3);

  const boxes = await page.locator(".dl-today-card").evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().top),
  );
  expect(boxes).toHaveLength(3);
  expect(new Set(boxes.map((top) => Math.round(top))).size).toBe(1);

  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.waitForTimeout(250);
  expect((await columns()).split(" ")).toHaveLength(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  expect((await columns()).split(" ")).toHaveLength(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBe(0);
});

test("search finds next steps, wishlist items and dictionary tiles", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Control+f");
  const palette = page.getByRole("dialog", { name: "検索" });
  await expect(palette).toBeVisible();
  await expect(palette.locator(".dl-palette-empty")).toHaveText(
    "言葉を入れると、次の一手・やりたいこと・辞書から探します。",
  );

  await palette.getByRole("textbox").fill("読");
  await expect(palette.locator(".dl-palette-group")).toHaveText([
    "次の一手",
    "やりたいこと",
    "辞書",
  ]);
  await expect(palette.locator(".dl-palette-item")).toHaveCount(3);

  await palette.getByRole("textbox").fill("ぜんぜんない");
  await expect(palette.locator(".dl-palette-empty")).toHaveText(
    "見つかりませんでした。別の言葉で試してください。",
  );

  await palette.getByRole("textbox").fill("参考書");
  await palette.locator(".dl-palette-item").first().press("Enter");
  await expect(page.locator(".dl-pill--state")).toHaveText("実行中");
  await expect(page.locator(".dl-timer-clock")).toHaveText("05:00");

  await page.keyboard.press("Control+f");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "検索" })).toHaveCount(0);
});

test("measuring counts up and records the session", async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole("button", { name: "計測", exact: true }).first().click();
  await expect(page.locator(".dl-pill--state")).toHaveText("計測中");
  await expect(page.locator(".dl-elapsed").first()).toHaveText("00:00");
  await page.clock.runFor(65_000);
  await expect(page.locator(".dl-elapsed").first()).toHaveText("01:05");
  await expect(page.locator(".dl-timer-clock")).toHaveText("01:05");

  await page.getByRole("button", { name: "終了", exact: true }).first().click();
  await expect(page.locator(".dl-pill--state")).toHaveText("待機中");
  await expect(page.locator(".dl-activity-row")).toHaveCount(2);
  await expect(page.locator(".dl-activity-row").first()).toContainText("2分");
});

test("the row menu moves items between Today 3 and the candidate list", async ({ page }) => {
  await open(page);
  await todayCard(page, "本を読む").locator(".dl-row-menu").click();
  const menu = page.getByRole("menu", { name: "操作メニュー" });
  await expect(menu.getByRole("menuitem")).toHaveText(["編集", "今日の3件から外す"]);
  await menu.getByRole("menuitem", { name: "今日の3件から外す" }).click();
  await expect(page.getByRole("article", { name: "本を読む" })).toHaveCount(0);
  await expect(page.locator(".dl-today-card")).toHaveCount(1);

  await page.locator(".dl-next-row").first().locator(".dl-row-menu--next").click();
  const nextMenu = page.getByRole("menu", { name: "操作メニュー" });
  await nextMenu.getByRole("menuitem", { name: "今日の3件に入れる" }).click();
  await expect(page.locator(".dl-today-card")).toHaveCount(2);
});

test("the shortcut list opens and closes from the left column", async ({ page }) => {
  await open(page);
  const head = page.locator(".dl-quick-head");
  await expect(head).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dl-quick-button")).toHaveCount(5);
  await head.click();
  await expect(head).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".dl-quick-button")).toHaveCount(0);
  await head.click();
  await expect(page.locator(".dl-quick-button")).toHaveCount(5);
});
