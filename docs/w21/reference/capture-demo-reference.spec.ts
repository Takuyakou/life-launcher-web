import { expect, test } from "@playwright/test";
import { createPublicFixture, FIXTURE_DATE, FIXTURE_NOW } from "./fixtures";
import { installTauriMock } from "./tauriMock";

test("@manual capture demo-data main", async ({ browser }) => {
  const page = await browser.newPage({ deviceScaleFactor: 2, colorScheme: "dark", locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const f = createPublicFixture();
  const c = f.config;
  c.groups = ["ショートカット"];
  c.buttons = [
    { id: "browser", label: "ブラウザ", icon: "□", group: "ショートカット", showInSidebar: true, showInOverlay: true, overlayPageId: "tools", aliases: ["Web"], description: "", actions: [{ type: "open_url", payload: { url: "https://example.invalid/" } }] },
    { id: "memo", label: "メモ", icon: "□", group: "ショートカット", showInSidebar: true, showInOverlay: true, overlayPageId: "tools", aliases: [], description: "", actions: [{ type: "open_app", payload: { path: "C:\\PublicDemo\\Apps\\Memo.exe" } }] },
    { id: "photos", label: "写真", icon: "□", group: "ショートカット", showInSidebar: true, showInOverlay: true, overlayPageId: "tools", aliases: [], description: "", actions: [{ type: "open_folder", payload: { path: "C:\\PublicDemo\\Photos" } }] },
  ] as typeof c.buttons;
  c.dictionaryOrder = ["browser", "memo", "photos"];
  const ns = (text: string) => ({ text, buttonIds: [], defaultTimerMinutes: 25, shortTimerMinutes: 5 });
  c.projects = [
    { id: "reading", name: "読書", northStar: "読みたい本を1冊読み終える", weeklyFocus: true, nextStep: { ...ns("数分だけ読む"), trigger: "3章のp.84から" }, colorId: "amber" },
    { id: "study", name: "学習", northStar: "参考書を1冊終える", weeklyFocus: true, nextStep: ns("参考書を10ページ進める"), colorId: "violet" },
    { id: "exercise", name: "運動", northStar: "毎日少し体を動かす", weeklyFocus: true, nextStep: ns("ストレッチをする"), colorId: "green" },
  ] as typeof c.projects;
  c.today = { ...c.today, date: FIXTURE_DATE, victory: { text: "後回しにしていたことを1つ終わらせる", done: false },
    items: [
      { text: "ストレッチをする", done: true, sourceKey: "project:exercise", projectId: "exercise" },
      { text: "数分だけ読む", done: false, sourceKey: "project:reading", projectId: "reading" },
    ] } as typeof c.today;
  c.inbox = [
    { id: "wish-book", text: "気になっていた本を読む", projectId: "reading" },
    { id: "wish-words", text: "英単語を20個復習する", projectId: "study" },
    { id: "wish-walk", text: "近所をゆっくり歩く" },
  ] as typeof c.inbox;
  f.doNowCandidates = [
    { projectId: "reading", reason: "manualOrder", restartEligible: true },
    { projectId: "study", reason: "manualOrder", restartEligible: true },
    { projectId: "exercise", reason: "manualOrder", restartEligible: true },
  ];
  await page.clock.install({ time: new Date(FIXTURE_NOW).getTime() });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installTauriMock(page, f, "main");
  await page.goto("/");
  await expect(page.locator("main, [role=main]").first()).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/w21/reference/win164-1440.png", fullPage: true });
  await page.evaluate(() => {
    document.querySelectorAll(".topPillGroup--autostart, .topPillsDivider, .windowControls, [class*=windowControl]").forEach((n) => ((n as HTMLElement).style.display = "none"));
    const labels = [...document.querySelectorAll(".topPillGroup--work .viewToggleButton")] as HTMLElement[];
    const set = (b: HTMLElement, text: string) => { const l = b.querySelector(".viewToggleButtonLabel"); if (l) l.textContent = text; };
    if (labels[0]) labels[0].style.display = "none";
    if (labels[1]) { set(labels[1], "リセット"); const i = labels[1].querySelector("svg"); if (i) (i as unknown as HTMLElement).style.display = "none"; }
    if (labels[2]) labels[2].style.display = "none";
    const group = document.querySelector(".topPillGroup--work");
    if (group) { const pill = document.createElement("span"); pill.textContent = "WEB DEMO"; pill.style.cssText = "align-self:center;margin-right:10px;padding:2px 10px;border:1px solid rgba(231,185,77,.6);border-radius:999px;color:#ffce5b;font-size:11px;font-weight:700;letter-spacing:.06em"; group.prepend(pill); }
    const walk = (root: Node) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.nodeValue?.includes("14日以上空いているため")) n.nodeValue = "今日の3件に入っている一手です"; if (n.nodeValue === "8月13日") n.nodeValue = "11月25日"; if (n.nodeValue === "木曜日") n.nodeValue = "水曜日"; } };
    walk(document.body);
  });
  await page.addStyleTag({ content: ".todayGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.timerPanel:not(.timerPanel--mini){padding:16px 14px 14px!important}.timerPanel:not(.timerPanel--mini) .timerActionText{font-size:17px!important}.timerPanel:not(.timerPanel--mini) .timerClock{font-size:42px!important}.timerPanel:not(.timerPanel--mini) .nextStepTimerStepButton{min-width:40px!important;min-height:40px!important}.timerPanel:not(.timerPanel--mini) .nextStepTimerValueInput{min-height:40px!important;font-size:15px!important}" });
  await page.setViewportSize({ width: 1120, height: 1060 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "docs/w21/reference/demo-v164.png" });

});
