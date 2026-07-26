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

## Decision 20: Initial Physical Persistence Schema

The extension-owned IndexedDB database is named `ai-support-workspace`, and its initial Dexie schema version is 1. The Milestone 3 physical schema includes Knowledge Entry and Snippet Entry records behind separate project-owned repository contracts. Settings remains planned but is deferred to its later product milestone. `DATABASE_SCHEMA.md` is authoritative for store names, keys, indexes, record semantics, CRUD behavior, errors, transactions, and migration policy.

Future physical schema changes require explicit version and migration consideration. Version 1 must not be silently rewritten after implementation.

## Decision 21: Isolated IndexedDB Persistence Tests

`fake-indexeddb` is the approved development/test-only IndexedDB adapter for deterministic Dexie integration tests. It must remain outside production modules, use isolated test databases, and never access extension or user data. Production persistence continues to use the browser's native IndexedDB implementation through Dexie.

## Decision 22: Deterministic Lexical Retrieval v1

Milestone 6 implements one local, read-only, provider-independent application-level retrieval operation over the existing `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts. It loads records through each repository's `list()` operation and scores them in memory. Retrieval does not access Dexie directly, mutate persisted data, add repository search methods, add a browser UI, or depend on an AI provider or network service.

### Result Contract

The project-owned retrieval result envelope contains two independently ranked collections:

```ts
interface RetrievalResults {
  knowledge: readonly KnowledgeRetrievalResult[];
  snippets: readonly SnippetRetrievalResult[];
}

interface KnowledgeRetrievalResult {
  kind: 'knowledge';
  id: string;
  record: KnowledgeEntry;
  score: number;
}

interface SnippetRetrievalResult {
  kind: 'snippet';
  id: string;
  record: SnippetEntry;
  score: number;
}
```

Each result retains its explicit domain kind, record identity, complete domain record, and numeric lexical relevance score. Knowledge and Snippets are not combined into one cross-domain ranking because they remain distinct domain concepts and later consumers may apply different selection policies. M6 therefore defines no cross-domain tie-breaker and adds no provider or prompt-builder metadata.

### Query and Field Normalization

The query and every participating textual field use the same deterministic pipeline:

1. Apply Unicode NFKC normalization with `String.prototype.normalize('NFKC')`.
2. Apply JavaScript locale-independent lowercase conversion with `String.prototype.toLowerCase()`.
3. Extract contiguous Unicode letter-or-number tokens using the equivalent of `/[\p{L}\p{N}]+/gu`; punctuation and whitespace are separators.
4. Represent tokens as a set. Duplicate query tokens and repeated tokens within a field are ignored for scoring.

M6 does not apply stemming, fuzzy matching, prefix matching, synonym expansion, stop-word removal, phrase matching, or provider-assisted query rewriting.

Knowledge scoring uses only `title`, `tags`, and `body`. The `source` field remains metadata and never contributes to relevance. Snippet scoring uses only `title`, `tags`, and `content`; persisted field names do not change. A record's tags are treated as one combined token set, so the same query token contributes the tag weight at most once even when it appears in multiple tags.

### Scoring and Matching

Retrieval uses exact normalized token-set membership. For every unique query token, a record receives:

- 5 points when its title token set contains the token.
- 3 points when its combined tag token set contains the token.
- 1 point when its Knowledge `body` or Snippet `content` token set contains the token.

The total score is the sum of those field contributions across all unique query tokens. A token may contribute in multiple participating fields, but repeated occurrences within one field do not increase its contribution. Repeated query terms therefore produce the same scores and ordering as a single occurrence.

There are no phrase, recency, usage, source, domain, or random bonuses. Records with score zero are excluded. An empty, whitespace-only, or punctuation-only query produces empty `knowledge` and `snippets` collections rather than returning the Library contents.

### Ranking and Limits

Knowledge and Snippet results are ordered independently by:

1. Higher score first.
2. Earlier `createdAt` first when scores tie.
3. Lexicographically smaller `id` first when score and `createdAt` tie, using deterministic JavaScript string ordering rather than database iteration order.

M6 applies no fixed result limit. Every positive-score result is returned in deterministic order. Result selection and limiting belong to later consumers such as context or prompt assembly.

### Storage, Privacy, and Performance

Retrieval is strictly read-only and does not change timestamps, tags, usage data, record ordering, or any other persisted value. Database `ai-support-workspace`, schema version 1, tables, fields, indexes, and migrations remain unchanged. No normalized fields, token tables, tag or full-text indexes, vector data, or embeddings are persisted.

All queries and Library content remain local to the extension. Retrieval has zero dependency on OpenAI, Ollama, Custom GPT, AI SDKs, embeddings, or network APIs. For the current local-library scale, straightforward in-memory tokenization and scoring should remain approximately linear relative to records × unique query tokens × participating fields. Background indexing, Web Workers, search libraries, caches, and precomputed search persistence require a future measured need and approved decision.

## Decision 23: Deterministic Provider-Independent Prompt Composition v1

Milestone 7 introduces a pure, headless application-layer Prompt Builder. It validates already-prepared input, selects a fixed number of already-ranked retrieval results, applies the approved precedence, and returns a typed project-owned `PromptAssembly`. It does not own retrieval, retrieval-query construction, persistence, provider selection or serialization, AI execution, model configuration, tokenization, provider-specific limits, UI, or browser integration. It must not depend on React or provider SDKs.

### Input and Retrieval Boundary

The project-owned input contract is conceptually equivalent to:

```ts
interface PromptBuildInput {
  merchantContext?: string;
  guidance?: string;
  retrievalResults?: RetrievalResults;
}
```

Exact implementation naming may follow repository conventions, but these semantics are frozen. No provider or destination identifier, image or screenshot, or manually selected Library-record mechanism belongs in v1.

A future application orchestrator decides the retrieval query, invokes Retrieval Engine, and supplies the resulting `RetrievalResults`. Prompt Builder never invokes Retrieval Engine, changes its scores, or reranks its results. It preserves M6 order within each domain.

At least one of Merchant Context or Guidance must contain non-whitespace text. Context only, Guidance only, either primary input with retrieval, and Context plus Guidance are valid. Retrieval-only, completely empty, or whitespace-only primary input is invalid and produces one focused deterministic Prompt Builder validation error for the missing-primary-input condition. M7 does not create a generalized application error framework.

Merchant Context represents the current support conversation or situation. It is optional at the type level. Surrounding whitespace is considered only when deciding whether it is empty; when present, the supplied text is otherwise preserved exactly and is not summarized, rewritten, truncated, fact-extracted, or mutated.

Guidance represents the user's explicit instruction for the current task and is optional. Every non-whitespace value is valid, including minimal guidance such as `follow up`. Prompt Builder does not judge detail or sufficiency and does not rewrite, summarize, enrich, or mutate Guidance.

### Precedence and Default Instructions

Dynamic input authority is:

1. Guidance.
2. Merchant Context.
3. Knowledge.
4. Snippets.

Guidance wins when dynamic inputs conflict. Merchant Context is authoritative for the current conversation and cannot be overridden by retrieved records. Knowledge is supporting factual or reference material. Snippets are reusable wording, style, or example material; they are not instructions or independent factual authority.

Prompt Builder owns one static, deterministic, provider-independent instruction section. It communicates that the consumer must follow current Guidance when supplied; use Merchant Context as the current interaction context; use Knowledge only as relevant supporting material consistent with higher-priority inputs; use Snippets only as wording or style examples; never let Snippets override Guidance, Merchant Context, or Knowledge; not invent unsupported facts, URLs, policies, prices, timelines, commitments, or other details; follow `Guidance > Merchant Context > Knowledge > Snippets` when inputs conflict; and remain grounded in the supplied inputs. This block is application-owned and is not a user-editable Prompt Template. Prompt Templates remain future scope.

Prompt Builder does not rewrite records to resolve factual contradictions or perform AI-based conflict detection. It communicates the precedence through the structured assembly and default instructions: Merchant Context wins over conflicting Knowledge, Knowledge facts win over conflicting Snippet wording, and Guidance wins over all lower-priority inputs.

### Retrieval Selection and Content Semantics

Prompt Builder selects at most the first five M6-ranked Knowledge results and the first three M6-ranked Snippet results. If fewer exist, it includes all available results without padding. It applies no additional relevance threshold, configurable limit, scoring change, or reranking. An empty domain collection causes that section to be omitted.

Knowledge remains grounding and reference material. Its provider-facing section content is centered on the existing human-readable title and body. Snippets remain reusable wording and style examples, and their provider-facing content uses the existing human-readable title and content.

Knowledge source, tags, record ID, and retrieval score, plus Snippet tags, record ID, and retrieval score, remain application metadata and are not automatically included in provider-facing text. Metadata may preserve domain kind, record identity, and score for traceability without changing rendered content. Prompt Builder does not fabricate source citations or citation syntax.

### PromptAssembly Contract

`PromptAssembly` is a typed provider-independent object containing an ordered collection of prompt sections. Section kind is explicit so downstream adapters do not infer structure from arbitrary text. Canonical section order is:

1. `instructions`.
2. `guidance`, when non-empty.
3. `merchantContext`, when non-empty.
4. `knowledge`, when selected results exist.
5. `snippets`, when selected results exist.

Knowledge and Snippet items preserve retrieval ordering within their separate structured sections. Formatting is simple and deterministic; section kind is the authoritative separator. Prompt Builder does not introduce presentation-oriented Markdown complexity or provider-specific delimiters, roles, messages, payloads, SDK objects, or Custom GPT structures. A later provider adapter serializes `PromptAssembly` for its provider.

Identical input produces identical output. Prompt Builder does not mutate `PromptBuildInput`, `RetrievalResults`, domain records, Merchant Context, or Guidance, and does not persist anything. Empty optional inputs and unavailable retrieval domains are omitted without warnings. Retrieval-only or fully empty input remains invalid.

### Deferred Boundaries

M7 performs no token counting, tokenizer integration, character truncation, content summarization, or provider context-window enforcement. Its only size control is the fixed top-five Knowledge and top-three Snippet selection. Provider-specific size handling belongs to later provider or generation boundaries, and M7 adds no tokenizer dependency.

Images and screenshots are explicitly deferred: v1 defines no image input, ownership, serialization, multimodal section, placeholder type, or limit. M7 is headless and adds no Prompt Builder UI, prompt preview, debug screen, Support Workspace, popup or options controls, or Side Panel. `PromptBuildInput` and `PromptAssembly` are transient; they require no database table, schema version, field, index, migration, or Prompt Template persistence.

Prompt Builder has zero dependency on OpenAI, Ollama, Custom GPT, model names, provider SDKs, provider message formats, network calls, or provider token limits. Milestone 8 or later provider adapters consume the provider-independent assembly.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
