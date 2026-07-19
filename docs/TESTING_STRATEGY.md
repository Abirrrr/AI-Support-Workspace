# Testing Strategy

## Testing Philosophy

Testing should be automated wherever practical. The repository should favor a lightweight but reliable quality bar that keeps future milestones safe to evolve.

## Required Checks

- Type checking
- Linting
- Unit tests
- Integration tests
- End-to-end tests where practical
- Minimal manual validation

## Testing Priorities

- Validate business logic using unit tests.
- Validate local storage and retrieval flows through integration tests.
- Validate browser-specific features through manual verification when automation is not practical.

## Manual Verification Requirements

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors were not applicable to Milestone 0 and should not be treated as fully automatable when later milestones introduce them.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
