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

## Manual Verification Requirements

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors were not applicable to Milestone 0 and should not be treated as fully automatable when later milestones introduce them.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
