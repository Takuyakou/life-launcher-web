# P8.6-04 Do Now / Other Step / Project Color Follow

**Result: PASS**

## Implemented

- Derived Do Now candidates only from Projects that currently have a NextStep.
- Documented the deterministic Web Demo rule: candidates follow Project registration order, with no hidden score.
- Added the exact explanatory copy for the single suggested next action.
- Replaced `別の候補` with `他の一手`, shown only when at least two candidates exist.
- Moved candidate rotation into component-local temporary UI state.
- Kept canonical Projects, NextSteps, Today3, source order, and localStorage unchanged while rotating.
- Applied the active Project color to the dot, Project label, left accent, and thin card border.
- Removed the fixed green card accent and prevented stale Project color after rotation.
- Kept short timer green, normal timer blue, Gold Add, neutral, and destructive semantic colors independent from Project identity.
- Preserved reduced-motion behavior.

## Verification

| Gate | Result |
| --- | --- |
| Unit | PASS; 58 tests |
| E2E | PASS; 42 tests, 1 intentional production-preview skip |
| Visual | PASS; 17 tests |
| Lint | PASS |
| TypeScript / Vite build | PASS |
| Public safety | PASS; 143 files |

Coverage includes one candidate, two candidates, a three-candidate cycle, amber-to-green-to-blue color changes, border/dot equality, stale-color prevention, canonical localStorage immutability, timer semantic-color stability, reduced motion, and A/B screenshots.

## Boundary

The broad Main-derived hover, focus-visible, pressed, disabled, card, modal, and responsive interaction grammar remains for P8.6-05.
