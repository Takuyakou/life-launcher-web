import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

test.skip(
  true,
  "Historical WEB11-00 only: regenerate on commit f34770d; current QA is tests/visual/sync.spec.ts",
);

// Historical audit only: explicitly run this file, not a future parity gate.
const output = path.resolve("docs/v1.1-sync/baseline");
for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`WEB11-00 baseline ${viewport.width}`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-09-08T03:00:00Z"));
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const metrics: Record<string, unknown> = { viewport };
    const capture = async (state: string, selector?: string) => {
      if (selector) {
        await page.locator(selector).evaluate((node) => {
          const header =
            document.querySelector(".site-header")?.getBoundingClientRect()
              .height ?? 0;
          window.scrollTo({
            top: window.scrollY + node.getBoundingClientRect().top - header - 8,
            behavior: "instant",
          });
        });
      }
      await page.screenshot({
        path: path.join(output, `${viewport.width}-${state}.png`),
        animations: "disabled",
      });
      const layout = await page.evaluate(() => ({
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        todayRows: Array.from(
          document.querySelectorAll(".today-row"),
          (node) => {
            const rect = node.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          },
        ),
        manualChecks: document.querySelectorAll(
          '.today-row input[type="checkbox"]',
        ).length,
        builderRows: document.querySelectorAll(".builder-row").length,
      }));
      metrics[state] = layout;
      expect(layout.overflow).toBe(0);
    };

    await capture("hero");
    await capture("default", "#demo");
    await capture("builder", ".builder-section");
    await capture("lower", ".next-section");
    await page
      .getByRole("button", { name: "机の上だけ片付けるを今日の3件に追加" })
      .click();
    await expect(page.locator(".today-row")).toHaveCount(3);
    await capture("today3", ".today-section");
    const completedBeforeTimer = await page
      .locator(".today-row input:checked")
      .count();
    await page.getByRole("button", { name: "本を読むを5分で開始" }).click();
    await expect(page.getByText("実行中", { exact: true })).toBeVisible();
    await capture("timer", ".demo-timer");
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    await expect(
      page.getByRole("dialog", { name: "おつかれさまでした" }),
    ).toBeVisible();
    await capture("completion-dialog");
    await page.getByRole("button", { name: "今は変更しない" }).click();
    await expect(page.locator(".today-row input:checked")).toHaveCount(
      completedBeforeTimer,
    );
    await capture("after-timer", ".today-section");
    for (const checkbox of await page
      .locator('.today-row input[type="checkbox"]')
      .all()) {
      await checkbox.check();
    }
    await expect(page.locator(".today-row input:checked")).toHaveCount(3);
    await expect(
      page.getByRole("button", { name: "次の3件を選ぶ" }),
    ).toHaveCount(0);
    await capture("completed-no-next-batch", ".today-section");
    await page.getByRole("button", { name: "辞書を開く Ctrl+K" }).click();
    await expect(page.getByRole("dialog", { name: "辞書" })).toBeVisible();
    await capture("dictionary");
    await writeFile(
      path.join(output, `${viewport.width}-metrics.json`),
      JSON.stringify(metrics, null, 2) + "\n",
    );
  });
}
