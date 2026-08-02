# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestone 9 — Output Workspace is complete, and the latest existing checkpoint is `33e4f54` (`docs: focus guidance after text capture`). The native WXT global Side Panel provides transient manual Context, Guidance, model input, automatic local retrieval, provider-independent generation through Ollama, editable plain-text output, and Copy beside the active support website. Knowledge and Snippet management remain in the options-page Library surface. Milestone 10 — Keyboard Shortcut is current, with an uncommitted implementation under manual validation. Its architecture invokes explicit active-page selection capture first, immediately opens or activates Workspace without awaiting capture, replaces Merchant Context after delivery, requests Guidance DOM focus with a collapsed caret at the end of its preserved value, and leaves Generate manual. When the command opens a closed panel, Guidance is expected to be immediately usable and this has passed manual validation. When the panel is already visible and the webpage owns keyboard focus, Chrome may keep keyboard routing on the webpage despite the successful DOM focus request, so the user may need to click Guidance.

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
- .github/workflows/: CI and workflow configuration

## Documentation

The documentation in the docs directory is the only authoritative source of truth for product direction, architecture, workflow, and project state.

## Next Step

Complete the remaining M10 functional manual checks and implementation review. Treat repeated-invocation browser-level Guidance activation as a documented Chrome platform limitation, not as an implementation workaround requirement or an M10 blocker once the remaining functional checks pass. Do not advance to M11 or create and push a checkpoint without explicit approval.
