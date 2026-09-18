import { expect, test } from "@playwright/test";

const interactionStyle = async (
  locator: import("@playwright/test").Locator,
) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      transform: style.transform,
    };
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("Gold, Neutral, Positive and Timer variants lift without losing semantics", async ({
  page,
}) => {
  const controls = [
    page.getByRole("button", { name: "今日やるものを選ぶ" }),
    page
      .getByRole("article", { name: "本を読む", exact: true })
      .getByRole("button", { name: "今日の3件から外す" }),
    page.locator(".do-now-card .button-good"),
    page.locator(".do-now-card .button-normal"),
  ];
  const semanticColors: string[] = [];
  for (const control of controls) {
    semanticColors.push((await interactionStyle(control)).background);
    await control.hover();
    const hovered = await interactionStyle(control);
    expect(hovered.transform).not.toBe("none");
    expect(hovered.boxShadow).not.toBe("none");
  }
  expect(new Set(semanticColors).size).toBeGreaterThanOrEqual(3);
});

test("focus, pressed, disabled and Danger states follow the common grammar", async ({
  page,
}) => {
  const gold = page.getByRole("button", { name: "今日やるものを選ぶ" });
  await gold.focus();
  const focused = await interactionStyle(gold);
  expect(focused.outlineStyle).toBe("solid");
  expect(focused.outlineWidth).toBe("2px");

  const box = await gold.boundingBox();
  if (!box) throw new Error("Gold button has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const pressed = await interactionStyle(gold);
  expect(pressed.transform).toContain("matrix");
  expect(pressed.transform).not.toContain("-1)");
  await page.mouse.move(box.x - 20, box.y - 20);
  await page.mouse.up();

  const reading = page.getByRole("article", {
    name: "本を読む",
    exact: true,
  });
  await reading.getByRole("button", { name: "本を読むを5分で開始" }).click();
  const disabled = reading.getByRole("button", {
    name: "今日の3件から外す",
  });
  await expect(disabled).toBeDisabled();
  const disabledStyle = await interactionStyle(disabled);
  expect(disabledStyle.transform).toBe("none");
  expect(disabledStyle.boxShadow).toBe("none");

  const danger = reading.getByRole("button", { name: "本を読むを終了" });
  await danger.hover();
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
    const dot = node.querySelector<HTMLElement>(".project-label > span");
    const style = getComputedStyle(node);
    return {
      top: style.borderTopColor,
      dot: dot ? getComputedStyle(dot).backgroundColor : "",
      transform: style.transform,
    };
  });
  expect(identity.top).toBe(identity.dot);
  expect(identity.transform).toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const short = page.locator(".do-now-card .button-good");
  await short.hover();
  expect((await interactionStyle(short)).transform).toBe("none");
});
