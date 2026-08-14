import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("landing CTAs point to the approved destinations", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Life Launcher" })).toBeVisible();
  const release = page.getByRole("link", { name: /Windows版をダウンロード/ }).first();
  await expect(release).toHaveAttribute(
    "href",
    "https://github.com/Takuyakou/life-launcher/releases/tag/v1.0.0",
  );
  await expect(release).toHaveAttribute("target", "_blank");
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
