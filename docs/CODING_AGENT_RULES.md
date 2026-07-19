# Coding Agent Rules

## Source of Truth

Repository documentation is the only source of truth for product direction, architecture, workflow, milestone scope, and project state. Conversation history is never authoritative project memory.

## Architecture Discipline

- Never redesign the architecture without updating the relevant documentation.
- Never expand milestone scope beyond the current milestone goal.
- Stop and report architectural conflicts when a proposed change would break the documented direction.

## Milestone Discipline

- Every milestone should leave the repository in a usable and testable state.
- Every milestone should include automated tests where applicable.
- Do not implement business functionality outside the current milestone unless explicitly requested.

## Required Engineering Lifecycle

Future milestones must follow this sequence:

```text
Architecture / Product Decision

↓

Principal Engineer creates implementation task

↓

Coding Agent implementation

↓

Automated validation

↓

Principal Engineer review

↓

Manual validation

↓

Repository documentation update

↓

Git commit

↓

Next milestone
```

A milestone is not complete until:

- Documentation is updated.
- Principal review is complete.
- Manual validation is complete when applicable.
- A Git checkpoint has been created.

## Documentation Discipline

- Update repository documentation as part of milestone completion, after review and validation and before the Git checkpoint.
- Keep the project state document aligned with the latest work.
- Preserve the long-term traceability of decisions and architecture changes.
- Treat missing documentation updates as a failed milestone review.

## Change Discipline

- Never commit unless explicitly instructed to do so.
- A required Git checkpoint must be created only after explicit authorization; until then, the milestone remains awaiting its checkpoint.
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

## Milestone 1 Scope Boundary

Milestone 1 does not implement the Chrome extension shell, AI features, Ollama, OpenAI, the database, snippets, the knowledge library, or the UI. Its exact technical-foundation task requires Principal Engineer approval before work begins.
