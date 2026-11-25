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
          .first()
          .evaluate((node) =>
            window.scrollTo({
              top: window.scrollY + node.getBoundingClientRect().top - 70,
              behavior: "instant",
            }),
          );
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        columns: getComputedStyle(
          document.querySelector(".dl-today-grid")!,
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
    await capture("default", ".dl-app");
    await capture("today", ".dl-today");

    const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
    await page.locator(".dl-today-add").click();
    await capture("picker-two", ".today-picker");
    await picker
      .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
      .click();
    await picker.getByRole("button", { name: "決定" }).click();
    await capture("three", ".dl-today");
    const columns = await page
      .locator(".dl-today-grid")
      .evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(viewport.width === 390 ? 1 : 3);

    if (viewport.width === 1440) {
      await expect(page.locator(".toast")).toHaveCount(0, { timeout: 5000 });
      await page.mouse.move(0, 0);
      await page.locator(".dl-app").screenshot({
        path: path.join(output, "readme-demo.png"),
        animations: "disabled",
        // Exclude landing-page overlays from this demo-only documentation crop.
        style: ".lp-header, .skip-link { visibility: hidden !important; }",
      });
    }

    const reading = page.getByRole("article", { name: "本を読む", exact: true });
    await reading.getByRole("button", { name: "5分", exact: true }).click();
    await capture("timer", ".dl-today");
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await capture("completion", ".completion-dialog");
    await page
      .locator(".completion-dialog")
      .getByRole("button", { name: "終わる", exact: true })
      .click();

    const study = page.getByRole("article", {
      name: "参考書を10ページ進める",
      exact: true,
    });
    await study.getByRole("button", { name: "5分", exact: true }).click();
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await page
      .locator(".completion-dialog")
      .getByRole("button", { name: "終わる", exact: true })
      .click();
    await capture("completed", ".dl-today");

    await page.locator(".dl-dictionary-button").click();
    await capture("dictionary", ".dictionary-dialog");
    await page.keyboard.press("Escape");
    await expect(page.locator(".dictionary-dialog")).toHaveCount(0);

    // W21 のデモは 760px 以下で節の操作列(まとめて取り込む)を畳むので、
    // その幅では広い画面で開いてから戻し、ダイアログ自体の収まりを見る。
    if (viewport.width <= 760) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator(".dl-ghost-button").click();
      await page.setViewportSize(viewport);
    } else {
      await page.locator(".dl-ghost-button").click();
    }
    await expect(
      page.getByRole("dialog", { name: "まとめて取り込む" }),
    ).toBeVisible();
    await capture("import-modal", ".demo-import-dialog");
    await page.keyboard.press("Escape");
    await expect(page.locator(".demo-import-dialog")).toHaveCount(0);

    // 3件そろうと「今日やるものを選ぶ」は消えるので、1件外してから開き直す。
    const remove = page.getByRole("menuitem", { name: "今日の3件から外す" });
    await reading
      .getByRole("button", { name: "操作メニュー" })
      .click();
    // メニューは position: fixed で 390px では画面の外へ伸びるので、
    // 撮る幅によらずフォーカスと Enter で選ぶ。
    await remove.focus();
    await page.keyboard.press("Enter");
    await expect(reading).toHaveCount(0);
    await expect(page.locator("article.dl-today-card")).toHaveCount(2);
    await capture("two-after-removal", ".dl-today");
    await page.locator(".dl-today-add").click();
    await capture("picker-after-removal", ".today-picker");
    await page.keyboard.press("Escape");

    await capture("sections", ".dl-next");
    await page.locator(".dl-pill-button").click();
    await capture("reset-modal", ".confirm-dialog");
    await page.getByRole("button", { name: "リセットする" }).click();
    await expect(page.locator("article.dl-today-card")).toHaveCount(2);
    await expect(reading).toHaveCount(1);
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
  const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
  await page.locator(".dl-today-add").click();
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  expect(
    await page
      .locator(".dl-today-grid")
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
