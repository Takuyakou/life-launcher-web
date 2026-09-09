import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("landing CTAs point to the approved destinations", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Life Launcher" })).toBeVisible();
  const releases = page.locator('a[href*="github.com/Takuyakou/life-launcher/releases"]');
  await expect(releases).toHaveCount(3);
  for (const release of await releases.all()) {
    await expect(release).toHaveAttribute(
      "href",
      "https://github.com/Takuyakou/life-launcher/releases/latest",
    );
    await expect(release).toHaveAttribute("target", "_blank");
    await expect(release).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(page.getByRole("link", { name: /GitHub/ }).first()).toHaveAttribute(
    "href",
    "https://github.com/Takuyakou/life-launcher",
  );
});

test("browser demo CTA scrolls and focuses the demo", async ({ page }) => {
  await page.getByRole("link", { name: "ブラウザで試す" }).first().click();
  await expect(page.locator("#demo")).toBeFocused();
  await expect(page.getByText("WEB DEMO", { exact: true }).first()).toBeVisible();
});

test("Hero mini start moves to and focuses the matching short timer action", async ({ page }) => {
  await page.locator(".hero-mini-preview .hero-preview-action").click();
  await expect(page.locator("[data-demo-do-now-short]")).toBeFocused();
  await expect(page.locator("#demo")).toBeInViewport();
});
