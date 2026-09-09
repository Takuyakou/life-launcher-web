# WEB11-04 Final QA / Production Readiness

2026-09-09。LOCAL QA完了。本番未反映。ユーザー指定の公開順序・本番承認を維持する。

## 実行結果

| 検証 | 結果 |
| --- | --- |
| npm ci | PASS |
| public:check | PASS |
| lint / build | PASS |
| unit | 34 PASS |
| production bundle E2E | 27 PASS |
| Visual QA | 9 PASS、対象viewportのhorizontal overflow 0 |
| XSS / network-zero / CSP | production bundleに配布予定_headersを適用したbrowser試験でPASS |
| runtime fetch/XHR/WebSocket/外部request | 対象操作で0 |
| console errors / page errors / HTTP 4xx+ | CSP下の対象操作で0 |
| metadata / favicon / OG | PASS、assets 200 |
| git diff --check | PASS |

Production相当の再現:

```powershell
npm.cmd ci
npm.cmd run build
$env:WEB11_PREVIEW='1'
npm.cmd run test:e2e
npm.cmd run test:visual
```

CIのE2Eもproduction previewモードに変更し、CSP検証をskipしない。通常devモードではproduction専用1件だけskipする。
旧WEB11-00の4試験は歴史資料。`f34770d`で再現し、現HEADでは明示skip。旧baseline画像は保持し、新仕様を旧動作へ合わせるために戻していない。

## Visual

1366×768 / 1440×900 / 1920×1080 / 390×844に加え1000pxで2列を確認。
Landing、default、Today0/1/2/3、Builder両page、timer、満了dialog、全3件完了、next batch、下段開閉、追加modal、長文、Dictionary、Resetを撮影。
生成物は`test-results/visual/web11`。README用1枚だけをdocsへ保存し、巨大なbuild複製は作らない。
スクリーンショット/幾何チェックであり、Windows pixel完全一致や支援技術全製品での動作保証ではない。

## 依存監査

当日のnpm auditで新たに3 package判定を検出した。前日のaudit0と矛盾させず、advisory更新による現在結果として記録。

- `js-yaml` 4.3.1 → 4.3.2: ESLint経由のdev-only High。互換範囲のpatch更新。lockfileのみ3行置換。対処内容は[GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh)。
- 残るModerate2判定は`vitest` / `@vitest/mocker`に対する同一[GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)。このrepoはNode単体testのみで、browser mode/API/mockerPlugin/interceptorPluginを構成していない。Vite pluginはReactのみ。本番static bundleへの到達経路なし。
- 修正版Vitestは別majorのため今回無理に更新しない。mock用dev serverを公開しないこと。別途メジャー更新を検証する余地がある。
- `npm audit --omit=dev --audit-level=low`: 0。全依存auditはModerate2のためnonzero。全audit PASSとは報告しない。`audit fix --force`なし。

## Cloudflareと未実施

親PR #5はGitHub verify/Workers BuildsともSUCCESSを確認した。ユーザー提供ログから不足はassets/name/compatibility_dateと判明し、ユーザーが設定後の成功を報告。
現在のbranch用upload commandは`npx wrangler versions upload --assets=./dist --name=life-launcher-web --compatibility-date=2026-09-07`。dateは更新日でなく互換基準。
versions upload成功をmain本番切替成功と混同しない。mainの実deploy設定・branch preview URL・本番切替は未確認/未実施。
認可されたpreview URLが得られた場合は`WEB11_BASE_URL`を指定してE2E/Visualを再実行できる。現在のローカルCSP試験はCloudflareでのheader適用の実測を代替しない。

## 残りのゲート

1. Windows v1.1 releaseと本体README更新（このWebタスクで本体repoは変更しない）。
2. Web README原稿を適用。
3. 本番反映の明示承認後、監査PR→実装PRの順でmainへmerge。
4. Cloudflare本番deploy成功、公開URLの新assets/headers/full flowを確認。

Final: **BLOCKED (PUBLICATION GATE)**。UI実装とlocal QAは完了したが、`DEPLOYED AND VERIFIED`はまだ宣言しない。
