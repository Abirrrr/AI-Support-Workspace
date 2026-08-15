# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 and M14-J are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is active: Decision 45 defines optional focus-safe Windows automatic paste through the existing C#/.NET 10 companion, while production automatic paste remains absent and manual `Ctrl+V` remains permanently supported.

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

M14-K.1 architecture is defined for Principal review. Automatic mode is additive and default-off, uses the same authoritative Text/Image clipboard preparation, and falls back to the preserved clipboard-only/manual `Ctrl+V` workflow whenever focus or native safety is unavailable. The existing C# companion is selected; permanent AutoHotkey and arbitrary send-keys are rejected. M14-K.2 Windows implementation is exact next after approval, followed by M14-K.3 Crisp/Intercom validation. No Settings toggle, protocol-v2 operation, `SendInput`, or automatic-paste runtime exists yet. See [the compatibility record](docs/DESTINATION_COMPATIBILITY.md), [the native companion architecture](docs/NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md), and [Decision 45](docs/DECISIONS.md).
