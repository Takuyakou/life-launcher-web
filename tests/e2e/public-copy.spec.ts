import { expect, test } from "@playwright/test";

const storageKey = "life-launcher-web-demo:v3";

test("fresh visitors see consistent, general sample content", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator(".hero-mini-project")).toHaveText("プロジェクト: 学習");
  await expect(page.locator(".hero-mini-step strong")).toHaveText(
    "参考書を10ページ進める",
  );
  await expect(page.locator(".do-now-card h2")).toHaveText(
    "参考書を10ページ進める",
  );
  await expect(page.locator(".do-now-card")).toHaveAttribute(
    "data-project-color",
    "violet",
  );
  await expect(page.getByText("Today Picker", { exact: false })).toHaveCount(0);

  const projects = await page.locator(".next-section .source-row").allTextContents();
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
  await expect(page.locator(".do-now-card h2")).toHaveText("机の上だけ片付ける");
  await expect(page.locator(".next-section .source-row")).toHaveCount(1);
  await expect(page.locator(".wishlist-row")).toContainText("引き出しを整理する");
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved);
});
