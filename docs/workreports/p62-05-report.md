# P62-05 Web Demo Sync Work Report

## Scope

- Repository: `Takuyakou/life-launcher-web`
- Branch: `feat/p62-05-phase62-demo-sync`
- Pull request: https://github.com/Takuyakou/life-launcher-web/pull/4
- Base commit: `aaf4638d289780abf0cf1f5b9d8e8b3a2e984a52`
- Windows specification source: Life Launcher main `b2c4a8e86449dcdb67ead7ff5ec46f85973d9f35`

## Implemented

- Derived Today Builder candidates from Project NextStep and Wishlist records.
- Added stable source IDs so duplicate text remains distinct and adopted Today items remain snapshots.
- Made Builder the only surface with `今日へ`; removed the old fixed Today candidate chips and source-card timer shortcuts.
- Grouped compact Builder rows into `次の一手` and `やりたいこと`.
- Added a simplified `今日の候補から外す` action that removes the matching Today snapshot while preserving its source.
- Persisted exclusions in localStorage and normalized older schema-v2 data that lacks source IDs or exclusions.
- Placed Today3 before Builder and synchronized landing, README, and docs copy with the register -> choose -> execute model.
- Kept native Explorer, Tauri permissions, real launcher execution, and Rust recommendation logic out of the Web Demo.

## Tests Added Or Updated

- Stable Builder candidate derivation and duplicate-text identity.
- Three-item limit and duplicate source guard.
- Candidate exclusion with source preservation.
- Backward-compatible schema-v2 localStorage normalization.
- Builder-only adoption, source visibility, Today snapshot removal, XSS, and network-zero browser coverage.
- Visual coverage at 1366x768, 1440x900, 1920x1080, and 390x844 with horizontal overflow checks.

## Validation

| Command | Result |
| --- | --- |
| `npm.cmd ci` | PASS; 181 packages, 0 vulnerabilities |
| `npm.cmd run public:check` | PASS; 45 files scanned |
| `npm.cmd run lint` | PASS |
| `npm.cmd run build` | PASS |
| `npm.cmd run test` | PASS; 22 tests |
| `npm.cmd run test:e2e` | PASS; 16 tests including network-zero and XSS |
| `npm.cmd run test:visual` | PASS; 4 tests / required viewports |
| `npm.cmd audit --audit-level=low` | PASS; 0 vulnerabilities |
| `git diff --check` | PASS |

## Deployment

No manual production deployment was executed. Publication remains governed by the repository's normal main-branch integration path.
