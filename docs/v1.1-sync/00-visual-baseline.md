# WEB11-00 Visual Baseline

2026-09-08、基準Web main `e08d69a3975632611177a0166661116ed274b597`をローカルで起動して記録。本体UIは変更していない。
公開JS/CSSとの同一性は[監査](00-gap-audit.md)参照。これは本番画面を直接撮影したものではない。

## 再現

以下は監査時commit `f34770d`での再現コマンド。同期実装後のHEADでは、この歴史的監査testをskipし、`tests/visual/sync.spec.ts`で新仕様を検証する。旧画像は上書きしない。

```sh
npm ci
npx playwright test tests/audit/web11-baseline.spec.ts --workers=1
```

Chromium、各test独立のlocalStorage、seedのみ。日付は2026-09-08 03:00 UTC固定、reduced-motion。テストがローカルserverを起動・終了する。
監査testは現行の不足挙動もassertする歴史的記録であり、今後の同期仕様の合格条件ではない。通常の`test:e2e`/`test:visual`/CIには含めない。

## 成果物

4viewport × 10状態 = **40 PNG**、layout metrics JSON 4件。すべて[baseline/](baseline/)に保存。

| 状態 suffix | 操作・意味 |
| --- | --- |
| `hero` | 初期landing |
| `default` | demo先頭、Today2件・うち1件seed完了 |
| `builder` | 初期7候補を表示 |
| `lower` | NextStep cardとlower sections |
| `today3` | Builderから3件目を採用 |
| `timer` | 本を読むを5分開始、環境simulationとsidebar timer |
| `completion-dialog` | Demo加速で満了dialog表示 |
| `after-timer` | dialogをskip。Today完了数が増えない状態 |
| `completed-no-next-batch` | 全3件をmanual check。next-batchボタンが存在しない証拠 |
| `dictionary` | 辞書open/search focus |

next batch画面は**未実装のため撮影不可**。存在しない画面を作らず、全3件完了状態とボタン不在assertで記録した。
PNGはviewport範囲。長いBuilderは縦scrollが必要。固定headerを避けて対象見出しを上に揃える。

| viewport | Today3 | Builder | 全件完了 | Dictionary | metrics |
| --- | --- | --- | --- | --- | --- |
| 1366×768 | [PNG](baseline/1366-today3.png) | [PNG](baseline/1366-builder.png) | [PNG](baseline/1366-completed-no-next-batch.png) | [PNG](baseline/1366-dictionary.png) | [JSON](baseline/1366-metrics.json) |
| 1440×900 | [PNG](baseline/1440-today3.png) | [PNG](baseline/1440-builder.png) | [PNG](baseline/1440-completed-no-next-batch.png) | [PNG](baseline/1440-dictionary.png) | [JSON](baseline/1440-metrics.json) |
| 1920×1080 | [PNG](baseline/1920-today3.png) | [PNG](baseline/1920-builder.png) | [PNG](baseline/1920-completed-no-next-batch.png) | [PNG](baseline/1920-dictionary.png) | [JSON](baseline/1920-metrics.json) |
| 390×844 | [PNG](baseline/390-today3.png) | [PNG](baseline/390-builder.png) | [PNG](baseline/390-completed-no-next-batch.png) | [PNG](baseline/390-dictionary.png) | [JSON](baseline/390-metrics.json) |

## 観察

- 全4サイズ・全10状態でdocument horizontal overflow=0。
- Today3は全サイズで縦row。1440のrow幅は1130px、高さ51px。3列カードの密度ではない。
- project dot色と緑/青timerは見えるが、Todayカード上端のproject色線はない。
- モバイルは項目名・project・buttonが段落ちする縦レイアウト。Builder7件は長く、5/pageの価値がある。
- Heroは製品名・3-step・mini green開始を維持。miniからDemoのshort startへのfocusは既存E2EでPASS。
- Dictionaryは5サンプルtileと検索focus。native管理操作はない。
- 上記PNGの代表例（desktop Today3、mobile Today3、Dictionary、wide Hero）を画像として確認した。全画像のpixel-diff/全要素overlap検出まではしていない。
- 既存Visual QAはスクリーンショット取得とoverflow assertionであり、承認済み画像との比較試験ではない。自動PASSだけで本体との見た目一致とは言わない。
