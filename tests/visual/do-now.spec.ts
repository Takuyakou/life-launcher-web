import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test("captures Do Now Project color A and B states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const card = page.locator(".dl-donow-card");
  // W21 は `data-project-color` をやめ、札の `--project-color` で色を持つ。
  // 塗っている要素の計算済みの色を読んで、A/B の 2 色を確かめる。
  const dot = page.locator(".dl-donow-card .dl-status-dot");
  const title = page.locator(".dl-donow-title");

  await expect(card).toBeVisible();
  await expect(title).toHaveText("数分だけ読む");
  await expect(dot).toHaveCSS("background-color", "rgb(231, 185, 77)");
  await card.screenshot({ path: path.join(output, "do-now-amber.png") });

  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(title).toHaveText("参考書を10ページ進める");
  await expect(dot).toHaveCSS("background-color", "rgb(173, 145, 238)");
  await card.screenshot({ path: path.join(output, "do-now-violet.png") });

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
});
