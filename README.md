# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 are complete. M14 — Snippet Authoring and Delivery is current. M14-I is complete, committed, and pushed at `ebe915f` (`feat: add clipboard delivery for text and image snippets`). Text clipboard/native-paste delivery is real-Chrome validated. The approved C#/.NET 10 Windows Native Clipboard Companion is connected through a stable development extension identity, optional `nativeMessaging`, strict service-worker transport, and reversible per-user development registration; Settings readiness, end-to-end native Image delivery, and the post-cleanup smoke test are real-Chrome PASS. Failed browser Image transports and A1/A2/B probes are absent from active runtime while their historical evidence remains. Production installation and automatic paste remain absent.

## Technology Stack

- WXT with Manifest V3
- TypeScript
- React with Tailwind CSS
- React Context and Hooks
- pnpm
- Dexie for local persistence
- Vitest and Playwright
- ESLint and Prettier
- Husky and lint-staged

## Repository Structure

- docs/: project documentation and planning artifacts
- src/: extension runtime and presentation source code
- tests/: automated unit, integration, build-output, and browser-test foundations
- native/windows-clipboard-companion/: Windows native clipboard companion, protocol fixtures, and development registration tooling
- .github/workflows/: CI and workflow configuration

## Documentation

The documentation in the docs directory is the only authoritative source of truth for product direction, architecture, workflow, and project state.

## Next Step

M14-I is complete. M14-J.2 is real-Crisp Text PASS, and M14-J.3 Shadow-DOM activation plus ordinary rich Text are real-Intercom PASS. M14-J.4 confirms canonical simple-list serialization and corrects generic inline hard breaks. M14-J.5's first live diagnostic exposed an incorrectly authored two-item fixture; the corrected three-item record passes persistence, serialization, delivery-payload equality, and normal Intercom paste. Crisp and Intercom Image paste also pass. Intercom bullet-list triggering immediately after Shift+Enter remains a known low-priority compatibility limitation. M14-J.5.1 synchronizes this evidence on top of preserved uncommitted M14-J.1–J.5 work. M14-J.6 lifecycle recovery is the exact next engineering task and is not started. Production installation, signing, production identity, AutoHotkey, and automatic paste do not exist. Manual native `Ctrl+V` remains the workflow. See [the compatibility record](docs/DESTINATION_COMPATIBILITY.md), [the native companion](native/windows-clipboard-companion/README.md), [the architecture](docs/NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md), and [the feasibility history](docs/NATIVE_IMAGE_CLIPBOARD_FEASIBILITY.md).
