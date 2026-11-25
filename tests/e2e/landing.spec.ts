import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("landing CTAs point to the approved destinations", async ({ page }) => {
  await expect(page.locator(".lp-h1")).toHaveText(
    "今日やることを3件に絞り、1件を選んで、すぐ始めるためのアプリです。",
  );
  const releases = page.locator('a[href*="github.com/Takuyakou/life-launcher/releases"]');
  await expect(releases).toHaveCount(4);
  for (const release of await releases.all()) {
    await expect(release).toHaveAttribute(
      "href",
      "https://github.com/Takuyakou/life-launcher/releases/latest",
    );
  }
  await expect(page.locator(".lp-footer-links a").first()).toHaveAttribute(
    "href",
    "https://github.com/Takuyakou/life-launcher",
  );
});

test("browser demo CTA scrolls without focusing its outer section", async ({ page }) => {
  await page.getByRole("link", { name: "ブラウザで試す" }).first().click();
  await expect(page.locator("#screen")).toBeInViewport();
  await expect(page.locator("#screen")).not.toBeFocused();
  await expect(page.getByText("WEB DEMO", { exact: true }).first()).toBeVisible();
});

test("large demo sections do not become browser focus targets", async ({ page }) => {
  const demo = page.locator("#screen");
  await page.getByRole("heading", { name: "開始までの流れを試す。" }).click();
  await expect(demo).not.toBeFocused();

  const today = page.locator(".dl-today");
  await today.getByRole("heading", { name: "今日の3件" }).click();
  await expect(today).not.toBeFocused();
  await page.mouse.wheel(0, 600);
  await expect(today).not.toBeFocused();
});
