# WEB11-00 Current Gap Audit

監査日: 2026-09-08。対象はWeb Demo。これは同期完了報告ではなく、実装前の差分固定です。

## 基準

- Web: `e08d69a3975632611177a0166661116ed274b597` (`main == origin/main`、fetch後確認)。PR #4まで。
- 作業ブランチ: `docs/web11-00-gap-audit`。開始時のtracked treeはclean。ユーザー提供の同期指示フォルダだけがuntrackedだった。
- Windows参照: `Takuyakou/life-launcher` のローカルmain `e59612b510d9efd10376ab8211b1f9b917b1a16a`。読み取りのみ。
- 比較順: Web code/tests → Windows current code/spec → 添付された報告書 → WEB11指示。
- 「v1.1 Sync」は今回の作業名。Web packageは`0.1.0`、Windows packageは`1.0.0`。新しいリリースの存在を意味しない。
- Windows `docs/spec/current-spec.md` §10には古い「チェックボックス」記述も残る。実装`src/App.tsx`の`todayCompletionStatus`は非操作の`span role=status`。今回は実装と新しい完了仕様を優先する。

## 公開状態とCloudflare

[公開URL](https://life-launcher-web.takuyakou.workers.dev/)のHTML・JS・CSSを読み取り、`npm ci`後に上記Web mainから生成した`dist`と比較した。

| アセット | 公開SHA256 | 結果 |
| --- | --- | --- |
| `assets/index-C0dVFzu9.js` | `ffb8689e7667ef769356bcea2405863357e17b235f87db3688bda73d4ce3b58e` | ローカルと完全一致 |
| `assets/index-CvAVF5lk.css` | `0a47d1fd6451615b9260fe0df3b179e9d13e3ad18b11b8a9b30f35eda676b491` | ローカルと完全一致 |
| `index.html` | `287867776196ce95eae0770b3e6704482bf6c4eb49da41bedc44b7bda7116bcc` | rawは不一致。改行・末尾空白の正規化後は一致 |

ローカルHTMLのraw SHA256は`49bf5ed0dc1127bb48ef6ea43a6a3e32b0aa26d910dca3cb60145a3850ed2c8e`。
確認できる結論は「公開中の主要UIアセットはmainと同じ」。配信プラットフォームのdeployment commit IDや全静的ファイルまで証明したわけではない。
したがって現在のUI差分は、少なくとも主要JS/CSSの公開漏れではなくWebコード自体に残っている。

| 設定 | 証拠と判定 |
| --- | --- |
| hosting | Workers URLで配信。READMEはWorkers + Static Assetsと説明 |
| Git integration | **PARTIAL**。監査PR #5で`Workers Builds: life-launcher-web`が自動実行されFAILURE。GitHub連携checkの存在は確認。main自動本番deployの設定までは未確認。ユーザー申告は従来手動運用 |
| production branch | **UNVERIFIED**。Git既定ブランチはmainだがCloudflare側の設定とは別 |
| preview build | **UNVERIFIED**。dashboard確認なし |
| build command | repoでは`npm run build`、成功。Cloudflare側の実設定は未確認 |
| output | repoでは`dist`。Cloudflare側の実設定は未確認 |
| repo deploy config | wrangler/Cloudflare設定ファイルなし。CIにdeploy stepなし |
| GitHub CI | [基準mainのCI成功](https://github.com/Takuyakou/life-launcher-web/actions/runs/34080029722) |

Cloudflare設定を推測で変更しない。WEB11-04で管理画面または認可されたAPIから確認する。今回デプロイなし。

PR作成後の追記: [PR #5](https://github.com/Takuyakou/life-launcher-web/pull/5)にCloudflare checkが付いた。check outputにはBuild IDとdashboardリンクのみで、失敗原因の説明/annotationはない。権限・課金・build設定のどれが原因かは断定できない。既存外部連携がpush/PRを受けて動いたもので、今回Cloudflare設定変更や手動deployは実行していない。公開成功の証拠にはせず、外部build失敗としてレビューに引き継ぐ。

## 画面と挙動の差分

分類は要求された4種。ALREADY MATCHESはその行の範囲だけの一致で、完全互換を意味しない。

| ID | 対象・現在の実装 | 分類 | 対応先・判断 |
| --- | --- | --- | --- |
| G01 | Main順はVictory → Do Now → Today3 → Builder → NextStep → Wishlist → Activity | ALREADY MATCHES | 順序を維持 |
| G02 | Heroは3-stepとmini UI、green開始。CTAはDemoへscroll/focusする | ALREADY MATCHES | Hero全面改修しない。copy整合は03 |
| G03 | Victoryは編集、未変更Enter復帰、チェック達成が可能 | ALREADY MATCHES | VictoryのチェックはToday3廃止対象とは別 |
| G04 | Do Nowは固定reasonと候補rotation。緑5分/青25分 | ALREADY MATCHES | 固定理由はWeb向け仕様として維持 |
| G05 | Do Now自身には実行中表示・pause/end切替がなく、sidebar timerに集約 | NEEDS BEHAVIOR SYNC | 01で実行対象と状態の表現を揃える |
| G06 | Today3は縦3行。desktopでも3列カードではない | NEEDS VISUAL SYNC | 01: wide3/medium2/narrow1 |
| G07 | Today3に色dot/nameあり。カード上端のproject色線なし | NEEDS VISUAL SYNC | 01: compact cardと色線 |
| G08 | Today3はgreen5分/blue25分を常設。文字が常時見える | ALREADY MATCHES | 色と開始導線を維持。hover表現の完全移植は不要 |
| G09 | Today3の完了は`TOGGLE_TODAY_ITEM`による手動checkbox | NEEDS BEHAVIOR SYNC | 01: timer完了結果の非操作statusへ |
| G10 | timer満了/終了はSession追加だけでToday3を完了にしない | NEEDS BEHAVIOR SYNC | 01: 満了・確定・途中終了・source IDの条件をテスト |
| G11 | Today3見出しは採用数`N/3`のみ。完了数表示なし | NEEDS VISUAL SYNC | 01: 件数と`完了数 / 件数 完了` |
| G12 | 全件manual完了後も「次の3件を選ぶ」なし。自動補充もなし | NEEDS BEHAVIOR SYNC | 01: 3件完了時だけ手動next batch。記録保持 |
| G13 | Today3最大3、重複source拒否、採用時label snapshotあり | ALREADY MATCHES | reducer/todayBuilderの制約を保持 |
| G14 | Today itemにtimer分数snapshotなし。全項目固定5/25 | NEEDS BEHAVIOR SYNC | 01でWebの固定時間とsnapshot設計を明記。Project時間設定の完全移植不要 |
| G15 | BuilderはNextStep4件 + Wishlist3件の派生候補。自由入力・送付先selectなし | ALREADY MATCHES | 02: source-onlyを維持 |
| G16 | Builderはgroup heading各1回、project dot/name、green今日へ、選択済み/full無効化 | ALREADY MATCHES | 02でcompact密度を調整 |
| G17 | Builderは7候補を一括表示。ページ切替なし | NEEDS BEHAVIOR SYNC | 02: 既に自然に5件超なので5/page。seed増量不要 |
| G18 | Builder headerはtitle→説明→右端count。Windows指定のtitle→count→説明と異なる | NEEDS VISUAL SYNC | 01/02: 共通header hierarchy |
| G19 | 候補除外は常設buttonで元登録を残し、同じToday snapshotも外す | ALREADY MATCHES | 右クリック完全再現は必須でない。意味は維持 |
| G20 | 除外は日付を持たずresetまで持続。実行中除外guard・保存失敗rollbackなし | NEEDS BEHAVIOR SYNC | 02で簡略化の境界を決定。黙ってWindowsと同等と説明しない |
| G21 | NextStepは4枚のproject cardで常時展開。compact row/accordionでない | NEEDS VISUAL SYNC | 01: lower sectionをcompact化 |
| G22 | Wishlistはcompact list/accordion、Activityもaccordion | ALREADY MATCHES | 01: 共通headerへ見た目を揃える |
| G23 | 3つの既存accordionはbutton全体が開閉領域。NextStepにはtoggle自体なし | ALREADY MATCHES | 全幅操作を保持、NextStepは01で追加 |
| G24 | NextStep/Wishlistの重複した常設「今日へ」はなし | ALREADY MATCHES | 02: Builderを主経路に維持。native右クリックshortcut追加不要 |
| G25 | 登録元に追加UIなし。NextStep編集は満了dialogだけ。Wishlistはread-only | NEEDS BEHAVIOR SYNC | 02: 必要ならtext-only modal。大規模Project formは除外 |
| G26 | Timerはstart/pause/resume/end、別開始時は旧timerを終了。Activityに記録 | ALREADY MATCHES | 共通の単一timerを保持 |
| G27 | 「満了まで進める」は実際にはSTOP_TIMER。時間は経過分を切上げ最低1分 | NEEDS BEHAVIOR SYNC | 01: 完了条件に使う前にdemo加速の意味を整理 |
| G28 | Dictionaryは検索、初期search focus、Tab trap、Escape/起点復帰 | ALREADY MATCHES | 03: keyboard/accessibility確認を継続 |
| G29 | Dictionaryの十字キーgrid移動なし。Tab操作はできる | NEEDS BEHAVIOR SYNC | 03でWeb向け範囲を明記。native完全互換としない |
| G30 | Resetはv2/v1 keyを消去しseed復元。nativeデータには触れない | ALREADY MATCHES | 02/03: 新field追加時もreset対象へ |
| G31 | Reset説明は勝利条件・チェック・記録のみ。Project編集/除外/開閉/timerも戻ることは未説明 | NEEDS BEHAVIOR SYNC | 03: 実際のreset範囲にcopyを合わせる |
| G32 | READMEは「候補を登録」と説明するが登録UIなし。v1.0.0固定DLと自動deploy説明も残る | NEEDS BEHAVIOR SYNC | 03: 実装できる範囲だけ説明。未公開v1.1リンクを作らない |
| G33 | Native launch/Explorer/手順書/mini/multi-monitor/Tauri/backup/settings/full records/Rust推薦 | NATIVE-ONLY / SKIP | 再現しない。実行はsimulationで明示 |
| G34 | D&D、native編集/削除の完全管理UI | NATIVE-ONLY / SKIP | 技術的にWeb不可という意味ではなく今回scope外 |

根拠: Web `src/components/DemoFrame.tsx`、`DemoTimer.tsx`、`DemoDictionary.tsx`、`CompletionDialog.tsx`、`src/App.tsx`、`src/demo/{types,reducer,todayBuilder,storage,seed}.ts`、`src/styles.css`、`README.md`。Windows `src/App.tsx` (`todayCompletionStatus`, `todayCompletedCount`, next-batch UI)、`docs/spec/current-spec.md` §8-13/15/Guide。

## 保存・Resetの契約

- keyは`life-launcher-web-demo:v2`、schemaVersion=2。v1は読まないがresetで消す。
- victory、Do Now index、Today items、exclusion IDs、projects、wishlist、sessions、sectionsを保存。
- Today source IDは`project:<id>` / `wishlist:<id>`。旧v2はproject ID等から補完。同文Wishlistは別ID。
- timerは保存時/読込時ともidleにする。reload後のcountdown復元なし。
- state変更ごとにsave effectが走るため、tickでもidle化したstateを再保存する。今回性能修正はしない。
- save/clearは失敗をbooleanで返すがAppは結果を使わない。UI rollback・保存失敗通知なし。
- 読込はJSON不正/アクセス例外をfallbackするが、配列内Project/Sessionやsections全fieldの完全validationはない。破損v2への堅牢性は追加QA候補。
- Resetはkey削除→seed全体へ置換→save effectで新seedをv2へ保存。dictionary/reset/completion dialogを閉じる。
- 自分のnamespaced key以外は消さない。日付切替によるToday/除外/Sessionの更新は未実装。

## Freezeと承認事項

WEB11-01はToday3とMain hierarchy、WEB11-02は候補選択・ページ分け・登録UX、WEB11-03はcopy/accessibility、WEB11-04はQA/配信確認へ割り当てる。
辞書十字キー、日付切替、保存失敗処理は差分として認識したが、Windows全互換の一括追加は行わない。対応/明示的な簡略化を各stageで判断し記録する。
既存テストPASSは現行Webの確認であり、この表の未実装項目がPASSしたことではない。

関連: [Visual baseline](00-visual-baseline.md) / [Test inventory](00-test-inventory.md) / [作業報告](workreports/web11-00-report.md)
