import { expect, test } from "@playwright/test";

const openPicker = async (page: import("@playwright/test").Page) => {
  const opener = page.getByRole("button", { name: "今日やるものを選ぶ" });
  await opener.click();
  return {
    opener,
    picker: page.getByRole("dialog", { name: "今日やるものを選ぶ" }),
  };
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("supports stable 0/3 through 3/3 add and remove flow", async ({ page }) => {
  const { picker } = await openPicker(page);
  const destination = picker.locator(".today-picker-destination-heading");
  const initialHeight = await picker.evaluate((node) => node.getBoundingClientRect().height);
  await expect(destination).toContainText("2 / 3");

  for (const label of ["ストレッチをする", "本を読む"]) {
    await picker
      .locator(".today-picker-slot", { hasText: label })
      .getByRole("button", { name: "今日から外す" })
      .click();
  }
  await expect(destination).toContainText("0 / 3");
  expect(
    Math.abs(
      (await picker.evaluate((node) => node.getBoundingClientRect().height)) -
        initialHeight,
    ),
  ).toBeLessThanOrEqual(1);

  for (const label of ["参考書を10ページ進める", "数分だけ読む"]) {
    await picker
      .getByRole("button", { name: `${label}を今日の3件に追加` })
      .click();
  }
  await expect(destination).toContainText("2 / 3");
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
  await picker
    .getByRole("button", { name: "近所をゆっくり歩くを今日の3件に追加" })
    .click();

  await expect(picker).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "今日やるものを選ぶ" }),
  ).toHaveCount(0);
});

test("does not close on backdrop and restores focus after Escape or Cancel", async ({
  page,
}) => {
  const { opener, picker } = await openPicker(page);
  await page
    .locator(".today-picker-backdrop")
    .click({ position: { x: 2, y: 2 } });
  await expect(picker).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "キャンセル" })
    .click();
  await expect(opener).toBeFocused();
});

test("same text from different sources stays distinct and survives reload", async ({
  page,
}) => {
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "今日の3件から外す" })
    .click();
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
  await expect(
    picker.getByRole("button", { name: "同じ一手を今日の3件に追加" }),
  ).toHaveCount(2);
  await picker
    .getByRole("button", { name: "同じ一手を今日の3件に追加" })
    .first()
    .click();
  await expect(
    picker.getByRole("button", { name: "同じ一手を今日の3件に追加" }),
  ).toHaveCount(1);
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
  await expect(
    picker.getByRole("button", { name: "同じ一手を今日の3件に追加" }),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.reload();
  ({ picker } = await openPicker(page));
  await expect(
    picker.locator(".today-picker-slot", { hasText: "同じ一手" }),
  ).toHaveCount(1);
  await expect(
    picker.getByRole("button", { name: "同じ一手を今日の3件に追加" }),
  ).toHaveCount(1);
});

test("long text remains usable without horizontal overflow at narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "やりたいことを追加", exact: true })
    .click();
  const longText = "次に進むための小さな準備を一つだけ整理する".repeat(4);
  const addDialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  await addDialog.getByRole("textbox").fill(longText);
  await addDialog.getByRole("button", { name: "追加", exact: true }).click();

  const { picker } = await openPicker(page);
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
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
