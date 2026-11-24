import { expect, test, type Page } from "@playwright/test";

const RELEASES = "https://github.com/Takuyakou/life-launcher/releases/latest";
const REPO = "https://github.com/Takuyakou/life-launcher";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
};

const edges = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { left: Math.round(rect.left), right: Math.round(rect.right) };
  });

test("header links go to the page sections, GitHub and the Windows release", async ({
  page,
}) => {
  await open(page);
  const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
  await expect(nav.getByRole("link", { name: "できること" })).toHaveAttribute("href", "#why");
  await expect(nav.getByRole("link", { name: "Web Demo" })).toHaveAttribute("href", "#demo");
  await expect(nav.getByRole("link", { name: "安全性" })).toHaveAttribute("href", "#privacy");
  for (const [name, href] of [
    ["GitHub", REPO],
    ["Windows版", RELEASES],
  ] as const) {
    const link = nav.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("hero start buttons move to and focus the matching demo timer button", async ({
  page,
}) => {
  await open(page);
  await page.locator(".lp-hero-start").click();
  await expect(page.locator("[data-demo-do-now-short]")).toBeFocused();
  await expect(page.locator("#demo")).toBeInViewport();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator(".lp-hero-start-normal").click();
  await expect(page.locator("[data-demo-do-now-normal]")).toBeFocused();
  await expect(page.locator("[data-demo-do-now-normal]")).toHaveAccessibleName(
    "数分だけ読むを25分で開始",
  );
  await expect(page.locator("#demo")).toBeInViewport();
});

for (const width of [1920, 1440, 1366, 1000, 390]) {
  test(`hero tagline keeps each of its two lines on one line at ${width}`, async ({
    page,
  }) => {
    await open(page, width);
    const lines = await page.locator(".lp-hero-lead > span").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        const range = document.createRange();
        range.selectNodeContents(node);
        const tops = new Set(
          Array.from(range.getClientRects(), (rect) => Math.round(rect.top)),
        );
        return {
          text: node.textContent,
          lineCount: tops.size,
          overflows: node.scrollWidth > node.clientWidth + 1,
          whiteSpace: style.whiteSpace,
        };
      }),
    );
    expect(lines.map((line) => line.text)).toEqual(["「何をしよう？」を", "「今これをやる」に変える。"]);
    for (const line of lines) {
      expect(line.lineCount).toBe(1);
      expect(line.overflows).toBe(false);
      expect(line.whiteSpace).toBe("nowrap");
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBe(0);
  });
}

for (const width of [1920, 1440, 1366]) {
  test(`every section lines up on the same left and right edges at ${width}`, async ({
    page,
  }) => {
    await open(page, width);
    const content = await edges(page, ".lp-hero-grid");
    const pad = await page
      .locator(".lp-hero-grid")
      .evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft));
    const left = content.left + pad;
    const right = content.right - pad;

    for (const selector of [
      ".lp-hero-copy",
      ".lp-why .lp-eyebrow",
      ".lp-why-grid",
      ".lp-demo .lp-eyebrow",
      ".lp-demo-steps",
      ".lp-demo-window",
      ".lp-features .lp-eyebrow",
      ".lp-feature-grid",
      ".lp-privacy .lp-eyebrow",
      ".lp-final .lp-eyebrow",
      ".lp-footer-inner > span",
    ]) {
      const box = await edges(page, selector);
      expect(Math.abs(box.left - left), `${selector} left`).toBeLessThanOrEqual(1);
    }
    for (const selector of [
      ".lp-hero-visual",
      ".lp-why-grid",
      ".lp-demo-steps",
      ".lp-demo-window",
      ".lp-feature-grid",
      ".lp-privacy-list",
      ".lp-footer-links",
    ]) {
      const box = await edges(page, selector);
      expect(Math.abs(box.right - right), `${selector} right`).toBeLessThanOrEqual(1);
    }
  });
}

test("the three WHY pictures have the same height so their headings line up", async ({
  page,
}) => {
  await open(page);
  const tops = await page.locator(".lp-why-heading").evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
  );
  expect(tops).toHaveLength(3);
  expect(new Set(tops).size).toBe(1);
  const heights = await page.locator(".lp-why-art").evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
  );
  expect(heights).toEqual([204, 204, 204]);
});

test("landing copy uses the approved wording", async ({ page }) => {
  await open(page);
  await expect(page.locator(".lp-hero .lp-eyebrow")).toHaveText("WINDOWS DESKTOP APP");
  await expect(page.getByRole("heading", { level: 2, name: "管理するためではなく、始めるために。" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "開始までの流れを試す。" })).toBeVisible();
  await expect(page.locator(".lp-demo-lead")).toHaveText("サンプルデータだけで安全に試せます。");
  await expect(page.getByRole("heading", { level: 2, name: "次の一手を、今ここで始める。" })).toBeVisible();
  await expect(page.locator(".lp-eyebrow")).toHaveText([
    "WINDOWS DESKTOP APP",
    "WHY LIFE LAUNCHER?",
    "INTERACTIVE DEMO",
    "FEATURES",
    "PRIVACY / SECURITY",
    "READY?",
  ]);
  await expect(page.locator(".lp-demo-step-title")).toHaveText([
    "今日やるものを選ぶ",
    "5分で始める",
    "終えて、次を書き残す",
    "まとめて取り込む",
  ]);
  await expect(page.locator('.lp-feature-tag[data-tag="demo"]')).toHaveCount(4);
  await expect(page.locator('.lp-feature-tag[data-tag="staged"]')).toHaveText("Web Demo は演出");
  await expect(page.locator('.lp-feature-tag[data-tag="windows"]')).toHaveText("Windows版");
  await expect(page.locator(".lp-footer")).toContainText("利用条件は GitHub リポジトリにあります。");

  const text = await page.evaluate(() => document.body.innerText);
  expect(text).not.toContain("localStorage");
  expect(text).not.toMatch(/\bText\b/);
  expect(text).not.toContain("ブラウザで、開始までの流れを試す");
  expect(text).not.toContain("Windows固有機能は、Web上の演出として再現します");
  expect(text).not.toContain("Usage terms");
});

test("the last section has the two CTAs only and the faint 05:00 stays inside it", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await open(page, width, 844);
    const final = page.locator(".lp-final");
    await expect(final.getByRole("link")).toHaveCount(2);
    await expect(final.getByRole("link", { name: "ブラウザで試す" })).toHaveAttribute("href", "#demo");
    await expect(final.getByRole("link", { name: /Windows版をダウンロード/ })).toHaveAttribute(
      "href",
      RELEASES,
    );
    await expect(final.getByRole("link", { name: /GitHub/ })).toHaveCount(0);

    const ghost = page.locator(".lp-final-ghost");
    await expect(ghost).toHaveAttribute("aria-hidden", "true");
    await expect(ghost).toHaveText("05:00");
    const inside = await page.evaluate(() => {
      const section = document.querySelector(".lp-final")!.getBoundingClientRect();
      const mark = document.querySelector(".lp-final-ghost")!.getBoundingClientRect();
      return (
        mark.top >= section.top &&
        mark.bottom <= section.bottom &&
        mark.left >= section.left &&
        mark.right <= section.right + 8
      );
    });
    expect(inside, `05:00 inside the section at ${width}`).toBe(true);
  }
});

test("buttons and links respond to hover; headings do not", async ({ page }) => {
  await open(page);
  const colorOf = (selector: string, property: string) =>
    page.locator(selector).first().evaluate(
      (node, prop) => getComputedStyle(node).getPropertyValue(prop),
      property,
    );

  const primary = ".lp-hero .button-gold";
  await expect(page.locator(primary)).toHaveCSS("background-color", "rgb(231, 185, 77)");
  await page.hover(primary);
  await expect(page.locator(primary)).toHaveCSS("background-color", "rgb(255, 206, 91)");

  const secondary = ".lp-hero .lp-cta-secondary";
  const secondaryBefore = await colorOf(secondary, "background-color");
  await page.hover(secondary);
  await expect(page.locator(secondary)).not.toHaveCSS("background-color", secondaryBefore);

  const nav = '.lp-nav-link[href="#why"]';
  await expect(page.locator(nav)).toHaveCSS("color", "rgb(198, 190, 176)");
  await page.hover(nav);
  await expect(page.locator(nav)).toHaveCSS("color", "rgb(255, 206, 91)");

  for (const selector of [".lp-hero-lead", ".lp-features-title"]) {
    const before = await page.locator(`${selector} span`).evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).color),
    );
    await page.hover(selector);
    const after = await page.locator(`${selector} span`).evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).color),
    );
    expect(after, `${selector} keeps its colours on hover`).toEqual(before);
  }
});

test("the display font is served from this site", async ({ page }) => {
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });
  await open(page);
  const loaded = await page.evaluate(() =>
    Array.from(document.fonts)
      .filter((font) => font.status === "loaded")
      .map((font) => `${font.family.replaceAll('"', "")} ${font.weight}`),
  );
  expect(loaded).toEqual(
    expect.arrayContaining(["Bricolage Grotesque 700", "Bricolage Grotesque 800"]),
  );
  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) {
    expect(new URL(url).origin).toBe(new URL(page.url()).origin);
  }
  await expect(page.locator(".lp-hero-title")).toHaveCSS(
    "font-family",
    /Bricolage Grotesque/,
  );
});

test("phone layout: card before the buttons, short start only, header keeps the download", async ({
  page,
}) => {
  await open(page, 390, 844);
  const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
  await expect(nav.getByRole("link", { name: "できること" })).toBeHidden();
  await expect(nav.getByRole("link", { name: "Windows版", exact: true })).toBeVisible();
  await expect(page.locator(".lp-hero-start-normal")).toBeHidden();
  await expect(page.locator(".lp-hero-start")).toBeVisible();

  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().top;
    return {
      description: top(".lp-hero-description"),
      card: top(".lp-hero-card"),
      tryButton: top(".lp-hero .button-gold"),
    };
  });
  expect(order.description).toBeLessThan(order.card);
  expect(order.card).toBeLessThan(order.tryButton);

  await expect(page.getByText("PCで開くとデモをより操作しやすく確認できます。")).toBeVisible();
  const steps = await page.locator(".lp-demo-steps").evaluate((node) => ({
    scrolls: node.scrollWidth > node.clientWidth,
    overflowX: getComputedStyle(node).overflowX,
  }));
  expect(steps).toEqual({ scrolls: true, overflowX: "auto" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBe(0);
});
