# Changelog

## [Unreleased]

### Milestone 1 — Technical Foundation

- Completed the Milestone 1 development foundation without adding extension runtime or business functionality.
- Initialized pnpm project management with a reproducible lockfile and explicit dependency build-script policy.
- Configured WXT, Manifest V3 targeting, TypeScript, React, Tailwind CSS, and Vite for future extension implementation.
- Added ESLint, Prettier, Husky, and lint-staged quality tooling.
- Added Vitest and Playwright testing foundations, including an infrastructure-only Playwright discovery test.
- Added continuous integration for installation, linting, formatting, type-checking, Vitest execution, and Playwright configuration validation.
- Validated the complete development toolchain successfully.
- Preserved the milestone boundary: no manifest, extension entry point, runtime source, storage implementation, business feature, or WXT production build was introduced.
- Deferred the first WXT production build to Milestone 2 — Extension Shell.

### Added

- Repository foundation documentation structure
- Initial product vision and requirements
- Initial architecture and decision records
- Initial roadmap and testing strategy
- Initial coding agent rules
- Initial project state document
- `UI_WORKFLOW.md`

### Updated

- Repository foundation completed.
- Finalized repository documentation after Principal Engineer review.
- Marked Milestone 0 as completed and aligned the project state with the new documentation-first workflow.
- Split the technical foundation and extension shell into separate milestones and synchronized subsequent milestone numbering.
- Added Milestones 0B, 0C, and 0D to make documentation finalization, technical architecture decisions, and platform approval explicit roadmap gates.
- Documented Manifest V3, TypeScript, React, layered testing, minimal state management, provider independence, planned storage boundaries, and project-layer responsibilities.
- Platform architecture approved.
- Technology stack finalized as WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged.
- Infrastructure decisions frozen for implementation.
- Repository ready for Milestone 1 implementation under an approved task.
- Repository continuity validation completed through a successful fresh-thread reconstruction.
- Documentation clarified following reconstruction testing.
- Milestone boundaries and infrastructure, architecture, and business-functionality terminology clarified without architecture changes.

### Notes

- Milestone 0 completed without implementation code.
- Milestones 0C and 0D documented and approved architecture without adding implementation artifacts.
- DP-001 includes no architecture changes and no implementation changes.
- The repository is now documented in a way that supports future milestone continuity.
