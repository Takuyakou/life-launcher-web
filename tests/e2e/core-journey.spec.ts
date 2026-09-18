import { expect, test } from "@playwright/test";

test("core journey keeps Project, NextStep and Wishlist sources after Today execution", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();

  const next = page.locator(".next-section");
  await expect(next.getByText("読書", { exact: true })).toBeVisible();
  for (const label of ["本を読む", "ストレッチをする"]) {
    await page
      .getByRole("article", { name: label, exact: true })
      .getByRole("button", { name: "今日の3件から外す" })
      .click();
  }

  const reading = next.locator(".source-row", { hasText: "読書" });
  await reading.getByRole("button", { name: "変更" }).click();
  const nextDialog = page.getByRole("dialog", { name: "次の一手を変更" });
  await nextDialog
    .getByRole("textbox", { name: "次の一手" })
    .fill("章を1ページ読む");
  await nextDialog.getByRole("button", { name: "保存" }).click();

  await page
    .getByRole("button", { name: "やりたいことを追加", exact: true })
    .click();
  const wishlistDialog = page.getByRole("dialog", {
    name: "やりたいことを追加",
  });
  await wishlistDialog
    .getByRole("textbox", { name: "やりたいこと" })
    .fill("読書メモを整理する");
  await wishlistDialog.getByRole("button", { name: "追加" }).click();

  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await picker
    .getByRole("button", { name: "章を1ページ読むを今日の3件に追加" })
    .click();
  await picker.getByRole("tab", { name: /やりたいこと/ }).click();
  await picker
    .getByRole("button", {
      name: "読書メモを整理するを今日の3件に追加",
    })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".today-row")).toHaveCount(2);

  const today = page.getByRole("article", {
    name: "章を1ページ読む",
    exact: true,
  });
  await today
    .getByRole("button", { name: "章を1ページ読むを5分で開始" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const completion = page.getByRole("dialog", { name: "おつかれさまでした" });
  await completion
    .getByRole("textbox", { name: "次の一手" })
    .fill("次の章を開く");
  await completion.getByRole("button", { name: "保存" }).click();

  await expect(
    page.getByRole("status", { name: "章を1ページ読む：完了" }),
  ).toBeVisible();
  await expect(reading.getByText("次の章を開く", { exact: true })).toBeVisible();
  await expect(reading.getByRole("button", { name: "変更" })).toBeEnabled();
  await page.locator(".wishlist-section .section-toggle").click();
  await expect(
    page
      .locator(".wishlist-row")
      .getByText("読書メモを整理する", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".next-section").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".wishlist-row")
      .getByText("読書メモを整理する", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("article", {
      name: "読書メモを整理する",
      exact: true,
    }),
  ).toHaveCount(1);
});
