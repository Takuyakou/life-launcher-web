import { expect, test } from "@playwright/test";

const openPicker = async (page: import("@playwright/test").Page) => {
  const opener = page.getByRole("button", { name: "今日やるものを選ぶ" });
  await opener.click();
  return {
    opener,
    picker: page.getByRole("dialog", { name: "今日やるものを選ぶ" }),
  };
};

const todayCards = (page: import("@playwright/test").Page) =>
  page.locator(".dl-today-grid article.dl-today-card");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

test("supports 0/3 through 3/3 in a draft that only 決定 saves", async ({
  page,
}) => {
  const { picker } = await openPicker(page);
  const progress = picker.getByRole("progressbar");
  await expect(progress).toHaveAttribute("aria-valuenow", "2");

  for (const label of ["ストレッチをする", "数分だけ読む"]) {
    await picker.getByRole("button", { name: `${label}を今日から外す` }).click();
  }
  await expect(progress).toHaveAttribute("aria-valuenow", "0");

  for (const label of ["参考書を10ページ進める", "数分だけ読む"]) {
    await picker
      .getByRole("button", { name: `${label}を今日の3件に追加` })
      .click();
  }
  await expect(progress).toHaveAttribute("aria-valuenow", "2");

  await picker
    .getByRole("button", { name: "気になっていた本を読むを今日の3件に追加" })
    .click();
  await expect(progress).toHaveAttribute("aria-valuenow", "3");
  await expect(picker).toBeVisible();

  await picker.getByRole("button", { name: "決定" }).click();
  await expect(picker).toHaveCount(0);
  await expect(todayCards(page)).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "今日やるものを選ぶ" }),
  ).toHaveCount(0);
});

test("does not close on backdrop and closes on Escape or Cancel", async ({
  page,
}) => {
  const { picker } = await openPicker(page);
  await expect(
    picker.getByRole("button", { name: "今日やるものを選ぶを閉じる" }),
  ).toBeFocused();
  await page
    .locator(".today-picker-backdrop")
    .click({ position: { x: 2, y: 2 } });
  await expect(picker).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).toHaveCount(0);

  await openPicker(page);
  await picker.getByRole("button", { name: "キャンセル" }).click();
  await expect(picker).toHaveCount(0);
});

test("same text from different sources stays distinct and survives reload", async ({
  page,
}) => {
  const reading = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await reading.getByRole("button", { name: "操作メニュー" }).click();
  await page.getByRole("menuitem", { name: "今日の3件から外す" }).click();
  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    state.todayItems = [];
    state.projects[0].nextStep = "同じ一手";
    state.projects[1].nextStep = "同じ一手";
    state.wishlist.unshift({
      id: "wish-same",
      label: "同じ一手",
      projectId: state.projects[0].id,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  let { picker } = await openPicker(page);
  const adds = picker.getByRole("button", { name: "同じ一手を今日の3件に追加" });
  await expect(adds).toHaveCount(3);
  await adds.first().click();
  await expect(adds).toHaveCount(2);
  await adds.first().click();
  await expect(adds).toHaveCount(1);
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(todayCards(page)).toHaveCount(2);
  await page.reload();
  ({ picker } = await openPicker(page));
  await expect(
    picker.locator(".today-picker-slot", { hasText: "同じ一手" }),
  ).toHaveCount(2);
  await expect(
    picker.getByRole("button", { name: "同じ一手を今日の3件に追加" }),
  ).toHaveCount(1);
});

test("long text remains usable without horizontal overflow at narrow width", async ({
  page,
}) => {
  const longText = "次に進むための小さな準備を一つだけ整理する".repeat(4);
  await page.getByRole("button", { name: "＋ やりたいこと" }).click();
  const addDialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  await addDialog.getByRole("textbox").fill(longText);
  await addDialog.getByRole("button", { name: "追加", exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  const { picker } = await openPicker(page);
  await expect(picker.getByText(longText, { exact: true })).toBeVisible();
  const layout = await page.evaluate(() => ({
    pageOverflow: document.documentElement.scrollWidth - innerWidth,
    pickerOverflow:
      document.querySelector(".today-picker")!.scrollWidth -
      document.querySelector(".today-picker")!.clientWidth,
    pickerHeight: document.querySelector(".today-picker")!.getBoundingClientRect()
      .height,
  }));
  expect(layout.pageOverflow).toBe(0);
  expect(layout.pickerOverflow).toBe(0);
  expect(layout.pickerHeight).toBeLessThanOrEqual(828);
});
