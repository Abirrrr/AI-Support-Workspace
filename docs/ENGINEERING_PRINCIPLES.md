# Engineering Principles

## Local-first

User data must not depend on a backend service. The product should remain usable even when network access is unavailable.

## Performance-first

Fast startup, responsive interactions, and quick local retrieval are prioritized over unnecessary features.

## Simplicity over Cleverness

Prefer obvious, maintainable solutions over clever mechanisms. Complexity should only be introduced when it solves a demonstrated problem; avoid premature abstractions, global state systems, and plugin systems.

## Buy Infrastructure. Build Product.

Adopt mature, well-supported libraries for infrastructure concerns instead of recreating solved platform capabilities. WXT, React, Dexie, and Playwright provide extension, UI, persistence, and browser-testing infrastructure.

Custom engineering effort should focus on product-specific value such as the Prompt Builder, Knowledge Retrieval, AI Provider Boundary, and Snippet Engine. Infrastructure may be extended only when an approved product requirement cannot be met cleanly by the selected platform.

## Provider Independence

Business logic must not depend on a specific AI provider. Provider integrations should remain isolated behind a narrow boundary.

## Small, Reviewable Milestones

Each milestone should be small enough to review thoroughly and must leave the project in a usable and testable state. Progress should be easy to validate, reverse, and resume later.

## Documentation Before Implementation

Architecture, product direction, and milestone scope must be documented and approved before implementation begins. Documentation is part of engineering work, not a retrospective summary.

Milestone closeout also requires the mandatory Documentation Impact Review defined in `CODING_AGENT_RULES.md`. A milestone is not complete until affected repository documentation is synchronized—or a no-update outcome is explicitly recorded—before its Git checkpoint.

## Document Technical Decisions First

A technical choice that affects the platform, language, framework, build, testing, storage, state management, project structure, or cross-layer contracts must be recorded with its rationale before implementation adopts it.

## No Undocumented Architectural Changes

Implementation may not introduce or redefine architecture implicitly. When an implementation task requires an undocumented architectural choice, work must stop until the repository documentation records and approves the decision.

## Repository-first Continuity

The repository documentation always takes precedence over conversational memory. Every architectural change, milestone completion, or workflow change must be reflected in repository documentation before implementation continues.

Git preserves the implementation history, while the canonical GitHub remote provides synchronization and backup. Approved milestone checkpoints must be pushed before the repository advances to the next milestone.

## Repository Continuity Validation

After a major architecture phase, reconstruct the project in a new conversation using repository documentation alone before implementation proceeds. The reconstruction should recover the approved architecture, technology stack, milestone boundaries, current repository state, and next engineering action without relying on prior conversational memory.

A failed or ambiguous reconstruction is a documentation defect. Correct the repository documentation and repeat the validation before implementation begins.

## Documentation as Constitution

When design questions arise, they should be checked against these principles before architecture changes are made.
git add .
git commit -m "docs: define ollama provider architecture"
git push