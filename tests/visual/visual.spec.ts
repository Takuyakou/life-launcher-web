import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test("captures expanded desktop states and layout metrics", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({
    path: path.join(output, "landing-top-1440x900.png"),
    fullPage: false,
  });

  const metrics = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect
        ? {
            top: rect.top,
            height: rect.height,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
          }
        : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollHeight: document.documentElement.scrollHeight,
      header: box(".lp-header"),
      hero: box(".lp-hero"),
      headline: box(".lp-h1"),
      primaryCta: box(".lp-cta--primary"),
      figure: box(".lp-f1"),
      steps: box("#flow .lp-steps"),
      demo: box("#screen"),
      stage: box(".lp-stage"),
      app: box(".dl-app"),
      table: box("#diff .lp-table-scroll"),
      final: box("#get .lp-final"),
      footer: box(".lp-footer"),
    };
  });
  await writeFile(
    path.join(output, "layout-metrics.json"),
    JSON.stringify(metrics, null, 2),
  );

  // 見出し・本文・始めるボタンは同じ左端にそろう。
  expect(metrics.headline).not.toBeNull();
  expect(metrics.primaryCta).not.toBeNull();
  expect(metrics.figure).not.toBeNull();
  expect(
    Math.abs(metrics.headline!.left - metrics.primaryCta!.left),
  ).toBeLessThanOrEqual(1);
  expect(metrics.primaryCta!.left + metrics.primaryCta!.width).toBeLessThanOrEqual(
    1440,
  );
  // デモは台紙を持たず、窓が段の幅いっぱいに置かれる。
  expect(metrics.stage).not.toBeNull();
  expect(metrics.app).not.toBeNull();
  expect(Math.abs(metrics.stage!.left - metrics.app!.left)).toBeLessThanOrEqual(
    1,
  );
  expect(
    Math.abs(metrics.stage!.width - metrics.app!.width),
  ).toBeLessThanOrEqual(1);
  expect(metrics.app!.left + metrics.app!.width).toBeLessThanOrEqual(1440);

  await page.locator("#screen").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(output, "demo-default-1440x900.png"),
    fullPage: false,
  });
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "5分", exact: true })
    .click();
  await page.screenshot({
    path: path.join(output, "launch-simulation-1440x900.png"),
    fullPage: false,
  });
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.screenshot({
    path: path.join(output, "completion-dialog-1440x900.png"),
    fullPage: false,
  });
  await page
    .locator(".completion-dialog")
    .getByRole("button", { name: "終わる", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await page.locator(".dl-today-add").click();
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(page.locator("article.dl-today-card")).toHaveCount(3);
  await page.screenshot({
    path: path.join(output, "today3-limit-1440x900.png"),
    fullPage: false,
  });
  await page.locator(".dl-dictionary-button").click();
  await page.screenshot({
    path: path.join(output, "dictionary-open-1440x900.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: path.join(output, "full-page-1440x900.png"),
    fullPage: true,
  });

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`captures ${viewport.width}x${viewport.height} with no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.screenshot({
      path: path.join(
        output,
        `landing-${viewport.width}x${viewport.height}.png`,
      ),
      fullPage: false,
    });

    // W21: ヘッダー・各節・フッターは同じ文字の列にそろう。
    const edges = await page.evaluate(() =>
      [
        ".lp-header-inner",
        "#top .lp-wrap",
        "#flow .lp-wrap",
        "#screen .lp-wrap",
        "#diff .lp-wrap",
        ".lp-footer-inner",
      ].map((selector) => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return {
          selector,
          left: Math.round(rect.left * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      }),
    );
    for (const edge of edges) {
      expect(edge.left, edge.selector).toBe(edges[0].left);
      expect(edge.width, edge.selector).toBe(edges[0].width);
    }

    await page.locator("#screen").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, `demo-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    });

    // デモの窓は台紙なしで段の幅いっぱい、画面の中に収まる。
    const demo = await page.evaluate(() => {
      const stage = document.querySelector(".lp-stage")!.getBoundingClientRect();
      const app = document.querySelector(".dl-app")!.getBoundingClientRect();
      return {
        stage: { left: stage.left, width: stage.width },
        app: { left: app.left, width: app.width },
        viewport: innerWidth,
      };
    });
    expect(Math.abs(demo.stage.left - demo.app.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(demo.stage.width - demo.app.width)).toBeLessThanOrEqual(1);
    expect(demo.app.left).toBeGreaterThanOrEqual(0);
    expect(demo.app.left + demo.app.width).toBeLessThanOrEqual(
      demo.viewport + 0.5,
    );

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    // 狭い画面では「試せる機能」の表だけが横にスクロールし、ページは広がらない。
    const table = await page.locator(".lp-table-scroll").evaluate((node) => ({
      client: node.clientWidth,
      scroll: node.scrollWidth,
    }));
    expect(table.client).toBeLessThanOrEqual(viewport.width);
    expect(table.scroll).toBeGreaterThanOrEqual(table.client);
  });
}
