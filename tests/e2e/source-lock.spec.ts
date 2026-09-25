import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("NextStep presents normal, locked, completed and empty states", async ({
  page,
}) => {
  const next = page.locator(".next-section");
  const reading = next.locator(".source-row", { hasText: "読書" });
  const exercise = next.locator(".source-row", { hasText: "運動" });

  await expect(
    reading.getByRole("img", { name: "今日の3件で使用中" }),
  ).toBeVisible();
  await expect(reading.getByRole("button", { name: "変更" })).toBeDisabled();
  await expect(reading.getByText("今日の3件", { exact: true })).toBeVisible();

  await expect(
    exercise.getByRole("img", { name: "今日の3件で使用中" }),
  ).toHaveCount(0);
  await expect(exercise.getByRole("button", { name: "変更" })).toBeEnabled();
  await expect(exercise.getByText("今日の3件", { exact: true })).toBeVisible();

  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "今日の3件から外す" })
    .click();
  await expect(
    reading.getByRole("img", { name: "今日の3件で使用中" }),
  ).toHaveCount(0);
  await expect(reading.getByRole("button", { name: "変更" })).toBeEnabled();
  await expect(
    reading.getByRole("button", { name: "数分だけ読むを今日の3件に追加" }),
  ).toBeVisible();

  await reading.getByRole("button", { name: "変更" }).click();
  const dialog = page.getByRole("dialog", { name: "次の一手を変更" });
  await dialog.getByRole("textbox", { name: "次の一手" }).fill("次の章を開く");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(reading.getByText("次の章を開く", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".next-section").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();

  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    delete state.projects.find((project: { id: string }) => project.id === "study")
      .nextStep;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const emptyStudy = page
    .locator(".next-section")
    .locator(".source-row", { hasText: "学習" });
  await expect(
    emptyStudy.getByText("まだ次の一手がありません", { exact: true }),
  ).toBeVisible();
  await emptyStudy.getByRole("button", { name: "次の一手を設定" }).click();
  const emptyDialog = page.getByRole("dialog", { name: "次の一手を設定" });
  await emptyDialog.getByRole("textbox", { name: "次の一手" }).fill("次の10ページを読む");
  await emptyDialog.getByRole("button", { name: "保存" }).click();
  await expect(emptyStudy.getByText("次の10ページを読む", { exact: true })).toBeVisible();
});

test("Wishlist is grouped by Project with unassigned last and unlocks on remove", async ({
  page,
}) => {
  await page.locator(".wishlist-section .section-toggle").click();
  const groups = page.locator(".wishlist-group");
  await expect(groups).toHaveCount(3);
  await expect(groups.nth(0).getByRole("heading")).toHaveText("学習");
  await expect(groups.nth(1).getByRole("heading")).toHaveText("読書");
  await expect(groups.nth(2).getByRole("heading")).toHaveText("未分類");

  const walk = groups.nth(2).locator(".wishlist-row", {
    hasText: "近所をゆっくり歩く",
  });
  await walk
    .getByRole("button", {
      name: "近所をゆっくり歩くを今日の3件に追加",
    })
    .click();
  await expect(
    walk.getByRole("img", { name: "今日の3件で使用中" }),
  ).toBeVisible();
  await expect(walk.getByText("今日の3件", { exact: true })).toBeVisible();
  await page
    .getByRole("article", { name: "近所をゆっくり歩く", exact: true })
    .getByRole("button", { name: "今日の3件から外す" })
    .click();
  await expect(
    walk.getByRole("img", { name: "今日の3件で使用中" }),
  ).toHaveCount(0);
  await expect(
    walk.getByRole("button", {
      name: "近所をゆっくり歩くを今日の3件に追加",
    }),
  ).toBeVisible();
});

test("same-text Wishlist rows lock only the matching stable source ID", async ({
  page,
}) => {
  await page.locator(".wishlist-section .section-toggle").click();
  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    state.wishlist.push(
      { id: "same-a", label: "同じ内容", projectId: "reading" },
      { id: "same-b", label: "同じ内容", projectId: "reading" },
    );
    state.todayItems = [
      {
        id: "today-same-a",
        sourceId: "wishlist:same-a",
        label: "同じ内容",
        projectId: "reading",
        completed: false,
        shortMinutes: 5,
        normalMinutes: 25,
      },
    ];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const rows = page.locator(".wishlist-row", { hasText: "同じ内容" });
  await expect(rows).toHaveCount(2);
  await expect(
    rows.getByRole("img", { name: "今日の3件で使用中" }),
  ).toHaveCount(1);
  await expect(
    rows.getByRole("button", { name: "同じ内容を今日の3件に追加" }),
  ).toHaveCount(1);
});

test("Do Now completion cannot replace an unfinished locked NextStep", async ({
  page,
}) => {
  await page.getByRole("button", { name: "他の一手" }).click();
  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "おつかれさまでした" });
  await expect(dialog.getByRole("textbox", { name: "次の一手" })).toHaveCount(
    0,
  );
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(
    page
      .locator(".next-section")
      .getByText("数分だけ読む", { exact: true }),
  ).toBeVisible();
});
