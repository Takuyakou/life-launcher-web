import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("shipped copy no longer promises manual Today completion or a free-input Builder", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const demo = readFileSync("src/components/DemoWindow.tsx", "utf8");
  const landing = readFileSync("src/landing/Landing.tsx", "utf8");
  const reducer = readFileSync("src/demo/reducer.ts", "utf8");
  expect(app).not.toContain("チェック状態");
  expect(demo).not.toContain("Inbox");
  expect(demo).not.toContain("<select");
  expect(reducer).not.toContain("TOGGLE_TODAY_ITEM");
  expect(landing).toContain("サンプルデータだけで安全に試せます。");
  expect(landing).toContain("デモはWindows版をすべて移したものではありません。");
});

it("published README references a real synthetic PNG and documents current demo limits", () => {
  const readme = readFileSync("README.md", "utf8");
  expect(readme).toContain("docs/screenshots/web-demo-landing.png");
  expect(readme).not.toMatch(/Life Launcher v\d+\.\d+/);
  expect(readme).not.toContain("今日を組み立てる");
  expect(readme).toContain("次はここから");
  expect(readme).toContain("まとめて取り込む");
  expect(readme).toContain("今日の3件から外す");
  expect(readme).toContain("日付が変わっても自動ではリセットされません");
  expect(readme).toContain("満了未確定");
  expect(readme).toContain("このブラウザの中に保存します");
  expect(readme).not.toContain("localStorage");
  expect(readme).toContain("releases/latest");
  expect(readme).not.toContain("releases/tag/v1.0.0");
  const png = readFileSync("docs/screenshots/web-demo-landing.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBeGreaterThan(1000);
  expect(png.readUInt32BE(20)).toBeGreaterThan(500);
});
