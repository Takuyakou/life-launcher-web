import { expect, test, type Page } from "@playwright/test";

const sections = [
  ".today-section",
  ".next-section",
  ".wishlist-section",
  ".activity-section",
];
const bar = (section: string) =>
  `${section} :is(.sync-heading, .sync-disclosure-header, .section-toggle)`;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.locator(".wishlist-section .section-toggle").click();
});

const headingMetrics = (page: Page) =>
  page.evaluate((list) => {
    return list.map((section) => {
      const root = document.querySelector(section)!;
      const name = root.querySelector<HTMLElement>(".heading-name > span")!;
      const range = document.createRange();
      range.selectNodeContents(name);
      const text = range.getBoundingClientRect();
      const count = root
        .querySelector<HTMLElement>(".section-count")!
        .getBoundingClientRect();
      const desc = getComputedStyle(root.querySelector("small")!);
      const title = getComputedStyle(root.querySelector(".heading-name")!);
      return {
        textRight: text.right,
        countLeft: count.left,
        desc: [desc.fontSize, desc.color, desc.fontWeight].join("|"),
        title: [title.fontSize, title.fontWeight].join("|"),
      };
    });
  }, sections);

for (const width of [1440, 390]) {
  test(`four headings align counts, keep names clear of counts and share type at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(async () => {
        const m = await headingMetrics(page);
        const lefts = m.map((entry) => entry.countLeft);
        return Math.max(...lefts) - Math.min(...lefts);
      })
      .toBeLessThanOrEqual(1);
    const metrics = await headingMetrics(page);
    const wishlist = metrics[2];
    expect(
      Math.abs(wishlist.countLeft - wishlist.textRight - 18),
    ).toBeLessThanOrEqual(1);
    for (const entry of metrics)
      expect(entry.textRight).toBeLessThanOrEqual(entry.countLeft + 0.5);
    expect(new Set(metrics.map((entry) => entry.desc)).size).toBe(1);
    expect(new Set(metrics.map((entry) => entry.title)).size).toBe(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}

test("section bars are bordered, other separators are transparent", async ({
  page,
}) => {
  for (const section of sections)
    await expect(page.locator(bar(section)).first()).toHaveCSS(
      "border-top-width",
      "1px",
    );
  for (const section of sections)
    await expect(page.locator(section).first()).toHaveCSS(
      "border-bottom-color",
      "rgba(0, 0, 0, 0)",
    );
  const remove = page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "今日の3件から外す" });
  await expect(remove).toHaveCSS("border-top-width", "1px");
  await expect(remove).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".today-slot")).toHaveCSS(
    "border-top-style",
    "dashed",
  );
});

test("section bar hover brightens only expandable bars", async ({ page }) => {
  const toggle = page.locator(".next-section .section-toggle");
  await toggle.hover();
  await expect(toggle).toHaveCSS("background-color", "rgb(26, 25, 21)");
  const heading = page.locator(".today-section .sync-heading");
  await heading.hover();
  await expect(heading).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("button colours follow roles: add is neutral, picker entrance and picker add are gold, save green, cancel red", async ({
  page,
}) => {
  const transparent = "rgba(0, 0, 0, 0)";
  const gold = "rgb(239, 200, 74)";
  await expect(page.locator(".next-section .source-add").first()).toHaveCSS(
    "background-color",
    transparent,
  );
  await expect(page.locator(".wishlist-row .source-add").first()).toHaveCSS(
    "background-color",
    transparent,
  );
  await expect(
    page.getByRole("button", { name: "やりたいことを追加", exact: true }),
  ).toHaveCSS("background-color", transparent);
  await expect(page.locator(".today-picker-trigger")).toHaveCSS(
    "background-color",
    gold,
  );

  await page.locator(".today-picker-trigger").click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(picker.locator(".today-picker-add").first()).toHaveCSS(
    "background-color",
    gold,
  );
  await expect(picker.getByRole("button", { name: "キャンセル" })).toHaveCSS(
    "background-color",
    "rgb(59, 33, 29)",
  );
  await page.keyboard.press("Escape");

  await page
    .locator(".next-section .source-row", { hasText: "運動" })
    .getByRole("button", { name: "編集" })
    .click();
  const dialog = page.getByRole("dialog", { name: "次の一手を編集" });
  const save = dialog.getByRole("button", { name: "保存" });
  const cancel = dialog.getByRole("button", { name: "キャンセル" });
  await expect(save).toHaveCSS("background-color", "rgb(24, 51, 38)");
  await expect(cancel).toHaveCSS("background-color", "rgb(59, 33, 29)");
  await expect(save).toHaveCSS("font-size", "12px");
  await expect(cancel).toHaveCSS("font-size", "12px");
});

test("keyboard focus on a heading shows exactly one ring", async ({ page }) => {
  const rings = (selector: string) =>
    page.locator(selector).evaluate(
      (root) =>
        [root, ...Array.from(root.querySelectorAll("*"))].filter((node) => {
          const style = getComputedStyle(node);
          return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
        }).length,
    );
  const header = page.locator(".wishlist-section .sync-disclosure-header");
  await page.locator(".wishlist-section .section-toggle").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator(".wishlist-section .section-toggle")).toBeFocused();
  await expect.poll(() => rings(".wishlist-section")).toBe(1);
  await expect(header).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "やりたいことを追加", exact: true }),
  ).toBeFocused();
  await expect.poll(() => rings(".wishlist-section")).toBe(1);
  await expect(header).toHaveCSS("outline-style", "none");

  await page.locator(".next-section .section-toggle").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect.poll(() => rings(".next-section")).toBe(1);
});

test("completion dialog: save and finish is green, finish is red (also when it is the only button)", async ({
  page,
}) => {
  const green = "rgb(24, 51, 38)";
  const red = "rgb(59, 33, 29)";
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
  await picker
    .getByRole("button", { name: "気になっていた本を読むを今日の3件に追加" })
    .click();
  await page
    .getByRole("button", { name: "気になっていた本を読むを5分で開始" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const only = page.getByRole("dialog", { name: "おつかれさまでした" });
  await expect(only.getByRole("button", { name: "保存して終わる" })).toHaveCount(0);
  await expect(only.getByRole("button", { name: "終わる", exact: true })).toHaveCSS(
    "background-color",
    red,
  );
  await only.getByRole("button", { name: "終わる", exact: true }).click();

  await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "おつかれさまでした" });
  await expect(
    dialog.getByRole("button", { name: "保存して終わる" }),
  ).toHaveCSS("background-color", green);
  await expect(
    dialog.getByRole("button", { name: "終わる", exact: true }),
  ).toHaveCSS("background-color", red);
});
