READY FOR PRODUCTION APPROVAL

# W14-03 Web Demo v1.4 公開前の確認(判定書)

- 確認日: 2026-11-02
- ブランチ: `release/w14-v1.4-demo`(PR [#15](https://github.com/Takuyakou/life-launcher-web/pull/15)、`main` 向け。W14-01(#13)・W14-02(#14)の変更を含む)
- 候補のコミット: `2ba1ec6`(CI は成功: GitHub Actions run [41374292877](https://github.com/Takuyakou/life-launcher-web/actions/runs/41374292877)、`verify` 3分32秒)。このあとの判定書のコミットは文書だけ
- 起点: `main` = `923f072`(v1.3 対応の公開版)
- 本番: https://life-launcher-web.takuyakou.workers.dev/(`main` へのマージで反映。この Stage では反映していない)
- 参照した Windows 版: `Takuyakou/life-launcher` タグ `v1.4.1`(Release 公開 2026-11-01、事前に確認)

## 判定

**`READY FOR PRODUCTION APPROVAL`**。すべての確認が通りました。`npm audit` は、5件を直し、ESLint 系の12件をオーナー判断で受け入れて通過とします(下の欄)。

## `npm audit` の扱い(オーナー判断 2026-11-02)

5件を直した。ESLint 系の12件は開発用の依存だけで公開物に入らないため、オーナー判断で受け入れ(2026-11-02)。

- 更新前: 17件(高 3・中 14)。更新後: 12件(中 12、高 0)。`npm audit --omit=dev --audit-level=moderate` は更新の前後とも 0 件。
- 直したのは `package-lock.json` だけ。`package.json` は変えていない。`npm audit fix --force` は使っていない。
- `npm audit fix` は、直す対象以外の `typescript-eslint` 系と `@eslint/eslintrc` も上げるため、使わずに戻した。代わりに対象のパッケージだけ `npm update vite vitest @vitest/mocker source-map-js brace-expansion` で上げた(ESLint 系のパッケージは1つも変わっていない)。
- 更新後に残るのは、ESLint 系の12件だけ(すべて中。元は `minimatch` の GHSA-g3hv-75wg-m249 で、`eslint`、`@eslint/config-array`、`@eslint/eslintrc`、`@eslint-community/eslint-utils`、`typescript-eslint`、`@typescript-eslint/{eslint-plugin,parser,type-utils,typescript-estree,utils}`、`eslint-plugin-react-refresh` に波及)。ほかは残らず、新しく出たものもない。ESLint の更新は次の版で行う。

### 更新前後のバージョン

| パッケージ | 更新前 | 更新後 | 備考 |
| --- | --- | --- | --- |
| `vite` | 8.2.1 | 8.3.5 | 開発用(直接)。同じメジャー、要件 8.2.4 以上 |
| `vitest` | 4.1.11 | 4.1.12 | 開発用(直接)。要件 4.1.12 以上 |
| `@vitest/mocker` | 4.1.11 | 4.1.12 | 要件 4.1.12 以上 |
| `source-map-js` | 1.2.1 | 1.2.2 | 要件 1.2.2 以上 |
| `brace-expansion`(トップ) | 1.1.18 | 1.1.21 | 勧告の修正版 |
| `brace-expansion`(`typescript-estree` の中) | 5.0.9 | 5.0.12 | 勧告の修正版 |
| 上の更新に伴って上がったもの | | | `rolldown` 1.2.4 → 1.2.16(と `@rolldown/binding-*`)、`@oxc-project/types` 0.144.0 → 0.156.0、`postcss` 8.5.26 → 8.5.32、`nanoid` 3.3.18 → 3.3.20、`chai` 6.2.2 → 6.3.0、`tinyrainbow` 3.1.1 → 3.2.0、`@vitest/{expect,pretty-format,runner,snapshot,spy,utils}` 4.1.11 → 4.1.12 |

公開物に入る依存(`react`、`react-dom`)は変わっていない。

### ビルドした公開物の差(更新前 `5675bc5` と更新後 `2ba1ec6`)

| ファイル | 結果 |
| --- | --- |
| `index.html` | ハッシュつきのファイル名だけが違う(中身は同じ) |
| `assets/index-*.js` | ハッシュが変わった(`index-8KNGLZK9.js` → `index-Ct41p4qS.js`)。大きさは同じ(201,060 バイト)。違いはバンドラー(rolldown 1.2.4 → 1.2.16)の出力で、CommonJS の補助コードの引数と、`!(typeof window>…` が `typeof window<…` になるような同じ意味の書き換え、それに伴う変数名の入れ替わり。アプリの文言・ロジックを変えるものは見つかっていない。本番プレビューの E2E 69件と Visual QA 24件が通ることで確かめた |
| `assets/index-*.css` | 同じ(同じハッシュ) |
| `_headers`、`favicon.svg`、`og-image.png` | 同じ |

## 確認の表

| 確認 | 結果 |
| --- | --- |
| 新しい `npm ci`(更新後の lockfile) | 通過。166 パッケージ、3秒 |
| `npm run public:check` | 通過。195 ファイル、1秒 |
| `npm run lint` | 通過。警告 0、2秒 |
| `npm run test` | 通過。8 ファイル・71 件、1秒 |
| `npm run build` | 通過。35 モジュール、2秒 |
| `WEB11_PREVIEW=1 npm run test:e2e` | 通過。**69 件、スキップなし**、18秒(本番と同じ CSP) |
| 通常の `npm run test:e2e`(開発サーバー) | 67 件通過、2 件は本番プレビュー専用のためスキップ(`production.spec.ts` と、中心の流れの通信監視) |
| `npm run test:visual`(`WEB11_PREVIEW` なし) | 通過。24 件、26秒 |
| `git diff --check` | 問題なし |
| `npm audit --audit-level=moderate` | 5件を直した。12件(ESLint 系、中)は上の欄のとおりオーナー判断で受け入れ |
| `npm audit --omit=dev --audit-level=moderate` | 通過。0 件 |
| CI(候補 `2ba1ec6`) | 通過(`verify`: install、public:check、lint、unit、build、E2E、Visual QA) |
| 公開物の走査 `923f072..HEAD` | 通過。追加行に個人のパス・メールアドレス・秘密情報・トークンらしい文字列なし(ユーザーフォルダーのパス、利用者名、メールアドレス、トークンや API キーの接頭辞、パスワード・秘密・API キー・トークンを表す語で検索。`package-lock.json` を含む)。画像は目で確認し、合成データだけで個人データ・実際のパスなし |

## 本番相当(CSP つき)の確認

`WEB11_PREVIEW=1` の E2E(69 件)に、次が含まれて通っています。

- `production.spec.ts`: 出荷する `public/_headers` の CSP を当てて、コンソールエラー・読めない資産・WebSocket の通信がないこと。
- `network.spec.ts`: fetch・XHR・WebSocket・外部への通信がないこと。
- `w14-release.spec.ts` の中心の流れ: 登録からタイマー・完了・再読み込みまでの間、コンソールエラー・ページエラー・失敗した読み込み・fetch/XHR/WebSocket・外部への通信がないこと。

## 保存データ(localStorage)の保護

v1.3 の公開版(`923f072`)をビルドして実際に操作し、保存された v3 のデータを `tests/e2e/fixtures/v1.3-public-state.json` に残した(勝利条件を編集して達成、今日の3件に3件目を追加して「本を読む」を完了、やりたいことを追加、次の一手を編集、やりたいことの開閉。公開版の画面には候補を除外する操作がないので、`candidateExcludedSourceIds` だけ手で足した)。`schemaVersion`、`seed.ts`、`types.ts`、`storage.ts` は `923f072` から変更なし。

| 確認 | テスト | 結果 |
| --- | --- | --- |
| 新しい版で読めて、全項目が変わらない(勝利条件、今日の3件と完了、次の一手、やりたいこと、候補の除外、実行記録、開閉)。読み込みで書き込みが起きない | `src/demo/v13-data.test.ts`、`w14-release.spec.ts` | 通過 |
| 再読み込みしても今日の3件が保たれる(保存の文字列も同一) | `w14-release.spec.ts` | 通過 |
| 今やる一手の並びが変わっても、保存の形式・中身が変わらない。「他の一手」で保存が起きない | `w14-release.spec.ts`、`do-now.spec.ts`、`w14-behavior.spec.ts` | 通過 |
| 保存に失敗したとき変更前を保つ(今やる一手からの開始、完了の確定。再試行で完了) | `w14-release.spec.ts` ほか既存の失敗系 | 通過 |
| 古いデータで完了済みの今日の3件の項目を、今やる一手の先頭にしない | `v13-data.test.ts`、`w14-release.spec.ts` | 通過 |

## 中心の流れ

次の一手とやりたいことの登録 → 今日やるものを選ぶ → 今やる一手が今日の3件の一手に変わる → タイマー → 完了 → 次の候補 → 再読み込みで保たれる。`w14-release.spec.ts`(本番プレビュー)で通過。今やる一手から開始したとき、今日の3件のカードにも「実行中」が出ることも確認している。

## Visual QA

幅 1920 / 1440 / 1366 / 1000 / 390 で通過(既存の `visual.spec.ts`、`sync.spec.ts`、`early-completion.spec.ts`、`remove-today.spec.ts` と、W14-02 の `w14-visual-rules.spec.ts`)。はみ出し・重なり・切れなし。幅 390 のフォーカスの輪とダイアログも画面内に収まる。

## W14-02 の報告への判断(オーナー、2026-11-02)の反映

- 完了ダイアログの「終わる」を赤にした(既存の赤のボタン。「保存して終わる」は緑のまま。「終わる」だけが出る場合も赤)。テスト: `w14-visual.spec.ts`。
- 幅 390 の見出しの高さは、指示どおりそのままにした。
- ヒーローの小さなプレビューを、今やる一手の最初の表示(読書「数分だけ読む」)とプロジェクト色(amber。黄色は使わない)に合わせた。テスト: `public-copy.spec.ts`。プレビューは静的な見本で、デモの操作には追従しない。

## `main` との差分の分類(`923f072..HEAD`、67 ファイル)

| 区分 | ファイル |
| --- | --- |
| W14-01 の実装 | `src/demo/doNow.ts`、`src/components/DemoFrame.tsx`、`src/components/NextStepDialog.tsx`、`src/styles.css`(勝利条件) |
| W14-02 の実装 | `src/components/{CompletionDialog,ConfirmDialog,NextStepDialog,TodayPicker,WishlistDialog,DemoFrame}.tsx`、`src/styles.css`、`src/sync.css` |
| W14-03 の実装 | `src/App.tsx`(ヒーロー)、`src/experience.css`、`src/components/CompletionDialog.tsx` |
| 依存(lockfile のみ) | `package-lock.json`(上の欄の更新。`package.json` は変更なし) |
| 画像 | `public/og-image.png`、`docs/screenshots/web-demo-v1.4.png`(古い画像は削除していない) |
| テスト(単体) | `src/demo/{doNow,v13-data}.test.ts`(新規)、`demo.test.ts`、`sync-docs.test.ts` |
| テスト(E2E・Visual) | `tests/e2e/{w14-behavior,w14-visual,w14-release}.spec.ts`(新規)、`tests/e2e/fixtures/v1.3-public-state.json`(新規)、`tests/visual/w14-visual-rules.spec.ts`(新規)、書き換え: `core-journey`、`demo`、`do-now`、`public-copy`、`source-lock`、`sync`、`tests/visual/do-now` |
| 文書 | `README.md`、`docs/README.md`、`docs/v1.4/01-behavior-copy.md`、`docs/v1.4/02-visual-rules.md`、`docs/v1.4/03-release-gate.md` |
| スクリーンショット | `docs/v1.4/01-screens/`、`docs/v1.4/02-screens/` |

`package.json`、`public/_headers`、`.github/workflows/ci.yml`、`src/demo/{reducer,storage,seed,types}.ts` は変更していない。この差分は W14-01〜W14-03 の内容と、上の lockfile の更新だけ。

## 既知の制限

- ブラウザのデモで、Windows 製品版の完全移植ではない。表示サイズ(大・特大)、ミニタイマー、拡大タイマー、サイドバーの待機中 Timer、設定画面、記録画面、空グループの案内、今やる一手の残りの並び順(長く空いたプロジェクト、今週の重点など)は含まない。
- 開発用の依存に、ESLint 系の勧告が12件残っている(中。元は `minimatch` の GHSA-g3hv-75wg-m249 など)。開発用の依存だけで公開物には入らない(`npm audit --omit=dev` は 0 件)。オーナー判断で受け入れ(2026-11-02)、ESLint の更新は次の版で行う。
- Windows 版 v1.4.1 で廃止された「タイマーを開始しました」の通知は、Web Demo ではまだ出る(今回の Stage の範囲外)。
- 「他の一手」で選んだプロジェクトが候補から消えたら先頭に戻る動きは、UI から次の一手を空にする操作がないため、E2E では確認していない(画面の状態の処理。W14-01 の報告に記載)。
- 画像の日付は、Visual QA と同じ固定の合成日付(9月9日)。

## 本番反映の手順(オーナーが行う)

1. この PR の CI が通っていることを確かめる(候補 `2ba1ec6` は通過済み。判定書のコミットは文書だけ)。
2. 「Create a merge commit」で `main` にマージする(squash しない)。Cloudflare の Git 連携が自動でビルドして本番に反映する。
3. 公開 URL で反映を確かめる(W14-04)。マージ後の `main` の tree が、CI が通った候補 `2ba1ec6` の tree と同じであることを `git rev-parse <commit>^{tree}` で確かめる(判定書のコミットは文書だけなので、`git diff --name-only 2ba1ec6..<最終のコミット>` が文書だけであること)。

戻し方: 公開 URL での確認で問題があれば、`main` のこのマージを revert する(同じ Git 連携で一つ前の版に戻る)。新しいデプロイの仕組みは足さない。

## 提案

- 次の版で ESLint 系(`eslint`、`typescript-eslint` など)を更新して、残りの12件をなくす。
- Windows 版 v1.4.1 に合わせて、タイマーの開始・一時停止の通知をやめるかどうか(今回は対象外)。
