# P8.6-02 Today Picker / Today3

**Result: PASS**

## Implemented

- Removed the permanent Today Builder, its transitional section state, pagination surface, and unused UI styles.
- Added `＋ 今日やるものを選ぶ` only while Today3 contains zero to two items.
- Added a modal Today Picker with three stable destination slots and an explicit `N / 3` count.
- Split available sources into `次の一手 N件` and `やりたいこと N件` tabs.
- Omitted selected sources from the lower source list while preserving their Project, NextStep, or Wishlist source.
- Added distinct selected status, Gold `＋ 今日へ`, and Neutral `今日から外す` actions.
- Kept the maximum at three and retained the fast third-add auto-close behavior.
- Prevented backdrop click from closing the Picker.
- Added close via close button, Cancel, and Escape with focus restoration to the Picker trigger.
- Fixed the Picker height so removing or adding rows does not resize the dialog.
- Kept running or paused Today items non-removable.

## Verification

| Gate | Result |
| --- | --- |
| Unit | PASS; 57 tests |
| E2E | PASS; 35 tests, 1 intentional production-preview skip |
| Visual | PASS; 16 tests |
| Lint | PASS |
| TypeScript / Vite build | PASS |

Coverage includes 0/3, 1/3, 2/3, 3/3, add, remove, max-three, source preservation, selected-source omission, same-text different-source identity, source tabs, backdrop behavior, Escape, Cancel, focus restore, reload, long text, and 390px narrow layout. Visual evidence covers 1920, 1440, 1366, 1000, and 390 pixel widths with no horizontal overflow.

## Boundary

Project-grouped Wishlist presentation and Source Lock indicators remain for P8.6-03. Do Now Project-color behavior and interaction grammar remain unchanged until their dedicated Stages.
