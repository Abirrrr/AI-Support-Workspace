# Architecture Decisions

## Decision 1: Local-first Execution

The project will prioritize local execution and local data storage. This reduces operational complexity and aligns with the product vision.

## Decision 2: Chrome Extension as Delivery Surface

The primary delivery surface is a Chrome extension because it fits browser-based support workflows and allows quick access to selected content.

## Decision 3: Simple Architecture

The system will favor a straightforward architecture over early abstraction. Additional structure will be introduced only when it solves a clear problem.

## Decision 4: Provider Independence

Business logic must not depend on Ollama or OpenAI directly. Project-owned contracts will isolate provider adapters when integrations begin. This keeps provider changes from affecting domain or application behavior.

## Decision 5: Performance as a First-Class Concern

Fast startup, fast retrieval, and responsive interactions are treated as product requirements, not secondary concerns.

## Decision 6: Incremental Milestones

The project will be delivered through small milestones so that progress is testable, reviewable, and reversible.

## Decision 7: Repository Continuity and Documentation-first Engineering

Repository documentation is the permanent project memory. Conversation history must never be treated as the authoritative project state. Architecture and technical decisions must be documented and approved before implementation, and every approved milestone must update the repository documentation before the project proceeds. This allows a new Principal Engineer to reconstruct the approved architecture, workflow, and project state without access to prior conversations.

## Decision 8: Manifest V3

The Chrome extension will use Manifest V3. Its lifecycle, permission, and security model defines the platform boundary that future extension work must follow. Chrome-specific behavior will remain isolated at that boundary.

## Decision 9: TypeScript

TypeScript is the project language for application, UI, extension, and test code. Static contracts reduce integration mistakes and make incremental refactoring safer across milestone boundaries.

## Decision 10: WXT Extension and Build Platform

WXT is the approved extension and build platform. It supplies Manifest V3-oriented entry points, development workflows, manifest generation, and packaging so the project does not recreate extension infrastructure. Custom build behavior requires a documented need and architecture review.

## Decision 11: React UI Framework

React is the approved UI framework. Its component model supports a maintainable browser workspace and isolated UI testing, while business logic remains outside components to preserve architectural boundaries.

## Decision 12: Vitest and Playwright Testing Platform

Vitest is approved for unit, UI, and integration tests, while Playwright is approved for browser-level end-to-end tests. This pairing provides fast feedback for isolated logic and realistic validation for Chrome workflows without forcing all tests through a browser.

## Decision 13: React Context and Hooks State Management

React Context and Hooks are the approved state-management approach. Hooks keep component state local, and scoped Context supports shared presentation or application coordination without adding an external state library. Business behavior remains in application services and domain contracts.

## Decision 14: Documented Architecture Inheritance

Implementation milestones inherit their architecture from the repository documentation. An implementation task may not select a new platform, framework, tool, library, layer, or cross-cutting pattern unless that decision has first been documented and approved. This prevents implementation convenience from silently redefining the architecture.

## Decision 15: Tailwind CSS Styling

Tailwind CSS is the approved styling solution. Its utility-based model provides consistent, maintainable presentation styling without creating a custom styling infrastructure or coupling product behavior to CSS architecture.

## Decision 16: pnpm Package Management

pnpm is the approved package manager. It provides deterministic dependency management and efficient local installs while giving the repository one consistent command and lockfile standard.

## Decision 17: Dexie Storage Abstraction

Dexie is the approved abstraction over IndexedDB for local persistence. It provides a mature API for versioned schemas, queries, and transactions while project-owned storage contracts keep Dexie out of domain and application logic.

## Decision 18: ESLint and Prettier Quality Standards

ESLint is the approved linting tool and Prettier is the approved formatter. Keeping correctness-oriented linting separate from deterministic formatting reduces subjective style work and provides consistent automated quality checks.

## Decision 19: Husky and lint-staged Commit Gate

Husky and lint-staged are the approved local commit quality gate. They run relevant checks on staged files for fast feedback while continuous integration remains responsible for full repository validation.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
