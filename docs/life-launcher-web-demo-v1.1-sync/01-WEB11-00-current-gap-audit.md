# WEB11-00 — Current Web Demo Audit & Gap Freeze

## Goal
現在のlife-launcher-webとWindows v1.1の差分を実装前に固定する。原則、本実装しない。

## Audit
1. Git baseline / origin/main / clean tree
2. Productionとmainの関係
3. Cloudflare Git integration / production branch / preview build / build command / output
4. Hero/CTA/Victory/Do Now/Today3/Builder/NextStep/Wishlist/Today Activity/Timer/Dictionary/Resetのinventory
5. localStorage schema / Reset scope
6. current tests/scripts inventory
7. Windows v1.1とのgapを以下で分類:
   - ALREADY MATCHES
   - NEEDS VISUAL SYNC
   - NEEDS BEHAVIOR SYNC
   - NATIVE-ONLY / SKIP

## 特に確認
### Today3
3列? Timer? manual checkbox? completion? next batch? responsive? project colors?

### Today Builder
source-only? free add? old source dropdown? card/row layout? grouping? 今日へ? pagination?

### Lower sections
NextStep/Wishlistのcompact化、accordion、重複した今日へ。

### Copy
manual checkboxや旧Builderの説明、v1.0限定表記が残っていないか。

## Baseline screenshots
1366/1440/1920/390 + demo default/Builder/Today3/timer/completed/next batch/Dictionary。

## Deliverables
- docs/v1.1-sync/00-gap-audit.md
- docs/v1.1-sync/00-visual-baseline.md
- docs/v1.1-sync/00-test-inventory.md
- docs/v1.1-sync/workreports/web11-00-report.md

PR作成後STOP。
