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
  test(`W16 landing page at ${viewport.width}: no overflow, full-page capture`, async ({
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

    await page.screenshot({
      path: path.join(output, `w16-landing-top-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(output, `w16-landing-full-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test("W16 landing text keeps a 4.5:1 contrast on its background", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const ratios = await page.evaluate(() => {
    const parse = (value: string) =>
      (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as [number, number, number];
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
      const node = document.querySelector(selector)!;
      const fg = luminance(parse(getComputedStyle(node).color));
      const bg = luminance(parse(backgroundOf(node)));
      return Math.round(((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)) * 100) / 100;
    };
    return Object.fromEntries(
      [
        ".lp-hero-lead-quiet",
        ".lp-hero-chip",
        ".lp-hero-card-reason",
        ".lp-why-faded",
        ".lp-demo-step-note",
        ".lp-demo-privacy",
        ".lp-feature-tag",
        ".lp-privacy-tech",
        ".lp-footer-inner > span",
      ].map((selector) => [selector, ratio(selector)]),
    );
  });
  for (const [selector, value] of Object.entries(ratios)) {
    expect(value, selector).toBeGreaterThanOrEqual(4.5);
  }
});
