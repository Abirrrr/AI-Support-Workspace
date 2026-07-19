# Coding Agent Rules

## Source of Truth

Repository documentation is the source of truth for product direction, architecture, and milestone scope.

## Architecture Discipline

- Never redesign the architecture without updating the relevant documentation.
- Never expand milestone scope beyond the current milestone goal.
- Stop and report architectural conflicts when a proposed change would break the documented direction.

## Milestone Discipline

- Every milestone should leave the repository in a usable and testable state.
- Every milestone should include automated tests where applicable.
- Do not implement business functionality outside the current milestone unless explicitly requested.

## Documentation Discipline

- Always update documentation after milestone completion.
- Keep the project state document aligned with the latest work.
- Preserve the long-term traceability of decisions and architecture changes.

## Change Discipline

- Never commit unless explicitly instructed to do so.
- Keep changes small and focused on the current milestone.
- Prefer clear, reversible edits over broad refactors.

## Completion Report Requirements

Every completion report must include:

- Files changed
- Tests executed
- Validation performed
- Known limitations
- Architecture concerns
- Documentation updated

## Non-Goals for This Milestone

This milestone does not implement the Chrome extension, AI features, Ollama, OpenAI, the database, snippets, the knowledge library, or the UI.
