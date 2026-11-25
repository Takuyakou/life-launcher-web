import { expect, test, type Page } from "@playwright/test";

// W21: 見出しは .dl-section-bar / .dl-section-disclosure / .dl-section-count に変わった。
const bars = [
  ".dl-today > .dl-section-bar",
  ".dl-next > .dl-section-bar",
  ".dl-wishlist > .dl-section-bar",
  ".dl-activity > .dl-section-bar",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
  // W21-05: やりたいことと今日の実行は、最初は閉じている。
  await page.evaluate(() => document.fonts.ready);
});

const headingMetrics = (page: Page) =>
  page.evaluate((list) => {
    return list.map((selector) => {
      const root = document.querySelector(selector)!;
      const name = root.querySelector<HTMLElement>("h2")!;
      // 今日の3件は、件数の代わりに「1 / 2 完了」を見せる(件数は読み上げ用に残る)。
      const count =
        root.querySelector<HTMLElement>(".dl-section-count:not([data-quiet])") ??
        root.querySelector<HTMLElement>(".dl-section-summary")!;
      const desc = root.querySelector<HTMLElement>(".dl-section-description")!;
      const title = getComputedStyle(name);
      const description = getComputedStyle(desc);
      const nameBox = name.getBoundingClientRect();
      const countBox = count.getBoundingClientRect();
      return {
        nameLeft: nameBox.left,
        nameRight: nameBox.right,
        countLeft: countBox.left,
        count: count.textContent,
        desc: [description.fontSize, description.color, description.fontWeight].join("|"),
        descDisplay: description.display,
        title: [title.fontSize, title.fontWeight].join("|"),
      };
    });
  }, bars);

for (const width of [1440, 390]) {
  test(`four headings align their names, keep names clear of counts and share type at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(async () => {
        const m = await headingMetrics(page);
        const lefts = m.map((entry) => entry.nameLeft);
        return Math.max(...lefts) - Math.min(...lefts);
      })
      .toBeLessThanOrEqual(1);
    const metrics = await headingMetrics(page);
    for (const entry of metrics) {
      // 全部のバーで、名前の右端から数までが同じ 14px。
      expect(
        Math.abs(entry.countLeft - entry.nameRight - 14),
      ).toBeLessThanOrEqual(1);
      expect(entry.nameRight).toBeLessThanOrEqual(entry.countLeft);
    }
    expect(new Set(metrics.map((entry) => entry.title)).size).toBe(1);
    if (width === 1440) {
      expect(new Set(metrics.map((entry) => entry.desc)).size).toBe(1);
    } else {
      // 760px 以下では説明文を畳む。
      expect(metrics.every((entry) => entry.descDisplay === "none")).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}

test("section bars stay chrome-free while the today cards carry the separators", async ({
  page,
}) => {
  for (const bar of bars)
    await expect(page.locator(bar).first()).toHaveCSS("border-top-width", "0px");

  const reading = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await expect(reading).toHaveCSS("border-top-width", "2px");
  await expect(reading).toHaveCSS("border-top-style", "solid");
  // 上辺はプロジェクト色(読書 = amber)。
  await expect(reading).toHaveCSS("border-top-color", "rgb(231, 185, 77)");

  const remove = reading.getByRole("button", { name: "操作メニュー" });
  await expect(remove).toHaveCSS("border-top-width", "1px");
  await expect(remove).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".dl-today-add")).toHaveCSS(
    "border-top-style",
    "dashed",
  );
});

test("section bar hover brightens only the expandable bar", async ({ page }) => {
  const header = page.locator(".dl-today > .dl-section-bar");
  await header.hover();
  await expect(header).toHaveCSS("background-color", "rgb(43, 41, 34)");
  const plain = page.locator(".dl-next > .dl-section-bar");
  await plain.hover();
  await expect(plain).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("button colours follow roles: add is neutral, picker entrance and picker add are soft gold, save green, cancel red", async ({
  page,
}) => {
  // W21: 金は Windows 版と同じ薄い地(塗りつぶしではない)。
  const neutral = "rgb(33, 31, 26)";
  const gold = "rgba(231, 185, 77, 0.1)";
  await expect(
    page
      .locator(".dl-next-row", { hasText: "学習" })
      .getByRole("button", { name: "＋ 今日へ" }),
  ).toHaveCSS("background-color", neutral);
  await expect(
    page.getByRole("button", { name: "＋ やりたいこと" }),
  ).toHaveCSS("background-color", neutral);
  await expect(page.locator(".dl-today-add-visual")).toHaveCSS(
    "background-color",
    gold,
  );

  await page.locator(".dl-today-add").click();
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

  await page.locator(".dl-next-row", { hasText: "運動" }).locator(".dl-row-menu").click();
  await page.getByRole("menuitem", { name: "次の一手を編集" }).click();
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
  const header = page.locator(".dl-wishlist .dl-section-disclosure");
  await header.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(header).toBeFocused();
  await expect.poll(() => rings(".dl-wishlist")).toBe(1);
  await expect(header).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "＋ やりたいこと", exact: true }),
  ).toBeFocused();
  await expect.poll(() => rings(".dl-wishlist")).toBe(1);
  await expect(header).toHaveCSS("outline-style", "none");

  await page.locator(".dl-next .dl-section-disclosure").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect.poll(() => rings(".dl-next")).toBe(1);
});

test("completion dialog: save and finish is green, finish is red (also when it is the only button)", async ({
  page,
}) => {
  const green = "rgb(24, 51, 38)";
  const red = "rgb(59, 33, 29)";
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "気になっていた本を読むを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await page
    .getByRole("article", { name: "気になっていた本を読む", exact: true })
    .getByRole("button", { name: "5分", exact: true })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const only = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(only.getByRole("button", { name: "保存して終わる" })).toHaveCount(0);
  await expect(only.getByRole("button", { name: "続ける(+15分)" })).toBeVisible();
  await expect(only.getByRole("button", { name: "終わる", exact: true })).toHaveCSS(
    "background-color",
    red,
  );
  await only.getByRole("button", { name: "終わる", exact: true }).click();

  await page
    .getByRole("article", { name: "数分だけ読む", exact: true })
    .getByRole("button", { name: "5分", exact: true })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await expect(
    dialog.getByRole("button", { name: "保存して終わる" }),
  ).toHaveCSS("background-color", green);
  await expect(
    dialog.getByRole("button", { name: "終わる", exact: true }),
  ).toHaveCSS("background-color", red);
});
