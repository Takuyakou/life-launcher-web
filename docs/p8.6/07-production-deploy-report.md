# P8.6-07 Production Deploy Report

- Deployed: 2026-09-18
- Repository: `Takuyakou/life-launcher-web`
- Production branch: `main`
- Deployed product commit: `8e852f9`
- Previous production commit: `9cd6125`
- Production URL: https://life-launcher-web.takuyakou.workers.dev/
- Deployment method: existing Cloudflare Workers Static Assets Git integration

## Pre-deploy

`origin/main` remained at the audited `9cd6125`; no unexpected remote advance was present. The working tree was clean, the approved audit branch was 10 commits ahead and 0 behind, and no repository Wrangler configuration or alternate deployment mechanism was introduced. The audit branch was pushed before `main` was fast-forwarded.

## Final gate

The final candidate passed lint, 58 unit tests, TypeScript and Vite build, public safety across 150 files, `git diff --check`, and three production-preview core/CSP tests. GitHub Actions run [35307611451](https://github.com/Takuyakou/life-launcher-web/actions/runs/35307611451) then passed install, public safety, lint, unit, build, full E2E, and full Visual QA on `main`.

## Production verification

Cloudflare returned HTTP 200 with the new `assets/index-e__xVAQH.js` bundle and the shipped CSP, including `connect-src 'none'`. The production URL then passed all 47 browser E2E tests with no skip or failure.

Verified production behavior includes page and asset loading, Project and optional NextStep state, Project-backed and unassigned Wishlist, Today Picker 0/3 through 3/3 selection, third-add auto-confirm, Today3 source snapshots, source preservation, Source Lock, execution and completion, Do Now `他の一手`, complete Project-color following, Timer semantic colors, hover/focus/pressed/reduced-motion behavior, localStorage persistence and migration, reload, keyboard dialogs, long text, and narrow layout. The obsolete permanent Today Builder is absent.

## Rollback

The previous known-good production point is `9cd6125`. If a later production regression requires rollback, revert the v1.3 parity commits on `main` or redeploy that known-good commit through the same Cloudflare Git integration, then repeat the public smoke suite. No rollback was required for this deployment.

Windows v1.3.0, its repository, tag, release, and assets were not modified.

WEB DEMO v1.3 PARITY DEPLOYED
