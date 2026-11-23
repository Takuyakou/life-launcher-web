import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

const boxOf = async (page: Page, selector: string) =>
  page.locator(selector).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });

for (const viewport of viewports) {
  test(`W15 main, picker, completion and import fit at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-11-02T03:00:00Z"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator("#demo").scrollIntoViewIfNeeded();

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await expect(page.locator(".do-now-resume-note")).toContainText(
      "次はここから: 3章のp.84から",
    );
    const importTrigger = page.getByRole("button", { name: /まとめて取り込む/ });
    await expect(importTrigger).toBeVisible();
    const triggerBox = await importTrigger.boundingBox();
    expect(triggerBox!.x).toBeGreaterThanOrEqual(0);
    expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(viewport.width);

    await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
    const picker = page.getByRole("dialog", { name: "今日やるものを選ぶ" });
    await expect(picker).toBeVisible();
    const pickerBox = await boxOf(page, ".today-picker");
    expect(pickerBox.left).toBeGreaterThanOrEqual(0);
    expect(pickerBox.right).toBeLessThanOrEqual(viewport.width);
    expect(pickerBox.bottom).toBeLessThanOrEqual(viewport.height);
    expect(
      await page.evaluate(() => {
        const node = document.querySelector<HTMLElement>(".today-picker")!;
        return node.scrollWidth - node.clientWidth;
      }),
    ).toBe(0);
    await expect(
      picker.getByRole("group", { name: "プロジェクトで絞り込む" }),
    ).toBeVisible();
    await expect(
      picker.getByRole("textbox", { name: "やりたいことを追加" }),
    ).toBeVisible();
    await expect(picker.getByRole("progressbar")).toBeVisible();
    await expect(picker.getByRole("button", { name: "決定" })).toBeVisible();
    await expect(picker.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page
      .getByRole("article", { name: "本を読む", exact: true })
      .getByRole("button", { name: "本を読むを5分で開始" })
      .click();
    await page.getByRole("button", { name: /満了まで進める/ }).click();
    const completion = page.getByRole("dialog", { name: "予定時間になりました" });
    await expect(completion).toBeVisible();
    const completionBox = await boxOf(page, ".completion-dialog");
    expect(completionBox.left).toBeGreaterThanOrEqual(0);
    expect(completionBox.right).toBeLessThanOrEqual(viewport.width);
    expect(completionBox.bottom).toBeLessThanOrEqual(viewport.height);
    expect(
      await page.evaluate(() => {
        const node = document.querySelector<HTMLElement>(".completion-dialog")!;
        return node.scrollWidth - node.clientWidth;
      }),
    ).toBe(0);
    for (const name of [/続ける/, /保存して終わる/, /^終わる$/]) {
      await expect(completion.getByRole("button", { name })).toBeVisible();
    }
    await completion.getByRole("button", { name: "終わる", exact: true }).click();

    await importTrigger.click();
    const importDialog = page.getByRole("dialog", { name: "まとめて取り込む" });
    await expect(importDialog).toBeVisible();
    const importBox = await boxOf(page, ".demo-import-dialog");
    expect(importBox.left).toBeGreaterThanOrEqual(0);
    expect(importBox.right).toBeLessThanOrEqual(viewport.width);
    expect(importBox.bottom).toBeLessThanOrEqual(viewport.height);
    expect(
      await page.evaluate(() => {
        const node = document.querySelector<HTMLElement>(".demo-import-dialog")!;
        return node.scrollWidth - node.clientWidth;
      }),
    ).toBe(0);
    await importDialog
      .getByRole("button", { name: "サンプルの AI 回答を貼ってみる" })
      .click();
    await expect(importDialog.getByText("✓ 読み取りました")).toBeVisible();
    await expect(
      importDialog.getByRole("button", { name: "取り込む(5件)" }),
    ).toBeVisible();
    const previewBox = await boxOf(page, ".demo-import-preview");
    expect(previewBox.right).toBeLessThanOrEqual(viewport.width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}
