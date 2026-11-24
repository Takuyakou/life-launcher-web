READY FOR PRODUCTION APPROVAL

# W18 最後の段の Windows 版の札と、技術の札(判定書)

- 確認日: 2026-11-24
- ブランチ: `feat/w18-final-cta-tech`(起点は `main` = `c50aa11`。W17 のマージ #20 と README 画像の更新 #21 の後)
- 本番: https://life-launcher-web.takuyakou.workers.dev/(この段階では反映していない)
- 見本: Design キャンバス「Life Launcher Web Demo 作り直しモック」の「最後の段:案B」と「安全性の段:技術の札に(4枚)」
- 新しい npm 依存は足していない(`package.json`・`package-lock.json` は無変更)

## 判定

**`READY FOR PRODUCTION APPROVAL`**。`public:check`・lint・単体テスト・build・本番相当E2E・Visual QA はすべて通過しました。保存形式(`life-launcher-web-demo:v3`、`schemaVersion: 3`)は変えていません。デモの中身は触っていません。

## 最後の段(「次の一手を、今ここで始める。」)

| 所 | 前 | 後 |
| --- | --- | --- |
| 並び | 見出しが左、2つのボタンが右(下端そろえ) | 見出し → 文字のリンク → Windows 版の札、の縦並び(左そろえ、間は 40px) |
| デモへの道 | 金色の「ブラウザで試す」ボタン | 見出しの下の文字のリンク「▶ まずはブラウザで試す」(乗せると明るい金 `#ffce5b`) |
| Windows 版 | 「Windows版をダウンロード」ボタン | 札「Windows版を入手」。動作要件・金色のボタン「最新版をダウンロード(GitHub Releases)」・配布の3形式と SHA256SUMS の一言 |

- 札の幅は 460px(スマホでは横いっぱい)。札には版の数字を書かない(公開のたびに直さなくてよいように)。
- 札の文言は、Windows 版 README の「ダウンロード」の節(インストーラー・単体実行版 EXE・ZIP 版、`SHA256SUMS.txt`、Windows 10 以降 x64・WebView2 Runtime)と合っていることを確かめた。
- 金色のボタンには、W17 で入れた開始ボタンの動き(`start-button`)をそのまま付けた。乗せると明るい金になり、1px 浮き、下に線が伸びる。押すと少し縮む。動きを減らす設定の時は浮かず縮まない。
- 狭い幅では「（GitHub Releases）」だけを次の行に送り、2行とも真ん中にそろえる(390px で確認)。
- 薄い「05:00」はそのまま段の中に収まる。

## 安全性の段

- 「Local-first.」の下の文「React・TypeScript・Vite・Rust・Tauri 2。Web Demoは静的SPAです。リリース版はWindows向けTauriデスクトップアプリです。」を外した。
- 代わりに丸い札を4枚並べた: Tauri 2 / Rust / React / TypeScript(見出しと重なる「Local-first」の札は入れない)。
- 外した文のうち「ブラウザの中だけで動く」「Windows 版は端末に保存する」は、右の一覧の1行目・2行目に書いてある。

## 確認の表

| 確認 | 結果 |
| --- | --- |
| `npm run public:check` | 通過。234 ファイル |
| `npm run lint` | 通過。警告 0 |
| `npm run test` | 通過。9 ファイル・107 件 |
| `npm run build` | 通過 |
| `WEB11_PREVIEW=1 npm run test:e2e` | 通過。118 件、スキップなし(本番と同じ CSP) |
| `WEB11_PREVIEW=1 npm run test:visual` | 通過。32 件(1920 / 1440 / 1366 / 1000 / 390) |
| `git diff --check main` | 問題なし |

E2E と Visual QA は Linux の Chromium で回した(CI の Windows ではない)。字の太さなど書体の見え方は CI と少し違うが、位置・大きさの確かめは書体に寄らない形にしてある。

## 追加・変更したテスト

- 新しい E2E: `tests/e2e/w18-final-tech.spec.ts`(9 件)。最後の段のリンクが2つ(文字のリンクと札のボタン)だけで、古いボタンが無いこと。札の見出し・要件・注記・リンク先(`target="_blank"`・`rel="noopener noreferrer"`)と、版の数字が無いこと。1920 / 1440 / 1366 で札が見出しの左端にそろい、本文の 40px 下に 460px 幅で出ること。1000 / 390 で横にはみ出さないこと。スマホで横いっぱいになること。金色のボタンの開始ボタンの動きと、文字のリンクの色の変化。技術の札が4枚・丸い・同じ高さで、古い文が無いこと。
- `tests/e2e/w16-landing.spec.ts`: 「最後の段は2つのボタンだけ」の確かめを外し、「05:00 が段の中に収まる」確かめだけを残した(最後の段のリンクは W18 の新しいテストで確かめる)。
- `tests/visual/w16-landing-visual.spec.ts`: 文字の見やすさ(4.5:1)の対象から `.lp-privacy-tech` を外し、`.lp-tech-chip`・`.lp-final-try`・`.lp-get-meta`・`.lp-get-note` を足した。

## 本番反映の手順(オーナーが行う)

1. このブランチの CI が通っていることを確かめる。
2. 「Create a merge commit」で `main` にマージする(squash しない)。Cloudflare の Git 連携が自動でビルドして本番に反映する。
3. 公開 URL で、次の点を確かめる。
   - 最後の段に「まずはブラウザで試す」と「Windows版を入手」の札が出て、札に版の数字が無い。
   - 札の「最新版をダウンロード(GitHub Releases)」を押すと、GitHub Releases の最新版が新しいタブで開く。
   - 安全性の段の「Local-first.」の下に、Tauri 2 / Rust / React / TypeScript の丸い札が出る。

戻し方: 公開 URL での確認で問題があれば、`main` のこのマージを revert する(同じ Git 連携で一つ前の版に戻る)。
