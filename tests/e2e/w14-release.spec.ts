import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const key = "life-launcher-web-demo:v3";
// Written by the public v1.3 build (923f072); see src/demo/v13-data.test.ts.
const raw = JSON.stringify(
  JSON.parse(readFileSync("tests/e2e/fixtures/v1.3-public-state.json", "utf8")),
);

const saved = (page: Page) =>
  page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
const doNow = (page: Page) => page.locator(".do-now-card");

async function loadV13(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([storageKey, value]) => localStorage.setItem(storageKey, value),
    [key, raw],
  );
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
}

test("v1.3 public data is read unchanged by this version", async ({ page }) => {
  await loadV13(page);
  expect(await saved(page)).toBe(raw);
  await expect(page.locator(".victory-card")).toContainText("公開版の勝利条件");
  await expect(
    page.getByRole("checkbox", { name: "今日の勝利条件を完了" }),
  ).toBeChecked();
  await expect(page.locator(".today-row")).toHaveCount(3);
  await expect(
    page.getByRole("status", { name: "ストレッチをする：完了" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "本を読む：完了" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "参考書を10ページ進める：未完了" }),
  ).toBeVisible();
  await expect(page.locator(".sync-heading")).toContainText("2 / 3 完了");
  await expect(
    page
      .locator(".next-section")
      .getByText("ストレッチを1分だけ", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".wishlist-section .section-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    page.locator(".wishlist-row").getByText("公開版のやりたいこと"),
  ).toBeVisible();
  await expect(page.locator(".activity-list li")).toHaveCount(2);

  await page.reload();
  await expect(page.locator(".today-row")).toHaveCount(3);
  expect(await saved(page)).toBe(raw);
});

test("a completed Today 3 item is not first in Do Now, and reordering never saves", async ({
  page,
}) => {
  await loadV13(page);
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNow(page).locator("h2")).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("読書に次の一手が設定されているため");
  expect(await saved(page)).toBe(raw);
  await page.getByRole("button", { name: "他の一手" }).click();
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  expect(await saved(page)).toBe(raw);
});

test("a failed save keeps the previous state when starting and completing from Do Now", async ({
  page,
}) => {
  await loadV13(page);
  const toast = page.getByText("保存できませんでした。変更前の状態を保持しています。");
  const failSaves = (fail: boolean) =>
    page.evaluate((value) => {
      const w = window as unknown as { __setItem?: Storage["setItem"] };
      w.__setItem ??= Storage.prototype.setItem;
      Storage.prototype.setItem = value
        ? () => {
            throw new Error("quota");
          }
        : w.__setItem!;
    }, fail);

  await failSaves(true);
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(toast).toBeVisible();
  await expect(doNow(page).locator("[data-demo-do-now-short]")).toBeVisible();
  await expect(doNow(page).getByRole("status")).toHaveCount(0);

  await failSaves(false);
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(doNow(page).getByText("実行中")).toBeVisible();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await failSaves(true);
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(toast).toBeVisible();
  await expect(page.getByRole("dialog", { name: "おつかれさまでした" })).toBeVisible();
  await expect(
    page.getByRole("status", { name: "参考書を10ページ進める：未完了" }),
  ).toBeVisible();

  await failSaves(false);
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "参考書を10ページ進める：完了" }),
  ).toBeVisible();
});

test("core journey runs without console errors, failed assets or network traffic", async ({
  page,
  baseURL,
}) => {
  test.skip(!process.env.WEB11_PREVIEW, "Run with WEB11_PREVIEW=1 after build");
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console:${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    problems.push(`failed:${request.url()}`),
  );
  page.on("websocket", (socket) => problems.push(`ws:${socket.url()}`));
  page.on("request", (request) => {
    if (["fetch", "xhr", "websocket"].includes(request.resourceType()))
      problems.push(`${request.resourceType()}:${request.url()}`);
    if (new URL(request.url()).origin !== new URL(baseURL!).origin)
      problems.push(`external:${request.url()}`);
  });

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();

  // register: edit a NextStep and add a Wishlist item
  for (const label of ["本を読む", "ストレッチをする"])
    await page
      .getByRole("article", { name: label, exact: true })
      .getByRole("button", { name: "今日の3件から外す" })
      .click();
  await page
    .locator(".next-section .source-row", { hasText: "読書" })
    .getByRole("button", { name: "編集" })
    .click();
  const nextDialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await nextDialog.getByRole("textbox", { name: "次の一手" }).fill("章を1ページ読む");
  await nextDialog.getByRole("button", { name: "保存" }).click();
  await page.getByRole("button", { name: "やりたいことを追加", exact: true }).click();
  const wish = page.getByRole("dialog", { name: "やりたいことを追加" });
  await wish.getByRole("textbox", { name: "やりたいこと" }).fill("読書メモを整理する");
  await wish.getByRole("button", { name: "追加", exact: true }).click();

  // pick for today: Do Now follows the Today 3 NextStep
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "章を1ページ読むを今日の3件に追加" })
    .click();
  await page.keyboard.press("Escape");
  await expect(doNow(page).locator("h2")).toHaveText("章を1ページ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  // timer -> completion -> next candidate
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(
    page.getByRole("article", { name: "章を1ページ読む", exact: true }).getByText("実行中"),
  ).toBeVisible();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const done = page.getByRole("dialog", { name: "おつかれさまでした" });
  await done.getByRole("textbox", { name: "次の一手" }).fill("次の章を開く");
  await done.getByRole("button", { name: "保存して終わる" }).click();
  await expect(
    page.getByRole("status", { name: "章を1ページ読む：完了" }),
  ).toBeVisible();
  await expect(doNow(page).locator("h2")).toHaveText("参考書を10ページ進める");

  // reload keeps everything
  await page.reload();
  await expect(
    page.getByRole("status", { name: "章を1ページ読む：完了" }),
  ).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("次の章を開く", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".activity-list li")).toHaveCount(2);

  expect(problems).toEqual([]);
});
