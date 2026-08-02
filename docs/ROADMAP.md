# Roadmap

## Milestone 0 — Foundation (Completed)

Established the repository structure, documentation setup, and engineering workflow foundation.

## Milestone 0B — Repository Documentation Finalization (Completed)

Finalized the repository as the authoritative project memory and established the permanent milestone lifecycle.

## Milestone 0C — Technical Architecture Decisions (Completed)

Documented the engineering platform requirements, architectural layers, standards, and application boundaries before implementation.

## Milestone 0D — Platform Architecture Approval (Completed)

Approved and froze the infrastructure stack that all implementation milestones must inherit.

## Milestone 1 — Technical Foundation (Completed)

### Goal

Establish the approved repository tooling, configuration, validation, and test foundation required before runtime extension infrastructure or product functionality is implemented.

### In Scope

- Initialize pnpm project metadata and deterministic dependency management.
- Install and configure the approved WXT, TypeScript, React, Tailwind CSS, and repository tooling dependencies without creating runtime extension entry points.
- Establish the minimal WXT build-tooling configuration needed for the technical foundation.
- Configure TypeScript type checking.
- Configure ESLint and Prettier.
- Configure Vitest and the Playwright testing foundation.
- Configure Husky and lint-staged commit quality gates.
- Define repeatable WXT preparation or configuration-validation, type-check, lint, format-check, and test commands appropriate to this milestone.
- Update continuous integration to run the applicable technical-foundation validation.

### Out of Scope

- The runtime extension shell, Manifest V3 manifest contents, permissions, background service worker, content script, popup, options page, and Side Panel.
- AI generation or AI-provider integrations.
- Retrieval or the Prompt Builder.
- Knowledge Library or Snippet Library functionality.
- Dexie storage implementation, schemas, migrations, indexes, or transactions.
- Business logic, product workflows, or other product functionality.

Side Panel was not approved within Milestone 1 and could not be introduced there without a documented architecture and product decision. The later Milestone 9 architecture now approves Side Panel specifically as the global Output Workspace surface; that amendment does not move Side Panel or other extension-shell work into Milestone 1. All other extension-shell infrastructure listed above remains assigned to Milestone 2.

### Completion Criteria

- pnpm installs the approved dependencies reproducibly and produces the repository's approved lockfile.
- WXT and TypeScript configuration preparation or validation completes successfully without adding runtime extension entry points or business behavior; producing a runnable extension bundle remains scoped to Milestone 2.
- Type checking, ESLint, Prettier checks, and Vitest complete successfully through documented commands.
- The Playwright foundation is configured and can be invoked; browser workflow tests remain scoped to milestones that provide a runnable extension workflow.
- Husky and lint-staged enforce the documented staged-file quality gate.
- Continuous integration runs all validation applicable to the technical foundation.
- No extension shell, storage implementation, provider integration, product UI, business logic, or product functionality is introduced.
- Principal Engineer review, applicable manual validation, repository documentation updates, and the Git checkpoint are complete.

## Milestone 2 — Extension Shell (Completed)

Create the basic Chrome extension shell and manifest scaffolding.

## Milestone 3 — Local Database (Completed)

Introduce local persistence and the initial storage layer.

## Milestone 4 — Knowledge Library (Completed)

Implement the knowledge library experience and local management flows.

## Milestone 5 — Snippet Library (Completed)

Implement the snippet library experience and local management flows.

## Milestone 6 — Retrieval Engine (Completed)

Implement fast local search and retrieval over stored content.

## Milestone 7 — Prompt Builder (Completed)

Create a provider-independent prompt composition layer.

## Milestone 8 — Ollama Provider (Completed)

Add Ollama as the first AI provider integration.

## Milestone 9 — Output Workspace (Completed)

Provide a workspace for reviewing and refining AI-generated output.

## Milestone 10 — Keyboard Shortcut (Completed)

Add a keyboard shortcut for quick access to the extension experience.

## Milestone 11 — Settings (Completed)

Provide a local Settings UI where the user can save one optional default Ollama model and have each new Workspace Side Panel session initialize its transient model field from that saved value. Establish the typed Settings persistence boundary and the Dexie version 2 migration that adds only the singleton Settings record.

Provider selection, provider endpoint configuration, behavior tuning, theme, shortcut settings, persistent writing preferences, and other generic configuration are not part of M11. Provider selection remains deferred until Milestone 13 — Provider Expansion / OpenAI, when more than one provider exists.

## Milestone 12 — Import / Export (Completed)

Add support for importing and exporting local data.

M12 provides manual local backup, restore after reinstall or local browser-data loss, and file transfer between profiles or computers. It implements one strict, independently versioned JSON format containing current Knowledge, Snippets, and Settings; frozen dedicated version 1 DTOs and explicit mappings; deterministic export; a 25 MiB guard; replace-only, identity-preserving atomic restore; preview and destructive acknowledgement; and a fourth options-page section without permissions, schema changes, or dependencies. Principal Engineer source review and automated and risk-based real Chrome validation passed. M12-D.1 and Milestone 12 are complete at final implementation checkpoint `d304f90` (`feat: add import and export backup workflow`).

Cloud synchronization, collaboration, sharing workflows, bulk editing, automatic or scheduled backups, merge import, encryption, compression, screenshot Context, and Rich Snippet data are outside M12.

## Milestone 13 — Provider Expansion / OpenAI (Current)

Add OpenAI as a later provider integration and define provider selection when more than one provider exists.

M13-A — Provider Expansion / OpenAI Architecture Readiness Review is the active task and has not started. No M13 implementation is authorized yet. The exact next action is to perform the read-only M13-A architecture readiness review.

## Milestone 14 — Multimodal Context Attachments

Allow one or more screenshots or images to be pasted into Merchant Context with transient, local-first behavior by default, a provider-independent attachment boundary, provider capability checks, and explicit feedback when a provider cannot use or omits an attachment. Detailed architecture remains deferred to future M14 tasks.

## Milestone 15 — Rich Snippet Templates & Trigger Expansion

Add semicolon triggers such as `;hello`, ordered rich content such as text → image/reference → text, rich-editor insertion where supported, deterministic plain-text fallback, an editor capability or adapter boundary, and compatibility with existing plain Snippets. Detailed architecture remains deferred to future M15 tasks.

## Planning Note

These milestones are intentionally small and can be refined as the product evolves.
