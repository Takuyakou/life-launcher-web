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

const rect = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
  });

test("the last section shows the Windows card and the text link to the demo", async ({ page }) => {
  await open(page);
  const final = page.locator(".lp-final");
  await expect(final.getByRole("link")).toHaveCount(2);
  await expect(final.getByRole("link", { name: "まずはブラウザで試す" })).toHaveAttribute(
    "href",
    "#demo",
  );

  const card = page.locator(".lp-get");
  await expect(card.getByRole("heading", { level: 3 })).toHaveText("Windows版を入手");
  await expect(card.locator(".lp-get-meta")).toHaveText("Windows 10 / 11 (x64) · WebView2 Runtime");
  await expect(card.locator(".lp-get-note")).toHaveText(
    "インストーラー / 単体実行 EXE / ポータブル ZIP の 3 形式・SHA256SUMS 添付",
  );
  const download = card.getByRole("link", { name: /^最新版をダウンロード\s?（GitHub Releases）$/ });
  await expect(download).toHaveAttribute("href", RELEASES);
  await expect(download).toHaveAttribute("target", "_blank");
  await expect(download).toHaveAttribute("rel", "noopener noreferrer");

  // 版の数字は札に書かない。古い2つのボタンも残っていない。
  expect(await card.innerText()).not.toMatch(/v\d+\.\d+/);
  await expect(final.getByRole("link", { name: /Windows版をダウンロード/ })).toHaveCount(0);
  await expect(final.locator(`a[href="${REPO}"]`)).toHaveCount(0);
  await expect(final.locator(".button-gold")).toHaveCount(1);
});

for (const width of [1920, 1440, 1366]) {
  // W20: 札の左端がすぐ上の安全性の一覧の左端とそろう(右端はそろえない。幅は 460px)。下端は本文(文字のリンク)とそろう。見出しは2行。
  test(`the card lines up with the privacy list above and ends with the copy at ${width}`, async ({
    page,
  }) => {
    await open(page, width);
    const list = await rect(page, ".lp-privacy-list");
    const card = await rect(page, ".lp-get");
    const copy = await rect(page, ".lp-final-copy");
    const heading = await rect(page, ".lp-final .lp-h2");
    const privacyHead = await rect(page, ".lp-privacy-head");
    expect(Math.abs(card.left - list.left)).toBeLessThanOrEqual(1);
    expect(Math.round(card.width)).toBe(460);
    expect(Math.abs(heading.left - privacyHead.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(card.bottom - copy.bottom)).toBeLessThanOrEqual(1);
    const lines = await page.locator(".lp-final .lp-h2").evaluate((node) => {
      const style = getComputedStyle(node);
      return Math.round(node.getBoundingClientRect().height / parseFloat(style.lineHeight));
    });
    expect(lines).toBe(2);
  });
}

// W20: 2列になる幅では、書体や幅に関係なく「次の一手を、」の後で折り返す。
for (const width of [1920, 1440, 1366, 1200, 1100, 1032]) {
  test(`the heading breaks after 次の一手を、 at ${width}`, async ({ page }) => {
    await open(page, width);
    const title = page.locator(".lp-final .lp-h2");
    await expect(title.locator("span")).toHaveText(["次の一手を、", "今ここで始める。"]);
    const lines = await title.locator("span").evaluateAll((nodes) =>
      nodes.map((node) => node.getClientRects().length),
    );
    expect(lines).toEqual([1, 1]);
    const tops = await title.locator("span").evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
    );
    expect(tops[1]).toBeGreaterThan(tops[0]);
  });
}

for (const width of [1000, 390]) {
  test(`the card stays inside the page at ${width}`, async ({ page }) => {
    await open(page, width, 844);
    const inner = await rect(page, ".lp-final-inner");
    const card = await rect(page, ".lp-get");
    const copy = await rect(page, ".lp-final-copy");
    expect(card.top).toBeGreaterThan(copy.bottom);
    expect(card.right).toBeLessThanOrEqual(inner.right);
    // 1列のときも、札の左端は見出しの左端とそろう。
    const heading = await rect(page, ".lp-final .lp-h2");
    expect(Math.abs(card.left - heading.left)).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBe(0);
  });
}

test("the card fills the width on a phone", async ({ page }) => {
  await open(page, 390, 844);
  const inner = await rect(page, ".lp-final-inner");
  const pad = await page
    .locator(".lp-final-inner")
    .evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft));
  const card = await rect(page, ".lp-get");
  const copy = await rect(page, ".lp-final-copy");
  expect(Math.round(card.width)).toBe(Math.round(inner.width - pad * 2));
  // 縦並びの間は 24px だけ(本文の下に空きを作らない)。
  expect(Math.round(card.top - copy.bottom)).toBe(24);
});

test("the download button copies the start-button hover; the text link turns gold", async ({
  page,
}) => {
  await open(page);
  const button = page.locator(".lp-get-button");
  await button.scrollIntoViewIfNeeded();
  const underline = () =>
    button.evaluate((node) => getComputedStyle(node, "::after").transform);
  await expect(button).toHaveCSS("background-color", "rgb(231, 185, 77)");
  expect(await underline()).toBe("matrix(0, 0, 0, 1, 0, 0)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(255, 206, 91)");
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
  await expect.poll(underline).toBe("matrix(1, 0, 0, 1, 0, 0)");

  const link = page.locator(".lp-final-try");
  await expect(link).toHaveCSS("color", "rgb(198, 190, 176)");
  await link.hover();
  await expect(link).toHaveCSS("color", "rgb(255, 206, 91)");
});

test("the privacy section lists the stack as four round chips instead of a sentence", async ({
  page,
}) => {
  await open(page);
  const head = page.locator(".lp-privacy-head");
  const chips = head.getByRole("list", { name: "使っている技術" }).getByRole("listitem");
  await expect(chips).toHaveText(["Tauri 2", "Rust", "React", "TypeScript"]);
  await expect(chips.first()).toHaveCSS("border-radius", "999px");
  const heights = await chips.evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
  );
  expect(new Set(heights).size).toBe(1);

  const text = await head.innerText();
  expect(text).not.toContain("静的SPA");
  expect(text).not.toContain("Vite");
  await expect(page.locator(".lp-privacy-tech")).toHaveCount(0);
});
