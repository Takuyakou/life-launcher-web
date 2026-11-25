import { expect, test, type Locator, type Page } from "@playwright/test";

const RED = "rgb(59, 33, 29)";
const GREEN = "rgb(24, 51, 38)";
const NEUTRAL = "rgb(33, 31, 26)";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
};

const timerPanel = (page: Page) => page.getByRole("region", { name: "デモタイマー" });

// 左に決定・右にキャンセル。横いっぱいを等分する(Windows 版と同じ)。
const expectEvenRow = async (actions: Locator, labels: string[]) => {
  const buttons = actions.getByRole("button");
  await expect(buttons).toHaveCount(labels.length);
  const boxes = await buttons.evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, top: r.top, text: node.textContent };
    }),
  );
  const row = await actions.evaluate((node) => node.getBoundingClientRect());
  boxes.forEach((box, index) => {
    expect(box.text).toContain(labels[index]);
    expect(Math.abs(box.top - boxes[0].top)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - boxes[0].width)).toBeLessThanOrEqual(1);
  });
  expect(Math.abs(boxes[0].left - row.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[boxes.length - 1].right - row.right)).toBeLessThanOrEqual(1);
};

test("the discard check: discard is red on the left, keep editing is grey on the right", async ({
  page,
}) => {
  await open(page);
  await page.locator("#screen").getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker.locator(".today-picker-add").first().click();
  await picker.getByRole("button", { name: "キャンセル", exact: true }).click();
  const check = page.getByRole("dialog", { name: "選んだ内容を破棄しますか？" });
  const actions = check.locator(".dialog-actions");
  await expectEvenRow(actions, ["破棄する", "編集を続ける"]);
  await expect(check.getByRole("button", { name: "破棄する" })).toHaveCSS("background-color", RED);
  await expect(check.getByRole("button", { name: "編集を続ける" })).toHaveCSS(
    "background-color",
    NEUTRAL,
  );
});

test("the reset check uses the same shape and colours", async ({ page }) => {
  await open(page);
  await page
    .locator("#screen")
    .getByRole("button", { name: "リセット", exact: true })
    .click();
  const check = page.getByRole("dialog", { name: "Web Demoをリセットしますか？" });
  const buttons = check.locator(".dialog-actions").getByRole("button");
  await expectEvenRow(check.locator(".dialog-actions"), ["リセットする", "キャンセル"]);
  await expect(buttons.nth(0)).toHaveCSS("background-color", RED);
  await expect(buttons.nth(1)).toHaveCSS("background-color", NEUTRAL);
});

test("edit dialogs: save green on the left, cancel red on the right, half each", async ({
  page,
}) => {
  await open(page);
  await page.locator("#screen .dl-next-row", { hasText: "運動" }).locator(".dl-row-menu").click();
  await page.getByRole("menuitem", { name: "次の一手を編集" }).click();
  const dialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await expectEvenRow(dialog.locator(".dialog-actions"), ["保存", "キャンセル"]);
  await expect(dialog.getByRole("button", { name: "保存" })).toHaveCSS("background-color", GREEN);
  await expect(dialog.getByRole("button", { name: "キャンセル" })).toHaveCSS(
    "background-color",
    RED,
  );
});

test("the completion dialog: continue is grey, save is green on the left, finish is red", async ({
  page,
}) => {
  await open(page);
  const today = page
    .locator("#screen")
    .getByRole("article", { name: "数分だけ読む", exact: true });
  await today.getByRole("button", { name: "5分", exact: true }).click();
  await expect(timerPanel(page)).toContainText("実行中");
  await page.mouse.move(5, 5);

  await timerPanel(page).getByRole("button", { name: /満了まで進める/ }).click();
  const done = page.getByRole("dialog", { name: "予定時間になりました" });
  const actions = done.locator(".dialog-actions");
  await expectEvenRow(actions, ["続ける", "保存して終わる", "終わる"]);
  // 「保存して終わる」と緑が並ばないように、続けるは灰色(オーナーの判断)。
  await expect(done.getByRole("button", { name: /続ける/ })).toHaveCSS("background-color", NEUTRAL);
  await expect(done.getByRole("button", { name: "保存して終わる" })).toHaveCSS(
    "background-color",
    GREEN,
  );
  await expect(done.getByRole("button", { name: "終わる", exact: true })).toHaveCSS(
    "background-color",
    RED,
  );
});

test("the quick add in the picker is green like the Windows app", async ({ page }) => {
  await open(page);
  await page.locator("#screen").getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(picker.locator(".today-picker-quick-add-button")).toHaveCSS(
    "background-color",
    GREEN,
  );
});

test("the Windows card's title and button use weight 700 so Latin and Japanese match", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".lp-get h3")).toHaveCSS("font-weight", "700");
  await expect(page.locator(".lp-getbtn")).toHaveCSS("font-weight", "700");
});
