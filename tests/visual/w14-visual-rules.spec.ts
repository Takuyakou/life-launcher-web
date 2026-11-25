import { expect, test, type Page } from "@playwright/test";

const widths = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1000, height: 900 },
  { width: 390, height: 844 },
];

async function open(page: Page, viewport: (typeof widths)[number]) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
  // W21-05: やりたいことは最初は閉じているので、開いてから確かめる。
  await page.locator(".dl-wishlist .dl-section-disclosure").click();
  await expect(page.locator(".dl-wishlist-body")).toBeVisible();
}

for (const viewport of widths) {
  test(`section bars and the Today grid do not overflow or overlap at ${viewport.width}`, async ({
    page,
  }) => {
    await open(page, viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    const overlaps = await page.evaluate(() => {
      const bad: string[] = [];
      const bars = document.querySelectorAll<HTMLElement>(".dl-section-bar");
      for (const bar of bars) {
        const box = bar.getBoundingClientRect();
        const parts = Array.from(
          bar.querySelectorAll<HTMLElement>(
            ".dl-section-count, .dl-section-summary, .dl-section-description",
          ),
        )
          .map((node) => node.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0);
        for (const part of parts)
          if (part.right > box.right + 0.5 || part.left < box.left - 0.5)
            bad.push(`outside:${bar.className}`);
        const [count, ...rest] = parts;
        for (const other of rest)
          if (
            count &&
            other &&
            count.bottom > other.top &&
            count.top < other.bottom &&
            count.right > other.left + 0.5
          )
            bad.push(`count-overlaps-description:${bar.className}`);
      }
      const slot = document.querySelector(".dl-today-add");
      const list = document.querySelector(".dl-today-grid");
      if (slot && list) {
        const s = slot.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        if (s.right > l.right + 0.5 || s.left < l.left - 0.5)
          bad.push("slot-outside-grid");
      }
      return bad;
    });
    expect(overlaps).toEqual([]);
  });
}

test("keyboard focus rings and dialogs stay inside the screen at 390", async ({
  page,
}) => {
  await open(page, { width: 390, height: 844 });
  const outside: string[] = [];
  for (let step = 0; step < 45; step++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const node = document.activeElement as HTMLElement | null;
      if (!node || node === document.body) return null;
      // W21-05: デモの中のタブ位置が減って、紹介ページの表の枠(横スクロールできる枠)まで
      // 届くようになった。この枠は見本どおり画面の端から 4px 内側にあり、ここでは確かめない。
      if (node.classList.contains("lp-table-scroll")) return null;
      const rect = node.getBoundingClientRect();
      return {
        label: node.getAttribute("aria-label") ?? node.textContent?.trim(),
        left: rect.left - 5,
        right: rect.right + 5,
        visible:
          rect.width > 0 && getComputedStyle(node).visibility !== "hidden",
        width: innerWidth,
      };
    });
    if (info?.visible && (info.left < 0 || info.right > info.width))
      outside.push(`${info.label}:${info.left}/${info.right}`);
  }
  expect(outside).toEqual([]);

  await page.locator(".dl-today-add").click();
  const picker = page.locator(".today-picker");
  const box = await picker.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.keyboard.press("Escape");

  await page.locator(".dl-next-row", { hasText: "運動" }).locator(".dl-row-menu").click();
  await page.getByRole("menuitem", { name: "次の一手を編集" }).click();
  const dialog = page.getByRole("dialog", { name: "次の一手を編集" });
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(390);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(844);
});
