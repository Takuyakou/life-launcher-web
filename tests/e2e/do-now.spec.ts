import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.locator(".wishlist-section .section-toggle").click();
});

test("cycles three NextStep candidates with complete Project color follow only", async ({
  page,
}) => {
  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    delete state.projects.find((project: { id: string }) => project.id === "study")
      .nextStep;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const card = page.locator(".do-now-card");
  const other = page.getByRole("button", { name: "他の一手" });
  const canonicalBefore = await page.evaluate(() =>
    localStorage.getItem("life-launcher-web-demo:v3"),
  );
  const timerColors = await card.locator(".sync-timer-actions button").evaluateAll(
    (buttons) =>
      buttons.map((button) => ({
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderColor,
        color: getComputedStyle(button).color,
      })),
  );
  const seen: string[] = [];

  for (const expected of ["amber", "green", "blue", "amber"]) {
    await expect(card).toHaveAttribute("data-project-color", expected);
    const colors = await card.evaluate((node) => {
      const dot = node.querySelector<HTMLElement>(".project-label > span");
      return {
        border: getComputedStyle(node).borderLeftColor,
        dot: dot ? getComputedStyle(dot).backgroundColor : "",
        project: getComputedStyle(node).getPropertyValue("--project").trim(),
      };
    });
    expect(colors.border).toBe(colors.dot);
    expect(colors.project).not.toBe("");
    seen.push(colors.border);
    if (expected !== "amber" || seen.length !== 4) await other.click();
  }

  expect(new Set(seen.slice(0, 3)).size).toBe(3);
  expect(
    await card.locator(".sync-timer-actions button").evaluateAll((buttons) =>
      buttons.map((button) => ({
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderColor,
        color: getComputedStyle(button).color,
      })),
    ),
  ).toEqual(timerColors);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("life-launcher-web-demo:v3"),
    ),
  ).toBe(canonicalBefore);
});

test("shows Other Step only when at least two NextStep candidates exist", async ({
  page,
}) => {
  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    for (const project of state.projects)
      if (project.id !== "reading") delete project.nextStep;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "他の一手" })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "数分だけ読む" }),
  ).toBeVisible();

  await page.evaluate(() => {
    const key = "life-launcher-web-demo:v3";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    state.projects.find((project: { id: string }) => project.id === "exercise")
      .nextStep = "ストレッチをする";
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "他の一手" })).toBeVisible();
});

test("reduced motion keeps Do Now color changes free of animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const card = page.locator(".do-now-card");
  await page.getByRole("button", { name: "他の一手" }).click();
  const motion = await card.evaluate((node) => ({
    animation: getComputedStyle(node).animationDuration,
    transition: getComputedStyle(node).transitionDuration,
  }));
  expect(Number.parseFloat(motion.animation)).toBeLessThanOrEqual(0.001);
  expect(Number.parseFloat(motion.transition)).toBeLessThanOrEqual(0.001);
});
