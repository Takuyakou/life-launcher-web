import { expect, test, type Page } from "@playwright/test";

const completion = (page: Page) =>
  page.getByRole("dialog", { name: "予定時間になりました" });
const openPicker = async (page: Page) => {
  await page.getByRole("button", { name: "今日やるものを選ぶ" }).click();
  return page.getByRole("dialog", { name: "今日やるものを選ぶ" });
};
const openImport = async (page: Page) => {
  await page.getByRole("button", { name: /まとめて取り込む/ }).click();
  return page.getByRole("dialog", { name: "まとめて取り込む" });
};
const finishAndExtend = async (page: Page) => {
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "続ける(+15分)" })).toBeVisible();
  await dialog.getByRole("button", { name: "延長分数を5分減らす" }).click();
  await expect(dialog.getByRole("button", { name: "続ける(+10分)" })).toBeVisible();
  await dialog.getByRole("button", { name: "続ける(+10分)" }).click();
  await expect(page.getByRole("timer")).toHaveText("10:00");
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
});

test("満了 1: a NextStep outside Today 3 saves 次はここから after extending", async ({
  page,
}) => {
  for (const label of ["本を読む", "ストレッチをする"]) {
    await page
      .getByRole("article", { name: label, exact: true })
      .getByRole("button", { name: "今日の3件から外す" })
      .click();
  }
  await page.locator("[data-demo-do-now-short]").click();
  await finishAndExtend(page);

  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  await expect(dialog).toContainText("予定 15分");
  await dialog
    .getByRole("textbox", { name: "次はここから(任意)" })
    .fill("p.90から");
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(page.getByText("次はここからを保存しました")).toBeVisible();
  await expect(page.locator(".do-now-card")).toContainText(
    "次はここから: p.90から",
  );
  await expect(page.locator(".next-section")).toContainText(
    "次はここから: p.90から",
  );
});

test("満了 2: a Today 3 NextStep can save 次の次の一手", async ({ page }) => {
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "本を読むを5分で開始" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  const input = dialog.getByRole("textbox", { name: "次の次の一手(任意)" });
  await expect(input).toHaveValue("数分だけ読む");
  await input.fill("2章を読み切る");
  await dialog.getByRole("button", { name: "保存して終わる" }).click();
  await expect(
    page.getByRole("status", { name: "本を読む：完了" }),
  ).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("2章を読み切る", { exact: true }),
  ).toBeVisible();
});

test("満了 3: a Wishlist item with a Project records with 終わる only", async ({
  page,
}) => {
  const picker = await openPicker(page);
  await picker
    .getByRole("button", { name: "気になっていた本を読むを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await page
    .getByRole("button", { name: "気になっていた本を読むを5分で開始" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  await expect(
    dialog.getByRole("textbox", { name: "次の次の一手(任意)" }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("textbox", { name: "次はここから(任意)" }),
  ).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "続ける(+15分)" })).toBeVisible();
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "気になっていた本を読む：完了" }),
  ).toBeVisible();
});

test("満了 4: an unassigned Wishlist item records with 終わる only", async ({
  page,
}) => {
  const picker = await openPicker(page);
  await picker
    .getByRole("button", { name: "近所をゆっくり歩くを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "決定" }).click();
  await page.getByRole("button", { name: "近所をゆっくり歩くを5分で開始" }).click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  await expect(
    dialog.getByRole("textbox", { name: "次の次の一手(任意)" }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "近所をゆっくり歩く：完了" }),
  ).toBeVisible();
});

test("Today Picker filters by Project, adds in place, and orders the three slots", async ({
  page,
}) => {
  const picker = await openPicker(page);
  const pills = picker.getByRole("group", { name: "プロジェクトで絞り込む" });
  await expect(pills.getByRole("button", { name: "すべて" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await pills.getByRole("button", { name: "読書" }).click();
  await expect(
    picker.getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" }),
  ).toHaveCount(0);
  await expect(
    picker.getByText("気になっていた本を読む", { exact: true }),
  ).toBeVisible();

  const quick = picker.getByRole("textbox", {
    name: "「読書」のやりたいことを追加",
  });
  await quick.fill("読書メモを整理する");
  await quick.press("Enter");
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await expect(
    picker.locator(".today-picker-slot", { hasText: "読書メモを整理する" }),
  ).toHaveCount(1);
  await expect(quick).toHaveValue("");

  await quick.fill("4件目");
  await quick.press("Enter");
  await expect(
    picker.getByText(
      "今日の3件は3件埋まっています。候補に追加してあるので、入れ替えて選べます。",
    ),
  ).toBeVisible();
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );

  const slots = picker.locator(".today-picker-slot.is-selected");
  await picker.getByRole("button", { name: "読書メモを整理するを上へ移動" }).click();
  await expect(slots.nth(1)).toContainText("読書メモを整理する");
  await picker.getByRole("button", { name: "読書メモを整理するを下へ移動" }).click();
  await picker.getByRole("button", { name: "読書メモを整理するを今日から外す" }).click();
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );

  await picker.getByRole("button", { name: "決定" }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(2);
});

test("Today Picker keeps the draft when a save fails, and a discard asks first", async ({
  page,
}) => {
  const picker = await openPicker(page);
  await picker
    .getByRole("button", { name: "参考書を10ページ進めるを今日の3件に追加" })
    .click();
  await picker.getByRole("button", { name: "キャンセル" }).click();
  const discard = page.getByRole("dialog", { name: "選んだ内容を破棄しますか？" });
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "編集を続ける" }).click();
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );

  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      throw new Error(`fail ${key.length + value.length}`);
    };
  });
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(picker).toBeVisible();
  await expect(
    picker.getByText("保存できませんでした。選んだ内容は保持しています。"),
  ).toBeVisible();
  await expect(picker.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await picker.getByRole("button", { name: "決定" }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(3);

  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "今日の3件から外す" })
    .click();
  const reopened = await openPicker(page);
  await reopened
    .getByRole("button", { name: "参考書を10ページ進めるを今日から外す" })
    .click();
  await reopened.getByRole("button", { name: "キャンセル" }).click();
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "破棄する" }).click();
  await expect(reopened).toHaveCount(0);
  await expect(page.locator(".today-row")).toHaveCount(2);
});

test("import: copy warning, sample preview, commit and 5 second undo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.reload();
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "本を読むを5分で開始" })
    .click();

  const dialog = await openImport(page);
  await expect(dialog).toContainText(
    "コピー内容には現在のプロジェクトや行動が含まれます。外部AIに送る前に内容を確認してください。",
  );
  await dialog.getByRole("button", { name: "初回作成用をコピー" }).click();
  await expect(dialog.getByText("コピーしました")).toBeVisible();

  await dialog.getByRole("button", { name: "サンプルの AI 回答を貼ってみる" }).click();
  await expect(dialog.getByText("✓ 読み取りました")).toBeVisible();
  await expect(dialog).toContainText("プロジェクト 2・次の一手 1・やりたいこと 4");
  await expect(dialog).toContainText(
    "きっかけとタイマーの分数は、Web Demo では取り込みません。Windows 版では反映されます。",
  );
  await expect(dialog).not.toContainText("projects[");

  await dialog
    .getByRole("checkbox", {
      name: "「読みかけの本を開いて次の見出しまで10分読む」を取り込む",
    })
    .uncheck();
  await expect(dialog).toContainText("5件のうち 4件を取り込みます");
  await expect(dialog.getByRole("button", { name: "取り込む(4件)" })).toBeEnabled();
  await dialog.getByRole("button", { name: "取り込む(4件)" }).click();
  await expect(dialog).toHaveCount(0);

  const toast = page.locator(".toast-undoable");
  await expect(toast).toContainText("4件を取り込みました");
  await page.waitForTimeout(1500);
  await expect(toast).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("英語", { exact: true }),
  ).toBeVisible();

  await toast.hover();
  await page.waitForTimeout(3800);
  await expect(toast).toBeVisible();
  await page.mouse.move(0, 0);
  await toast.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.getByText("取り込みを元に戻しました")).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("英語", { exact: true }),
  ).toHaveCount(0);
});

test("import: a failed undo keeps the snapshot for a retry", async ({ page }) => {
  const dialog = await openImport(page);
  await dialog.getByRole("button", { name: "サンプルの AI 回答を貼ってみる" }).click();
  await expect(dialog.getByText("✓ 読み取りました")).toBeVisible();
  await dialog.getByRole("button", { name: "取り込む(5件)" }).click();
  const toast = page.locator(".toast-undoable");
  await expect(toast).toContainText("5件を取り込みました");

  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original;
      throw new Error(`fail ${key.length + value.length}`);
    };
  });
  await toast.getByRole("button", { name: "元に戻す" }).click();
  await expect(
    page.getByText("元に戻せませんでした。もう一度「元に戻す」を押してください。"),
  ).toBeVisible();
  await expect(toast.getByRole("button", { name: "元に戻す" })).toBeVisible();

  await toast.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.getByText("取り込みを元に戻しました")).toBeVisible();
  await expect(
    page.locator(".next-section").getByText("英語", { exact: true }),
  ).toHaveCount(0);
});

test("dialogs trap Tab, close on Escape and keep the IME Enter guard", async ({
  page,
}) => {
  await page
    .getByRole("article", { name: "本を読む", exact: true })
    .getByRole("button", { name: "本を読むを5分で開始" })
    .click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const dialog = completion(page);
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(
          document.activeElement?.closest(".completion-dialog"),
        ),
      ),
    ).toBe(true);
  }
  await dialog.getByRole("button", { name: "終わる", exact: true }).click();

  const picker = await openPicker(page);
  await picker.getByRole("button", { name: "本を読むを今日から外す" }).click();
  await page.keyboard.press("Escape");
  const discard = page.getByRole("dialog", { name: "選んだ内容を破棄しますか？" });
  await expect(discard).toBeVisible();
  await expect(
    discard.getByRole("button", { name: "編集を続ける" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(discard).toHaveCount(0);
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: "キャンセル" }).click();
  await discard.getByRole("button", { name: "破棄する" }).click();
  await expect(picker).toHaveCount(0);

  const importDialog = await openImport(page);
  await page.keyboard.press("Escape");
  await expect(importDialog).toHaveCount(0);

  await page.locator("[data-demo-do-now-short]").click();
  await page.getByRole("button", { name: /満了まで進める/ }).click();
  const later = completion(page);
  const input = later.getByRole("textbox", { name: "次はここから(任意)" });
  await input.fill("変換中のEnterでは閉じない");
  await input.evaluate((node) => {
    node.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
      }),
    );
  });
  await expect(later).toBeVisible();
  await later.getByRole("button", { name: "終わる", exact: true }).click();
  await expect(later).toHaveCount(0);
});

test("reduced motion removes the picker transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const picker = await openPicker(page);
  await expect(picker.locator(".today-picker-progress > span")).toHaveCSS(
    "transition-duration",
    /^(0s|1e-05s)$/,
  );
  await expect(picker.locator(".today-picker-pill").first()).toHaveCSS(
    "transition-duration",
    /^(0s|1e-05s)$/,
  );
});
