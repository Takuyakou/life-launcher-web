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
  const reading = todayCard(page, "数分だけ読む");
  await expect(reading.locator(".dl-pill--project")).toHaveText("今やる一手");
  await expect(reading.locator(".dl-row-menu")).toHaveAttribute("aria-label", "操作メニュー");

  // 次の一手は鍵と今日の3件の印
  await expect(page.locator(".dl-next-row")).toHaveCount(3);
  const readingRow = page.locator(".dl-next-row").filter({ hasText: "数分だけ読む" });
  await expect(readingRow.locator(".dl-lock")).toBeVisible();
  await expect(readingRow.locator(".dl-today-chip")).toHaveText("✓ 今日の3件");
  const studyRow = page.locator(".dl-next-row").filter({ hasText: "参考書を10ページ進める" });
  await expect(studyRow.locator(".dl-lock")).toHaveCount(0);

  // やりたいことと今日の実行は、最初は閉じている(中身は下の専用のテストで確かめる)。
  await expect(page.locator(".dl-wishlist-group")).toHaveCount(0);
  await expect(page.locator(".dl-activity-row")).toHaveCount(0);
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
  await page.locator(".dl-activity .dl-section-disclosure").click();
  await expect(page.locator(".dl-activity-row")).toHaveCount(2);
  await expect(page.locator(".dl-activity-row").first()).toContainText("2分");
});

test("the row menu moves items between Today 3 and the candidate list", async ({ page }) => {
  await open(page);
  await todayCard(page, "数分だけ読む").locator(".dl-row-menu").click();
  const menu = page.getByRole("menu", { name: "操作メニュー" });
  await expect(menu.getByRole("menuitem")).toHaveText(["編集", "今日の3件から外す"]);
  await menu.getByRole("menuitem", { name: "今日の3件から外す" }).click();
  await expect(page.getByRole("article", { name: "数分だけ読む" })).toHaveCount(0);
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

// ---------- W21-05: 見本 demo-v164.png に合わせた直し ----------

test("W21-05: 計測 stays on one line at the height of the start buttons", async ({ page }) => {
  await open(page);
  const measure = page.locator(".dl-donow .dl-measure");
  const short = page.locator("[data-demo-do-now-short]");
  await expect(measure).toHaveCSS("white-space", "nowrap");
  const sizes = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>(".dl-donow .dl-measure")!;
    const label = button.querySelector("span")!;
    const icon = button.querySelector("svg")!;
    const range = document.createRange();
    range.selectNodeContents(label);
    const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
    const iconBox = icon.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    return {
      lines: lines.size,
      // 時計の印と字が同じ行にある(縦の中心が近い)。
      centreGap: Math.abs(
        iconBox.top + iconBox.height / 2 - (labelBox.top + labelBox.height / 2),
      ),
      iconLeftOfLabel: iconBox.right <= labelBox.left,
      // 字がボタンの枠の中に収まっている。
      labelInside:
        labelBox.left >= button.getBoundingClientRect().left &&
        labelBox.right <= button.getBoundingClientRect().right,
    };
  });
  expect(sizes.lines).toBe(1);
  expect(sizes.centreGap).toBeLessThanOrEqual(2);
  expect(sizes.iconLeftOfLabel).toBe(true);
  expect(sizes.labelInside).toBe(true);
  expect((await measure.boundingBox())!.height).toBe((await short.boundingBox())!.height);

  // 今日の3件の札: 5分・25分・時計のボタンが同じ高さ。
  const heights = await todayCard(page, "数分だけ読む")
    .locator(".dl-today-actions button")
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(heights).toHaveLength(3);
  expect(new Set(heights).size).toBe(1);
});

test("W21-05: the seeded reading step has one name in Do Now, Today 3 and the next steps", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".dl-donow-title")).toHaveText("数分だけ読む");
  await expect(page.locator(".dl-today-card").nth(1)).toHaveAttribute(
    "aria-label",
    "数分だけ読む",
  );
  const reading = page.locator(".dl-next-row", { hasText: "読書" });
  await expect(reading.locator(".dl-next-resume")).toHaveText(/^3章のp\.84から ▸\s*$/);
  await expect(reading.locator(".dl-next-text p")).toHaveText(/^3章のp\.84から ▸ 数分だけ読む$/);
  await expect(page.locator(".dl-app").getByText("本を読む", { exact: true })).toHaveCount(0);
});

test("W21-05: next step rows stay on one line and are edited from the menu", async ({ page }) => {
  await open(page);
  const rows = page.locator(".dl-next-row");
  await expect(rows).toHaveCount(3);
  const layout = await rows.evaluateAll((nodes) =>
    nodes.map((row) => {
      const centre = (selector: string) => {
        const node = row.querySelector(selector);
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return box.top + box.height / 2;
      };
      const text = row.querySelector(".dl-next-text p")!;
      const range = document.createRange();
      range.selectNodeContents(text);
      const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.bottom)));
      return {
        height: row.getBoundingClientRect().height,
        lines: lines.size,
        centres: [".dl-next-project", ".dl-next-text", ".dl-next-meta", ".dl-row-menu"].map(centre),
        metaRight: row.querySelector(".dl-next-meta")!.getBoundingClientRect().right,
        menuLeft: row.querySelector(".dl-row-menu")!.getBoundingClientRect().left,
      };
    }),
  );
  for (const row of layout) {
    expect(row.height).toBe(56);
    expect(row.lines).toBe(1);
    const centres = row.centres.filter((value): value is number => value !== null);
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(3);
    expect(row.metaRight).toBeLessThanOrEqual(row.menuLeft);
  }

  // 行に「編集」のボタンは無い。「＋ 今日へ」は、入れられないときは押せない見た目。
  await expect(rows.getByRole("button", { name: "編集" })).toHaveCount(0);
  const study = rows.filter({ hasText: "学習" });
  const reading = rows.filter({ hasText: "読書" });
  const exercise = rows.filter({ hasText: "運動" });
  await expect(study.getByRole("button", { name: "＋ 今日へ" })).toBeEnabled();
  await expect(exercise.getByRole("button", { name: "＋ 今日へ" })).toBeDisabled();
  await expect(exercise.locator(".dl-today-chip")).toHaveText("✓ 今日の3件");
  await expect(reading.getByRole("button", { name: "＋ 今日へ" })).toHaveCount(0);
  await expect(reading.locator(".dl-lock")).toBeVisible();

  // ロック中は、メニューの「次の一手を編集」が押せず、理由が添えてある。
  await reading.locator(".dl-row-menu").click();
  const locked = page.getByRole("menuitem", { name: /次の一手を編集/ });
  await expect(locked).toBeDisabled();
  await expect(locked.locator(".dl-menu-note")).toHaveText("未完了の今日の3件に入っているため");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  // ロックの無い行は、メニューから編集できる。
  await study.locator(".dl-row-menu").click();
  await page.getByRole("menuitem", { name: "次の一手を編集" }).click();
  const dialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await dialog.getByRole("textbox", { name: "次の一手" }).fill("参考書を5ページ進める");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(study.locator(".dl-next-text p")).toHaveText("参考書を5ページ進める");
});

test("W21-05: やりたいこと and 今日の実行 start closed, show counts, and open and close", async ({
  page,
}) => {
  await open(page);
  const wishlist = page.locator(".dl-wishlist");
  const wishlistToggle = wishlist.locator(".dl-section-disclosure");
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "false");
  await expect(wishlist.locator(".dl-section-count")).toHaveText("3件");
  await expect(wishlist.locator(".dl-group-summary-item")).toHaveText([
    "読書 1件",
    "学習 1件",
    "未分類 1件",
  ]);
  await expect(wishlist.locator(".dl-wishlist-row")).toHaveCount(0);
  await wishlistToggle.click();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "true");
  await expect(wishlist.locator(".dl-wishlist-row")).toHaveCount(3);
  await expect(wishlist.locator(".dl-group-summary")).toHaveCount(0);

  const activity = page.locator(".dl-activity");
  const activityToggle = activity.locator(".dl-section-disclosure");
  await expect(activityToggle).toHaveAttribute("aria-expanded", "false");
  await expect(activity.locator(".dl-section-count")).toHaveText("1件");
  await expect(activity.locator(".dl-auto-badge")).toHaveText("自動");
  await expect(activity.locator(".dl-activity-row")).toHaveCount(0);
  await activityToggle.click();
  await expect(activity.locator(".dl-activity-row")).toHaveCount(1);
  await activityToggle.click();
  await expect(activity.locator(".dl-activity-row")).toHaveCount(0);

  // 保存された開閉は、そのまま使う(やりたいことは開いたまま、今日の実行は閉じたまま)。
  await page.reload();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "true");
  await expect(activityToggle).toHaveAttribute("aria-expanded", "false");
  await wishlistToggle.click();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "false");
  await expect(wishlist.locator(".dl-group-summary-item")).toHaveCount(3);
});

test("W21-05: the demo window in the landing page is at most 1100px tall at 1120px wide", async ({
  page,
}) => {
  await open(page);
  const box = (await page.locator(".dl-app").boundingBox())!;
  expect(Math.round(box.width)).toBe(1120);
  expect(box.height).toBeLessThanOrEqual(1100);
});

test("W21-05: the small details follow the reference", async ({ page }) => {
  await open(page);
  // 曜日は「水曜日」の形。
  await expect(page.locator(".dl-weekday")).toHaveText(/^[日月火水木金土]曜日$/);
  // 今日の3件の見出し: 見えるのは「1 / 2 完了」と説明文。件数は読み上げ用にだけ残る。
  const bar = page.locator(".dl-today > .dl-section-bar");
  await expect(bar.locator(".dl-section-summary")).toHaveText("1 / 2 完了");
  await expect(bar.locator(".dl-section-summary")).toBeVisible();
  await expect(bar.locator(".dl-section-count")).toHaveAttribute("data-quiet", "true");
  expect((await bar.locator(".dl-section-count").boundingBox())!.width).toBeLessThanOrEqual(1);
  await expect(bar.locator(".dl-section-description")).toBeVisible();
  // 「今やる一手」の印は、札の右上の … の左。
  const card = todayCard(page, "数分だけ読む");
  const pill = (await card.locator(".dl-today-top-actions .dl-pill--project").boundingBox())!;
  const menu = (await card.locator(".dl-today-top-actions .dl-row-menu").boundingBox())!;
  expect(pill.x + pill.width).toBeLessThanOrEqual(menu.x);
  expect(Math.abs(pill.y + pill.height / 2 - (menu.y + menu.height / 2))).toBeLessThanOrEqual(2);
  // ショートカットは頭文字の札。
  await expect(page.locator(".dl-quick-button .dl-letter-icon")).toHaveText([
    "読",
    "ス",
    "学",
    "写",
    "ブ",
  ]);
  await expect(page.locator(".dl-quick-button .dl-letter-icon").first()).toHaveCSS(
    "width",
    "20px",
  );
});
