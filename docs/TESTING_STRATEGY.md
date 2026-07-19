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

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors should not be treated as fully automatable in the early repository foundation stage.

## Current Milestone Status

This milestone does not add implementation code, so there are no runtime tests to execute. The testing approach is established for future milestones.
