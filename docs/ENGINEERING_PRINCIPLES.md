# Engineering Principles

## Local-first

User data must not depend on a backend service. The product should remain usable even when network access is unavailable.

## Performance-first

Fast startup, responsive interactions, and quick local retrieval are prioritized over unnecessary features.

## Simplicity over Abstraction

Complexity should only be introduced when it solves a demonstrated problem. Avoid premature abstractions and plugin systems.

## Provider Independence

Business logic must not depend on a specific AI provider. Provider integrations should remain isolated behind a narrow boundary.

## Small, Verifiable Milestones

Each milestone should leave the project in a usable and testable state. Progress should be easy to review and easy to resume later.

## Repository-first Continuity

The repository documentation always takes precedence over conversational memory. Every architectural change, milestone completion, or workflow change must be reflected in repository documentation before implementation continues.

## Documentation as Constitution

When design questions arise, they should be checked against these principles before architecture changes are made.
