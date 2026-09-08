# WEB11-01 — Main UI / Today3 / Section Layout Sync

## Goal
Web DemoのMainをWindows v1.1の視覚階層へ寄せる。Landing全面改修は禁止。

## Main order
Victory → Do Now → Today3 → Today Builder → NextStep → Wishlist → Today Activity

## Today3
- wide 3列 / medium 2列 / narrow 1列
- project color/name/action
- short/normal Timer
- manual checkbox完了を使わない
- DemoではTimer完了の結果として✓になることが分かる
- Demo-only「満了まで進める」は維持可
- 3/3完了時だけ「次の3件を選ぶ」
- 自動補充なし

## Section header
- chevron
- title
- count
- muted description
- bar全体で開閉
- child action clickはtoggleしない

## NextStep / Wishlist / Today Activity
heavy card chromeを減らしcompact list/accordionへ。Web Demoに不要な管理機能は増やさない。

## Do Now
現行Web Demoの固定reason/rotationを維持。Rustロジック完全再現禁止。

## Visual QA
1366/1440/1920/390。Today3 0/1/2/3、3完了、next batch、open/closed sections。

PR + tests + report後STOP。
