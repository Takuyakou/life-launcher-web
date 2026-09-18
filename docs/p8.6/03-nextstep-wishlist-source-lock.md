# P8.6-03 NextStep / Wishlist / Source Lock

**Result: PASS**

## Implemented

- Rebuilt NextStep as compact, flat source rows below the stronger Today3 action cards.
- Preserved Project identity and added direct Gold `＋ 今日へ` plus `変更` / `次の一手を設定` actions.
- Added the empty state `まだ次の一手がありません`.
- Added a focused NextStep edit dialog with keyboard containment, Escape, validation, and focus restoration.
- Grouped Wishlist rows by Project, with Project identity secondary, task text primary, and unassigned items in a final `未分類` group.
- Added direct Wishlist `＋ 今日へ` actions that retain the source item.
- Added derived Source Lock indicators and `✓ 今日の3件` status for selected NextStep and Wishlist sources.
- Disabled NextStep replacement while the same source is present as an unfinished Today3 item.
- Applied the same lock to timer-completion replacement, while allowing replacement when that timer completes the matching Today item.
- Unlocked sources immediately after Today completion or removal.
- Kept same-text Wishlist rows independent through stable source IDs.

## Verification

| Gate | Result |
| --- | --- |
| Unit | PASS; 58 tests |
| E2E | PASS; 39 tests, 1 intentional production-preview skip |
| Visual | PASS; 16 tests |
| Lint | PASS |
| TypeScript / Vite build | PASS |

Coverage includes normal, empty, lock, completed-source unlock, remove unlock, grouped and unassigned Wishlist, direct adoption, same-text different-ID isolation, conflicting completion replacement, persistence, and reload. Existing visual coverage continues across 1920, 1440, 1366, 1000, and 390 pixel widths with no horizontal overflow.

## Boundary

Do Now Project-color follow, `他の一手` wording, and the complete Main-derived interaction grammar remain for P8.6-04 and P8.6-05.
