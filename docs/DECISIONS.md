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

Milestone 9 `OutputWorkflow` fulfills the later application-orchestrator boundary: it decides the retrieval query, invokes Retrieval Engine, and supplies the resulting `RetrievalResults`. Prompt Builder never invokes Retrieval Engine, changes its scores, or reranks its results. It preserves M6 order within each domain.

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

## Decision 25: Transient Manual Output Workspace v1

Milestone 9 implements the first complete manual Context-to-generated-output workflow through one dedicated extension-owned Workspace page. It connects the existing Retrieval Engine, Prompt Builder, `GenerationProvider`, and `OllamaProvider` boundaries without changing their behavior. The workflow accepts manual Merchant Context, manual Guidance, and a temporary Ollama model value; automatically retrieves local Knowledge and Snippets; generates through the provider boundary; and presents editable plain-text output with a Copy action.

M9 introduces no dedicated Regenerate, Cancel, Stop, Clear, or Reset control; manual Library selection; Save as Snippet; PromptAssembly preview; provider selection or registry; OpenAI integration; model discovery; `/api/tags`; persistent Settings or workspace drafts; generation history; keyboard shortcut; page scraping or insertion; Side Panel; streaming; retry; health check; automatic model pull; or endpoint configuration. After a request completes, the ordinary Generate button may be used again for a fresh complete workflow with the current inputs.

### Workspace Surface and Composition

M9 adds one dedicated foreground extension Workspace page. The popup remains a launcher and may expose separate Open Workspace and Open Libraries actions. Open Libraries preserves the existing options-page behavior, and Knowledge and Snippet CRUD remain owned by the options page. M9 introduces no router, Side Panel, injected merchant-page UI, or content-script change.

The Workspace extension entry point is the composition root. It constructs the existing Knowledge and Snippet repositories, `RetrievalEngine`, `PromptBuilder`, and `OllamaProvider`, then supplies a focused application-layer `OutputWorkflow` to the React Workspace UI. Composition remains separate from presentation, no dependency-injection framework is introduced, and React components do not directly coordinate the retrieval, prompt, and provider steps.

`OutputWorkflow` accepts a project-owned input conceptually equivalent to:

```ts
interface OutputWorkflowInput {
  merchantContext?: string;
  guidance?: string;
  model: string;
}
```

It depends on `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`, not Ollama-specific request or response structures. For each invocation it constructs the retrieval query, invokes Retrieval Engine once, passes the original Merchant Context and Guidance plus prepared `RetrievalResults` to Prompt Builder, constructs `GenerationRequest`, invokes `GenerationProvider` once, and returns `GenerationResult`. The current composition root supplies `OllamaProvider`; application logic introduces no provider factory, registry, selector, provider-name branching, or future-provider placeholder.

### Retrieval and Prompt Construction

Every Generate action performs automatic retrieval. The query includes Merchant Context first when it contains non-whitespace, followed by Guidance when it contains non-whitespace. Included values are preserved exactly and joined with exactly two newline characters (`\n\n`). Context-only and Guidance-only queries use that supplied value directly. Whitespace-only values are omitted. No labels, headings, rewriting, summarization, enrichment, tokenization, or AI transformation are added by the workflow.

The existing Retrieval Engine continues to search both Knowledge and Snippets with unchanged M6 normalization, scoring, ranking, and empty-result behavior. Empty retrieval results are valid. M9 has no record pinning, manual selection, retrieval override, automatic/manual merging, or Use in Builder integration.

`OutputWorkflow` passes the original Merchant Context, original Guidance, and prepared `RetrievalResults` to the existing Prompt Builder. It does not change input precedence, top-five Knowledge or top-three Snippet selection, or `PromptAssembly` format. `PromptAssembly` remains internal and is not exposed in the Workspace UI.

### Model, Endpoint, and Browser Runtime

Before M11 Settings, Workspace provides one transient Ollama model text field whose initial value is blank. A placeholder may show `qwen2.5:7b`, but that value is not a default and must not affect generation unless entered by the user. Workspace trims leading and trailing UI whitespace before constructing `GenerationRequest`; the resulting model must contain non-whitespace. M9 does not persist, discover, list, or automatically select models and does not call `/api/tags`.

M9 preserves the fixed provider endpoint `http://localhost:11434/api/chat`. It adds no endpoint field and no `127.0.0.1`, LAN, arbitrary remote, Ollama cloud, or cloud-fallback support.

Generation executes directly from the foreground Workspace page. It does not move to the background service worker and introduces no `chrome.runtime` generation request, response, cancellation, or lifecycle messages. Application and provider code remain browser-runtime independent.

M9 approves exactly one new manifest host permission: `http://localhost/*`. Chrome host-permission match patterns are broader than a port, while `OllamaProvider` remains fixed to `localhost:11434`. M9 adds no ordinary Chrome API permission solely for Ollama networking and no `http://127.0.0.1/*`, broad HTTP or HTTPS pattern, or `<all_urls>`.

Real browser generation also requires the installed Ollama server to allow the environment-specific `chrome-extension://<extension-id>` origin through external `OLLAMA_ORIGINS` configuration. M9 does not hardcode an extension ID, alter Ollama configuration, set environment variables, launch or restart Ollama, automatically use a wildcard origin, or broaden Ollama to remote hosts. Setup and manual-validation guidance should prefer the specific installed extension origin.

### Inputs, Generation State, and Repeated Generation

Merchant Context and Guidance are optional, manual, multiline, transient inputs. Any non-whitespace Guidance, including `follow up`, is valid. Both values are preserved as supplied for Prompt Builder, retained after generation during the mounted Workspace session, never scraped, rewritten, enriched, or persisted, and receive no arbitrary M9 maximum length.

Generate is enabled only when Merchant Context or Guidance contains non-whitespace, the trimmed model contains non-whitespace, and no request is active. UI validation is preventive; existing Prompt Builder and provider validation remain authoritative if invalid input reaches an application boundary.

One Generate click performs exactly one retrieval, prompt-build, and provider-generation workflow. While generating, Generate is disabled, duplicate requests are prevented, and a visible accessible generating state is shown. Existing output remains visible but read-only. On success, new `GenerationResult.text` replaces previous output exactly, output becomes editable, and generation-error feedback clears. On failure, existing output remains unchanged, becomes editable again, and a safe error appears. M9 performs no automatic retry.

There is no dedicated Regenerate control. After completion, Generate becomes available again; another click uses current Context, Guidance, and model, reruns retrieval, rebuilds the prompt, and makes a fresh provider request. Successful output replaces any prior edited output, and no generation history is retained.

M9 exposes no Stop or Cancel control. Existing `AbortSignal` capability remains available infrastructure but is not part of the M9 UI. Closing or reloading the foreground Workspace naturally abandons the interaction without new background lifecycle infrastructure.

Workspace uses four explicit status values: `idle`, `generating`, `success`, and `error`. Validation feedback may appear within idle or error presentation without exposing internal retrieving, prompt-building, or provider phases. Output text remains separate from status so a prior draft can survive a later failed generation.

### Output, Copy, and Error UX

Generated output is one editable plain-text textarea. M9 does not render Markdown. On success, `GenerationResult.text` becomes its initial value exactly, preserving whitespace, line breaks, and Unicode. User edits live only in component state, and no original or edited generation is persisted.

Copy uses `navigator.clipboard.writeText(currentOutput)` from the direct user click handler and copies the current edited textarea value exactly. M9 does not read the clipboard and does not pre-approve `clipboardRead` or `clipboardWrite`; an additional permission would require implementation evidence that direct user activation is insufficient. Copy provides lightweight transient success feedback and the safe failure message `Could not copy. Select the text and copy it manually.` It mutates neither output nor persistence.

The Workspace maps expected failures to safe user-facing messages:

- Missing Context or Guidance: `Add Merchant Context or Guidance before generating.`
- Missing model: `Enter an Ollama model name.`
- `ProviderUnavailableError`: `Couldn't connect to Ollama. Make sure Ollama is running and configured for this extension.`
- `ModelUnavailableError`: `That model is not available in your local Ollama installation.`
- `ProviderRequestError`: `Ollama couldn't complete the request. Try again.`
- `ProviderResponseError`: `Ollama returned an invalid response. Try again.`
- `GenerationCancelledError`: `Generation was cancelled.`
- Local persistence or retrieval failure: `Couldn't read the local Library. Try again.`
- Copy failure: `Could not copy. Select the text and copy it manually.`

Equivalent punctuation and styling may follow existing UI conventions. UI errors expose no stack trace, raw cause, raw Ollama payload or response body, `PromptAssembly`, Merchant Context, or Library content. M9 never pulls or installs a model. Missing-model feedback says only that the model is unavailable locally and must be installed in Ollama before retrying.

M9 provides no full onboarding wizard. Minimal helper text may state that Ollama must be installed, running locally, contain the requested model, and allow browser-extension access. Generation remains the only availability check; detailed Settings and connection management remain deferred.

### Layout, Accessibility, Persistence, and Privacy

Workspace uses a centered full-page vertical layout ordered as identity/header, Merchant Context textarea, Guidance textarea, Ollama model text input, Generate, generating or error status, editable Generated Output textarea, and Copy. Styling follows existing Tailwind conventions without a component or design-system dependency.

Every control has an explicit visible label, buttons are semantic and keyboard-operable, native disabled behavior communicates unavailable Generate state, status and error feedback use an appropriate `aria-live` region, the output textarea is labelled, generating state is accessible, tab order is natural, and generation does not force an unexpected focus jump. M9 adds no keyboard shortcut.

All Workspace state is transient: Merchant Context, Guidance, model, generated or edited output, status, and feedback are lost on page reload or close. M9 uses no Dexie, `localStorage`, `chrome.storage`, history, or draft persistence. Database `ai-support-workspace` remains at schema version 1 with only `knowledgeEntries` and `snippetEntries`; M9 adds no table, field, index, migration, or Settings persistence.

M9 preserves local-first privacy. Provider-generation material is sent only to the fixed local Ollama endpoint. No telemetry, analytics, cloud fallback, prompt or output logging, or raw request or response logging is introduced. The content script and its existing match configuration remain unchanged; M9 performs no active-page read, scraping, insertion, or merchant-page modification.

### Validation Boundary

Automated tests must validate `OutputWorkflow`, Workspace UI, the exact `http://localhost/*` generated-manifest host permission without broader hosts or clipboard permission, absence of Side Panel, and regressions across popup, Libraries, persistence, Retrieval Engine, Prompt Builder, Ollama Provider, and the production extension build. Normal component and orchestration tests use controlled dependencies and never require real Ollama.

M9 requires real Chrome validation of Workspace and Library navigation, input and Generate rules, real local generation, loading and safe errors, editable output, exact edited-output copying, repeated generation, output preservation after a later failure, missing-service and missing-model behavior, absence of leaked content or Chrome runtime errors, and Library regressions. This is the first actual Chrome-extension-to-Ollama request: automated tests validate the manifest and application boundaries, while manual Chrome validation proves host permission, external Ollama origin configuration, and browser interoperability.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
