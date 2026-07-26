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

## Decision 24: Local Ollama Generation Provider v1

Milestone 8 introduces a narrow project-owned generation-provider contract and one local Ollama infrastructure adapter. Application consumers depend on the contract rather than Ollama-specific types or name-based branching. M8 does not introduce a provider registry, future-provider placeholders, workflow orchestration, generated-output UI, or browser runtime wiring.

### Project-Owned Contract and Identity

The contract is conceptually equivalent to:

```ts
interface GenerationProvider {
  readonly id: GenerationProviderId;
  generate(
    request: GenerationRequest,
    signal?: AbortSignal,
  ): Promise<GenerationResult>;
}

interface GenerationRequest {
  prompt: PromptAssembly;
  model: string;
}

interface GenerationResult {
  text: string;
  providerId: GenerationProviderId;
  model: string;
}
```

Exact implementation naming may follow repository conventions, but these semantics are frozen. `OllamaProvider` implements the contract in the infrastructure/provider boundary with project-owned identity `ollama`. The identity is provider metadata; it must not cause provider-name conditionals to spread through application consumers.

`GenerationRequest` is transient. Its `prompt` is an already-built M7 `PromptAssembly`, and its `model` is supplied by the caller for this generation. A model must contain non-whitespace text after trimming for validation, while the supplied identifier is otherwise preserved. The request contains no base URL, destination, UI state, persistence instruction, provider option, or tuning parameter.

`GenerationResult` contains only non-whitespace generated `text`, the provider identity, and the requested model. It exposes no raw provider response, token or timing telemetry, completion reason, HTTP details, or provider-specific type. The returned model value is the requested identifier; M8 does not infer or replace it from provider response data.

### Local Endpoint and Request Translation

Ollama v1 is local-only at fixed base URL `http://localhost:11434`. It performs `POST http://localhost:11434/api/chat` using Ollama's native chat API. M8 does not use `/api/generate`, an OpenAI-compatible endpoint, remote or LAN Ollama addresses, cloud fallback, or caller-configurable base URLs. Planned `providerBaseUrl` settings remain deferred to Milestone 11.

Every request is non-streaming and includes `stream: false`. M8 introduces no stream reader, chunk type, callback, async iterable, partial-result event, or streaming state.

An adapter translates `PromptAssembly` into exactly two messages:

1. One `system` message whose content is exactly the assembly's Instructions section content. The provider adds no instruction text.
2. One `user` message whose content is the deterministic `JSON.stringify` serialization of one project-owned intermediate object.

The intermediate object's applicable keys are inserted in this exact order: `guidance`, `merchantContext`, `knowledge`, `snippets`. Absent sections are omitted. Guidance and Merchant Context values preserve their Prompt Builder content. Each Knowledge item contains only `title` then `body`; each Snippet item contains only `title` then `content`. IDs, kinds, scores, tags, source, and other application metadata are excluded. Standard JSON serialization owns escaping. Translation must not fabricate citations, add delimiters or instructions, reinterpret content, or mutate the assembly.

The HTTP body contains exactly:

```ts
{
  model,
  messages: [systemMessage, userMessage],
  stream: false,
}
```

M8 sends no `tools`, `format`, `think`, `keep_alive`, `logprobs`, `options`, tuning, stop sequence, or other unsupported request field.

### Transport, Runtime, and Permissions

The adapter uses native `fetch` rather than a provider SDK or new HTTP dependency. Construction accepts an injected fetch-compatible transport for deterministic tests and defaults to `globalThis.fetch` in production. The optional caller `AbortSignal` is forwarded to that transport.

M8 does not choose where generation executes inside the Chrome extension and has no Chrome consumer. `OllamaProvider` remains runtime-independent application/infrastructure code. Background-service-worker changes, `chrome.runtime` messaging, UI integration, and the generation orchestrator are deferred until a later workflow or output integration selects their owner.

No Chrome host permission is added in M8 architecture definition or implementation. The existing generated manifest remains unchanged. The later runtime-integration task must separately review whether localhost host permission is required; M8 must not add `http://localhost/*`, `http://127.0.0.1/*`, `<all_urls>`, or equivalent access now.

CORS, extension-origin access, and Ollama `OLLAMA_ORIGINS` configuration are deferred with runtime ownership. M8 neither prescribes a browser-origin workaround nor changes local Ollama configuration.

### Model, Availability, and Execution Policy

The caller supplies the model identifier transiently for each request. M8 defines no default, hardcoded model, automatic model selection, model discovery, or model persistence. Settings owns user-configurable model choice later.

Generation itself is the availability check. M8 adds no health endpoint or preliminary request. A connection or network failure before an HTTP response becomes `ProviderUnavailableError`. Later Settings diagnostics may introduce a distinct test-connection workflow when approved.

M8 never pulls or installs a model. HTTP 404 becomes `ModelUnavailableError`, preserving a safe provider message and cause when available without triggering `/api/pull` or another recovery request.

M8 defines no internal timeout and no retry. Caller cancellation remains the only v1 termination control. Future timeout or retry behavior requires an explicit approved decision because it changes user-visible latency and duplicate-request behavior.

### Errors, Response Validation, and Cancellation

The provider boundary uses these focused project-owned errors without introducing a generic application error framework:

- `ProviderUnavailableError`: a connection or network failure occurs before a response is received.
- `ModelUnavailableError`: Ollama returns HTTP 404.
- `ProviderRequestError`: Ollama returns another non-success HTTP status; the error may expose the status and a safe Ollama error string.
- `ProviderResponseError`: a success response is malformed or its assistant content is missing, invalid, or empty.
- `GenerationCancelledError`: a supplied caller signal cancels the request.

Original failures are preserved as causes when available, but raw response objects, raw payloads, and customer content must not escape through errors. For every non-success response, the adapter safely attempts to parse a JSON string `error` field. A 404 maps to `ModelUnavailableError`; every other non-success status maps to `ProviderRequestError`, even when the error body is absent or malformed.

For a success response, the adapter validates that the JSON root is an object, `message` is an object, and `message.content` is a string containing non-whitespace text. Malformed JSON, unexpected shapes, missing or non-string content, and empty or whitespace-only content become `ProviderResponseError`. A valid response returns the original content string without trimming or rewriting and ignores all unapproved response telemetry.

When a supplied `AbortSignal` causes cancellation, the adapter maps the failure to `GenerationCancelledError` rather than `ProviderUnavailableError`. Cancellation is not inferred for unrelated transport failures.

### Privacy, Replaceability, and Deferred Scope

The adapter must not log prompt content, Merchant Context, Guidance, Knowledge, Snippets, generated text, or raw provider payloads. Diagnostic errors must not expose customer content. M8 adds no telemetry, analytics, or cloud transmission; its only network destination is the fixed localhost endpoint.

Raw Ollama request and response types remain internal to `OllamaProvider`. The dependency direction is `PromptAssembly` to `GenerationProvider` to `OllamaProvider`; a future provider can implement the same project-owned contract without changing Prompt Builder. M8 adds no OpenAI placeholder, provider registry, or widespread provider-identity branching.

M8 adds no generation options beyond the required model. It adds no UI, Support Workspace, popup or options controls, generated-output surface, persistence, Settings contract, database table, schema version, field, index, migration, Chrome runtime integration, or permission change.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
