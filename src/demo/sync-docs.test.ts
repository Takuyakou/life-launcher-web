import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("shipped copy no longer promises manual Today completion or a free-input Builder", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const frame = readFileSync("src/components/DemoFrame.tsx", "utf8");
  const reducer = readFileSync("src/demo/reducer.ts", "utf8");
  expect(app).not.toContain("チェック状態");
  expect(frame).not.toContain("Inbox");
  expect(frame).not.toContain("<select");
  expect(reducer).not.toContain("TOGGLE_TODAY_ITEM");
  expect(frame).toContain("Demoでは起動動作を演出しています。");
});

it("published README references a real synthetic PNG and documents current demo limits", () => {
  const readme = readFileSync("README.md", "utf8");
  expect(readme).toContain("docs/screenshots/web-demo-v1.1.png");
  expect(readme).toContain("今日の3件から外す");
  expect(readme).toContain("日付が変わっても自動ではリセットされません");
  expect(readme).toContain("満了未確定");
  expect(readme).toContain("localStorage");
  expect(readme).toContain("releases/latest");
  expect(readme).not.toContain("releases/tag/v1.0.0");
  const png = readFileSync("docs/screenshots/web-demo-v1.1.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBeGreaterThan(1000);
  expect(png.readUInt32BE(20)).toBeGreaterThan(500);
});
