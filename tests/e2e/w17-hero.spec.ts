import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
};

const box = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: rect.width };
  });

test("the hero has no GitHub link; the header keeps it", async ({ page }) => {
  await open(page);
  await expect(page.locator(".lp-hero").getByRole("link", { name: /GitHub/ })).toHaveCount(0);
  await expect(page.locator(".lp-hero").getByRole("link")).toHaveCount(2);
  await expect(
    page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "GitHub" }),
  ).toBeVisible();
});

for (const width of [1920, 1440, 1366]) {
  test(`the right column sits 22px below the left edges at ${width}`, async ({ page }) => {
    await open(page, width);
    const eyebrow = await box(page, ".lp-hero .lp-eyebrow");
    const actions = await box(page, ".lp-hero-copy > .lp-actions");
    const chips = await box(page, ".lp-hero-candidates");
    const card = await box(page, ".lp-hero-card");
    expect(chips.top - eyebrow.top).toBe(22);
    expect(card.bottom - actions.bottom).toBe(22);
  });
}

test("the right column is not shifted when the hero is one column", async ({ page }) => {
  await open(page, 1000, 800);
  await expect(page.locator(".lp-hero-visual")).toHaveCSS("position", "static");
});

test("start buttons copy the Windows app hover: lift, lighter fill and an underline", async ({
  page,
}) => {
  await open(page);
  const underline = (selector: string) =>
    page.locator(selector).evaluate((node) => getComputedStyle(node, "::after").transform);

  for (const [selector, fill] of [
    [".lp-hero-start", "rgb(48, 66, 53)"],
    [".lp-hero-start-normal", "rgb(48, 59, 74)"],
  ]) {
    expect(await underline(selector)).toBe("matrix(0, 0, 0, 1, 0, 0)");
    await page.hover(selector);
    await expect(page.locator(selector)).toHaveCSS("background-color", fill);
    await expect(page.locator(selector)).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
    await expect.poll(() => underline(selector)).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await page.mouse.move(5, 5);
  }

  const demoShort = page.locator("[data-demo-do-now-short]");
  await demoShort.scrollIntoViewIfNeeded();
  await demoShort.hover();
  await expect(demoShort).toHaveCSS("background-color", "rgb(48, 66, 53)");
});

test("the normal start button carries the play mark and the same type as the short one", async ({
  page,
}) => {
  await open(page);
  const normal = page.locator(".lp-hero-start-normal");
  await expect(normal.locator("svg")).toHaveCount(1);
  await expect(normal).toHaveCSS("font-size", "17px");
  await expect(normal).toHaveCSS("font-weight", "800");
  expect((await box(page, ".lp-hero-start-normal")).width).toBeGreaterThanOrEqual(150);
});
