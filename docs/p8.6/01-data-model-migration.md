# P8.6-01 Data Model / localStorage Migration

**Result: PASS**

## Implemented

- Advanced the Web Demo state to schema version 3 and storage key `life-launcher-web-demo:v3`.
- Made Project NextStep optional.
- Added optional Project identity to Wishlist rows.
- Standardized source identity as `nextstep:{projectId}` and `wishlist:{wishlistId}`.
- Added derived Source Lock from unfinished Today3 source identity.
- Added non-destructive v2-to-v3 read, normalize, validate, then write migration.
- Kept legacy Wishlist rows unassigned instead of guessing a Project.
- Preserved same-text Wishlist rows as distinct stable IDs.
- Preserved Today3 source snapshots, max-three validation, exclusions, sessions, victory, and remaining disclosure state.
- Deliberately ignored the old permanent Builder open state during migration.
- Kept readable v2 data when writing the migrated v3 copy fails.
- Reset now removes v3, v2, and v1 namespaced data after the fresh v3 state is saved.

## Verification

| Gate | Result |
| --- | --- |
| Unit | PASS; 57 tests |
| E2E | PASS; 32 tests |
| Lint | PASS |
| TypeScript / Vite build | PASS |

Coverage includes empty Projects, optional NextStep, Project-backed and unassigned Wishlist, same-text different IDs, Today3 max3, source preservation, reload, old schema, malformed storage, migration write failure, and derived lock/unlock identity.

## Boundary

The permanent Builder UI remains temporarily in this Stage. P8.6-02 replaces it with the Today Picker and removes the transitional `todayBuilder` section state.
