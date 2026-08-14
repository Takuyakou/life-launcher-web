import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("dictionary supports focus, search, native-only toast, Escape and focus return", async ({ page }) => {
  const opener = page.getByRole("button", { name: /辞書を開く/ });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "辞書" });
  await expect(dialog).toBeVisible();
  const search = dialog.getByRole("searchbox", { name: "辞書を検索" });
  await expect(search).toBeFocused();
  await search.fill("運動");
  const stretchTile = dialog.getByRole("button", { name: "ストレッチ 運動" });
  await expect(stretchTile).toBeVisible();
  await expect(dialog.getByRole("button", { name: /読書メモ/ })).toHaveCount(0);
  await stretchTile.click();
  await expect(page.getByText(/ストレッチはWindows版で実行できます/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("dictionary can be opened and closed with keyboard only", async ({ page }) => {
  await page.locator("#demo").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /辞書$/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("searchbox", { name: "辞書を検索" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /辞書$/ })).toBeFocused();
});

test("reduced motion preference disables visible transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const duration = await page.locator(".chevron").first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).transitionDuration),
  );
  expect(duration).toBeLessThan(0.1);
});
