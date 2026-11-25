import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test("captures hover, focus, pressed, disabled and Danger states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();

  const today = page.locator(".dl-today");
  const gold = page.locator(".dl-today-add");
  await expect(gold).toBeVisible();
  await gold.hover();
  await today.screenshot({ path: path.join(output, "gold-hover.png") });
  await gold.focus();
  await today.screenshot({ path: path.join(output, "gold-focus.png") });
  const box = await gold.boundingBox();
  if (!box) throw new Error("Gold button has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await today.screenshot({ path: path.join(output, "gold-pressed.png") });
  await page.mouse.move(box.x - 20, box.y - 20);
  await page.mouse.up();

  const reading = page.getByRole("article", {
    name: "本を読む",
    exact: true,
  });
  await reading
    .getByRole("button", { name: "5分", exact: true })
    .click();
  await reading.getByRole("button", { name: "終了", exact: true }).hover();
  await today.screenshot({
    path: path.join(output, "danger-hover-disabled-neutral.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
});
