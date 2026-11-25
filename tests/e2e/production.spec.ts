import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// W21-05: 「やりたいこと」と「今日の実行」は、最初は閉じている。中を確かめる前に開く。
const openSection = async (
  page: import("@playwright/test").Page,
  name: "wishlist" | "activity",
) => {
  const toggle = page.locator(`.dl-${name} .dl-section-disclosure`);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
};

test("production bundle works under shipped CSP without runtime network or console errors", async ({
  page,
  baseURL,
}) => {
  test.skip(!process.env.WEB11_PREVIEW, "Run with WEB11_PREVIEW=1 after build");
  const headers = Object.fromEntries(
    readFileSync("public/_headers", "utf8")
      .split(/\r?\n/)
      .filter((line) => line.startsWith("  "))
      .map((line) => {
        const index = line.indexOf(":");
        return [
          line.slice(0, index).trim().toLowerCase(),
          line.slice(index + 1).trim(),
        ];
      }),
  );
  const errors: string[] = [],
    traffic: string[] = [],
    missing: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("websocket", (socket) => traffic.push(socket.url()));
  page.on("request", (request) => {
    if (
      ["fetch", "xhr"].includes(request.resourceType()) ||
      new URL(request.url()).origin !== new URL(baseURL!).origin
    )
      traffic.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) missing.push(response.url());
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), ...headers },
    });
  });
  await page.goto("/");
  await page.locator("#screen").scrollIntoViewIfNeeded();

  const timer = page.getByRole("region", { name: "デモタイマー" });

  // A refused wishlist entry keeps its dialog open and leaves no phantom row.
  await page
    .getByRole("button", { name: "＋ やりたいこと", exact: true })
    .click();
  const addDialog = page.getByRole("dialog", { name: "やりたいことを追加" });
  await addDialog.getByRole("textbox").fill("<svg onload=alert(1)>");
  await addDialog.getByRole("button", { name: "追加", exact: true }).click();
  await expect(addDialog).toHaveCount(0);
  await openSection(page, "wishlist");
  await expect(
    page.locator(".dl-wishlist-row").getByText("<svg onload=alert(1)>", { exact: true }),
  ).toBeVisible();

  await page.locator(".dl-wishlist .dl-section-disclosure").click();
  await expect(page.locator(".dl-wishlist-row")).toHaveCount(0);
  await page.locator(".dl-wishlist .dl-section-disclosure").click();
  await expect(
    page.locator(".dl-wishlist-row").getByText("<svg onload=alert(1)>", { exact: true }),
  ).toBeVisible();

  const reading = page.getByRole("article", { name: "数分だけ読む", exact: true });
  await reading.getByRole("button", { name: "25分", exact: true }).click();
  await page.getByRole("button", { name: /5分経過まで進める/ }).click();
  await timer.getByRole("button", { name: "終了", exact: true }).click();
  await page
    .getByRole("button", { name: "未完了のまま終了", exact: true })
    .click();
  await reading.getByRole("button", { name: "5分", exact: true }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  await page.getByRole("button", { name: "終わる", exact: true }).click();
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
  expect(traffic).toEqual([]);
  expect(missing).toEqual([]);
});

test("metadata and packaged assets remain available", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Life Launcher | 今やる一手を決める");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Life Launcher/,
  );
  for (const asset of ["/favicon.svg", "/og-image.png"])
    expect((await page.request.get(asset)).status()).toBe(200);
});
