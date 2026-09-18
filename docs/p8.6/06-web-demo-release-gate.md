READY FOR PRODUCTION APPROVAL

# P8.6-06 Web Demo Release Gate

- Audited: 2026-09-18
- Branch: `release/v1.3.0-parity-audit`
- Approved release candidate: `7fb37a7`
- Production branch: `main`
- Production URL: https://life-launcher-web.takuyakou.workers.dev/
- Deployment in this Stage: not performed

## Full gate result

| Gate | Result |
| --- | --- |
| Fresh `npm ci` | PASS; 166 packages installed |
| `npm run lint` | PASS; 0 warnings |
| TypeScript and Vite build | PASS; 35 modules transformed and `dist` produced |
| `npm test` | PASS; 58 tests |
| Normal `npm run test:e2e` | PASS; 46 passed and 1 intentional production-preview skip |
| `WEB11_PREVIEW=1 npm run test:e2e` | PASS; 47 passed, 0 skipped |
| `npm run test:visual` | PASS; 18 tests |
| `npm run public:check` | PASS; 148 public files scanned |
| `npm audit --audit-level=moderate` | PASS; 0 vulnerabilities |
| `git diff --check` | PASS |

The production-preview run applied the shipped CSP and completed without runtime console errors, missing assets, external requests, fetch/XHR, or WebSocket traffic. The visual suite covers wide, common, narrow, and long-text layouts, including 1920, 1440, 1366, 1000, and 390 pixel widths.

## Core journey and regression

The release gate covers a fresh Project and NextStep, Project-backed Wishlist creation, Today Picker adoption from both source types, Today3 execution and completion, source preservation, and reload persistence. It also covers stable source identity, same-text distinct IDs, derived Source Lock, Do Now rotation, complete Project-color following without stale color, independent Timer semantic colors, keyboard and focus behavior, modal containment, reduced motion, storage-write failure, and narrow-layout overflow.

## Storage migration

The demo uses schema version 3 at `life-launcher-web-demo:v3`. On first read it non-destructively normalizes and validates readable v2 data before writing a v3 copy. Legacy Wishlist rows remain unassigned instead of receiving a guessed Project. Stable Wishlist IDs, same-text distinct sources, Today3 snapshots, exclusions, sessions, victory state, and remaining disclosure state are preserved. Source Lock remains derived rather than persisted. A failed migration write leaves readable v2 data available and does not replace it with partial state.

## Known limitations

This is a browser demo, not the Windows application. It intentionally excludes Explorer and Tauri integration, native launch, tray and mini-window behavior, autostart, global shortcuts, native file pickers, instruction-file handling, backup, restore, software reset, notifications, and Rust services. Do Now recommendations are deterministic from Project registration order, and demo data remains local to the current browser profile. These exclusions are explicit product boundaries and are not parity blockers for the browser demo.

## Deploy and rollback

Deployment must use the existing repository contract: update `main` from the approved candidate and let the existing external Cloudflare Workers Static Assets Git integration build `npm run build` and publish `dist`. After deployment, verify the public URL, shipped CSP, asset freshness, and the complete browser smoke journey.

If public smoke fails, revert the production merge on `main` or redeploy the immediately previous known-good production commit through the same Git integration, then repeat public verification. Do not introduce a new deployment mechanism or change the Windows v1.3.0 repository, tag, release, or assets.

## Decision

P8.6-06 is complete. Release candidate `7fb37a7` is ready for explicit P8.6-07 production approval.
