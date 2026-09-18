import { expect, test } from "@playwright/test";

test("captures hover, focus, pressed, disabled and Danger states", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();

  const gold = page.getByRole("button", { name: "今日やるものを選ぶ" });
  await gold.hover();
  await page.locator(".today-section").screenshot({
    path: testInfo.outputPath("gold-hover.png"),
  });
  await gold.focus();
  await page.locator(".today-section").screenshot({
    path: testInfo.outputPath("gold-focus.png"),
  });
  const box = await gold.boundingBox();
  if (!box) throw new Error("Gold button has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.locator(".today-section").screenshot({
    path: testInfo.outputPath("gold-pressed.png"),
  });
  await page.mouse.move(box.x - 20, box.y - 20);
  await page.mouse.up();

  const reading = page.getByRole("article", {
    name: "本を読む",
    exact: true,
  });
  await reading.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await reading.getByRole("button", { name: "本を読むを終了" }).hover();
  await page.locator(".today-section").screenshot({
    path: testInfo.outputPath("danger-hover-disabled-neutral.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
});
