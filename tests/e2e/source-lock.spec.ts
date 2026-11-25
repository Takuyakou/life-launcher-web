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
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

test("NextStep presents normal, locked, completed and empty states", async ({
  page,
}) => {
  const next = page.locator(".dl-next");
  const reading = next.locator(".dl-next-row", { hasText: "読書" });
  const exercise = next.locator(".dl-next-row", { hasText: "運動" });

  await expect(reading.locator(".dl-lock")).toHaveAttribute(
    "aria-label",
    "今日の3件で使用中のためロック中",
  );
  await expect(
    reading.getByRole("button", { name: "編集", exact: true }),
  ).toHaveCount(0);
  await expect(reading.locator(".dl-today-chip")).toHaveText("✓ 今日の3件");

  await expect(exercise.locator(".dl-lock")).toHaveCount(0);
  await expect(
    exercise.getByRole("button", { name: "編集", exact: true }),
  ).toBeEnabled();
  await expect(exercise.locator(".dl-today-chip")).toHaveText("✓ 今日の3件");

  const readingCard = page.getByRole("article", {
    name: "本を読む",
    exact: true,
  });
  await openRowMenu(readingCard.locator(".dl-row-menu"));
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
  await expect(reading.locator(".dl-lock")).toHaveCount(0);
  await expect(
    reading.getByRole("button", { name: "編集", exact: true }),
  ).toBeEnabled();
  await expect(
    reading.getByRole("button", { name: "＋ 今日へ", exact: true }),
  ).toBeVisible();

  await reading.getByRole("button", { name: "編集", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await dialog.getByRole("textbox", { name: "次の一手" }).fill("次の章を開く");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(reading.getByText("次の章を開く", { exact: true })).toBeVisible();
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
  await expect(
    page.locator(".dl-next").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();

  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    delete state.projects.find(
      (project: { id: string }) => project.id === "study",
    ).nextStep;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
  const emptyStudy = page
    .locator(".dl-next")
    .locator(".dl-next-row", { hasText: "学習" });
  const setNextStep = emptyStudy.getByRole("button", {
    name: "次の一手を設定",
  });
  await expect(setNextStep).toBeVisible();
  await setNextStep.click();
  const emptyDialog = page.getByRole("dialog", { name: "次の一手を設定" });
  await emptyDialog
    .getByRole("textbox", { name: "次の一手" })
    .fill("次の10ページを読む");
  await emptyDialog.getByRole("button", { name: "保存" }).click();
  await expect(
    emptyStudy.getByText("次の10ページを読む", { exact: true }),
  ).toBeVisible();
});

test("Wishlist is grouped by Project with unassigned last and unlocks on remove", async ({
  page,
}) => {
  const groups = page.locator(".dl-wishlist-group");
  await expect(groups).toHaveCount(3);
  await expect(groups.nth(0).locator(".dl-wishlist-head")).toHaveText("学習1件");
  await expect(groups.nth(1).locator(".dl-wishlist-head")).toHaveText("読書1件");
  await expect(groups.nth(2).locator(".dl-wishlist-head")).toHaveText(
    "未分類1件",
  );

  const walk = groups
    .nth(2)
    .locator(".dl-wishlist-row", { hasText: "近所をゆっくり歩く" });
  const addToToday = page.locator(".dl-menu-item", {
    hasText: "今日の3件に入れる",
  });
  await openRowMenu(walk.locator(".dl-row-menu"));
  await expect(addToToday).toBeEnabled();
  await addToToday.click();
  const walkCard = page.getByRole("article", {
    name: "近所をゆっくり歩く",
    exact: true,
  });
  await expect(walkCard).toHaveCount(1);
  await openRowMenu(walk.locator(".dl-row-menu"));
  await expect(addToToday).toBeDisabled();
  await page.keyboard.press("Escape");
  await openRowMenu(walkCard.locator(".dl-row-menu"));
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
  await expect(walkCard).toHaveCount(0);
  await openRowMenu(walk.locator(".dl-row-menu"));
  await expect(addToToday).toBeEnabled();
});

test("same-text Wishlist rows lock only the matching stable source ID", async ({
  page,
}) => {
  // The demo writes storage on the first change: collapse and reopen the
  // Wishlist so the seed state exists before it is rewritten below.
  const wishlistToggle = page.locator(".dl-wishlist .dl-section-disclosure");
  await wishlistToggle.click();
  await wishlistToggle.click();
  await expect(wishlistToggle).toHaveAttribute("aria-expanded", "true");
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
  await page.locator("#screen").scrollIntoViewIfNeeded();
  const rows = page.locator(".dl-wishlist-row", { hasText: "同じ内容" });
  await expect(rows).toHaveCount(2);
  await expect(rows.locator(".dl-wishlist-text")).toHaveText([
    "同じ内容",
    "同じ内容",
  ]);
  const addToToday = page.locator(".dl-menu-item", {
    hasText: "今日の3件に入れる",
  });
  const firstMenu = rows.nth(0).locator(".dl-row-menu");
  const secondMenu = rows.nth(1).locator(".dl-row-menu");
  await openRowMenu(firstMenu);
  await expect(addToToday).toBeDisabled();
  await page.keyboard.press("Escape");
  await openRowMenu(secondMenu);
  await expect(addToToday).toBeEnabled();
  await addToToday.click();
  await expect(
    page.getByRole("article", { name: "同じ内容", exact: true }),
  ).toHaveCount(2);
  await openRowMenu(firstMenu);
  await expect(addToToday).toBeDisabled();
  await page.keyboard.press("Escape");
  await openRowMenu(secondMenu);
  await expect(addToToday).toBeDisabled();
});

test("Do Now completion of a locked NextStep completes its Today item before the NextStep can be replaced", async ({
  page,
}) => {
  await page
    .locator(".dl-donow")
    .getByRole("button", { name: "5分で始める" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = page.getByRole("dialog", { name: "予定時間になりました" });
  await dialog
    .getByRole("textbox", { name: "次の次の一手(任意)" })
    .fill("次の章を開く");
  await dialog.getByRole("button", { name: "保存して終わる" }).click();
  const readingCard = page.getByRole("article", {
    name: "本を読む",
    exact: true,
  });
  await expect(readingCard.locator(".dl-today-status")).toHaveText("✓");
  await expect(
    page.locator(".dl-next").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();
});
