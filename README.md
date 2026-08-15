# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 and M14-J are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. The approved C#/.NET 10 Windows Native Clipboard Companion remains the Image clipboard path; production installation and automatic paste remain absent.

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

M14-J is complete and real-browser validated. Crisp Text/Enter/Shift+Enter/Image/no-refresh and Intercom Shadow-DOM Text/normal bullet/Image/no-refresh pass; repeated extension reloads remain duplicate-safe. Decision 44 uses exact persistent HTTP/HTTPS host access, while normal navigation retains static all-frame injection. Intercom bullet triggering immediately after Shift+Enter remains a non-blocking limitation, and perceived Image latency is a future performance follow-up. M14-K Automatic Paste is next but not started: manual native `Ctrl+V` remains the workflow, with no AutoHotkey, `SendInput`, or automatic paste implemented. See [the compatibility record](docs/DESTINATION_COMPATIBILITY.md), [the native companion](native/windows-clipboard-companion/README.md), [the architecture](docs/NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md), and [the feasibility history](docs/NATIVE_IMAGE_CLIPBOARD_FEASIBILITY.md).
