import { expect, test } from "@playwright/test";

for (const [width, columns] of [[1440, 3], [1000, 2], [390, 1]]) {
  test(`Today removal layout, long text and focus at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
    await page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByRole("button", {
        name: "参考書を10ページ進めるを今日の3件に追加",
      })
      .click();
    const list = page.locator(".today-list");
    expect(await list.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(columns);
    const card = page.getByRole("article", { name: "本を読む", exact: true });
    await card.locator(".sync-card-title").evaluate(node => { node.textContent = "後回しにしていたことを整理して次に進むための小さな準備".repeat(4); });
    const remove = card.getByRole("button", { name: "今日の3件から外す" });
    await remove.hover();
    await page.keyboard.press("Tab");
    await remove.focus();
    expect(await remove.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
    await list.screenshot({ path: testInfo.outputPath("focus-long-text.png") });
    for (const row of await page.locator(".today-row").all()) {
      const buttons = await row.locator("button").evaluateAll(nodes => nodes.map(node => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, overflow: node.scrollWidth - node.clientWidth };
      }));
      for (const button of buttons) expect(button.overflow).toBeLessThanOrEqual(1);
      for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
        const a = buttons[i], b = buttons[j];
        expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
      }
    }
    await card.getByRole("button", { name: "本を読むを5分で開始" }).click();
    await expect(remove).toBeDisabled();
    await list.screenshot({ path: testInfo.outputPath("timer-disabled.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
}
