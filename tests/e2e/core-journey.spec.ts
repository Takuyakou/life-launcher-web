import { expect, test, type Locator } from "@playwright/test";

const openRowMenu = async (trigger: Locator) => {
  // The menu is position: fixed and opens under its trigger, so centre the
  // trigger first: one sitting on the bottom edge pushes the menu out of view.
  await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await trigger.click();
};

test("core journey keeps Project, NextStep and Wishlist sources after Today execution", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();

  const next = page.locator(".dl-next");
  const reading = next.locator(".dl-next-row", { hasText: "読書" });
  await expect(reading.locator(".dl-identity--project")).toHaveText("読書");
  for (const label of ["本を読む", "ストレッチをする"]) {
    const card = page.getByRole("article", { name: label, exact: true });
    await openRowMenu(card.locator(".dl-row-menu"));
    await page
      .locator(".dl-menu-item", { hasText: "今日の3件から外す" })
      .click();
    await expect(card).toHaveCount(0);
  }
  await expect(page.locator("article.dl-today-card")).toHaveCount(0);

  await reading.getByRole("button", { name: "編集", exact: true }).click();
  const nextDialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await nextDialog
    .getByRole("textbox", { name: "次の一手" })
    .fill("章を1ページ読む");
  await nextDialog.getByRole("button", { name: "保存" }).click();

  await page
    .getByRole("button", { name: "＋ やりたいこと", exact: true })
    .click();
  const wishlistDialog = page.getByRole("dialog", {
    name: "やりたいことを追加",
  });
  await wishlistDialog
    .getByRole("textbox", { name: "やりたいこと" })
    .fill("読書メモを整理する");
  await wishlistDialog.getByRole("button", { name: "追加" }).click();

  await page
    .getByRole("button", { name: "今日やるものを選ぶ", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "章を1ページ読むを今日の3件に追加" })
    .click();
  await picker
    .getByRole("button", {
      name: "読書メモを整理するを今日の3件に追加",
    })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(page.locator("article.dl-today-card")).toHaveCount(2);

  const today = page.getByRole("article", {
    name: "章を1ページ読む",
    exact: true,
  });
  await today.getByRole("button", { name: "5分", exact: true }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const completion = page.getByRole("dialog", { name: "予定時間になりました" });
  await completion
    .getByRole("textbox", { name: "次の次の一手(任意)" })
    .fill("次の章を開く");
  await completion.getByRole("button", { name: "保存して終わる" }).click();

  await expect(today.locator(".dl-today-status")).toHaveText("✓");
  await expect(reading.getByText("次の章を開く", { exact: true })).toBeVisible();
  await expect(
    reading.getByRole("button", { name: "編集", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .locator(".dl-wishlist-row")
      .getByText("読書メモを整理する", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
  await expect(
    page.locator(".dl-next").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".dl-wishlist-row")
      .getByText("読書メモを整理する", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("article", {
      name: "読書メモを整理する",
      exact: true,
    }),
  ).toHaveCount(1);
});
