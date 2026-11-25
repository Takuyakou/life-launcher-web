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

test("header nav links go to the page sections and the Windows release", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".lp-header")).toBeVisible();
  const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
  for (const [name, href] of [
    ["使い方", "#flow"],
    ["デモ", "#screen"],
    ["試せる機能", "#diff"],
  ] as const) {
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
      "href",
      href,
    );
  }
  await expect(nav.getByRole("link", { name: "Windows版", exact: true })).toHaveAttribute(
    "href",
    RELEASES,
  );
  await expect(nav.getByRole("link")).toHaveCount(4);
});

test("GitHub and the Windows release stay one click away in the footer", async ({
  page,
}) => {
  await open(page);
  const footer = page.locator(".lp-footer");
  await expect(footer.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute(
    "href",
    REPO,
  );
  await expect(footer.getByRole("link", { name: "Windows版", exact: true })).toHaveAttribute(
    "href",
    RELEASES,
  );

  // W21: GitHub moved out of the header, and the hero only carries its two CTAs.
  await expect(
    page.locator(".lp-header").getByRole("link", { name: "GitHub" }),
  ).toHaveCount(0);
  await expect(page.locator(".lp-hero").getByRole("link", { name: /GitHub/ })).toHaveCount(0);
  await expect(page.locator(".lp-hero").getByRole("link")).toHaveCount(2);
});

test("the last section keeps the faint 05:00 inside it", async ({ page }) => {
  // 最後の段のリンクと札は W18(tests/e2e/w18-final-tech.spec.ts)で確かめる。
  for (const width of [1440, 390]) {
    await open(page, width, 844);
    const ghost = page.locator(".lp-ghost");
    await expect(ghost).toHaveAttribute("aria-hidden", "true");
    await expect(ghost).toHaveText("05:00");
    const inside = await page.evaluate(() => {
      const section = document.querySelector(".lp-final")!.getBoundingClientRect();
      const mark = document.querySelector(".lp-ghost")!.getBoundingClientRect();
      return (
        mark.top >= section.top &&
        mark.bottom <= section.bottom &&
        mark.left >= section.left &&
        mark.right <= section.right + 8
      );
    });
    expect(inside, `05:00 inside the section at ${width}`).toBe(true);
  }
});
