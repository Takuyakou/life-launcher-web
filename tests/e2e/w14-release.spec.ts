import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const key = "life-launcher-web-demo:v3";
// Written by the public v1.3 build (923f072); see src/demo/v13-data.test.ts.
const raw = JSON.stringify(
  JSON.parse(readFileSync("tests/e2e/fixtures/v1.3-public-state.json", "utf8")),
);

const saved = (page: Page) =>
  page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
const doNow = (page: Page) => page.locator(".dl-donow-card");
const doNowTitle = (page: Page) => doNow(page).locator(".dl-donow-title");
const card = (page: Page, label: string) =>
  page.getByRole("article", { name: label, exact: true });
// W21: 編集と「今日の3件から外す」は行の … メニューに入った。
const removeFromToday = async (page: Page, label: string) => {
  await card(page, label).locator(".dl-row-menu").click();
  await page.locator(".dl-menu-item", { hasText: "今日の3件から外す" }).click();
};

async function loadV13(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([storageKey, value]) => localStorage.setItem(storageKey, value),
    [key, raw],
  );
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
}

// W21: Web フォントが Inter + Noto Sans JP の分割ファイルになったので、
// 読み終わる前に reload すると、その reload 自身がフォント要求を中断させる。
const settleFonts = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready.then(() => true));
};

test("v1.3 public data is read unchanged by this version", async ({ page }) => {
  await loadV13(page);
  expect(await saved(page)).toBe(raw);
  await expect(page.locator(".dl-victory")).toContainText("公開版の勝利条件");
  await expect(page.locator(".dl-victory-badge")).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "勝利条件を達成" }),
  ).toBeChecked();
  await expect(page.locator(".dl-today-card")).toHaveCount(3);
  // W21: 完了・未完了は role="status" ではなくカードの data-complete で示す。
  await expect(card(page, "ストレッチをする")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await expect(card(page, "本を読む")).toHaveAttribute("data-complete", "true");
  await expect(card(page, "参考書を10ページ進める")).not.toHaveAttribute(
    "data-complete",
    "true",
  );
  await expect(page.locator(".dl-today .dl-section-count")).toHaveText("3件");
  await expect(page.locator(".dl-today .dl-section-summary")).toHaveText(
    "2 / 3 完了",
  );
  await expect(
    page.locator(".dl-next-row", { hasText: "運動" }),
  ).toContainText("ストレッチを1分だけ");
  await expect(
    page.locator(".dl-wishlist .dl-section-disclosure"),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator(".dl-wishlist-row").getByText("公開版のやりたいこと"),
  ).toBeVisible();
  await expect(page.locator(".dl-activity-list li")).toHaveCount(2);

  await page.reload();
  await expect(page.locator(".dl-today-card")).toHaveCount(3);
  expect(await saved(page)).toBe(raw);
});

test("a completed Today 3 item is not first in Do Now, and reordering never saves", async ({
  page,
}) => {
  await loadV13(page);
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNowTitle(page)).toHaveText("数分だけ読む");
  await expect(doNow(page)).toContainText("読書に次の一手が設定されているため");
  expect(await saved(page)).toBe(raw);
  await page.getByRole("button", { name: "他の一手" }).click();
  await page.getByRole("button", { name: "他の一手" }).click();
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
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
  await expect(page.locator(".dl-pill--state")).toHaveText("待機中");

  await failSaves(false);
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(doNow(page).getByText("実行中")).toBeVisible();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await failSaves(true);
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "予定時間になりました" }),
  ).toBeVisible();
  await expect(page.locator(".dl-pill--state")).toHaveText("完了確認中");
  await expect(card(page, "参考書を10ページ進める")).not.toHaveAttribute(
    "data-complete",
    "true",
  );

  await failSaves(false);
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(card(page, "参考書を10ページ進める")).toHaveAttribute(
    "data-complete",
    "true",
  );
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
  await settleFonts(page);
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();

  // register: edit a NextStep and add a Wishlist item
  for (const label of ["本を読む", "ストレッチをする"])
    await removeFromToday(page, label);
  await page
    .locator(".dl-next-row", { hasText: "読書" })
    .getByRole("button", { name: "編集" })
    .click();
  const nextDialog = page.getByRole("dialog", { name: "次の一手を編集" });
  await nextDialog.getByRole("textbox", { name: "次の一手" }).fill("章を1ページ読む");
  await nextDialog.getByRole("button", { name: "保存" }).click();
  await page.getByRole("button", { name: "＋ やりたいこと" }).click();
  const wish = page.getByRole("dialog", { name: "やりたいことを追加" });
  await wish.getByRole("textbox", { name: "やりたいこと" }).fill("読書メモを整理する");
  await wish.getByRole("button", { name: "追加", exact: true }).click();

  // pick for today: Do Now follows the Today 3 NextStep
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "章を1ページ読むを今日の3件に追加" })
    .click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "決定" })
    .click();
  await expect(doNowTitle(page)).toHaveText("章を1ページ読む");
  await expect(doNow(page)).toContainText("今日の3件に入っている一手です");

  // timer -> completion -> next candidate
  await doNow(page).locator("[data-demo-do-now-short]").click();
  await expect(card(page, "章を1ページ読む")).toHaveAttribute(
    "data-running",
    "true",
  );
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const done = page.getByRole("dialog", { name: "予定時間になりました" });
  await done
    .getByRole("textbox", { name: "次の次の一手(任意)" })
    .fill("次の章を開く");
  await done.getByRole("button", { name: "保存して終わる" }).click();
  await expect(card(page, "章を1ページ読む")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await expect(doNowTitle(page)).toHaveText("参考書を10ページ進める");

  // reload keeps everything
  await page.reload();
  await expect(card(page, "章を1ページ読む")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await expect(
    page.locator(".dl-next-row", { hasText: "読書" }),
  ).toContainText("次の章を開く");
  await expect(page.locator(".dl-activity-list li")).toHaveCount(2);

  expect(problems).toEqual([]);
});
