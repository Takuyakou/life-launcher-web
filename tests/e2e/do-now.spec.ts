import { expect, test, type Page } from "@playwright/test";

const storageKey = "life-launcher-web-demo:v3";

/**
 * The demo only writes storage after a saved change, so the seed has no
 * snapshot until something is committed. Toggle the victory check twice: the
 * state is saved on the first change and put back by the second one.
 */
const persistSeed = async (page: Page) => {
  const victory = page.getByRole("checkbox", { name: "勝利条件を達成" });
  await victory.check();
  await victory.uncheck();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

test("cycles three NextStep candidates with complete Project color follow only", async ({
  page,
}) => {
  const card = page.locator(".dl-donow-card");
  const other = page.getByRole("button", { name: "他の一手" });
  const canonicalBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    storageKey,
  );
  const timerActions = card.locator(
    ".dl-donow-actions .dl-start, .dl-donow-actions .dl-measure",
  );
  const readTimerColors = () =>
    timerActions.evaluateAll((buttons) =>
      buttons.map((button) => ({
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderColor,
        color: getComputedStyle(button).color,
      })),
    );
  await page.mouse.move(0, 0);
  const timerColors = await readTimerColors();
  const seen: string[] = [];

  for (const [chip, title] of [
    ["読書", "数分だけ読む"],
    ["学習", "参考書を10ページ進める"],
    ["運動", "ストレッチをする"],
    ["読書", "数分だけ読む"],
  ] as const) {
    await expect(card.locator(".dl-chip")).toHaveText(chip);
    await expect(card.locator(".dl-donow-title")).toHaveText(title);
    const colors = await card.evaluate((node) => {
      const dot = node.querySelector<HTMLElement>(".dl-status-dot");
      const heading = node.querySelector<HTMLElement>(".dl-donow-kicker h2");
      return {
        project: getComputedStyle(node).getPropertyValue("--project-color").trim(),
        dot: dot ? getComputedStyle(dot).backgroundColor : "",
        heading: heading ? getComputedStyle(heading).color : "",
      };
    });
    expect(colors.project).not.toBe("");
    expect(colors.dot).not.toBe("");
    // The kicker heading and the status dot both follow the Project colour.
    expect(colors.heading).toBe(colors.dot);
    seen.push(colors.dot);
    if (seen.length < 4) {
      await other.click();
      await page.mouse.move(0, 0);
    }
  }

  expect(new Set(seen.slice(0, 3)).size).toBe(3);
  expect(await readTimerColors()).toEqual(timerColors);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBe(canonicalBefore);
});

test("shows Other Step only when at least two NextStep candidates exist", async ({
  page,
}) => {
  await persistSeed(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    for (const project of state.projects)
      if (project.id !== "reading") delete project.nextStep;
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await expect(page.getByRole("button", { name: "他の一手" })).toHaveCount(0);
  await expect(page.locator(".dl-donow-title")).toHaveText("数分だけ読む");

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    state.projects.find(
      (project: { id: string }) => project.id === "exercise",
    ).nextStep = "ストレッチをする";
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await expect(page.getByRole("button", { name: "他の一手" })).toBeVisible();
});

test("reduced motion keeps Do Now color changes free of animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const card = page.locator(".dl-donow-card");
  await page.getByRole("button", { name: "他の一手" }).click();
  const motion = await card.evaluate((node) => ({
    animation: getComputedStyle(node).animationDuration,
    transition: getComputedStyle(node).transitionDuration,
  }));
  expect(Number.parseFloat(motion.animation)).toBeLessThanOrEqual(0.001);
  expect(Number.parseFloat(motion.transition)).toBeLessThanOrEqual(0.001);
});
