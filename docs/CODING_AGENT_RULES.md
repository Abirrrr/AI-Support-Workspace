# Coding Agent Rules

## Source of Truth

Repository documentation is the only source of truth for product direction, architecture, workflow, milestone scope, and project state. Conversation history is never authoritative project memory.

## Interruption-Safe Agent Execution

Substantial or multi-phase coding-agent work must remain safely resumable when a usage limit, low or exhausted context, disconnection, unexpected command duration, or user-requested pause interrupts the session. Repository state is authoritative; conversation history is supplementary only. A task must not depend on its original conversation remaining available.

### Durable Resume Checkpoint

Before substantial work begins, identify where working state will be persisted. Use this order unless the task specification gives a stronger applicable instruction:

1. A task-specific working or report document, when one naturally exists.
2. The active-task section of `PROJECT_STATE.md`.
3. A dedicated temporary task-state document only when justified.

A Durable Resume Checkpoint is working-state documentation. **Durable Resume Checkpoint != Git Checkpoint.** Creating or updating one does not authorize staging, committing, or pushing, and agents must not create extra Git commits merely to survive session limits.

Keep the checkpoint concise and record, as applicable:

- Exact task identifier.
- Current phase and completed phases.
- Files changed.
- Validated evidence and results.
- Incomplete, interrupted, failed, or unvalidated work.
- Expensive operations already completed and not to repeat unnecessarily.
- Exact next action.
- Current Git state, including staged, commit, and push state.

Do not duplicate a full completion report after every phase. Update the checkpoint:

- After each meaningful completed phase.
- After obtaining costly or important evidence.
- Before long-running work, expensive benchmark or test batches, migrations, or other difficult-to-reproduce operations.
- Whenever the remaining session capacity may not safely cover the next substantial phase.

### Usage and Context

Use available capacity efficiently while preserving correctness, evidence integrity, and resumability:

- Continue while the next bounded phase can reasonably complete.
- Do not pause unnecessarily early only because significant capacity has been consumed.
- When remaining usage or context is low or uncertain, do not begin another substantial phase.
- Persist the Durable Resume Checkpoint before an operation that may outlast the session.
- Correctness, evidence integrity, and resumability take priority over consuming the final available capacity.

When a comparable usage meter is visible, an approximate final 10–15% safety reserve may guide operations. This is not a normative provider-specific percentage or permanent contract.

### Safe Pause Protocol

When interruption is expected:

1. Finish the current atomic operation when safe.
2. Do not begin another substantial phase.
3. Persist the Durable Resume Checkpoint.
4. Mark interrupted or unvalidated work truthfully.
5. Record the exact next resume action.
6. Capture current Git status.
7. Do not stage, commit, or push merely because execution is pausing.
8. Return a concise `PAUSED` handoff.
9. Stop.

An intentionally paused task is not a failed engineering task. Its Principal-readiness self-check may be `FAIL` only because the task remains incomplete.

### Unexpected Interruption Recovery

If a session ends before a handoff is produced, the next session must reconstruct state in this order:

1. `PROJECT_STATE.md`.
2. Task-specific resume or report state.
3. `CODING_AGENT_RULES.md`.
4. Current Git status and diff.
5. Preserved evidence and results.
6. Other relevant repository documentation.

Inspect existing work before editing. Preserve valid completed work and do not automatically rerun expensive operations. If existing work is unsafe, corrupted, out of scope, or unreliable, stop and report the specific conflict.

### Task Identity During Interruption

A usage, context, or session interruption alone does not create a new task letter, a corrective decimal suffix, or a new milestone. Resume the same task identifier. Corrective decimal suffixes remain reserved for actual focused corrections under the existing task-identification rules; independent letters remain reserved for genuinely independent work.

### Completion Cleanup

When the task completes, consolidate temporary resume notes, remove or replace stale active-state instructions, retain historical evidence that materially explains the result, and update `PROJECT_STATE.md` to the final state. The final completion report supersedes temporary pause handoffs. Keep the repository resumable without turning it into a log dump.

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

## Milestone Task Identification

- Every Principal Engineer or coding-agent task inside a milestone must use a unique identifier made from the parent milestone number and a sequential letter, such as `M12-A`, `M12-B`, `M12-C`, and `M12-D`.
- Normal task letters are assigned sequentially and are never reused within the same milestone for an independent task.
- Every Codex task heading and matching completion-report heading must include the exact task identifier.
- `PROJECT_STATE.md` must record the current active task identifier. A task may not silently change the documented milestone or active task.
- Every completion report must confirm that work remained within the identified task scope.
- Git commit messages may include the task identifier when useful, but no task-identifier commit-message format is mandatory.
- This convention introduces no epics, sprints, ticket system, story points, issue tracker, or deeper project-management hierarchy.

### Corrective Task Suffixes

- A focused corrective task or corrective continuation uses a sequential decimal suffix, such as `M12-C.1` and `M12-C.2`. Resuming unchanged scope after a usage, context, or session interruption keeps the original identifier and is not a corrective continuation.
- A decimal correction remains part of the original task and does not consume the next normal letter. The next independent task after `M12-C`, `M12-C.1`, or `M12-C.2` remains `M12-D`.
- A correction must not be represented as a new independent task, and a previous identifier must not be reused for unrelated work.
- M12-A.1 is the corrective execution of the missing M12-A documentation work; M12-A ran only a readiness self-check, produced no repository changes, and was superseded rather than reused.

### Task Continuity Gate

Before changing files, the coding agent must compare the supplied identifier, milestone, repository documentation, and Git state. Stop and report a continuity conflict when:

- The supplied task identifier conflicts with the active task in `PROJECT_STATE.md`.
- An identifier is reused for an independent task.
- The supplied milestone number differs from the current documented milestone.
- A corrective task is represented as a new independent task.
- The next sequential task identifier is skipped without explanation.
- Documentation and Git state materially disagree.

## Scope Interpretation

- When milestone scope appears ambiguous, repository documentation overrides inference.
- Report the ambiguity instead of silently narrowing, expanding, or redefining the milestone.
- Do not silently remove required infrastructure work from an implementation milestone.
- Infrastructure is the technical machinery that enables implementation, including repository tooling, build and validation configuration, and—when assigned by the roadmap—the runtime extension shell and browser entry points.
- Architecture is the approved set of technologies, boundaries, responsibilities, and constraints that implementation must inherit.
- Business functionality is product-specific behavior and user value, including support workflows, knowledge and snippet behavior, retrieval, prompt construction, AI-provider behavior, and generated output.
- Classifying work as infrastructure does not move it between milestones; the roadmap remains authoritative for milestone ownership.

## Principal Engineer Task Specification Standard

Before a substantial implementation or diagnostic task begins, the Principal Engineer must produce one finalized task specification for the coding agent. The specification must be directly copy-pasteable and include:

- The complete approved milestone goal and scope.
- Explicit non-goals and milestone boundaries.
- Required automated and manual validation.
- The required completion report.
- Any repository-document reading order or task-specific constraints.
- The Durable Resume Checkpoint location for substantial work.
- The required checkpoint cadence.
- Safe-pause behavior and truthful incomplete-work reporting.
- Resume semantics, including reuse of the same task identifier after session interruption.
- Git restrictions during pause; a Durable Resume Checkpoint never authorizes staging, commit, or push.

Small atomic tasks may state that no dedicated task-specific resume file is required, but they still inherit the global Interruption-Safe Agent Execution rules.

After the specification is finalized, it should not be revised incrementally unless the user explicitly requests a revision. If a revision is requested, the Principal Engineer should provide one consolidated replacement specification so the task remains deterministic and unambiguous.

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

## Principal-Readiness Self-Check

- Every Principal Engineer or coding-agent task must end with a final independent Principal-readiness review before its completion report.
- The review must verify the exact task identifier in the task and report headings, current milestone and active-task continuity, adherence to only the identified task scope, documentation consistency, intended-file-only Git diff, required validation results, and the absence of unauthorized commits or pushes.
- The completion report must state `Principal-readiness self-check: PASS` or `Principal-readiness self-check: FAIL`.
- A failed self-check must list every unresolved issue, must not claim the task is complete, and must not recommend a checkpoint until the issues are resolved.

## Repository Synchronization

- Git is the implementation history.
- GitHub is the authoritative remote Git history and recovery source.
- Google Drive may synchronize working-tree project files, but the repository's separate external Git metadata directory is local operational state and is not a portable or synchronized project artifact.
- Repository documentation remains the project continuity source of truth, and normal clone/recovery from GitHub remains supported.
- Every approved milestone must end with an authorized Git checkpoint followed by a GitHub push.
- Confirm that the local checkpoint exists on the remote and that the working tree is clean before beginning the next milestone.
- Local and remote repositories should remain synchronized at milestone boundaries.
- Never store repository URLs, credentials, access tokens, or other secrets in workflow documentation.

## Git Metadata Safety

- This repository uses Git's separate-git-dir mechanism. The project-root `.git` is a pointer file, not a Git metadata directory.
- Before any direct Git metadata inspection or operation, resolve the actual directory with `git rev-parse --absolute-git-dir`. Never assume project-root `.git` is a directory.
- Never delete, recreate, rewrite, or recursively modify the `.git` pointer file as routine cleanup.
- Use `git fsck --full` for Git integrity validation. The former recursive `.git/**/desktop.ini` sweep is obsolete and must not appear in routine preflight or final-validation guidance.
- Direct operations on the resolved Git metadata directory require deliberate Principal authorization. Do not run destructive history or object cleanup, including `git gc`, `git prune`, or similar cleanup commands, unless intentionally authorized.
- Never run `git reset --hard` unless the Principal explicitly authorizes that exact destructive operation.

## Change Discipline

- Never commit unless explicitly instructed to do so.
- A required Git checkpoint must be created only after explicit authorization; until then, the milestone remains awaiting its checkpoint.
- Keep changes small and focused on the current milestone.
- Prefer clear, reversible edits over broad refactors.

## Completion Report Requirements

Every completion report must include:

- A heading containing the exact active task identifier
- Confirmation that only the identified task scope was addressed
- Files changed
- Tests executed
- Validation performed
- Known limitations
- Architecture concerns
- Documentation updated
- Documentation Impact Review outcome
- Principal-readiness self-check result

## Milestone 1 Scope Boundary

Milestone 1 does not implement the Chrome extension shell, AI features, Ollama, OpenAI, the database, snippets, the knowledge library, or the UI. Its exact technical-foundation task requires Principal Engineer approval before work begins.
