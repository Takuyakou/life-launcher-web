# WEB11-04 — Full QA / Cloudflare Production Readiness

## Goal
Web Demo v1.1 Syncを総合回帰し、Cloudflare本番へ反映可能か判定する。

## Full flow
Landing → Demo → Victory → Do Now → Builder → 今日へ → Today3 → Timer → completion → 3/3 → 次の3件 → Reset

## Visual
1366x768 / 1440x900 / 1920x1080 / 390x844。
Landing / default / Today3 / Builder / timer / completed / next batch / modal / Dictionary / mobile。horizontal overflow 0。

## Security/privacy
XSS / network-zero / no backend / no analytics / no auth / localStorage only / synthetic data。

## Build/test
package.jsonに存在するscriptのみ。最低: npm ci / public:check / lint / build / unit if exists / browser/e2e if exists / visual / XSS / network-zero / git diff --check。

## Cloudflare preview
branch previewがあればproduction相当QA。console error 0 / 404 0 / assets 200 / headers確認。

## Production gate
Stage PR作成後STOP。
ユーザーが「WEB11-04承認。本番反映してください」と明示した場合のみmain merge。
Cloudflare auto build/deploy Success確認後production smoke。

Production:
https://life-launcher-web.takuyakou.workers.dev

Final:
WEB DEMO v1.1 SYNC DEPLOYED AND VERIFIED
または BLOCKED。

Windows v1.1 Releaseはまだ行わない。
