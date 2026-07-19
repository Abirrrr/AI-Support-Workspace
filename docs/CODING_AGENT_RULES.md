# Coding Agent Rules

## Source of Truth

Repository documentation is the only source of truth for product direction, architecture, workflow, milestone scope, and project state. Conversation history is never authoritative project memory.

## Architecture Discipline

- Never redesign the architecture without updating the relevant documentation.
- No implementation task may introduce architecture that has not already been documented and approved.
- Implementation milestones inherit their architecture from the repository documentation.
- If implementation requires an undocumented technical decision, stop and return the decision for documentation and approval before proceeding.
- Never expand milestone scope beyond the current milestone goal.
- Stop and report architectural conflicts when a proposed change would break the documented direction.

## Approved Platform Discipline

- Implementation must use WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged in their documented roles.
- Do not substitute platform technologies, such as replacing WXT with Plasmo or pnpm with npm, without an explicit architecture review and approved documentation update.
- Infrastructure libraries must remain behind the documented layer boundaries and must not redefine business logic.

## Milestone Discipline

- Every milestone should leave the repository in a usable and testable state.
- Every milestone should include automated tests where applicable.
- Do not implement business functionality outside the current milestone unless explicitly requested.

## Scope Interpretation

- When milestone scope appears ambiguous, repository documentation overrides inference.
- Report the ambiguity instead of silently narrowing, expanding, or redefining the milestone.
- Do not silently remove required infrastructure work from an implementation milestone.
- Infrastructure is the technical machinery that enables implementation, including repository tooling, build and validation configuration, and—when assigned by the roadmap—the runtime extension shell and browser entry points.
- Architecture is the approved set of technologies, boundaries, responsibilities, and constraints that implementation must inherit.
- Business functionality is product-specific behavior and user value, including support workflows, knowledge and snippet behavior, retrieval, prompt construction, AI-provider behavior, and generated output.
- Classifying work as infrastructure does not move it between milestones; the roadmap remains authoritative for milestone ownership.

## Principal Engineer Implementation Task Standard

Before implementation begins, the Principal Engineer must produce one finalized implementation specification for Codex. The specification must be directly copy-pasteable and include:

- The complete approved milestone goal and scope.
- Explicit non-goals and milestone boundaries.
- Required automated and manual validation.
- The required completion report.
- Any repository-document reading order or task-specific constraints.

After the specification is finalized, it should not be revised incrementally unless the user explicitly requests a revision. If a revision is requested, the Principal Engineer should provide one consolidated replacement specification so the implementation task remains deterministic and unambiguous.

## Required Engineering Lifecycle

Every implementation milestone must follow this sequence:

```text
Principal Engineer defines and finalizes milestone scope

↓

Codex implements the approved scope and completes required automated validation

↓

Principal Engineer reviews the implementation and validation results

↓

Documentation Impact Review

↓

Repository documentation synchronized when required

↓

Manual validation

↓

Authorized Git checkpoint

↓

GitHub push

↓

Local and remote repositories synchronized; repository ready for next milestone
```

Documentation synchronization is part of milestone completion, not optional follow-up work. A milestone is not complete until every applicable item in the Milestone Closeout Checklist is satisfied.

## Documentation Impact Review

The Documentation Impact Review is a mandatory engineering gate after Principal Engineer implementation review and before manual validation or Git checkpoint approval. No Git checkpoint should be approved until this review is complete.

The review determines whether the completed work requires updates to:

- `PROJECT_STATE.md`.
- `CHANGELOG.md`.
- Architecture documentation.
- Engineering workflow documentation.
- Engineering principles.
- Technical decision records.
- Repository continuity and handoff documentation.
- Product requirements, product workflows, or other product documentation.
- Any other repository document affected by the completed work.

Required updates must be completed before the milestone can close. If no documentation changes are required, that outcome must be recorded explicitly in `CHANGELOG.md`, `PROJECT_STATE.md`, or another appropriate repository closeout document. The repository—not conversational memory—remains the authoritative record of the review outcome and resulting engineering knowledge.

## Milestone Closeout Checklist

Use this checklist for every implementation milestone:

- [ ] Principal Engineer implementation review and approval completed.
- [ ] Required automated validation completed.
- [ ] Documentation Impact Review completed and its outcome recorded.
- [ ] Repository documentation synchronized when required.
- [ ] Manual validation completed when applicable.
- [ ] `PROJECT_STATE.md` updated when applicable.
- [ ] `CHANGELOG.md` updated when applicable.
- [ ] Intended checkpoint diff reviewed with no unrelated changes.
- [ ] Authorized Git checkpoint created.
- [ ] Git working tree clean after the checkpoint.
- [ ] GitHub push completed.
- [ ] Local and remote repositories synchronized.
- [ ] Repository ready for the next milestone.

## Documentation Discipline

- Complete the Documentation Impact Review after implementation review and before manual validation or Git checkpoint approval.
- Update affected repository documentation before manual validation and the Git checkpoint.
- Explicitly record a no-update outcome when the Documentation Impact Review finds that no documentation changes are required.
- Keep the project state document aligned with the latest work.
- Preserve the long-term traceability of decisions and architecture changes.
- Treat missing documentation updates as a failed milestone review.

## Repository Synchronization

- Git is the implementation history.
- GitHub is the canonical remote repository and backup.
- Every approved milestone must end with an authorized Git checkpoint followed by a GitHub push.
- Confirm that the local checkpoint exists on the remote and that the working tree is clean before beginning the next milestone.
- Local and remote repositories should remain synchronized at milestone boundaries.
- Never store repository URLs, credentials, access tokens, or other secrets in workflow documentation.

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
- Documentation Impact Review outcome

## Milestone 1 Scope Boundary

Milestone 1 does not implement the Chrome extension shell, AI features, Ollama, OpenAI, the database, snippets, the knowledge library, or the UI. Its exact technical-foundation task requires Principal Engineer approval before work begins.
