import { expect, test, type Locator } from "@playwright/test";

const openRowMenu = async (trigger: Locator) => {
  // The menu is position: fixed and opens under its trigger, so centre the
  // trigger first: one sitting on the bottom edge pushes the menu out of view.
  await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await trigger.click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// W21-05: 「やりたいこと」と「今日の実行」は、最初は閉じている。中を確かめる前に開く。
const openSection = async (
  page: import("@playwright/test").Page,
  name: "wishlist" | "activity",
) => {
  const toggle = page.locator(`.dl-${name} .dl-section-disclosure`);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
};

test("remove persists without confirmation or loss of sources and sessions", async ({
  page,
}) => {
  const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await openRowMenu(card.locator(".dl-row-menu"));
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("今日の3件から外しました", { exact: true }),
  ).toBeVisible();
  // The removal neither confirms nor drops the recorded sessions.
  await openSection(page, "activity");
  await expect(page.locator(".dl-activity-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByText("数分だけ読む", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("article.dl-today-card")).toHaveCount(1);
  await page.reload();
  await expect(card).toHaveCount(0);
  await expect(page.locator("article.dl-today-card")).toHaveCount(1);
});

test("active and paused target is disabled, another card remains removable", async ({
  page,
}) => {
  const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
  const stretch = page.getByRole("article", {
    name: "ストレッチをする",
    exact: true,
  });
  const removeItem = page.locator(".dl-menu-item", {
    hasText: "今日の3件から外す",
  });
  await card.getByRole("button", { name: "5分", exact: true }).click();
  await openRowMenu(card.locator(".dl-row-menu"));
  await expect(removeItem).toBeDisabled();
  // Force the click: the disabled item must be refused, not just painted grey.
  await removeItem.evaluate((button) => button.click());
  await expect(card).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".dl-menu")).toHaveCount(0);
  await card
    .locator(".dl-today-timer")
    .getByRole("button", { name: "一時停止" })
    .click();
  await openRowMenu(card.locator(".dl-row-menu"));
  await expect(removeItem).toBeDisabled();
  await page.keyboard.press("Escape");
  await openRowMenu(stretch.locator(".dl-row-menu"));
  await removeItem.click();
  await expect(stretch).toHaveCount(0);
  await expect(card).toHaveCount(1);
  await card
    .locator(".dl-today-timer")
    .getByRole("button", { name: "終了", exact: true })
    .click();
  await openRowMenu(card.locator(".dl-row-menu"));
  await expect(removeItem).toBeEnabled();
  await removeItem.focus();
  await page.keyboard.press("Enter");
  await expect(card).toHaveCount(0);
});

test("failed storage retains Today3 unchanged and does not report success", async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage unavailable");
    };
  });
  const card = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await openRowMenu(card.locator(".dl-row-menu"));
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
  await expect(page.locator("article.dl-today-card")).toHaveCount(2);
  await expect(
    page.getByText("保存できませんでした。変更前の状態を保持しています。"),
  ).toBeVisible();
  await expect(
    page.getByText("今日の3件から外しました", { exact: true }),
  ).toHaveCount(0);
});
