import { expect, test, type Locator } from "@playwright/test";

const interactionStyle = async (locator: Locator) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      boxShadow: style.boxShadow,
      color: style.color,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      transform: style.transform,
    };
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#screen").scrollIntoViewIfNeeded();
});

test("semantic variants stay distinct and primary starts lift on hover", async ({
  page,
}) => {
  const variants = {
    gold: page.getByRole("button", { name: "今日やるものを選ぶ" }),
    neutral: page
      .getByRole("article", { name: "本を読む", exact: true })
      .getByRole("button", { name: "操作メニュー" }),
    positive: page.locator(".dl-donow-card .dl-start--short"),
    timer: page.locator(".dl-donow-card .dl-start--normal"),
  };
  const backgrounds: string[] = [];
  for (const control of Object.values(variants)) {
    backgrounds.push((await interactionStyle(control)).background);
  }
  expect(new Set(backgrounds).size).toBe(4);

  // The two start variants lift, and hover keeps the colour that names them.
  for (const control of [variants.positive, variants.timer]) {
    await page.mouse.move(0, 0);
    const rest = await interactionStyle(control);
    await control.hover();
    await expect
      .poll(async () => (await interactionStyle(control)).boxShadow)
      .not.toBe("none");
    const hovered = await interactionStyle(control);
    expect(hovered.transform).not.toBe("none");
    expect(hovered.color).toBe(rest.color);
  }

  // The gold and neutral variants stay flat and answer with a background change.
  for (const control of [variants.gold, variants.neutral]) {
    await page.mouse.move(0, 0);
    const rest = await interactionStyle(control);
    await control.hover();
    await expect
      .poll(async () => (await interactionStyle(control)).background)
      .not.toBe(rest.background);
    expect((await interactionStyle(control)).transform).toBe("none");
  }
});

test("focus, pressed, disabled and Danger states follow the common grammar", async ({
  page,
}) => {
  const gold = page.getByRole("button", { name: "今日やるものを選ぶ" });
  await gold.focus();
  const focused = await interactionStyle(gold);
  expect(focused.outlineStyle).toBe("solid");
  expect(focused.outlineWidth).toBe("2px");

  const start = page.locator(".dl-donow-card .dl-start--short");
  await start.hover();
  const box = await start.boundingBox();
  if (!box) throw new Error("Start button has no box");
  await page.mouse.down();
  await expect
    .poll(async () => (await interactionStyle(start)).transform)
    .toContain("0.985");
  const pressed = await interactionStyle(start);
  expect(pressed.transform).toContain("matrix");
  expect(pressed.transform).not.toContain("-1)");
  await page.mouse.move(box.x - 20, box.y - 20);
  await page.mouse.up();

  // A running item cannot be removed from 今日の3件, so the menu entry is out.
  const reading = page.getByRole("article", { name: "本を読む", exact: true });
  await reading.getByRole("button", { name: "5分", exact: true }).click();
  await reading.getByRole("button", { name: "操作メニュー" }).click();
  const disabled = page.getByRole("menuitem", { name: "今日の3件から外す" });
  await expect(disabled).toBeDisabled();
  const disabledStyle = await interactionStyle(disabled);
  expect(disabledStyle.transform).toBe("none");
  expect(disabledStyle.boxShadow).toBe("none");
  await page.keyboard.press("Escape");

  // The Danger variant keeps the shared .button lift inside the demo dialogs.
  await gold.click();
  const danger = page
    .getByRole("dialog", { name: "今日やるものを選ぶ" })
    .getByRole("button", { name: "キャンセル" });
  await page.mouse.move(0, 0);
  await danger.hover();
  await expect
    .poll(async () => (await interactionStyle(danger)).boxShadow)
    .not.toBe("none");
  const dangerStyle = await interactionStyle(danger);
  expect(dangerStyle.transform).not.toBe("none");
  expect(dangerStyle.boxShadow).not.toBe("none");
});

test("Today card hover keeps Project identity and reduced motion removes transforms", async ({
  page,
}) => {
  const card = page.getByRole("article", { name: "本を読む", exact: true });
  await card.hover();
  const identity = await card.evaluate((node) => {
    const dot = node.querySelector<HTMLElement>(".dl-identity-dot");
    const style = getComputedStyle(node);
    return {
      top: style.borderTopColor,
      dot: dot ? getComputedStyle(dot).backgroundColor : "",
      project: style.getPropertyValue("--project-color").trim(),
    };
  });
  expect(identity.top).toBe(identity.dot);
  expect(identity.project).not.toBe("");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.hover();
  await expect(card).toHaveCSS("transform", "none");
  const doNow = page.locator(".dl-donow-card");
  await doNow.hover();
  await expect(doNow).toHaveCSS("transform", "none");
});
