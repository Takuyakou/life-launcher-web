import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results", "visual");

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

for (const [width, columns] of [
  [1440, 3],
  [1000, 2],
  [390, 1],
]) {
  test(`Today removal layout, long text and focus at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
    await page.locator(".dl-today-add").click();
    await picker
      .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
      .click();
    await picker.getByRole("button", { name: "決定" }).click();

    const list = page.locator(".dl-today-grid");
    expect(
      await list.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length,
      ),
    ).toBe(columns);

    const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
    await card.locator(".dl-today-text").evaluate((node) => {
      node.textContent = "後回しにしていたことを整理して次に進むための小さな準備".repeat(
        4,
      );
    });

    // W21 は「今日の3件から外す」を札の操作メニューへ移した。
    const opener = card.getByRole("button", { name: "操作メニュー" });
    await opener.click();
    const remove = page.getByRole("menuitem", { name: "今日の3件から外す" });
    await expect(remove).toBeEnabled();
    await page.keyboard.press("Tab");
    await remove.focus();
    expect(
      await remove.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    // メニューは position: fixed なので、札の上に重ねずに閉じてから撮る。
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await list.screenshot({
      path: path.join(output, `focus-long-text-${width}.png`),
    });

    for (const row of await page.locator(".dl-today-card").all()) {
      const buttons = await row.locator("button").evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            overflow: node.scrollWidth - node.clientWidth,
          };
        }),
      );
      for (const button of buttons)
        expect(button.overflow).toBeLessThanOrEqual(1);
      for (let i = 0; i < buttons.length; i++)
        for (let j = i + 1; j < buttons.length; j++) {
          const a = buttons[i],
            b = buttons[j];
          expect(
            a.right <= b.left ||
              b.right <= a.left ||
              a.bottom <= b.top ||
              b.bottom <= a.top,
          ).toBe(true);
        }
    }

    await card.getByRole("button", { name: "5分", exact: true }).click();
    await expect(card.getByRole("button", { name: "終了" })).toBeVisible();
    await card.getByRole("button", { name: "操作メニュー" }).click();
    await expect(
      page.getByRole("menuitem", { name: "今日の3件から外す" }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await list.screenshot({
      path: path.join(output, `timer-disabled-${width}.png`),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}
