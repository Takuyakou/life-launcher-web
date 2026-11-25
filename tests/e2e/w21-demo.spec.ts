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

// W21-08: 「今日の実行」は画面から消えた。記録は保存されたデータ(sessions)に残る。
const savedSessions = (page: Page) =>
  page.evaluate(
    (key) =>
      (JSON.parse(localStorage.getItem(key) ?? "{}").sessions ?? []) as {
        label: string;
        minutes: number;
      }[],
    "life-launcher-web-demo:v3",
  );

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
  await expect(page.locator(".dl-donow-title")).toHaveCSS("font-size", "24px");
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

  // やりたいことは最初は閉じている(中身は下の専用のテストで確かめる)。今日の実行は画面に無い。
  await expect(page.locator(".dl-wishlist-group")).toHaveCount(0);
  await expect(page.locator(".dl-activity")).toHaveCount(0);
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
  // 記録は保存されたデータ(sessions)に残る。画面には出さない。
  await expect(page.locator(".dl-activity")).toHaveCount(0);
  await expect.poll(async () => (await savedSessions(page)).length).toBe(2);
  expect((await savedSessions(page)).at(-1)!.minutes).toBe(2);
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
    expect(row.height).toBe(46);
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

test("W21-08: やりたいこと starts closed with two items and per-project counts, and there is no 今日の実行", async ({
  page,
}) => {
  await open(page);
  const wishlist = page.locator(".dl-wishlist");
  const wishlistToggle = wishlist.locator(".dl-section-disclosure");
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "false");
  await expect(wishlist.locator(".dl-section-count")).toHaveText("2件");
  await expect(wishlist.locator(".dl-group-summary-item")).toHaveText(["読書 1件", "学習 1件"]);
  await expect(wishlist.locator(".dl-wishlist-row")).toHaveCount(0);
  await wishlistToggle.click();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "true");
  await expect(wishlist.locator(".dl-wishlist-row")).toHaveCount(2);
  await expect(wishlist.locator(".dl-wishlist-text")).toHaveText([
    "気になっていた本を読む",
    "英単語を20個復習する",
  ]);
  await expect(wishlist.locator(".dl-group-summary")).toHaveCount(0);

  // 今日の実行の段は、デモの画面に無い。
  await expect(page.locator(".dl-activity")).toHaveCount(0);
  await expect(page.locator(".dl-auto-badge")).toHaveCount(0);
  await expect(page.locator(".dl-app").getByText("今日の実行", { exact: true })).toHaveCount(0);

  // 保存された開閉は、そのまま使う。
  await page.reload();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "true");
  await wishlistToggle.click();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "false");
  await expect(wishlist.locator(".dl-group-summary-item")).toHaveCount(2);
});

test("W21-08: finishing a timer keeps the record in the saved data and shows nothing on the screen", async ({
  page,
}) => {
  await open(page);
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(page.locator(".dl-activity")).toHaveCount(0);
  await expect
    .poll(async () => (await savedSessions(page)).filter((s) => s.label === "数分だけ読む").length)
    .toBe(1);
  expect(await savedSessions(page)).toHaveLength(2);
  // 保存された記録は、読み込み直しても残る。
  await page.reload();
  expect(await savedSessions(page)).toHaveLength(2);
});

// ---------- W21-08: デモを詰めて窓を画面に収める ----------

const crowd = async (page: Page) => {
  // 最初の変更で保存されるので、開けて保存データを作り、項目を増やして読み込み直す。
  await page.locator(".dl-wishlist .dl-section-disclosure").click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    for (let i = 0; i < 14; i += 1)
      state.wishlist.push({
        id: `crowd-${i}`,
        label: `やりたいこと${i + 1}`,
        projectId: i % 2 ? "reading" : "study",
      });
    state.sections.wishlist = true;
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#screen").scrollIntoViewIfNeeded();
};

test("W21-08: at 1440x900 the seeded demo window is compact and its column does not scroll", async ({
  page,
}) => {
  await open(page, 1440, 900);
  const box = (await page.locator(".dl-app").boundingBox())!;
  expect(Math.round(box.width)).toBe(1120);
  expect(box.height).toBeLessThanOrEqual(780);
  const column = await page
    .locator(".dl-main")
    .evaluate((node) => ({ scrolls: node.scrollHeight > node.clientHeight + 1 }));
  expect(column.scrolls).toBe(false);

  const buttons = page.locator(
    "[data-demo-do-now-short], [data-demo-do-now-normal], .dl-donow .dl-measure",
  );
  const heights = await buttons.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  );
  expect(heights).toEqual([40, 40, 40]);
  const fontSizes = await buttons.evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fontSize),
  );
  expect(new Set(fontSizes)).toEqual(new Set(["14px"]));
  await expect(page.locator(".dl-donow-title")).toHaveCSS("font-size", "24px");
  await expect(page.locator(".dl-next-row").first()).toHaveCSS("min-height", "46px");
  const rows = await page
    .locator(".dl-next-row")
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(rows).toEqual([46, 46, 46]);

  // ③ の「次はここから」「始めると一緒に開く」「チップ」は1行に並ぶ。
  const line = await page.locator(".dl-donow-line").evaluate((node) => {
    const centres = [
      ...node.querySelectorAll(".dl-donow-resume, .dl-donow-meta > span, .dl-open-chip"),
    ].map((item) => {
      const rect = item.getBoundingClientRect();
      return Math.round(rect.top + rect.height / 2);
    });
    return { spread: Math.max(...centres) - Math.min(...centres), count: centres.length };
  });
  expect(line.count).toBeGreaterThanOrEqual(4);
  expect(line.spread).toBeLessThanOrEqual(2);
  // 見出しの行は、上下の余白 4px。
  const paddings = await page
    .locator(".dl-section-bar")
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).paddingTop));
  expect(new Set(paddings)).toEqual(new Set(["4px"]));
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
] as const) {
  test(`W21-08: with more content the window stops at the screen height and only the column scrolls at ${width}x${height}`, async ({
    page,
  }) => {
    await open(page, width, height);
    await crowd(page);
    const expected = Math.min(1060, Math.max(620, height - 64));
    const app = page.locator(".dl-app");
    await expect
      .poll(async () => Math.round((await app.boundingBox())!.height))
      .toBe(expected);
    const state = await page.locator(".dl-main").evaluate((node) => ({
      scrolls: node.scrollHeight > node.clientHeight + 1,
      overflowY: getComputedStyle(node).overflowY,
    }));
    expect(state.scrolls).toBe(true);
    expect(state.overflowY).toBe("auto");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBe(0);

    // 窓全体が画面に入る位置まで、ページを動かせる。
    await page.locator("#top .lp-cta--primary").click();
    await expect.poll(async () => Math.round((await app.boundingBox())!.y)).toBe(32);
    const inView = await app.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    });
    expect(inView).toBe(true);

    // 本文の列だけがスクロールする。上の帯・左の列・タイマーは窓に付いたまま。
    const before = await page.evaluate(() => ({
      top: document.querySelector(".dl-topbar")!.getBoundingClientRect().top,
      timer: document.querySelector(".dl-timer")!.getBoundingClientRect().top,
      sidebar: document.querySelector(".dl-sidebar")!.getBoundingClientRect().top,
    }));
    await page.locator(".dl-main").evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const after = await page.evaluate(() => {
      const appBox = document.querySelector(".dl-app")!.getBoundingClientRect();
      const timer = document.querySelector(".dl-timer")!.getBoundingClientRect();
      return {
        top: document.querySelector(".dl-topbar")!.getBoundingClientRect().top,
        timer: timer.top,
        sidebar: document.querySelector(".dl-sidebar")!.getBoundingClientRect().top,
        timerInside: timer.top >= appBox.top && timer.bottom <= appBox.bottom,
        timerOnScreen: timer.top >= 0 && timer.bottom <= innerHeight,
        main: document.querySelector<HTMLElement>(".dl-main")!.scrollTop,
      };
    });
    expect(after.main).toBeGreaterThan(0);
    expect(after.top).toBe(before.top);
    expect(after.timer).toBe(before.timer);
    expect(after.sidebar).toBe(before.sidebar);
    expect(after.timerInside).toBe(true);
    expect(after.timerOnScreen).toBe(true);

  });
}

test("W21-08: menus and search come out in the right place while the column is scrolled", async ({
  page,
}) => {
  await open(page, 1366, 768);
  await crowd(page);
  await page.locator(".dl-main").evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const row = page.locator(".dl-wishlist-row").last();
  const trigger = row.locator(".dl-row-menu");
  await trigger.click();
  const menu = page.getByRole("menu", { name: "操作メニュー" });
  await expect(menu).toBeVisible();
  const [t, m] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
  const viewport = page.viewportSize()!;
  // 画面の中に収まり、引き金の近く(下か、入らなければ内側へ寄せた所)に出る。
  expect(m!.x).toBeGreaterThanOrEqual(0);
  expect(m!.y).toBeGreaterThanOrEqual(0);
  expect(m!.x + m!.width).toBeLessThanOrEqual(viewport.width);
  expect(m!.y + m!.height).toBeLessThanOrEqual(viewport.height);
  expect(Math.abs(m!.x + m!.width / 2 - (t!.x + t!.width / 2))).toBeLessThanOrEqual(m!.width);
  expect(m!.y + m!.height).toBeGreaterThan(t!.y - m!.height);
  await page.keyboard.press("Escape");

  // 本文の列がスクロールしたら、メニューは閉じる(ずれて残らない)。
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.locator(".dl-main").evaluate((node) => {
    node.scrollTop = 0;
  });
  await expect(menu).toHaveCount(0);

  await page.keyboard.press("Control+f");
  const palette = page.locator(".dl-palette");
  await expect(palette).toBeVisible();
  const box = (await palette.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
});

test("W21-08: the zone numbers follow the column's scroll and stay with the left column", async ({
  page,
}) => {
  await open(page, 1366, 768);
  const tops = () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll(".lp-zone")].map((zone) => [
          zone.querySelector(".lp-zone-num")!.textContent,
          Math.round(zone.getBoundingClientRect().top),
        ]),
      ),
    );
  const before = await tops();
  await page.locator(".dl-main").evaluate((node) => {
    node.scrollTop = 30;
  });
  await expect.poll(async () => (await tops())["3"]).toBe(before["3"] - 30);
  const after = await tops();
  expect(after["1"]).toBe(before["1"]);
  expect(after["6"]).toBe(before["6"]);
  expect(after["4"]).toBe(before["4"] - 30);
  // 本文の列の番号は、本文の列の見えている範囲(窓の中)で切れ、窓の外へはみ出さない。
  const clipped = await page.evaluate(() => {
    const appBox = document.querySelector(".dl-app")!.getBoundingClientRect();
    const main = document.querySelector(".dl-main")!.getBoundingClientRect();
    return [...document.querySelectorAll(".lp-zone-clip")].every((clip) => {
      const box = clip.getBoundingClientRect();
      return (
        box.top >= appBox.top - 1 &&
        box.bottom <= appBox.bottom + 1 &&
        Math.abs(box.top - main.top) <= 1
      );
    });
  });
  expect(clipped).toBe(true);
});

test("W21-08: at 390 the window grows with its content and does not scroll inside", async ({
  page,
}) => {
  await open(page, 390, 844);
  await crowd(page);
  const state = await page.evaluate(() => {
    const app = document.querySelector<HTMLElement>(".dl-app")!;
    const main = document.querySelector<HTMLElement>(".dl-main")!;
    return {
      height: app.getBoundingClientRect().height,
      maxHeight: getComputedStyle(app).maxHeight,
      overflowY: getComputedStyle(main).overflowY,
      scrolls: main.scrollHeight > main.clientHeight + 1,
      innerHeight,
      horizontal: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(state.maxHeight).toBe("none");
  expect(state.overflowY).not.toBe("auto");
  expect(state.scrolls).toBe(false);
  expect(state.height).toBeGreaterThan(state.innerHeight);
  expect(state.horizontal).toBe(0);
  // ③ の開始ボタンは同じ高さ。
  const heights = await page
    .locator("[data-demo-do-now-short], [data-demo-do-now-normal], .dl-donow .dl-measure")
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(heights).toEqual([40, 40, 40]);
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

// ---------- W21-07: 今日の3件の見出しは、今日の3件を開け閉めする ----------

const storageKey = "life-launcher-web-demo:v3";

test("W21-07: the Today 3 heading opens and closes Today 3 and leaves the next steps alone", async ({
  page,
}) => {
  await open(page);
  const toggle = page.locator(".dl-today > .dl-section-bar");
  const nextToggle = page.locator(".dl-next .dl-section-disclosure");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dl-today-card")).toHaveCount(2);
  await expect(page.locator(".dl-today-add")).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".dl-today-card")).toHaveCount(0);
  await expect(page.locator(".dl-today-add")).toHaveCount(0);
  // 見出しの行は残る。
  await expect(toggle.locator(".dl-section-summary")).toBeVisible();
  await expect(toggle.locator(".dl-section-description")).toBeVisible();
  // 次の一手の一覧は開いたまま。
  await expect(nextToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dl-next-row")).toHaveCount(3);
  // 印の向き
  await expect(toggle.locator("svg").first()).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dl-today-card")).toHaveCount(2);
  await expect(page.locator(".dl-today-add")).toBeVisible();
});

test("W21-07: saved data without a today flag opens Today 3, and the saved flag is kept", async ({
  page,
}) => {
  await open(page);
  // 最初の変更で保存されるので、開け閉めして保存データを作る。
  await page.locator(".dl-wishlist .dl-section-disclosure").click();
  const raw = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(raw).not.toBeNull();
  const state = JSON.parse(raw!);
  delete state.sections.today;
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    storageKey,
    JSON.stringify(state),
  ]);
  await page.reload();
  await expect(page.locator(".dl-today > .dl-section-bar")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator(".dl-today-card")).toHaveCount(2);

  // 保存された today: false は、そのまま使う。
  state.sections.today = false;
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    storageKey,
    JSON.stringify(state),
  ]);
  await page.reload();
  await expect(page.locator(".dl-today > .dl-section-bar")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator(".dl-today-card")).toHaveCount(0);

  // リセットすると、開いた状態に戻る。
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByRole("button", { name: "リセットする" }).click();
  await expect(page.locator(".dl-today > .dl-section-bar")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});
