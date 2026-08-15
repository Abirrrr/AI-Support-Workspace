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

## Milestone 14 — Snippet Authoring and Delivery (Current — M14-I Complete; M14-J Next)

Extend the M13 Snippet aggregate and trigger/editor foundation with canonical structured text, first-class bullet/numbered lists, a separate one-image Image Snippet content type, deterministic compatibility, and truthful destination delivery. Preserve existing Plain Snippets, legacy URL references, M14-E local assets, and frozen Backup Formats v1-v4.

Status: M14-I is complete, committed, and pushed at `ebe915f` (`feat: add clipboard delivery for text and image snippets`). Text clipboard/native-paste, Settings companion readiness, Windows native Image delivery, and the post-cleanup smoke test are real-Chrome validated. M14-I.5 removed the failed browser Image transports and A1/A2/B feasibility runtime probes while retaining historical evidence. M14-F remains cancelled, M14-H remains absorbed, and M14-J is next but not started.

Revised sequence:

- **M14-F.1 — Snippet Image Product Boundary Architecture Correction:** documentation-only cancellation of inline Rich-image authoring; defines portable text-only Rich Snippets, one-image Image Snippets, legacy compatibility, Backup v5, typed trigger delivery, and M15 separation.
- **M14-G/G.2 (implemented, committed at `672185e`):** unordered/ordered list domain, strict Backup v5, constrained Tiptap Text authoring, simplified All/Text/Images Library, direct screenshot/file Image authoring, and atomic M14-E lifecycle reuse.
- **M14-H — ABSORBED INTO M14-G.2 / NOT A SEPARATE ACTIVE TASK.**
- **M14-I.1.3 — Offscreen Text Clipboard Compatibility Correction (implemented, runtime validated, committed in `ebe915f`):** Text writes exact planned plain + safe HTML through one temporary offscreen copy handler and requires handler plus command success. Real Chrome validates clipboard preparation, cleanup, notice, formatting, and lists.
- **M14-I.1.4 — Image Clipboard Compatibility Correction (historical failed path, removed from active runtime):** the Decision 42-gated File copy-event experiment pasted `snippet.png`, not an inline/native image. M14-I.5 removed it after native replacement validation.
- **M14-I.1.5.2 — Native Image Clipboard Feasibility Conclusion (completed; historical evidence preserved):** records A1 `TEXT` as `REAL-CHROME FAILED`, focused extension-page B `VISIBLE IMAGE` as a capability-only `REAL-CHROME PASS`, and A2/F9 as not run/no longer required.
- **M14-I.2 — Windows Native Clipboard Companion Architecture (defined, committed in `ebe915f`):** Decision 43 selects the Windows-only optional, exact-origin Native Messaging adapter and its bounded PNG/registered-PNG/CF_DIBV5 contract. Decision 43 remains unchanged by closeout.
- **M14-I.3/M14-I.3.1 — Windows Native Clipboard Companion Foundation and Safety Correction (implemented, automated-validated, committed in `ebe915f`):** provides the standalone .NET 10 `win-x64` host, strict v1, WIC, registered PNG + CF_DIBV5, HWND, ownership, retry, mutex, framing, fixtures, and failure-safety coverage.
- **M14-I.4/M14-I.4.1 — Chrome Native Messaging Integration and Capability Correction (implemented, real-Chrome validated, committed in `ebe915f`):** stable development identity, optional permission and truthful Settings status, callback-aligned service-worker-only native transport, strict TypeScript protocol conformance, development host manifest/publish/HKCU registration, and reversible tooling. Settings `Ready` and complete native Image delivery passed in real Chrome. Production packaging and automatic paste remain absent.
- **M14-I.5 — Native Image Delivery Cleanup and M14-I Finalization (complete, committed in `ebe915f`):** removed the failed offscreen Async/File Image transports, obsolete Image-only errors/messages/tests, and all feasibility-probe runtime/UI/tests. Preserved the validated Text offscreen copy-event transport, Decisions 42 and 43, native integration, metadata-only catalogs, and historical evidence. The post-cleanup real-Chrome smoke test passed.
- **M14-J — Destination Compatibility Validation (NEXT / NOT STARTED):** validate the M14-I native-paste implementation in Crisp, Intercom, representative rich editors, and representative plain editors; record text/HTML formatting fidelity, Image paste behavior, graceful representation fallback, and only evidence-backed compatibility corrections. It does not introduce the base clipboard architecture or normal Rich-image delivery.

The shared Backup v5 transition in M14-G remains intentional and Dexie remains physical version 5. Manual `Ctrl+V` is accepted. The exact next action is Principal review of the M14-I.6 documentation closeout, commit/push the closeout docs, then create the M14-J implementation/validation task. Optional automatic native paste remains a separate later investigation.

## Milestone 15 — Multimodal Screenshot Context

Allow one or more screenshots to be pasted into Merchant Context with transient, local-first behavior by default, a provider-independent attachment boundary, provider capability checks, and explicit feedback when a provider cannot use or omits an attachment. Detailed architecture remains deferred to future M15 tasks.

## Milestone 16 — OpenAI Provider Expansion

Add OpenAI as a later provider integration and define provider selection when more than one provider exists. Provider credentials, endpoint policy, model selection, permissions, and security require their own implementation-ready architecture before work begins.

## Later Milestone — Workflow Polish and Additional Integrations

Continue product polish and add further support-platform or workflow integrations only through separately approved, small milestones.

One explicitly deferred investigation is Optional Windows Automatic Native Paste. A future companion might separately support focus-safe Windows-level `Ctrl+V`/input injection after clipboard preparation, but that capability is not part of the M14-I.2 image clipboard foundation. It has no approved AutoHotkey or `SendInput` implementation, must retain manual `Ctrl+V`, and requires a separate focus/race-safety decision.

## Planning Note

These milestones are intentionally small and can be refined as the product evolves.
