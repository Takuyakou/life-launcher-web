import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("test-results/visual/web11");
for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`WEB11 full visual flow ${viewport.width}`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-09-09T03:00:00Z"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const metrics: Record<string, unknown> = {};
    const capture = async (state: string, selector?: string) => {
      if (selector)
        await page
          .locator(selector)
          .evaluate((node) =>
            window.scrollTo({
              top: window.scrollY + node.getBoundingClientRect().top - 70,
              behavior: "instant",
            }),
          );
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        columns: getComputedStyle(
          document.querySelector(".today-list")!,
        ).gridTemplateColumns.split(" ").length,
      }));
      expect(layout.overflow).toBe(0);
      metrics[state] = layout;
      await page.screenshot({
        path: path.join(output, `${viewport.width}-${state}.png`),
        animations: "disabled",
      });
    };
    await capture("landing");
    await capture("default", ".demo-window");
    await capture("two", ".today-section");
    await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
    await capture("picker-two", ".today-picker");
    await page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
      .click();
    await capture("three", ".today-section");
    const columns = await page
      .locator(".today-list")
      .evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(viewport.width === 390 ? 1 : 3);
    if (viewport.width === 1440) {
      await expect(page.locator(".toast")).toHaveCount(0, { timeout: 5000 });
      await page.mouse.move(0, 0);
      await page
        .locator(".demo-window")
        .screenshot({
          path: path.join(output, "readme-demo.png"),
          animations: "disabled",
          // Exclude landing-page overlays from this demo-only documentation crop.
          style: ".site-header, .skip-link { visibility: hidden !important; }",
        });
    }
    await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
    await capture("timer", ".today-section");
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await capture("completion");
    await page.getByRole("button", { name: "終わる", exact: true }).click();
    await page
      .getByRole("button", { name: "机の上だけ片付けるを5分で開始" })
      .click();
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await page.getByRole("button", { name: "終わる", exact: true }).click();
    await capture("completed", ".today-section");
    await page.getByRole("button", { name: "次の3件を選ぶ" }).click();
    await expect(page.locator(".today-row")).toHaveCount(0);
    await capture("picker-zero", ".today-picker");
    await page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByRole("button", { name: "数分だけ読むを今日の3件に追加" })
      .click();
    await page.keyboard.press("Escape");
    await capture("one", ".today-section");
    for (const section of [
      "next-section",
      "wishlist-section",
      "activity-section",
    ])
      await page.locator(`.${section} .section-toggle`).click();
    await capture("sections", ".next-section");
    await page
      .getByRole("button", { name: "やりたいことを追加", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("textbox")
      .fill("後回しにしていたことを整理して次に進むための小さな準備".repeat(3));
    await capture("add-modal");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "追加", exact: true })
      .click();
    await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
    await page
      .getByRole("dialog", { name: "今日やるものを選ぶ" })
      .getByRole("tab", { name: /やりたいこと/ })
      .click();
    await capture("long-candidate", ".today-picker");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /辞書を開く/ }).click();
    await capture("dictionary");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "リセット", exact: true }).click();
    await capture("reset-modal");
    await page.getByRole("button", { name: "リセットする" }).click();
    await expect(page.locator(".today-row")).toHaveCount(2);
    expect(errors).toEqual([]);
    await writeFile(
      path.join(output, `${viewport.width}-metrics.json`),
      JSON.stringify(metrics, null, 2),
    );
  });
}

test("medium Today3 uses two stable columns", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  await page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
    .click();
  expect(
    await page
      .locator(".today-list")
      .evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
});
