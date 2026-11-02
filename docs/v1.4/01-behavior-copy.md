# W14-01 動きと文言 — 報告

## 判定

`DONE`

## 実装内容の要約

- 今やる一手: 今日の3件に未完了で入っている次の一手を先頭にし(理由「今日の3件に入っている一手です」)、ほかは登録順。「他の一手」の選択はプロジェクトの ID を画面の状態として持つ(保存しない)。
- 今やる一手から開始したタイマーを、今日の3件の項目(未完了で1件だけあるとき)につなげた。実行中・一時停止・満了の表示と、満了確定での完了が両方向でそろう。
- 今日の3件の件数は「{完了} / {件数} 完了」か「0件」だけにし、「変更」を「編集」に、勝利条件の光り方を Windows 版 v1.4 の決まりに合わせた。

## 変更ファイル

- `src/demo/doNow.ts` — 並び順と理由
- `src/components/DemoFrame.tsx` — ID での選択、今日の3件との連動、注記、件数、「編集」、勝利条件のクラス
- `src/components/NextStepDialog.tsx` — 見出し「次の一手を編集」
- `src/styles.css` — 勝利条件の hover・編集中
- `README.md`、`docs/README.md` — 並び順と連動の説明
- テスト: `src/demo/doNow.test.ts`(新規)、`src/demo/demo.test.ts`、`tests/e2e/w14-behavior.spec.ts`(新規)、`tests/e2e/{core-journey,demo,do-now,public-copy,source-lock,sync}.spec.ts`、`tests/visual/do-now.spec.ts`
- `docs/v1.4/01-behavior-copy.md`、`docs/v1.4/01-screens/`

`src/demo/reducer.ts`、`types.ts`、`storage.ts`、`seed.ts` は変更していない。タイマーと完了の連動は、START 時に `todayItemId` を渡すだけで実現している(reducer は今のまま)。

## 完了条件ごとの結果

- [x] 今日の3件に未完了で入っている次の一手が先頭、理由は Windows 版と同じ — `doNow.test.ts`、`w14-behavior.spec.ts`
- [x] 「他の一手」がプロジェクトの ID で保たれる。`doNowIndex` の保存形式は変更なし。押しても保存は起きない(押す前後で localStorage の文字列が同一であることを E2E で確認)
- [x] 今やる一手からの開始が、今日の3件のカードと両方向でつながる(表示・一時停止・再開・満了・完了)。別プロジェクト・やりたいこと由来・完了済み・今日の3件に無いものは完了にしない(reducer のテスト)。`earlyTarget` は変更していない(既存の `earlyCompletion.test.ts`、`early-completion.spec.ts` が通る)
- [x] 件数「0件」/「{完了} / {件数} 完了」、「編集」(ボタン・見出し・`title`)
- [x] 勝利条件: 入力済みで hover すると枠が金色・背景が明るく・1px 浮く(120ms、達成済みでも同じ)。未入力は変わらない。キーボードではボタンの輪だけで枠は変わらない。編集中は枠が強いまま
- [x] 必須ゲートがローカルで通る

## 実行したゲート

| ゲート | 結果 |
| --- | --- |
| `npm run public:check` | 通過(154 ファイル) |
| `npm run lint` | 通過 |
| `npm run test` | 68 件通過(7 ファイル) |
| `npm run build` | 通過 |
| `npm run test:e2e`(`WEB11_PREVIEW=1`) | 58 件通過 |
| `npm run test:visual`(`WEB11_PREVIEW` なし) | 18 件通過 |
| `git diff --check` | 問題なし |

CI は待っていない(README の決まり)。

## スクリーンショット

`docs/v1.4/01-screens/` に前後を保存。`before/` は `origin/main`(`923f072`)のビルド、`after/` はこのブランチ。

- `01-do-now.png` — 今やる一手(前: 学習 / 後: 読書「今日の3件に入っている一手です」)
- `02-today3.png` — 今日の3件の見出し(前: 「2件」+「1 / 2 完了」 / 後: 「1 / 2 完了」)
- `03-next-step.png` — 次の一手(「変更」→「編集」)
- `04-victory-hover.png` — 勝利条件に hover
- `05-do-now-running.png`、`06-today3-running.png` — 今やる一手から開始した直後(後は両方に「実行中」)

## 書き換えた既存テストと理由

- `src/demo/demo.test.ts` 「derives Do Now candidates only from Projects with a NextStep」: seed の今日の3件に読書の次の一手があり先頭になるため、登録順の確認だけが目的のこのテストでは `todayItems` を空にした
- `tests/e2e/core-journey.spec.ts`、`source-lock.spec.ts`: 「変更」→「編集」、「次の一手を変更」→「次の一手を編集」
- `tests/e2e/demo.spec.ts`(Do Now rotates…)、`do-now.spec.ts`(色の順)、`public-copy.spec.ts`、`tests/visual/do-now.spec.ts`: 新しい seed の初期表示が「読書(amber)→学習(violet)→運動(green)」になったため、期待する順を入れ替えた。理由の文言も追加
- `tests/e2e/sync.spec.ts`(paused replacement…): 今やる一手の先頭が「本を読む」になり、同じタイマーの一時停止が表示されるため、置き換え先を「他の一手」で学習に切り替えてから開始する形にした(確かめる内容は同じ)
- `tests/e2e/source-lock.spec.ts`(Do Now completion…): 旧: 今やる一手からの完了は、今日の3件で使用中の次の一手を置き換えられない。新: 連動により今日の3件の項目が完了し、そのうえで次の一手を置き換えられる(今日の3件のカードから開始した場合と同じ)。テスト名と内容を書き換えた

## 判断メモ

- ローカルの `main` が `origin/main` より 16 コミット古かったので、`origin/main`(`923f072`)から `feature/w14-01-behavior-copy` を切った。前に開いていた `feature/p7-02-early-completion-demo` には触れていない。
- Windows 版 `Takuyakou/life-launcher` のタグ `v1.4.0` と Release v1.4.0 があることを確認した(公開 2026-10-30)。
- seed の今日の3件に読書の次の一手が未完了で入っているので、新しい訪問者が最初に見る今やる一手は「数分だけ読む」(読書)になる。seed は変更していない(仕様どおり)。
- ランディングのヒーローにある静的なミニプレビューは「学習 / 参考書を10ページ進める」のままで、今やる一手の初期表示と食い違う。紹介文の範囲なので W14-03 に回す(`public-copy.spec.ts` の、ヒーローと今やる一手を同じ値にする確認はヒーロー側だけ残した)。
- 「クリックで編集が始まるのは本文と編集ボタンだけ」: 今の Web Demo では編集ボタンだけが編集を始める(枠も本文も押しても何も起きない)。「今の作りは変えない」に従い、本文クリックでの編集は足していない。起動時の自動フォーカスは Web Demo に無いので対象外。
- 未入力の勝利条件は画面からは作れない(空は保存しない)ため、E2E は localStorage を直接書いて確認した。
- 「保存に失敗したとき変更前の状態を保つ」は既存の仕組み(`dispatch` が保存失敗で戻す)を使っており、今やる一手から開始→完了だけの専用テストは足していない。既存の失敗系テスト(`remove-today`、`early-completion`、`sync`)は通っている。
- 「選んだプロジェクトが候補から消えたら先頭に戻る」は画面の状態の effect で処理している。UI から次の一手を空にする操作が無いため、E2E では確認していない。

## 提案

- W14-03: ヒーローのミニプレビューを、初期の今やる一手(読書)に合わせるか、見え方の違いを許容するか決める。
- 今やる一手から開始したときの完了確認ダイアログで次の一手を編集できるようになった(今日の3件のカードから開始した場合と同じ)。Windows 版 v1.4 の挙動と照らして問題ないか、W14-03 の確認時に見てほしい。
