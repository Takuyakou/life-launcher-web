READY FOR PRODUCTION APPROVAL

# W16 Web Demo トップページの作り直し(判定書)

- 確認日: 2026-11-24
- ブランチ: `feat/w16-landing`(起点は `main` = `356befe`。W15 のマージ #17)
- 本番: https://life-launcher-web.takuyakou.workers.dev/(この段階では反映していない)
- 参照した見本: 採用したモック「Life Launcher Web Demo 作り直しモック」
- 新しい npm 依存は足していない(`package.json`・`package-lock.json` は無変更)。見出しの英字の書体 Bricolage Grotesque(SIL Open Font License 1.1)は、`src/assets/fonts/` にファイルで同梱し、外部へ取りに行かない(`font-src 'self'` のまま)

## 判定

**`READY FOR PRODUCTION APPROVAL`**。`public:check`・lint・単体テスト・build・本番相当E2E・Visual QA はすべて通過しました。push・PR・マージ・Cloudflare への反映はしていません。デモの中身(W15 で入れたアプリの画面と動き)は変えていません。

## コミット一覧(`356befe..HEAD`)

| 段 | コミット | 内容 |
| --- | --- | --- |
| W16-01 | `ef0f6cf` | トップページの作り直し(ヘッダー・最初の画面・3 つの理由・デモの案内・機能・安全性・最後の呼びかけ・フッター)、同梱の書体、`src/mobile-polish.css` の削除 |
| W16-02 | `62bb30a` | 使われなくなった古いトップページの CSS の削除(`src/styles.css`・`src/experience.css`) |
| W16-03 | `8a0aa94` | 既存 E2E / Visual の仕様同期と W16 の新規テスト |
| W16-04 | この文書のコミット | スクリーンショット・OG 画像・README・この判定書 |

## 確認の表

| 確認 | 結果 |
| --- | --- |
| `npm run public:check` | 通過。229 ファイル |
| `npm run lint` | 通過。警告 0 |
| `npm run test` | 通過。9 ファイル・107 件 |
| `npm run build` | 通過。`dist` を生成(同梱の書体 2 ファイルを含む) |
| `WEB11_PREVIEW=1 npm run test:e2e` | 通過。**95 件、スキップなし**(本番と同じ CSP。`network.spec.ts`・コンソールエラー 0 を含む) |
| `WEB11_PREVIEW=1 npm run test:visual` | 通過。32 件(1920 / 1440 / 1366 / 1000 / 390) |
| `git diff --check main` | 問題なし |
| v1.3 公開データの互換 | `tests/e2e/w14-release.spec.ts` の「v1.3 public data is read unchanged by this version」を変更せずに通過。`schemaVersion: 3` と保存形式は変えていない |

## 追加したテスト

- E2E: `tests/e2e/w16-landing.spec.ts`(16 件)。ヘッダーの行き先、最初の画面の開始ボタンとデモのボタンの対応、2 行のコピーが 1 行ずつで収まること(5 幅)、全部の段の左右の端が 1px 以内でそろうこと(3 幅)、3 つの理由の絵の高さがそろうこと、決めた文言、最後の節が 2 つのボタンだけであることと薄い 05:00 が節の中にあること、ボタンとリンクはホバーで変わり見出しは変わらないこと、書体をこのサイトから配ること、スマホの並びとヘッダー。
- Visual: `tests/visual/w16-landing-visual.spec.ts`(6 件)。1920 / 1440 / 1366 / 1000 / 390 でのはみ出し 0 と全体の撮影、本文のコントラスト比 4.5 以上。
- 今あるテストを変えたのは、次の 6 ファイルだけです。トップページの絵に同じ言葉が出るようになったため `demo.spec.ts` の該当の確かめをデモの中(`#demo`)に絞り、`landing.spec.ts` は Windows版へのリンクの数を 3 → 4 に、`public-copy.spec.ts` は最初の画面のカードを新しい名前と文言に、`visual.spec.ts`・`sync.spec.ts`・`web11-baseline.spec.ts` はヘッダーと最初の画面の名前(`.lp-header`・`.lp-hero`・`.lp-hero-primary`)に合わせました。

## ホバーの決まり

すべて 120ms です。動きを減らす設定の時は浮きません(今のサイト全体の決まりのまま)。

| 物 | 乗せた時 |
| --- | --- |
| 「ブラウザで試す」(金) | 明るい金になり、1px 浮いて影 |
| 「Windows版をダウンロード」「Windows版」(枠付き) | 地の色と枠が少し明るくなり、1px 浮いて影 |
| 「5分で始める」(緑)・「通常25分」(青) | 今のデモの同じボタンと同じ |
| ヘッダーの文字のリンク・フッターのリンク | 文字が明るい白になる |
| GitHub(文字のリンク) | 文字が明るい白になり、1px 浮く |
| 見出し・候補の札・カード・機能の行・デモの案内 | 何も変わらない(押せない物は動かさない) |

## 本番反映の手順(オーナーが行う)

1. このブランチの CI が通っていることを確かめる。
2. 「Create a merge commit」で `main` にマージする(squash しない)。Cloudflare の Git 連携が自動でビルドして本番に反映する。
3. 公開 URL で、次の点を確かめる。
   - トップの見出しが「Life Launcher」と 2 行のコピーになっている。
   - 「この中から、1件だけ。」と今やる一手のカードがある。
   - デモの上に 4 手順の案内がある。
   - 一番下の 05:00 が薄く見える。

戻し方: 公開 URL での確認で問題があれば、`main` のこのマージを revert する(同じ Git 連携で一つ前の版に戻る)。新しいデプロイの仕組みは足さない。

## 提案

- 初期データの「本を読む」を「数分だけ読む」にそろえる件は、今のテストと保存済みデータの互換に響くため、この版では扱っていません。別の版で決めてください。
- スマホのメニュー(三本線)は、開く先が無いため入れていません。開く先が決まったら次の版で扱ってください。
