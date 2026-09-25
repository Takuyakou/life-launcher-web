import { expect, test } from "@playwright/test";

test("captures Do Now Project color A and B states", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const card = page.locator(".do-now-card");
  await expect(card).toHaveAttribute("data-project-color", "violet");
  await card.screenshot({ path: testInfo.outputPath("do-now-violet.png") });
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(card).toHaveAttribute("data-project-color", "amber");
  await card.screenshot({ path: testInfo.outputPath("do-now-amber.png") });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
});
