# Product Requirements

## Product Scope

The product will eventually provide an integrated support workspace for Intercom users, combining local knowledge retrieval, reusable snippets, and AI-assisted drafting.

## Functional Requirements (Planned)

- Capture support context from the browser and local workspace.
- Store reusable knowledge entries locally as a Knowledge Library.
- Store reusable snippets locally as a Snippet Library.
- Retrieve relevant content quickly during support work.
- Build prompts for AI assistance without coupling business logic to a specific provider.
- Allow users to review and edit AI-generated drafts before use.

## Knowledge Library vs. Snippet Library

- The Knowledge Library owns broader, contextual support knowledge used for troubleshooting, reference, and retrieval during support work.
- The Snippet Library owns compact, reusable response text and message fragments intended for quick insertion or expansion into a reply.

The libraries may both contribute to a support response, but they have different responsibilities and must remain separate concepts in the product experience, persistence model, and documentation.

## Prompt Composition Semantics

- Prompt composition accepts Merchant Context, explicit Guidance, or both as the current-task input. At least one must contain non-whitespace text; retrieved Library material alone cannot define the user's task.
- Guidance is the user's highest-priority current instruction. Any non-whitespace Guidance is valid, including a minimal instruction such as `follow up`.
- Merchant Context represents the current support conversation or situation and takes priority over retrieved Library material.
- Retrieved Knowledge is supporting factual or reference material. Retrieved Snippets are lower-priority reusable wording, style, or examples and are not instructions or independent factual authority.
- Dynamic input conflicts follow `Guidance > Merchant Context > Knowledge > Snippets`.
- Prompt composition produces a structured provider-independent assembly. Provider selection, provider serialization, and AI execution occur outside this product boundary.
- Images and screenshots are not Prompt Builder v1 inputs. Multimodal prompt behavior requires a later approved product and architecture decision.

## Output Workspace v1

- M9 provides one extension-owned global Chrome Side Panel Workspace for manual Merchant Context, manual Guidance, a transient Ollama model value, generation, editable plain-text output, and copying the current edited draft while the user keeps the active support website visible beside it.
- At least one of Merchant Context or Guidance plus a non-whitespace model is required. Inputs and output remain transient for the mounted Workspace session and are lost on close or reload.
- Generate automatically runs local Knowledge and Snippet retrieval, Prompt Builder, and the current `GenerationProvider` once. A later Generate action repeats the complete workflow with current inputs.
- The generated draft remains editable before copying. Copy uses the current edited text and preserves it exactly.
- The popup opens the global Workspace Side Panel in the current browser window and continues to open the separate options-page Libraries. Knowledge and Snippet CRUD do not move into the Side Panel.
- M9 does not include a standalone Workspace tab, manual Library selection, dedicated Regenerate, Cancel, Clear, Save as Snippet, history, persistence, Settings, provider selection, model discovery, keyboard shortcuts, page scraping, or insertion.

## Quality Requirements

- Fast startup and responsive interactions are required.
- The product must work without a backend service.
- The architecture should remain simple enough to maintain over time.
- Local persistence must be reliable and understandable.

## Constraints

- The first implementation path should prioritize local-first execution.
- The extension should be usable in a browser context without a hosted service.
- Any AI integration should be introduced gradually and behind a provider abstraction.

## Approved Platform Constraints

- The Chrome extension platform is WXT targeting Manifest V3, using TypeScript.
- The presentation layer uses React, Tailwind CSS, and React Context with Hooks.
- Local persistence uses Dexie behind project-owned storage contracts.
- Infrastructure choices must not couple product requirements or business logic to a specific AI provider.

## Scope for Milestone 0

Milestone 0 established the repository documentation, engineering workflow, and project guardrails. It did not implement any of the features above.
