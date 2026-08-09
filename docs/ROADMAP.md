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

Provider selection, provider endpoint configuration, behavior tuning, theme, shortcut settings, persistent writing preferences, and other generic configuration are not part of M11. Provider selection remains deferred until Milestone 16 — OpenAI Provider Expansion, when more than one provider exists.

## Milestone 12 — Import / Export (Completed)

Add support for importing and exporting local data.

M12 provides manual local backup, restore after reinstall or local browser-data loss, and file transfer between profiles or computers. It implements one strict, independently versioned JSON format containing current Knowledge, Snippets, and Settings; frozen dedicated version 1 DTOs and explicit mappings; deterministic export; a 25 MiB guard; replace-only, identity-preserving atomic restore; preview and destructive acknowledgement; and a fourth options-page section without permissions, schema changes, or dependencies. Principal Engineer source review and automated and risk-based real Chrome validation passed. M12-D.1 and Milestone 12 are complete at final implementation checkpoint `d304f90` (`feat: add import and export backup workflow`).

Cloud synchronization, collaboration, sharing workflows, bulk editing, automatic or scheduled backups, merge import, encryption, compression, screenshot Context, and Rich Snippet data are outside M12.

## Milestone 13 — Snippet Trigger Expansion v1 (Completed)

Add optional unique semicolon triggers to existing plain-text Snippets and expand a complete trigger when the user presses Space in an actively focused supported web editor. M13 preserves surrounding content, plain text, normal host-editor input behavior, and predictable caret placement through focused generic editor adapters and an extension-owned transient trigger catalog.

The previously documented M13-A — Provider Expansion / OpenAI Architecture Readiness Review was superseded before execution by the product-priority realignment. M13-A.1 defined the approved architecture. M13-B implemented trigger-enabled Snippets, persistence and Backup Format v2, the transient catalog, typed frame synchronization, and supported-editor expansion. M13-B.1 corrected overlapping catalog publication, and M13-B.2 corrected isolated-world/realm handling and intentionally expanded availability to normal HTTP/HTTPS websites. Principal Engineer review, automated validation, and product-owner real Chrome validation passed. M13 is complete at implementation checkpoint `b76fcb4` (`feat: add snippet trigger expansion`).

## Milestone 14 — Rich Snippet Templates (Current — Architecture Revised)

Extend the M13 Snippet aggregate and trigger/editor foundation with canonical structured content, one normal Rich authoring surface with locally owned inline images, deterministic text compatibility, and destination-aware direct or clipboard-assisted delivery. Preserve existing Plain Snippets, legacy URL image references, and frozen Backup Formats v1-v3.

Status: M14-B implements structured content, Dexie v4, Backup v3, and text-consumer compatibility at `ed23f30`; M14-C implements structured authoring at `a787100`; M14-D is complete at `64504df`; and Decision 38 is committed at `f9b5097`. M14-E now implements the local asset/Dexie v5/Backup v4 foundation and awaits Principal source review; no implementation commit exists yet.

Revised sequence:

- **M14-D — Rich Snippet Delivery and Local Image Architecture:** documentation-only definition of unified authoring, local assets, Dexie v5, Backup v4, capability planning, optional clipboard transport, evidence boundaries, and security.
- **M14-E — Local Image Asset Foundation and Backup v4:** asset domain/repository, validated Blob ownership, atomic lifecycle, Dexie v5, Backup v4, v1-v3 regression compatibility, and Decision 38 catalog exclusion for local-image Snippets until M14-G.
- **M14-F — Unified Rich Editor Inline Image Authoring:** image paste, Insert Image file selection, inline local preview, removal/reordering, cancel/save/reopen, and legacy-reference compatibility; no destination delivery.
- **M14-G — Delivery Planner and Clipboard-Assisted Fallback:** behavioral capabilities, serializer, optional permission workflow, offscreen transport, safe plain/HTML payloads, explicit outcomes, and Crisp-oriented browser evidence.
- **M14-H — Rich Browser Rendering and Image Delivery Capability Validation:** safe direct rich rendering where proven, destination capability adapters supported by evidence, and image delivery only where validated.

The exact next action after M14-E review is M14-F — Unified Rich Editor Inline Image Authoring. M14 remains incomplete.

## Milestone 15 — Multimodal Screenshot Context

Allow one or more screenshots to be pasted into Merchant Context with transient, local-first behavior by default, a provider-independent attachment boundary, provider capability checks, and explicit feedback when a provider cannot use or omits an attachment. Detailed architecture remains deferred to future M15 tasks.

## Milestone 16 — OpenAI Provider Expansion

Add OpenAI as a later provider integration and define provider selection when more than one provider exists. Provider credentials, endpoint policy, model selection, permissions, and security require their own implementation-ready architecture before work begins.

## Later Milestone — Workflow Polish and Additional Integrations

Continue product polish and add further support-platform or workflow integrations only through separately approved, small milestones.

## Planning Note

These milestones are intentionally small and can be refined as the product evolves.
