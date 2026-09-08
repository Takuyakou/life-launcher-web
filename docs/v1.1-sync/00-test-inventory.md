# WEB11-00 Test Inventory

実行日2026-09-08。Web基準mainの製品コードは無変更。lockfile変更なし。

## Scriptsと今回の結果

| コマンド | 結果 | 内容 |
| --- | --- | --- |
| `npm ci` | PASS | lockfile準拠、audit 0 vulnerabilities |
| `npm run public:check` | PASS | 公開資料のpath/secret-like/runtime file検査。一般的な安全保証ではない |
| `npm run lint` | PASS | ESLint warnings=0 |
| `npm run build` | PASS | TypeScript + Vite。JS/CSSは公開版とSHA256一致 |
| `npm run test` | PASS: 22 | Vitest 2ファイル |
| `npm run test:e2e` | PASS: 16 | Chromium 4ファイル |
| `npm run test:visual` | PASS: 4 | 4viewportの撮影・overflow |
| `npx playwright test tests/audit/web11-baseline.spec.ts --workers=1` | PASS: 4 | 40 PNG + 4 metrics、現行差分を再現 |
| `git diff --check` / `git diff --cached --check` | PASS | 新規資料を含むwhitespace検査 |

その他: `dev`/`preview`は127.0.0.1:4173、`screenshot:og`はOG生成。今回OGは再生成しない。
Rust/Tauri/Installer試験はWeb監査の対象外。

## テスト単位

| ファイル | 件数 | 主な検証 |
| --- | --- | --- |
| `src/demo/demo.test.ts` | 16 | seed再現性/独立性、source派生、同文WishlistのID分離、Victory、rotation、3件/duplicate制限、除外時source保持、手動Today完了、NextStep編集、timer状態、二重stop、reset、simulation、辞書検索 |
| `src/demo/storage.test.ts` | 6 | v2 roundtrip、旧v2補完、JSON不正、v1無視、storage例外、v1/v2 key消去 |
| `tests/e2e/demo.spec.ts` | 9 | plain-text編集、未変更Enter、rotation、Builder採用と上限、除外、timer/simulation/記録、満了dialog保存/skip、reset |
| `tests/e2e/dictionary.spec.ts` | 3 | 初期focus/検索/toast/Escape復帰、keyboardでopen/close、reduced motion |
| `tests/e2e/landing.spec.ts` | 3 | CTAリンク、Demo scroll/focus、Hero mini short focus |
| `tests/e2e/network.spec.ts` | 1 | 対象操作でfetch/XHR/WebSocket/外部requestが発生しない |
| `tests/visual/visual.spec.ts` | 4 | 1366/1440/1920/390、代表状態、横overflow0。pixel comparisonなし |
| `tests/audit/web11-baseline.spec.ts` | 4 | WEB11-00専用。手動checkbox存在、満了前後完了数不変、全件checkでもnext batch不在、各状態overflow0 |

`npm run test`はVitestでありPlaywrightを含まない。CIはpublic check/lint/unit/build/E2E/visualを明示実行する。監査testは既存script/CIに混ぜず独立実行する。

## 誤ってPASS扱いしない範囲

- timer満了によるToday3完了、早期終了非完了、3/3 next batch、対象item ID整合は現行実装にも試験にもない。
- wide3/medium2/narrow1、Today0/1/2/3、project上端線、NextStep accordion、長文のカードoverlapは後続01で追加。
- Builder5/page、日付で除外解除、実行中除外拒否、保存失敗rollback、追加modalは後続02で判断/追加。
- storageの`saveDemoState`失敗通知/rollbackや全field validationは現在保証しない。
- Dictionary十字キー移動は現在のkeyboard E2Eに含まれない。Tabで操作できることと区別する。
- production deployment/preview/Git integrationはCIで検証されない。network E2Eも本番全通信の証明ではない。
- screenshot testは自動撮影＋幾何チェック。承認画像とのpixel差分試験ではない。

## 初回失敗と修正

監査専用testの初回4件は「seedの完了数=0」というテスト作成側の誤った前提で失敗した。実seedは既に1件完了している。
製品は変更せず、満了前後の完了数が同じことをassertする形に修正。再実行で4/4 PASS。
既存unit/E2E/visualの失敗はなかった。
