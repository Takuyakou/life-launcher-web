import { expect, test } from "@playwright/test";

test("interactive demo performs no fetch, XHR, WebSocket, or external request", async ({ page }) => {
  const runtimeRequests: string[] = [];
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr", "websocket"].includes(request.resourceType())) runtimeRequests.push(request.url());
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/");
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /辞書を開く/ }).click();
  await page.getByRole("searchbox", { name: "辞書を検索" }).fill("読書");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "本を10分読むを5分で開始" }).click();
  await page.getByRole("button", { name: /終了/ }).click();

  expect(runtimeRequests).toEqual([]);
  expect(externalRequests).toEqual([]);
});
