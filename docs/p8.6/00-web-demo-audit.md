# P8.6-00 Web Demo Current-State Audit

**Result: PASS — audit complete; v1.3 parity implementation remains pending**

- Audited: 2026-09-18
- Repository: `Takuyakou/life-launcher-web`
- Audit branch: `release/v1.3.0-parity-audit`
- Audit HEAD before this report: `4fd1cd9`
- Production branch: `main`
- Production HEAD: `9cd6125`
- Branch relation: 0 behind / 2 ahead of `origin/main`
- Working tree at audit start: clean
- Production URL: https://life-launcher-web.takuyakou.workers.dev/

This Stage records the implementation boundary only. It does not change product code, merge to `main`, or deploy production. Windows v1.3.0 and its repository, tag, and release assets were not modified.

## Baseline and deployment

| Item | Current state |
| --- | --- |
| Package | `life-launcher-web` `0.1.0`; React 18 / TypeScript / Vite |
| Install | `npm ci`; lockfile resolved Vite 8.2.1 and Vitest 4.1.11 |
| Build command | `npm run build` |
| Output directory | `dist` |
| Hosting | Cloudflare Workers + Static Assets through external Git integration |
| Production trigger | `main` according to the repository deployment contract |
| Repository deploy config | No Wrangler config; Cloudflare settings are external |
| GitHub default branch | `main` |
| Current production response | HTTP 200, HTML title and `#root` present |
| Current production CSP | `connect-src ''none''`; scripts/styles/images/fonts restricted to the documented static surface |
| Current production CI | GitHub Actions run for `9cd6125` passed |

The public URL is healthy, but it serves the existing pre-v1.3 experience. The parity audit branch has not been merged or deployed.

## Automated verification

All browser suites ran serially against the built `dist` output with `WEB11_PREVIEW=1`.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS; 166 packages installed, 0 vulnerabilities |
| `npm audit --audit-level=moderate` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS; 0 warnings |
| `npm test` | PASS; 53 tests in 6 files |
| `npm run build` | PASS; `dist` produced |
| `npm run test:e2e` | PASS; 32 passed, 0 skipped, 0 failed |
| `npm run test:visual` | PASS; 16 passed, 0 failed |
| `npm run public:check` | PASS; 132 files scanned |

The visual suite generated desktop and mobile evidence at 1920, 1440, 1366, 1000, and 390 pixel widths. Automated assertions found no horizontal overflow and confirmed 3/2/1-column Today layouts. Direct image loading in the audit client was unavailable because its Windows ACL image helper failed; the generated PNG and metric artifacts remain under ignored `test-results/visual`.

## Current parity matrix

| v1.3 center-flow contract | Current Web Demo | Result |
| --- | --- | --- |
| Project as the persistent organizing unit | Four stable seed Projects with IDs, names, colors, and NextStep | PARTIAL: no Project creation flow |
| NextStep: zero or one restart point per Project | One required string per seeded Project; completion can replace it | PARTIAL: cannot be absent and has no direct setup flow |
| Wishlist with stable identity and optional Project | Stable Wishlist IDs and duplicate text remains distinct | FAIL: no `projectId`, grouping, or unassigned presentation |
| Today Picker with destination slots above sources | Permanent collapsible `今日を組み立てる` section | FAIL |
| Picker omits adopted sources | Adopted source remains as a disabled `選択済み` row | FAIL |
| Picker action grammar | `今日へ` plus `候補から外す` | FAIL: missing `＋ 今日へ` / `↩ 今日から外す` contract |
| Today3 maximum of three | Reducer and UI prevent a fourth item | PASS |
| Today3 is a source snapshot | Today item stores independent label/project/timer values | PASS |
| Stable source identity | `project:{projectId}` and `wishlist:{wishlistId}`; legacy Today fallback exists | PASS for current schema |
| Source preservation | Adding/removing Today snapshots leaves Project, NextStep, Wishlist, and sessions intact | PASS |
| Source Lock derived from unfinished Today3 | No lock derivation or lock state UI | FAIL |
| NextStep/Wishlist selected-state presentation | Builder-only disabled state | FAIL |
| Do Now candidate rotation | Text, Project label, reason, and timer target rotate | PARTIAL |
| Do Now Project-color follow | Project dot/label changes | FAIL: card accent remains fixed green and stale-color coverage is absent |
| Do Now wording | `別の候補` | FAIL: v1.3 requires `他の一手` |
| Project colors on source/Today surfaces | Project labels and Today card top borders use semantic Project colors | PARTIAL |
| Timer semantic colors remain independent | Green/blue timer actions are not overwritten by Project colors | PASS |
| Hover/focus/pressed grammar | Global focus ring and variant hover rules exist | PARTIAL: pressed uses `translateY(1px)`; card and disabled matrices are incomplete |
| Responsive behavior | 3/2/1-column Today layout and no overflow at tested widths | PASS |
| Reduced motion | Global reduced-motion rule and E2E assertion exist | PASS |
| localStorage compatibility | Schema v2 validation, normalization, write-failure rollback, corrupt-data fallback | PARTIAL: no v2-to-v3 migration |

## Reconfirmed blocking gaps

1. The old permanent Today Builder remains the only adoption surface.
2. Wishlist has no Project identity and cannot be grouped by Project.
3. Source Lock is neither derived nor presented.
4. Do Now candidate rotation changes the label but leaves the card accent fixed green.
5. Main-derived button/card hover, focus, pressed, and disabled grammar is incomplete.

These are Web Demo parity blockers. Windows-only capabilities are deliberately excluded and are not blockers.

## Obsolete implementation list

The following surfaces must be removed or replaced in later Stages, not carried forward as parallel UX:

- `sections.todayBuilder`, `OPEN_BUILDER`, and the permanent `.builder-section` disclosure.
- Builder pagination and disabled selected rows as the primary Today adoption interaction.
- `今日を組み立てる`, bare `今日へ`, `選択済み`, `候補から外す`, and `別の候補` copy where the v1.3 contract supplies replacements.
- Builder-only source selection tests and selectors after equivalent Picker coverage is introduced.
- The fixed green `.do-now-card` left border.
- Wishlist rows without Project or explicit unassigned identity.

Candidate exclusion data must not be deleted casually. P8.6-01 must decide how existing exclusions normalize into the v3 model before obsolete UI is removed.

## localStorage migration risks

Current storage key is `life-launcher-web-demo:v2` and the accepted state requires `schemaVersion: 2`.

- Legacy Wishlist rows have stable IDs but no Project; migration must keep them unassigned rather than guess.
- Same-text Wishlist rows must retain distinct IDs.
- Existing Today source IDs must remain stable, especially `wishlist:{id}`.
- Today3 maximum-three validation and source snapshots must survive reload.
- Removing old Builder view state must not remove Projects, NextSteps, Wishlist, Today3, exclusions, sessions, victory state, or remaining section preferences.
- Source Lock must be derived from unfinished Today3 plus source identity; no persisted lock flag should be introduced.
- Corrupt or unsupported data must fall back safely without overwriting recoverable stored data.
- v3 should be written only after read, normalize, and validate all succeed.
- Storage write failure must keep the previous in-memory and persisted state.

## P8.6-01 change boundary

The next Stage is limited to data model and localStorage migration:

- Introduce the v3 Project / optional NextStep / Wishlist optional-Project / Today source-snapshot model.
- Preserve stable `nextstep:{projectId}` and `wishlist:{wishlistId}` identity independent of display text.
- Add a non-destructive v2-to-v3 decoder and validator.
- Keep legacy Wishlist rows unassigned.
- Derive Source Lock; do not persist it.
- Add tests for empty state, Project, optional NextStep, Wishlist identity, same-text IDs, Today3 max3, source preservation, reload, old schema, corrupt storage, unassigned Wishlist, and write failure.
- Do not perform the Today Picker or broad UI redesign in P8.6-01.

## Stage decision

**P8.6-00: PASS**

The baseline is healthy and reproducible, the parity gaps are fixed in scope, migration hazards are documented, and P8.6-01 may begin. Production deployment remains prohibited through P8.6-06.
