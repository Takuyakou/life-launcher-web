import { expect, test, type Page } from "@playwright/test";

const RELEASES = "https://github.com/Takuyakou/life-launcher/releases/latest";

const open = async (page: Page, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
};

test("the last section shows the Windows card and the text link to the demo", async ({ page }) => {
  await open(page);
  const final = page.locator(".lp-final");
  await expect(final.getByRole("link")).toHaveCount(2);
  await expect(final.getByRole("link", { name: "まずはブラウザで試す" })).toHaveAttribute(
    "href",
    "#screen",
  );

  const card = page.locator(".lp-get");
  await expect(card.getByRole("heading", { level: 3 })).toHaveText("Windows版を入手");
  await expect(card.locator(".lp-get-meta")).toHaveText("Windows 10 / 11 (x64) · WebView2 Runtime");
  await expect(card.locator(".lp-get-note")).toHaveText(
    "インストーラー / 単体実行 EXE / ポータブル ZIP の 3 形式・SHA256SUMS 添付",
  );
  const download = card.getByRole("link", { name: /^最新版をダウンロード\s?（GitHub Releases）$/ });
  await expect(download).toHaveAttribute("href", RELEASES);
  await expect(download.locator("span")).toHaveText(["最新版をダウンロード", "（GitHub Releases）"]);

  // 版の数字は札に書かない。
  expect(await card.innerText()).not.toMatch(/v\d+\.\d+/);
});

test("the download button copies the start-button hover; the text link turns gold", async ({
  page,
}) => {
  await open(page);
  const button = page.locator(".lp-getbtn");
  await button.scrollIntoViewIfNeeded();
  const underline = () =>
    button.evaluate((node) => getComputedStyle(node, "::after").transform);
  await expect(button).toHaveCSS("background-color", "rgb(231, 185, 77)");
  expect(await underline()).toBe("matrix(0, 0, 0, 1, 0, 0)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(255, 206, 91)");
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -1)");
  await expect.poll(underline).toBe("matrix(1, 0, 0, 1, 0, 0)");

  const link = page.locator(".lp-try");
  await expect(link).toHaveCSS("color", "rgb(198, 190, 176)");
  await link.hover();
  await expect(link).toHaveCSS("color", "rgb(255, 206, 91)");
});
