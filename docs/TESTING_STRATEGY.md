# Testing Strategy

## Testing Philosophy

Testing should be automated wherever practical. The repository should favor a lightweight but reliable quality bar that keeps future milestones safe to evolve.

Vitest is the approved platform for unit, React UI, and integration tests. Playwright is the approved platform for browser-level end-to-end tests. Manual validation remains required when extension behavior cannot be validated reliably through automation.

## Required Checks

- TypeScript type checking
- ESLint
- Prettier formatting checks
- Vitest unit, UI, and integration tests
- Playwright end-to-end tests where practical
- Minimal manual validation

## Testing Priorities

- Validate business logic using Vitest unit tests.
- Validate React behavior using Vitest UI tests.
- Validate Dexie storage and retrieval flows through Vitest integration tests.
- Validate browser workflows using Playwright and manual verification where automation is not practical.

### Persistence Integration Tests

Milestone 3 Dexie integration tests use `fake-indexeddb` as an approved development/test-only IndexedDB adapter. Tests must use isolated databases, close and clean them deterministically, and never access extension or user data. Persistence-across-reopen behavior is tested by closing one database instance and reopening the same isolated test database through a new instance.

Milestone 3 completed this integration coverage with 13 passing persistence tests. The full project Vitest suite passed with 4 files and 15 tests, including UUID, timestamp, deterministic ordering, missing-record, error-wrapping, update, and database close-and-reopen behavior.

### Knowledge Library Tests

Milestone 4 added focused application tests for repository delegation, persistence-error propagation, and deterministic ordering; React UI tests for loading, existing and empty states, create, edit, delete confirmation, immediate list updates, and safe user-visible errors; and an integration test proving that the application workflow persists through the real Knowledge repository and Dexie boundary. The full project Vitest suite passed with 7 files and 25 tests.

## Manual Verification Requirements

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors were not applicable to Milestone 0 and should not be treated as fully automatable when later milestones introduce them.

No Milestone 3-specific manual Chrome validation was required. Its persistence boundary is validated more appropriately through isolated IndexedDB integration tests, and adding temporary browser UI solely for manual persistence testing would violate the approved milestone boundary. Regression validation confirmed that the existing Manifest V3 extension shell remains operational.

Milestone 4 manual Chrome validation confirmed that popup navigation opens the Knowledge Library on the existing options-page surface, creation and editing appear immediately and persist across reload or reopen, deletion cancellation preserves the record, confirmed deletion remains effective after reload or reopen, and the tested Knowledge Library workflow reports no runtime problems.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
