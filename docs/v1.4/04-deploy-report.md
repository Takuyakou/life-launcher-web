DEPLOYED

# W14-04 本番反映の確認(報告)

- 確認日: 2026-11-02
- 公開 URL: https://life-launcher-web.takuyakou.workers.dev/
- 確かめたコミット: `main` = `b47d707`(PR [#15](https://github.com/Takuyakou/life-launcher-web/pull/15) のマージコミット。tree `fcdf350`)
- CI が通った候補: `2ba1ec6`(tree `5b0561d`)。`b47d707` との差は `docs/v1.4/03-release-gate.md` だけ(`git diff --name-only 2ba1ec6 b47d707`)
- 反映の方法: 既存の Cloudflare Workers Static Assets の Git 連携(新しい仕組みは足していない)
- 製品のコードは変えていない。この Stage の変更は、この報告とスクリーンショットだけ
- 参照した Windows 版: `Takuyakou/life-launcher` タグ `v1.4.1`(Release 公開 2026-11-01、事前に確認)

## 判定

**`DEPLOYED`**。問題は見つかりませんでした。

## 各項目の結果

| # | 確認 | 結果 |
| --- | --- | --- |
| 1 | 反映された版 | 通過。公開 URL の `index.html` は、`main` をビルドした `dist/index.html` と同じ(改行コードの違いだけを除く)。参照する資産は `assets/index-Ct41p4qS.js` と `assets/index-D8lYhO2o.css` で、`main` のビルドと一致。JS・CSS・`og-image.png` はバイト単位で同一(SHA-256 が同じ)、`favicon.svg` は改行コードを除いて同一。古い版の JS(`index-8KNGLZK9.js`)のパスは、存在しないパスと同じ扱い(`index.html` を返す)で、古い資産はもう配信されていない。`index.html` は `Cache-Control: public, max-age=0, must-revalidate`。`main` のコミットの Cloudflare ビルド(`Workers Builds`)と CI(`verify`)も成功 |
| 2 | CSP | 通過。配信されているヘッダー(`content-security-policy`、`referrer-policy`、`x-content-type-options`、`x-frame-options`、`permissions-policy`)の5つすべてが、`public/_headers` の値と文字列まで一致。`connect-src 'none'` を含む。JS の配信でも CSP と `nosniff` が付いている |
| 3 | 外部への通信 | 通過。新しいブラウザのプロファイルで、ページの読み込みと中心の流れの間に、外部への通信・fetch・XHR・WebSocket はなし(`network.spec.ts`、`production.spec.ts`、`w14-release.spec.ts` を公開 URL に対して実行。コンソールエラー・失敗した読み込みもなし) |
| 4 | 中心の流れ(新しいプロファイル) | 通過。次の一手とやりたいことの登録 → 今日やるものを選ぶ → 今やる一手が今日の3件の一手に変わる(理由「今日の3件に入っている一手です」)→ タイマー → 完了 → 次の候補 → 再読み込みで保たれる(`w14-release.spec.ts` を公開 URL で実行) |
| 5 | v1.4 の変更 | 通過。新しいプロファイルで確認: 今日の3件の見出しは「1 / 2 完了」と説明文だけ(「N件」なし)、次の一手のボタンは「編集」、今やる一手は「数分だけ読む」(読書)。4つの見出しの件数の左端は、幅 1440 で 4つとも 380.6px、幅 390 で 4つとも 129.6px(差 0)。未入力の勝利条件は、マウスを乗せると枠だけ金色になり(`rgb(157, 127, 37)` → `rgb(239, 200, 74)`)、「今日はこれができれば勝ち」の文字色は変わらない(`rgb(170, 163, 151)`)。キーボードで見出しに移ると輪は1つ。ヒーローのプレビューは「プロジェクト: 読書 / 数分だけ読む」で今やる一手と一致。保存データ(v1.3 公開版で作った v3)の読み込み・失敗時の保護も通過(`w14-release.spec.ts`) |
| 6 | 幅 1440 と 390 | 通過。はみ出し・重なり・崩れなし(横スクロールなし。Visual QA 24件を公開 URL に対して実行して通過。幅 1920 / 1366 / 1000 も含む) |
| 7 | 「Windows版をダウンロード」 | 通過。README と紹介ページ(配信中の JS の中)のリンクは `https://github.com/Takuyakou/life-launcher/releases/latest`。GitHub はこれを `releases/tag/v1.4.1` に 302 で転送し、最新の Release は v1.4.1(2026-11-01 公開、プレリリースではない) |
| 8 | 累積 PR の整理 | 完了。#13(W14-01)は、#15 のマージで GitHub が自動的にマージ済みと表示した(変更は #15 に含まれる)ので、「#15 で `main` に入った」とコメントだけした。#14(W14-02)は同じコメントをして、マージせずにクローズした。二重にマージしていない。ブランチ(`feature/w14-01-behavior-copy`、`feature/w14-02-visual-rules`、`release/w14-v1.4-demo`)は削除していない(削除してよいが、必須ではない) |
| 9 | この報告の PR | 下の手順を参照 |

公開 URL に対する自動テストの結果: E2E 69件通過(`WEB11_BASE_URL` を公開 URL にして `WEB11_PREVIEW=1`、23秒)、Visual QA 24件通過。

## 配信中の資産(SHA-256)

| ファイル | SHA-256 |
| --- | --- |
| `assets/index-Ct41p4qS.js` | `4108a070e0b8392ba97d45aa7f577b1f8f2f9261fa20533f043de8fa1c4a16eb` |
| `assets/index-D8lYhO2o.css` | `6a7348359bd6ecf1f2198cee5f59f0f63466fc89327e39ce8a81f893d2c84ea4` |
| `favicon.svg` | `efd14b021fde9aa6f405d0da3d6fd591bb22d19405ff41a30d45a2a5f30513dd` |
| `og-image.png` | `bcda43341506528a6102e7914e192eabf4d3cf59e7f77b8dc6c02c71f86bc10e` |

## スクリーンショット(公開 URL、新しいプロファイル)

`docs/v1.4/04-screens/`

- `demo-1440.png`、`demo-390.png` — Demo 部分の全体
- `picker-390.png` — 幅 390 の今日やるものを選ぶ画面
- `hover-victory-empty.png` — 未入力の勝利条件にマウスを乗せた状態
- `focus-heading.png` — キーボードで見出しに移ったときの輪

## この報告の PR をマージした後の確認(文書だけの変更)

この PR は文書とスクリーンショットだけですが、`main` へのマージで Cloudflare の再ビルド・再反映が起きます。マージ後に、オーナーかこの担当が、アプリの中身が変わっていないことを確かめてください。

1. `git rev-parse <マージ後の main>^{tree}` と、`b47d707` の tree に対して `git diff --name-only b47d707 <マージ後の main>` が `docs/` の下だけであること。
2. 公開 URL の `index.html` が、まだ `assets/index-Ct41p4qS.js` と `assets/index-D8lYhO2o.css` を参照していること。
3. 上の SHA-256 の4つが同じこと(`curl -s <公開 URL>/assets/index-Ct41p4qS.js | sha256sum` など)。
4. `content-security-policy` ほか5つのヘッダーが `public/_headers` と同じこと。

違いがあれば、そこで止めて報告し、戻す場合は下の手順に従ってください。

## 戻し方(W14-03 の判定書より)

公開 URL での確認で問題があれば、`main` のこのマージ(`b47d707`)を revert する。同じ Git 連携で一つ前の版(`923f072` の v1.3 公開版)に戻る。新しいデプロイの仕組みは足さない。戻したあとも、公開 URL の資産とヘッダーを上と同じ方法で確かめる。今回は問題がなかったので、戻していない。

## 提案

- 次の版で ESLint 系(`eslint`、`typescript-eslint` など)を更新して、`npm audit` に残る12件をなくす(W14-03 の判定書の既知の制限)。
- Windows 版 v1.4.1 で廃止された「タイマーを開始しました」の通知を、Web Demo でも廃止するかどうか。
- 不要になったブランチ(`feature/w14-01-behavior-copy`、`feature/w14-02-visual-rules`、`release/w14-v1.4-demo`)の削除。
