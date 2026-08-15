# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 are complete. M14 — Snippet Authoring and Delivery is current. M14-G/G.2 is committed at `672185e`; M14-I through M14-I.5 remains uncommitted. Text clipboard/native-paste delivery is real-Chrome validated. The approved C#/.NET 10 Windows Native Clipboard Companion is connected through a stable development extension identity, optional `nativeMessaging`, strict service-worker transport, and reversible per-user development registration; Settings readiness and end-to-end native Image delivery are real-Chrome PASS. M14-I.5 removes failed browser Image transports and A1/A2/B probes from active runtime while retaining historical evidence. Production installation and automatic paste remain absent.

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

M14-I is implemented, real-Chrome validated, cleanup-complete, and pending Principal final review, one post-cleanup `native-dev` smoke test, and an authorized Git checkpoint. M14-J starts only after that checkpoint. Production installation, signing, production identity, AutoHotkey, and automatic paste do not exist. Manual native `Ctrl+V` remains the workflow. See [the native companion](native/windows-clipboard-companion/README.md), [the architecture](docs/NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md), and [the feasibility history](docs/NATIVE_IMAGE_CLIPBOARD_FEASIBILITY.md).
