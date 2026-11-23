READY FOR PRODUCTION APPROVAL

# W15 Web Demo v1.6.3 世代更新(判定書)

- 確認日: 2026-11-23
- ブランチ: `release/w15-v1.6-demo`(起点は `main` = `f887385`)
- 本番: https://life-launcher-web.takuyakou.workers.dev/(この段階では反映していない)
- 参照した Windows 版: `Takuyakou/life-launcher` タグ `v1.6.3`
- 新しい依存は足していない(`package.json`・`package-lock.json` は無変更)

## 判定

**`READY FOR PRODUCTION APPROVAL`**。`public:check`・lint・単体テスト・build・本番相当E2E・Visual QA はすべて通過しました。push・PR・マージ・Cloudflare への反映はしていません。

## コミット一覧(`f887385..HEAD`)

| 段 | コミット | 内容 |
| --- | --- | --- |
| W15-01a | `ed6bbe1` | `goal` / `resumeNote` の型・保存・初期データ・reducer・「次はここから」表示 |
| W15-01b | `8f2dc6b` | `EXTEND_TIMER` と満了ダイアログ刷新(延長分数、「次はここから」「次の次の一手」) |
| W15-01c | `57080ea` | 今日やるものを選ぶ画面の刷新(単一保存点、絞り込み、その場追加、3枠の並べ替え) |
| W15-01d | `71d000b` | v1.6.3 の色・角丸・影トークン、Before/After 見本 |
| W15-02a | `665208a` | ブラウザ完結の取り込み読み取り・検証・計画(`importDemo.ts` と単体テスト) |
| W15-02b | `5670f92` | 3段の取り込みダイアログ、導線、`COMMIT_IMPORT` / `UNDO_IMPORT`、5秒の「元に戻す」 |
| W15-03a | `3229759` | 既存 E2E / Visual の仕様同期と W15 の新規テスト |
| W15-03b | この文書のコミット | スクリーンショット・OG 画像・README・この判定書 |

## 確認の表

| 確認 | 結果 |
| --- | --- |
| `npm run public:check` | 通過。220 ファイル |
| `npm run lint` | 通過。警告 0 |
| `npm run test` | 通過。9 ファイル・107 件 |
| `npm run build` | 通過。`dist` を生成 |
| `WEB11_PREVIEW=1 npm run test:e2e` | 通過。**79 件、スキップなし**(本番と同じ CSP。`network.spec.ts`・コンソールエラー 0 を含む) |
| `WEB11_PREVIEW=1 npm run test:visual` | 通過。26 件(1920 / 1440 / 1366 / 1000 / 390) |
| `git diff --check` | 問題なし |
| v1.3 公開データの互換 | `tests/e2e/w14-release.spec.ts` の「v1.3 public data is read unchanged by this version」を変更せずに通過。`schemaVersion: 3` と保存形式は変えていない |

## 追加したテスト

- 単体: `src/demo/importDemo.test.ts`(22 件)。プロンプト文面の構造、256 KB の UTF-8 バイト判定、Markdown 崩れの修復、30 プロジェクト / 100 やりたいこと上限、文字数上限、12 色→4 色、計画と適用、Undo。
- 単体: `demo.test.ts` に延長・「次はここから」・今日やるものを選ぶ下書きの5つの不変条件・取り込みの指紋不一致・Undo を追加。`storage.test.ts` に 120 文字のプロジェクト名と `goal` / `resumeNote` の後方互換を追加。
- E2E: `tests/e2e/w15-v16-features.spec.ts`(10 件)。満了4パターン、絞り込みとその場追加、破棄確認、保存失敗時の保持、取り込みと5秒 Undo、Undo 失敗時の再試行、フォーカストラップ、IME 変換中の Enter、Reduced Motion。
- Visual: `tests/visual/w15-visual.spec.ts`(2 件)。1440 / 390 でメイン・選ぶ画面・満了ダイアログ・取り込みダイアログのはみ出しと収まりを確認。

## 見た目の確認(Before / After)

`docs/v1.6/mock/before/` と `docs/v1.6/mock/after/` に、トークン適用前後の次の画面を保存しました。

- `main-1440.png` / `main-390.png`
- `picker-1440.png` / `picker-390.png`
- `completion-1440.png` / `completion-390.png`

`docs/v1.6/mock/after/metrics.json` に、適用後の実測値を残しています。

- 色トークンは `01-base.css` の確定値と一致(`--surface #211f1a`、`--gold #e7b94d`、`--green #6fcf97`、`--radius 8px` など)。
- コントラスト比: 本文 14.48、注釈 6.04、選ぶ画面のフッター注記 6.7、選択中の絞り込みピル 7.21(いずれも 4.5 以上)。
- はみ出し: 1440 / 390 ともにページ・選ぶ画面・満了ダイアログ・取り込みダイアログで 0。ダイアログは画面内に収まる。
- 既存の Visual QA(`w14-visual-rules.spec.ts` ほか)も通過し、見出しの件数位置・重なり・フォーカスの輪に破綻はありません。

画像の最終的な見た目の判断はオーナーの目視で行ってください。色・余白・コントラストに違和感があれば、マージ前に止めて知らせてください。

## 既知の制限

- Web Demo は Windows 製品版の完全移植ではありません。手順書ビューア、記録画面・今週を決める、設定画面の完全版、ミニタイマー・拡大タイマー、複雑な D&D 並べ替え、ZIP バックアップ、複数ディスプレイ対応は含みません。
- 「まとめて取り込む」は、貼り付けた答えをブラウザ内だけで読みます。外部 AI への送信・問い合わせはしません。`trigger` / `minutes` / `shortMinutes` はプレビューに注記したうえで反映しません。
- 取り込みはプロジェクトとやりたいことだけを変え、今日の3件・実行記録・タイマーには触れません。
- 延長したタイマーは、再読み込みすると待機に戻ります(既存の Web Demo のルールどおり)。
- 事前に確認している開発用依存の `npm audit` の扱いは、v1.4 の判定書([docs/v1.4/03-release-gate.md](../v1.4/03-release-gate.md))から変えていません。

## 本番反映の手順(オーナーが行う)

1. このブランチの CI が通っていることを確かめる。
2. 「Create a merge commit」で `main` にマージする(squash しない)。Cloudflare の Git 連携が自動でビルドして本番に反映する。
3. 公開 URL で、次の点を確かめる。
   - 今やる一手に「次はここから: 3章のp.84から」が出る。
   - 今日やるものを選ぶ画面が、絞り込みピル・その場追加・3枠・「決定」になっている。
   - タイマー満了が「予定時間になりました」で、延長分数と「終わる」がある。
   - 「まとめて取り込む」が開き、サンプル回答でプレビューが出る。
4. 資産のハッシュとヘッダーが、マージ後のビルドと一致することを確かめる。

戻し方: 公開 URL での確認で問題があれば、`main` のこのマージを revert する(同じ Git 連携で一つ前の版に戻る)。新しいデプロイの仕組みは足さない。

## 提案

- 「元に戻す」の対象はプロジェクトとやりたいことだけです。今日の3件まで戻したい場合は、次の版で範囲を決めてください。
- 取り込みの指紋不一致(プレビュー後に別の変更が入った場合)は、1タブの操作では起きにくいため、E2E では保存失敗の経路で再生成を確認しています。複数タブを想定するなら、次の版でタブ間同期を扱ってください。
