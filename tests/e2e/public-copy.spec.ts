import { expect, test } from "@playwright/test";

const storageKey = "life-launcher-web-demo:v3";

test("fresh visitors see consistent, general sample content", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // The hero states what the product does. The old hero mock card is gone.
  await expect(page.locator("#top .lp-h1")).toContainText(
    "今日やることを3件に絞り",
  );
  await expect(page.locator("#top .lp-h1")).toContainText("すぐ始める");
  await expect(page.locator("#top .lp-lead")).toContainText("Windows");
  await expect(page.locator("#top .lp-lead")).toContainText("今やる一手");

  // The demo starts on the general reading sample.
  await expect(page.locator(".dl-chip")).toHaveText("読書");
  await expect(page.locator(".dl-donow-title")).toHaveText("数分だけ読む");
  await expect(page.locator(".dl-status-dot")).toHaveCSS(
    "background-color",
    "rgb(231, 185, 77)",
  );
  await expect(page.locator(".dl-donow-resume-text")).toHaveText(
    "3章のp.84から",
  );
  await expect(page.getByText("Today Picker", { exact: false })).toHaveCount(0);

  // Sample strings stay general: no email address and no absolute local path.
  const sampleText = await page.locator(".dl-app").innerText();
  expect(sampleText).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  expect(sampleText).not.toMatch(/(?:[A-Za-z]:\\|\\\\Users\\)/);

  const projects = await page
    .locator(".dl-next .dl-next-row")
    .allTextContents();
  expect(projects).toHaveLength(3);
  expect(projects.join(" ")).toContain("学習");
  expect(projects.join(" ")).toContain("運動");
  expect(projects.join(" ")).toContain("読書");

  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await expect(
    picker.getByRole("button", {
      name: "参考書を10ページ進めるを今日の3件に追加",
    }),
  ).toBeVisible();
  await expect(picker.locator(".today-picker-slot.is-selected")).toHaveCount(2);
});

test("existing saved projects and text survive a new seed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => {
    localStorage.clear();
    const state = {
      schemaVersion: 3,
      victory: { text: "保存済みの勝利条件", completed: false },
      doNowIndex: 0,
      todayItems: [],
      candidateExcludedSourceIds: [],
      projects: [
        {
          id: "tidy",
          name: "保存済みの片付け",
          color: "blue",
          nextStep: "机の上だけ片付ける",
        },
      ],
      wishlist: [{ id: "saved-wish", label: "引き出しを整理する", projectId: "tidy" }],
      sessions: [],
      timer: {
        status: "idle",
        label: "",
        projectId: "",
        projectName: "",
        durationSeconds: 0,
        remainingSeconds: 0,
        elapsedSeconds: 0,
      },
      sections: { nextStep: true, wishlist: true, activity: true },
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  const saved = await page.evaluate((key) => localStorage.getItem(key), storageKey);

  await page.reload();
  await expect(page.locator(".dl-donow-title")).toHaveText("机の上だけ片付ける");
  await expect(page.locator(".dl-next .dl-next-row")).toHaveCount(1);
  await expect(page.locator(".dl-wishlist-row")).toContainText("引き出しを整理する");
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved);
});
