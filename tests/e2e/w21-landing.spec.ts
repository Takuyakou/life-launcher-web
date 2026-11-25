import { expect, test, type Page } from "@playwright/test";

const RELEASES = "https://github.com/Takuyakou/life-launcher/releases/latest";
const REPO = "https://github.com/Takuyakou/life-launcher";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
};

const left = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((node) => Math.round(node.getBoundingClientRect().left * 10) / 10);

test("the page keeps the approved order and wording", async ({ page }) => {
  await open(page);
  const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
  await expect(nav.getByRole("link", { name: "使い方" })).toHaveAttribute("href", "#flow");
  await expect(nav.getByRole("link", { name: "デモ" })).toHaveAttribute("href", "#screen");
  await expect(nav.getByRole("link", { name: "試せる機能" })).toHaveAttribute("href", "#diff");
  await expect(nav.getByRole("link", { name: "Windows版" })).toHaveAttribute("href", RELEASES);
  await expect(page.locator(".lp-brand-name")).toHaveText("Life Launcher");

  await expect(page.locator(".lp-h1")).toHaveText(
    "今日やることを3件に絞り、1件を選んで、すぐ始めるためのアプリです。",
  );
  await expect(page.locator(".lp-hero .lp-eyebrow")).toHaveText("これは何か");
  await expect(page.locator("#top .lp-lead")).toHaveText(
    "Life Launcher は Windows のデスクトップアプリです。迷ったときに「今やる一手」を1つ示し、その作業に使うアプリやファイルを開いて、タイマーを始めます。",
  );
  await expect(page.locator("#top .lp-cta--primary")).toHaveText("ブラウザで試す");
  await expect(page.locator("#top .lp-cta--primary")).toHaveAttribute("href", "#screen");
  await expect(page.locator("#top .lp-cta:not(.lp-cta--primary)")).toContainText(
    "Windows版をダウンロード",
  );

  await expect(page.locator("#flow .lp-eyebrow")).toHaveText("使い方");
  await expect(page.locator("#flow .lp-h2")).toHaveText("やることは4つだけ。");
  await expect(page.locator(".lp-step .lp-step-num")).toHaveText(["1", "2", "3", "4"]);
  await expect(page.locator(".lp-step-title")).toHaveText([
    "次の一手を書いておく",
    "今日やる3件を選ぶ",
    "5分で始める",
    "終えて、次を書き残す",
  ]);

  await expect(page.locator("#screen .lp-eyebrow")).toHaveText("デモ");
  await expect(page.locator("#screen .lp-h2")).toHaveText("開始までの流れを試す。");
  await expect(page.locator("#screen .lp-demo-lead")).toHaveText(
    "サンプルデータだけで安全に試せます。",
  );
  await expect(page.locator(".dl-app")).toBeVisible();

  await expect(page.locator("#diff .lp-eyebrow")).toHaveText("試せる機能");
  await expect(page.locator("#diff .lp-h2")).toHaveText("試した流れを取り入れる。");
  await expect(page.locator(".lp-table thead th")).toHaveText([
    "できること",
    "デモ",
    "Windows版",
  ]);
  await expect(page.locator(".lp-table tbody tr")).toHaveCount(8);
  await expect(page.locator("#diff .lp-note")).toHaveText(
    "デモはWindows版をすべて移したものではありません。",
  );

  await expect(page.locator("#get .lp-eyebrow")).toHaveText("READY?");
  await expect(page.locator(".lp-fin")).toHaveText("次の一手を、今ここで始める。");
  await expect(page.locator(".lp-ghost")).toHaveText("05:00");
  await expect(page.locator(".lp-try")).toHaveText("まずはブラウザで試す");
  await expect(page.locator(".lp-try")).toHaveAttribute("href", "#screen");
  await expect(page.locator(".lp-getbtn")).toHaveAttribute("href", RELEASES);

  await expect(page.locator(".lp-footer")).toContainText("© 2026 Takuyakou");
  await expect(page.locator(".lp-footer")).not.toContainText("利用条件は");
  await expect(page.locator(".lp-footer-links a").first()).toHaveAttribute("href", REPO);
});

test("the four main buttons share the app start-button motion", async ({ page }) => {
  await open(page);
  const buttons = [
    "#top .lp-cta--primary",
    "#top .lp-cta:not(.lp-cta--primary)",
    ".lp-hdl",
    ".lp-getbtn",
  ];
  const readAfter = (selector: string) =>
    page.locator(selector).first().evaluate((node) => {
      const line = getComputedStyle(node, "::after");
      const box = getComputedStyle(node);
      return {
        transform: line.transform,
        height: line.height,
        left: line.left,
        right: line.right,
        bottom: line.bottom,
        background: line.backgroundColor,
        boxTransform: box.transform,
        shadow: box.boxShadow,
      };
    });

  for (const selector of buttons) {
    const before = await readAfter(selector);
    expect(before.transform, selector).toBe("matrix(0, 0, 0, 1, 0, 0)");
    expect(before.height, selector).toBe("2px");
    expect(before.left, selector).toBe("12px");
    expect(before.right, selector).toBe("12px");
    expect(before.bottom, selector).toBe("0px");
    expect(before.boxTransform, selector).toBe("none");

    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await page.locator(selector).first().hover();
    await page.waitForTimeout(320);
    const after = await readAfter(selector);
    expect(after.transform, selector).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(after.height, selector).toBe("2px");
    expect(after.left, selector).toBe("12px");
    expect(after.right, selector).toBe("12px");
    expect(after.bottom, selector).toBe("0px");
    expect(after.background, selector).toBe(before.background);
    expect(after.boxTransform, selector).toBe("matrix(1, 0, 0, 1, 0, -1)");
    expect(after.shadow, selector).toContain("0px 7px 16px");
    await page.mouse.move(5, 5);
  }
});

test("nav links and the heading underline respond to hover", async ({ page }) => {
  await open(page);
  const navLink = page.locator(".lp-nav a").first();
  await expect(navLink).toHaveCSS("color", "rgb(244, 240, 232)");
  await navLink.hover();
  await expect(navLink).toHaveCSS("color", "rgb(255, 206, 91)");

  const highlight = page.locator(".lp-h1 .lp-hl");
  await expect(highlight).toHaveCSS("color", "rgb(231, 185, 77)");
  expect(await highlight.evaluate((node) => getComputedStyle(node).backgroundSize)).toBe(
    "0px 3px",
  );
  await page.locator(".lp-h1").hover();
  await page.waitForTimeout(320);
  expect(await highlight.evaluate((node) => getComputedStyle(node).backgroundSize)).toBe(
    "100% 3px",
  );
  await expect(highlight).toHaveCSS("color", "rgb(255, 206, 91)");
});

test("each of the four steps has its own illustration motion", async ({ page }) => {
  await open(page);
  const animationsOf = (index: number) =>
    page.locator(".lp-step").nth(index).evaluate((node) => {
      const names = [...node.querySelectorAll("*")].map(
        (child) => getComputedStyle(child).animationName,
      );
      return names.filter((name) => name && name !== "none");
    });

  const third = page.locator(".lp-step").nth(2);
  await third.scrollIntoViewIfNeeded();
  await third.hover();
  await page.waitForTimeout(450);
  expect(await animationsOf(2)).toEqual(
    expect.arrayContaining(["lp-pr", "lp-pp", "lp-bw"]),
  );

  const fourth = page.locator(".lp-step").nth(3);
  await fourth.hover();
  await page.waitForTimeout(450);
  expect(await animationsOf(3)).toEqual(expect.arrayContaining(["lp-pr", "lp-ty"]));

  const first = page.locator(".lp-step").first();
  await first.hover();
  await page.waitForTimeout(350);
  expect(
    await first.locator(".lp-hv").evaluate((node) => getComputedStyle(node).opacity),
  ).toBe("1");
  expect(
    await first.locator(".lp-hu").first().evaluate((node) => getComputedStyle(node).opacity),
  ).toBe("0");
});

test("the numbered callouts and the list light each other up", async ({ page }) => {
  await open(page);
  await page.locator("#screen").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(page.locator(".lp-zone-num")).toHaveCount(6);

  await page.locator(".lp-zone-num").nth(2).scrollIntoViewIfNeeded();
  await page.locator(".lp-zone-num").nth(2).hover();
  await expect(page.locator(".lp-zone[data-active='true']")).toHaveCount(1);
  await expect(page.locator(".lp-zone-item[data-active='true']")).toHaveCount(1);
  await expect(page.locator(".lp-zone-item[data-active='true']")).toContainText("今やる一手");

  await page.locator(".lp-zone-item").nth(3).hover();
  await expect(page.locator(".lp-zone-item[data-active='true']")).toContainText("今日の3件");
  await expect(page.locator(".lp-zone[data-active='true']")).toHaveCount(1);

  const blocking = await page.evaluate(() =>
    [...document.querySelectorAll(".lp-zone")].every(
      (zone) => getComputedStyle(zone).pointerEvents === "none",
    ),
  );
  expect(blocking, "the callout frame must not block the demo").toBe(true);
});

test("the auto-playing figure stops when motion is reduced", async ({ page }) => {
  await open(page);
  const animation = () =>
    page.locator(".lp-f1 .lp-a1").evaluate((node) => getComputedStyle(node).animationName);
  expect(await animation()).toBe("lp-a1");
  expect(
    await page.locator(".lp-f1 .lp-a7").evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("lp-a7");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(150);
  expect(await animation()).toBe("none");
  expect(
    await page.locator(".lp-step").first().locator(".lp-hv").evaluate(
      (node) => getComputedStyle(node).opacity,
    ),
  ).toBe("1");
});

test("everything lines up on one left edge at 1440", async ({ page }) => {
  await open(page, 1440);
  const heading = await left(page, ".lp-h1");
  for (const selector of [
    ".lp-lead",
    "#top .lp-cta--primary",
    ".lp-step-num",
    "#flow .lp-h2",
    "#screen .lp-h2",
    "#diff .lp-h2",
    ".dl-app",
    ".lp-zone-list .lp-num",
  ]) {
    expect(Math.abs((await left(page, selector)) - heading), selector).toBeLessThanOrEqual(1);
  }
  // 図の枠は内側の余白の分だけ外へ出て、中の札と番号は列にそろう。
  expect(await left(page, ".lp-f1")).toBeLessThan(heading);
  expect(Math.abs((await left(page, ".lp-f1 .lp-k")) - heading)).toBeLessThanOrEqual(1);
  expect(Math.abs((await left(page, ".lp-f1 .lp-num")) - heading)).toBeLessThanOrEqual(1);
  expect(Math.abs((await left(page, ".lp-vig .lp-k")) - heading)).toBeLessThanOrEqual(1);
  expect(await left(page, ".lp-vig")).toBeLessThan(heading);

  // デモの窓は文字の列いっぱい(1440px の画面で 1120px)。
  const demo = await page.locator(".dl-app").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { left: Math.round(rect.left), right: Math.round(rect.right) };
  });
  expect(demo.left).toBe(Math.round(heading));
  expect(demo.right - demo.left).toBe(1120);
  const wrapRight = await page
    .locator("#screen .lp-wrap")
    .evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return Math.round(rect.right - parseFloat(style.paddingRight));
    });
  expect(Math.abs(demo.right - wrapRight)).toBeLessThanOrEqual(1);
});

test("the same left edge holds at 390", async ({ page }) => {
  await open(page, 390, 844);
  const heading = await left(page, ".lp-h1");
  expect(heading).toBeGreaterThan(0);
  for (const selector of [
    ".lp-lead",
    "#top .lp-cta--primary",
    ".lp-step-num",
    ".lp-f1 .lp-k",
    ".lp-f1 .lp-num",
    ".dl-app",
    ".lp-zone-list .lp-num",
  ]) {
    expect(Math.abs((await left(page, selector)) - heading), selector).toBeLessThanOrEqual(1);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBe(0);
});

// ---------- W21-07: 外へ出るリンクは新しいタブで開く ----------

test("W21-07: the five outgoing links open in a new tab and in-page links stay put", async ({
  page,
}) => {
  await open(page);
  const outgoing = [
    page.locator("header .lp-hdl"),
    page.locator("#top .lp-cta:not(.lp-cta--primary)"),
    page.locator(".lp-getbtn"),
    page.locator(".lp-footer").getByRole("link", { name: "GitHub" }),
    page.locator(".lp-footer").getByRole("link", { name: "Windows版" }),
  ];
  const hrefs = [RELEASES, RELEASES, RELEASES, REPO, RELEASES];
  for (const [index, link] of outgoing.entries()) {
    await expect(link).toHaveAttribute("href", hrefs[index]);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  // ページの中の移動は、同じタブのまま。
  const inPage = await page
    .locator('a[href^="#"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => [node.getAttribute("target"), node.getAttribute("rel")]),
    );
  expect(inPage.length).toBeGreaterThan(4);
  for (const [target, rel] of inPage) {
    expect(target).toBeNull();
    expect(rel).toBeNull();
  }
  // 外へ出るリンクは、この5つだけ。
  await expect(page.locator('a[href^="http"]')).toHaveCount(5);
});

// ---------- W21-08: 表の行とデモへの移動 ----------

test("W21-08: the table row names only the timer, and the record row stays with Windows", async ({
  page,
}) => {
  await open(page);
  const rows = page.locator(".lp-table tbody tr");
  await expect(rows.nth(1).locator("th, td").first()).toHaveText("タイマー(5分・25分・延長)");
  await expect(page.locator(".lp-table")).not.toContainText("実行の記録");
  const record = rows.filter({ hasText: "記録・今週を決める" });
  await expect(record).toHaveCount(1);
  await expect(record.locator(".lp-cell-yes")).toHaveCount(1);
  await expect(rows).toHaveCount(8);
});

for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [1366, 768],
] as const) {
  test(`W21-08: the try buttons bring the whole demo window onto the screen at ${width}x${height}`, async ({
    page,
  }) => {
    await open(page, width, height);
    for (const selector of ["#top .lp-cta--primary", ".lp-try"]) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.locator(selector).click();
      const stage = page.locator(".lp-stage");
      await expect
        .poll(async () => Math.round((await stage.boundingBox())!.y))
        .toBe(32);
      const fits = await stage.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      });
      expect(fits).toBe(true);
    }
  });
}

test("W21-08: the header Demo link still lands on the heading", async ({ page }) => {
  await open(page);
  await page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "デモ" }).click();
  const heading = page.getByRole("heading", { name: "開始までの流れを試す。" });
  await expect
    .poll(async () => {
      const box = await heading.boundingBox();
      return box ? box.y > 0 && box.y < 200 : false;
    })
    .toBe(true);
});
