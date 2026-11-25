import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1000, height: 800 },
  { width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`W21 landing page at ${viewport.width}: no overflow, full-page capture`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-09-09T01:00:00Z"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.evaluate(() => document.fonts.ready);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBe(0);

    // W21 の並び: 見出し・本文・図・CTA・4つの段・試せる機能の表・最後の節。
    await expect(page.locator(".lp-page")).toHaveCount(1);
    await expect(page.locator(".lp-header")).toBeVisible();
    await expect(page.locator(".lp-h1")).toBeVisible();
    await expect(page.locator("#top .lp-lead")).toBeVisible();
    await expect(page.locator(".lp-f1")).toBeVisible();
    await expect(page.locator("#top .lp-cta--primary")).toBeVisible();
    await expect(
      page.locator("#top .lp-cta:not(.lp-cta--primary)"),
    ).toBeVisible();
    await expect(page.locator("#flow .lp-step")).toHaveCount(4);
    await expect(page.locator(".lp-stage .dl-app")).toHaveCount(1);
    await expect(page.locator("#diff .lp-table")).toBeVisible();
    await expect(page.locator("#get .lp-fin")).toBeVisible();
    await expect(page.locator("#get .lp-ghost")).toHaveCount(1);
    await expect(page.locator("#get .lp-get")).toBeVisible();
    await expect(page.locator(".lp-footer")).toBeVisible();

    // ヘッダー・各節・フッターは同じ文字の列にそろう。
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

    await page.screenshot({
      path: path.join(
        output,
        `w21-landing-top-${viewport.width}x${viewport.height}.png`,
      ),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(output, `w21-landing-full-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test("W21 landing text keeps a 4.5:1 contrast on its background", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);

  const ratios = await page.evaluate(() => {
    const parse = (value: string) =>
      (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as [
        number,
        number,
        number,
      ];
    const luminance = ([r, g, b]: [number, number, number]) => {
      const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const backgroundOf = (node: Element): string => {
      let current: Element | null = node;
      while (current) {
        const bg = getComputedStyle(current).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const ratio = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) return `missing:${selector}`;
      const fg = luminance(parse(getComputedStyle(node).color));
      const bg = luminance(parse(backgroundOf(node)));
      return (
        Math.round(
          ((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)) * 100,
        ) / 100
      );
    };
    return Object.fromEntries(
      [
        "#top .lp-lead",
        "#top .lp-eyebrow",
        ".lp-fig-note",
        ".lp-fig-meta",
        ".lp-step-num",
        ".lp-step-text",
        ".lp-vig-note",
        ".lp-zone-text",
        ".lp-note",
        ".lp-get-meta",
        ".lp-get-note",
        ".lp-try",
        ".lp-footer-inner > span",
      ].map((selector) => [selector, ratio(selector)]),
    );
  });
  for (const [selector, value] of Object.entries(ratios)) {
    expect(typeof value, selector).toBe("number");
    expect(value as number, selector).toBeGreaterThanOrEqual(4.5);
  }
});
