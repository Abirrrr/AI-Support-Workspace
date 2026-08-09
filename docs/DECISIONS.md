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

Ollama v1 is local-only at fixed base URL `http://localhost:11434`. It performs `POST http://localhost:11434/api/chat` using Ollama's native chat API. M8 does not use `/api/generate`, an OpenAI-compatible endpoint, remote or LAN Ollama addresses, cloud fallback, or caller-configurable base URLs. Provider endpoint configuration is excluded from M11 and remains deferred until provider expansion or a dedicated provider-configuration architecture review addresses host permissions, localhost versus LAN or remote access, HTTP/HTTPS policy, URL credential rejection, `OLLAMA_ORIGINS`, security, and provider independence.

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

The caller supplies the model identifier transiently for each request. M8 defines no default, hardcoded model, automatic model selection, model discovery, or model persistence. M11 later owns one optional saved default Ollama model used only to initialize a new Workspace session's transient model field; the generation request continues to receive the current caller-supplied model.

Generation itself is the availability check. M8 adds no health endpoint or preliminary request. A connection or network failure before an HTTP response becomes `ProviderUnavailableError`. M11 adds no diagnostic request; a future provider-configuration review may introduce a distinct test-connection workflow only when approved.

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

Milestone 9 implements the first complete manual Context-to-generated-output workflow through one extension-owned global Chrome Side Panel. It connects the existing Retrieval Engine, Prompt Builder, `GenerationProvider`, and `OllamaProvider` boundaries without changing their behavior. The workflow accepts manual Merchant Context, manual Guidance, and a temporary Ollama model value; automatically retrieves local Knowledge and Snippets; generates through the provider boundary; and presents editable plain-text output with a Copy action.

M9 introduces no dedicated Regenerate, Cancel, Stop, Clear, or Reset control; manual Library selection; Save as Snippet; PromptAssembly preview; provider selection or registry; OpenAI integration; model discovery; `/api/tags`; persistent Settings or workspace drafts; generation history; keyboard shortcut; page scraping or insertion; standalone Workspace tab; streaming; retry; health check; automatic model pull; or endpoint configuration. After a request completes, the ordinary Generate button may be used again for a fresh complete workflow with the current inputs.

### Workspace Surface and Composition

M9 adds one global foreground Chrome Side Panel containing the Workspace. It is an extension-owned companion UI intended to remain visible beside the current support website without switching tabs. The popup remains a launcher with separate Open Workspace and Open Libraries actions. Open Workspace opens the global Side Panel in the current browser window from the direct popup user gesture; Open Libraries preserves the existing options-page behavior. Knowledge and Snippet CRUD remain owned by the options page. M9 introduces no router, injected merchant-page UI, or content-script change.

The WXT Side Panel entry point is the composition root. It produces `sidepanel.html`, constructs the existing Knowledge and Snippet repositories, `RetrievalEngine`, `PromptBuilder`, and `OllamaProvider`, then supplies a focused application-layer `OutputWorkflow` to the React Workspace UI. Composition remains separate from presentation, no dependency-injection framework is introduced, and React components do not directly coordinate the retrieval, prompt, and provider steps.

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

Generation executes directly from the foreground Side Panel page. It does not move to the background service worker and introduces no `chrome.runtime` generation request, response, cancellation, or lifecycle messages. Application and provider code remain browser-runtime independent.

M9 approves exactly one Chrome API permission, `sidePanel`, and exactly one new manifest host permission, `http://localhost/*`. The generated Manifest V3 contract contains `permissions: ['sidePanel']`, `host_permissions: ['http://localhost/*']`, and `side_panel.default_path` pointing to the WXT Side Panel entry point. Chrome host-permission match patterns are broader than a port, while `OllamaProvider` remains fixed to `localhost:11434`. M9 adds no `tabs`, `activeTab`, storage, clipboard, or scripting permission and no `http://127.0.0.1/*`, broad HTTP or HTTPS pattern, or `<all_urls>`.

Real browser generation also requires the installed Ollama server to allow the environment-specific `chrome-extension://<extension-id>` origin through external `OLLAMA_ORIGINS` configuration. M9 does not hardcode an extension ID, alter Ollama configuration, set environment variables, launch or restart Ollama, automatically use a wildcard origin, or broaden Ollama to remote hosts. Setup and manual-validation guidance should prefer the specific installed extension origin.

### Inputs, Generation State, and Repeated Generation

Merchant Context and Guidance are optional, manual, multiline, transient inputs. Any non-whitespace Guidance, including `follow up`, is valid. Both values are preserved as supplied for Prompt Builder, retained after generation during the mounted Workspace session, never scraped, rewritten, enriched, or persisted, and receive no arbitrary M9 maximum length.

Generate is enabled only when Merchant Context or Guidance contains non-whitespace, the trimmed model contains non-whitespace, and no request is active. UI validation is preventive; existing Prompt Builder and provider validation remain authoritative if invalid input reaches an application boundary.

One Generate click performs exactly one retrieval, prompt-build, and provider-generation workflow. While generating, Generate is disabled, duplicate requests are prevented, and a visible accessible generating state is shown. Existing output remains visible but read-only. On success, new `GenerationResult.text` replaces previous output exactly, output becomes editable, and generation-error feedback clears. On failure, existing output remains unchanged, becomes editable again, and a safe error appears. M9 performs no automatic retry.

There is no dedicated Regenerate control. After completion, Generate becomes available again; another click uses current Context, Guidance, and model, reruns retrieval, rebuilds the prompt, and makes a fresh provider request. Successful output replaces any prior edited output, and no generation history is retained.

M9 exposes no Stop or Cancel control. Existing `AbortSignal` capability remains available infrastructure but is not part of the M9 UI. Closing, destroying, or reloading the Side Panel naturally abandons the interaction without new background lifecycle infrastructure.

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

M9 provides no full onboarding wizard. Minimal helper text may state that Ollama must be installed, running locally, contain the requested model, and allow browser-extension access. Generation remains the only availability check. M11 adds only an optional saved default model and does not add connection management, discovery, health checks, or endpoint configuration.

### Layout, Accessibility, Persistence, and Privacy

Workspace uses a fluid vertical Side Panel layout ordered as identity/header, Merchant Context textarea, Guidance textarea, Ollama model text input, Generate, generating or error status, editable Generated Output textarea, and Copy. Controls occupy the available narrow panel width without normal horizontal scrolling, vertical scrolling is permitted, and no code attempts to force Chrome's user-controlled Side Panel width. Styling follows existing Tailwind conventions without a component or design-system dependency.

Every control has an explicit visible label, buttons are semantic and keyboard-operable, native disabled behavior communicates unavailable Generate state, status and error feedback use an appropriate `aria-live` region, the output textarea is labelled, generating state is accessible, tab order is natural, and generation does not force an unexpected focus jump. M9 adds no keyboard shortcut.

All Workspace state is transient: Merchant Context, Guidance, model, generated or edited output, status, and feedback are lost on page reload or close. M9 uses no Dexie, `localStorage`, `chrome.storage`, history, or draft persistence. Database `ai-support-workspace` remains at schema version 1 with only `knowledgeEntries` and `snippetEntries`; M9 adds no table, field, index, migration, or Settings persistence.

M9 preserves local-first privacy. Provider-generation material is sent only to the fixed local Ollama endpoint. No telemetry, analytics, cloud fallback, prompt or output logging, or raw request or response logging is introduced. The content script and its existing match configuration remain unchanged; M9 performs no active-page read, scraping, insertion, or merchant-page modification.

### Validation Boundary

Automated tests must validate `OutputWorkflow`, the Side Panel-hosted Workspace UI, the WXT Side Panel entry point, generated `side_panel.default_path`, exact `sidePanel` Chrome API permission, exact `http://localhost/*` host permission without broader hosts or unnecessary permissions, direct popup opening of the current-window Side Panel, absence of background messaging for opening or generation, and regressions across popup, Libraries, persistence, Retrieval Engine, Prompt Builder, Ollama Provider, and the production extension build. No standalone Workspace tab is required. Normal component and orchestration tests use controlled dependencies and never require real Ollama.

M9 requires real Chrome validation that popup Open Workspace opens the global Side Panel beside the active webpage, the panel remains usable during normal support-page navigation, Open Libraries still opens options, controls work at narrow Side Panel dimensions without horizontal layout breakage, and the existing input, Generate, real local generation, loading, safe-error, editable-output, Copy, repeated-generation, output-preservation, missing-service, missing-model, privacy, runtime-error, and Library-regression contracts hold. This is the first actual Chrome-extension-to-Ollama request: automated tests validate the manifest and application boundaries, while manual Chrome validation proves Side Panel opening, `sidePanel` permission, host permission, external Ollama origin configuration, and browser interoperability.

## Decision 26: M9 Global Chrome Side Panel Surface Amendment

Manual product review rejected the standalone extension-tab Workspace after M9 implementation had begun but before that implementation was committed. This decision deliberately supersedes only Decision 25's original standalone page, separate-tab, centered full-page layout, and Side Panel exclusion. The OutputWorkflow, retrieval, prompt, provider, model, state, output, Copy, error, privacy, persistence, and deferred-scope contracts remain unchanged.

M9 uses WXT's native Side Panel entry point as one global Workspace companion beside any current browser tab. The generated page is `sidepanel.html`, and the generated MV3 manifest declares `side_panel.default_path` for that page. The panel is not enabled per site, does not use tab-specific or dynamic paths, and does not create different side panels or content by website. Chrome controls panel width and lifecycle.

The popup stays in place because it also owns Open Libraries. Open Workspace calls `chrome.sidePanel.open(...)` from the direct popup user interaction for the current browser window. Resolving that window requires no `tabs` or `activeTab` permission, and no background message is introduced solely to open the panel. Clicking the extension toolbar icon continues to open the popup rather than bypassing it.

The amended manifest contract adds only `sidePanel` to ordinary permissions and preserves only `http://localhost/*` in host permissions. It adds no `tabs`, `activeTab`, `storage`, `clipboardRead`, `clipboardWrite`, `scripting`, `127.0.0.1`, or broad host access. The Side Panel shares the same environment-specific `chrome-extension://<extension-id>` origin requirement already documented for external Ollama `OLLAMA_ORIGINS` configuration.

Workspace state remains transient for the mounted Side Panel instance. Chrome closure, destruction, or reload may discard it, and this surface change does not authorize persistence. The UI must be fluid, narrow-width-safe, vertically scrollable, and free of normal horizontal scrolling without attempting to programmatically set Side Panel width.

Implementation validation must replace standalone-page checks with Side Panel entrypoint, popup-opening, permission, manifest, narrow-layout, and real Chrome Side Panel checks. Existing application and component tests remain applicable because the React view and all workflow behavior are reused without redesign.

## Decision 27: M10 Selected-Text Keyboard Command

Milestone 10 adds exactly one browser-scoped standard Chrome command, `capture-selection-to-workspace`, with the user-facing description `Capture selected text in AI Support Workspace`. Its suggested shortcut is `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS. The command is declared through the manifest `commands` key, does not use `_execute_action`, and must not set `global: true`. Chrome's native `chrome://extensions/shortcuts` surface owns user remapping, collision handling, and unassigned-command recovery; M10 adds no in-app shortcut editor, shortcut persistence, forced assignment, or collision-repair UI.

### Runtime and Manifest Boundary

The existing extension service worker owns `chrome.commands.onCommand` for this focused command. The command listener validates the command-provided active tab and browser window, performs explicit selection extraction, opens or activates the existing global Workspace Side Panel, transiently delivers the capture result, and coordinates safe failures. Unknown commands are ignored. React presentation code does not register the command listener, and the service worker does not acquire Retrieval Engine, Prompt Builder, `OutputWorkflow`, `OllamaProvider`, generation, persistence, or durable Workspace-state responsibilities.

M10 preserves `side_panel.default_path`, the existing `sidePanel` permission, and the exact `http://localhost/*` host permission. It adds exactly `activeTab` and `scripting` to ordinary permissions so explicit user invocation can run selection extraction in the active tab without permanent site access. The `commands` declaration is a manifest key rather than an ordinary permission. M10 adds no `tabs`, storage, clipboard, notification, broad host, `<all_urls>`, permanent support-site host, `127.0.0.1`, remote-provider, or cloud permission. The existing persistent content script and its `https://example.com/*` development match remain unchanged.

The command is available only while Chrome is focused and a current active normal webpage can be addressed. It has no OS-global promise and no special behavior for Chrome-unfocused use, DevTools, `chrome://` pages, Chrome Web Store restricted surfaces, cross-origin frames, or incognito. Existing Chrome incognito policy remains unchanged. Unsupported or restricted contexts fail safely without requesting broader access.

### Selection Extraction and Ordering

M10 captures only an explicit selection from the active tab's main frame. Selection extraction applies this precedence:

1. When the focused element is a `textarea` or a text-capable `input` that exposes a non-empty selection range, return exactly the selected substring of its value.
2. Otherwise, return the main-frame document selection from `window.getSelection()` or equivalent.
3. Treat an absent or whitespace-only result as empty.

Any selected text that contains non-whitespace is preserved exactly, including Unicode, line breaks, and leading or trailing whitespace. M10 does not scrape surrounding page content, inspect a support application's conversation DOM, infer Merchant Context, read cross-origin iframe selection, capture screenshots, or fall back to arbitrary page text. Contenteditable selection is handled through the ordinary main-frame document selection. Cross-frame capture remains future scope.

The command must invoke selection capture before invoking Side Panel opening so the scripting request is dispatched before panel focus can affect the page selection. It must not await capture completion before calling `chrome.sidePanel.open({ windowId })`: Side Panel opening is initiated immediately and synchronously in the same keyboard-command user-action turn. Capture-invocation ordering is required; capture-completion ordering is not. After both operations have been initiated, the service worker observes their independent asynchronous outcomes, maps the capture to the approved typed result, and delivers it only when the panel can receive it. The command is open/activate behavior, not toggle behavior: a closed panel opens, an already-open panel remains open, and repeated invocation never closes it. M10 creates no tab-specific panel path.

### Transient Delivery Contract

M10 introduces one focused typed Chrome runtime messaging boundary for capture delivery. Its result states are success with exact selected text, empty selection, unsupported or restricted page, and capture failure. Each transient delivery receives a positive delivery ID. Delivery works when the Side Panel is already mounted and when the command opens a previously closed panel. A newly mounted Side Panel announces readiness, which retries pending delivery after the initial send could not reach the unmounted panel. The Side Panel acknowledges only after it has applied the result or failure feedback, and the service worker removes only the queue head whose delivery ID matches that acknowledgement. This is a focused ready-and-acknowledgement handshake, not a generalized message bus or durable queue.

The capture must not be silently lost because the Side Panel has not finished mounting. Pending items live only in the service worker's in-memory delivery queue and survive only that runtime lifetime. No capture is written to Dexie, `localStorage`, `chrome.storage`, or another durable store. No database table or Workspace persistence mechanism is added. If reliable delivery cannot be implemented within this transient handshake without persistence or another permission, implementation must stop for architecture review instead of changing this contract.

### Workspace State, Focus, and Feedback

On acknowledged success, the Side Panel replaces Merchant Context with the exact captured text. It preserves Guidance, the transient Ollama model, generated or user-edited Output, and all existing M9 transient-state semantics. It clears previous capture-specific feedback and may show lightweight capture success feedback. The selected text affects future Generate actions only; M10 never appends to or merges with old Context and never automatically invokes Generate.

After applying every successful capture, the Side Panel calls `guidanceElement.focus()` and places a collapsed caret at the end of its existing value with `setSelectionRange(end, end)`. Empty Guidance receives the same DOM focus request. Existing Guidance is neither selected nor modified, Merchant Context does not receive requested final DOM focus, and Generate is not focused. When the command opens a closed Side Panel, Guidance is expected to be immediately usable. When the panel is already visible and the webpage owns keyboard focus, Chrome may retain host-level keyboard routing on the webpage despite the successful DOM focus and caret request; the user may need to click Guidance. If a generation request is active, capture does not cancel it or alter its already-constructed `GenerationRequest`; Merchant Context changes only for the next generation, while the current generating and output behavior remains governed by M9.

An empty selection does not alter Merchant Context. The Side Panel opens or remains open where possible and shows `Select text on the page, then use the shortcut again.` A restricted page or other capture failure also preserves Context and shows the safe equivalent of `Couldn't capture selected text from this page. Copy and paste it into Merchant Context.` Capture failure does not force unrelated focus movement. Raw Chrome errors are never exposed.

If Side Panel opening fails, the service worker safely maps or swallows the raw Chrome exception. M10 adds no notification permission and no alternate tab, window, or popup error surface. A small capture-status message inside the existing Side Panel is the only approved M10 UI addition; M10 does not redesign Workspace.

### Validation and Deferred Scope

Automated validation must cover the exact command manifest, suggested keys, browser-only scope, exact permission and host contract, command dispatch and unknown-command handling, command-provided tab and window use, capture invocation immediately followed by Side Panel open invocation without an awaited boundary, independent capture/open outcomes, main-frame selection precedence and exact-text preservation, empty and restricted-page failures, non-toggle Side Panel behavior, transient readiness and acknowledgement delivery for mounted and newly opened panels, state replacement and preservation, the successful Guidance DOM focus request with a collapsed end caret and no text selection or mutation, absence of forced Guidance focus on failure, active-generation preservation, raw-error hiding, absence of capture persistence, and regressions across M9 Workspace, popup, Libraries, Retrieval Engine, Prompt Builder, Ollama Provider, generation, Copy, and production build. Normal tests use controlled browser and provider boundaries and require no live Ollama. JSDOM can prove only the document-level active element, selection range, and state effects inside the Side Panel document. Controlled browser APIs and JSDOM cannot prove Chrome WebContents activation, cross-surface keyboard routing, or preservation of Chrome transient user activation, so real Chrome validation remains mandatory.

Manual Chrome validation must confirm the installed command in `chrome://extensions/shortcuts`, suggested-key assignment or native remapping after collision, normal document, textarea, and contenteditable selection, exact Context replacement, preserved Guidance content, immediately usable Guidance focus when a closed panel opens, the DOM focus and collapsed end-caret request on repeated capture, no forced Guidance focus on empty or failed capture, state preservation, absence of automatic generation, repeated non-toggle invocation, empty-selection and restricted-page feedback, normal Generate and popup/Library regressions, absence of runtime errors, and the exact permission surface. Browser-level keyboard routing when the panel is already visible is observed separately from the DOM assertion and is subject to Decision 30.

M10 adds no Generate or Copy shortcut, automatic generation, Snippet trigger field, semicolon detection, Snippet expansion, editor replacement, screenshot or clipboard-image capture, multimodal request change, Settings functionality, dependency, database change, schema migration, or persistent Workspace state. Rich Snippet Trigger Expansion and Multimodal Context Attachments remain separately tracked future work.

## Decision 28: M10 Runtime Sequencing Amendment

Real Chrome validation supersedes only Decision 27's original requirement to await capture completion before opening the Side Panel. Chrome correctly registered the command, including the user's Chrome-native remapping from the colliding suggested key to `Ctrl+Shift+Y`; dispatched `chrome.commands.onCommand`; executed main-frame selection scripting; and opened the global Side Panel when `chrome.sidePanel.open({ windowId })` was invoked directly in the keyboard-command turn. The production sequence `await chrome.scripting.executeScript(...)` followed by `await chrome.sidePanel.open(...)` failed because the asynchronous capture boundary exhausted Chrome's user-action eligibility for Side Panel opening, and the implementation's safe exception handling made that failure silent.

The validated replacement starts `chrome.scripting.executeScript(...)` and retains its Promise, then immediately starts `chrome.sidePanel.open({ windowId })` without awaiting any asynchronous work between the two invocations. Real Chrome diagnostics repeatedly produced fulfilled capture and open outcomes with this ordering and preserved exact selection text, including leading whitespace. Only after both calls have been initiated may the service worker await or otherwise observe settlement. Initiating capture first minimizes the risk of panel focus affecting the source selection; it does not require capture to complete before panel opening begins.

Capture and Side Panel opening are independent asynchronous outcomes. Capture success, empty selection, or safe capture failure is mapped through the existing typed contract independently of panel-open success or failure. A successfully opened panel receives the eventual result through the existing transient ready-and-acknowledgement handshake. Capture failure with a successful open shows the approved copy-and-paste guidance; empty capture with a successful open shows the approved select-text guidance. Panel-open failure causes no persistence, notification, fallback surface, raw-error exposure, or delivery attempt that assumes a receiving panel. No capture outcome may prevent the Side Panel open call from being initiated in the command turn, and panel-open success is not evidence of capture success.

Automated regression coverage must structurally prove capture invocation first, immediate Side Panel open invocation second, no awaited boundary between them, independent settlement handling, and delivery only after a typed capture outcome exists. Ordinary API mocks cannot establish Chrome transient user activation, so real Chrome command validation remains the browser-level authority; that validation passed during M10 closeout. This amendment changes no command identity, shortcut-remapping policy, selection semantics, permissions, content-script matches, runtime ownership, transient delivery contract, Workspace state behavior, database schema, M11 separation, Snippet-trigger scope, or multimodal scope.

## Decision 29: M10 Guidance Focus UX Amendment

Successful selected-text capture still replaces Merchant Context exactly and preserves Guidance, the transient model, generated or edited Output, and any active generation request. After applying that replacement, the Side Panel requests focus for the Guidance textarea rather than Merchant Context because the shortcut has already supplied Context and the next natural action is optional case-specific instruction entry. The focus request does not invoke Generate or alter any generation boundary. Decision 30 qualifies the browser-level outcome when the Side Panel is already visible.

Guidance content remains unchanged. Every successful capture calls `guidanceElement.focus()` and `setSelectionRange(end, end)`; existing text is not automatically selected, replaced, appended to, or otherwise modified. When a closed Side Panel opens, empty Guidance is ready for immediate typing. Merchant Context must not receive requested final DOM focus after successful shortcut capture.

Empty selection, restricted or unsupported pages, and capture failure preserve the existing Merchant Context and approved safe feedback. Those failure paths do not force Guidance focus and require no additional focus behavior. Automated regression coverage verifies exact Context replacement, Guidance preservation, the Guidance DOM focus and collapsed end-caret request, absence of Guidance text selection or replacement, absence of requested final Context focus, no automatic Generate, and no forced Guidance focus on failure. Real Chrome manual validation separately verifies immediate usability when opening a closed panel and observes the host-level repeated-invocation behavior described by Decision 30. This amendment changes no shortcut, runtime sequencing, ready/acknowledgement delivery, state preservation, generation behavior, permission, database, M11, Snippet-trigger, or multimodal contract.

## Decision 30: M10 Repeated Side Panel Focus Platform Limitation Amendment

Real Chrome validation establishes two distinct focus outcomes. On first invocation while the Side Panel is closed, the panel opens, capture and exact Context delivery succeed, preserved Workspace state remains intact, Guidance receives the requested DOM focus and collapsed end caret, and Guidance is immediately usable for typing. On repeated invocation while the Side Panel is already visible and the webpage owns keyboard focus, panel visibility, capture, delivery, exact Context replacement, state preservation, and the internal Guidance DOM focus/caret request still succeed, but Chrome may keep browser-level keyboard routing on the webpage. The user may need to click Guidance before typing.

This is a Chrome Side Panel host limitation rather than a failed DOM focus implementation. Chrome currently exposes no supported API that activates or focuses an already-visible Side Panel after the shortcut capture. The implementation must retain `guidanceElement.focus()` followed by `setSelectionRange(end, end)` on every successful capture. M10 must not add `window.focus()` assumptions, focus retries, artificial delays, polling, panel close/reopen, toggle behavior, broader permissions, persistence, notifications, or alternate tab or window surfaces to mask the limitation.

Automated tests, including JSDOM component tests, may prove only Side Panel document state such as `document.activeElement`, the collapsed selection range, preserved values, exact Context replacement, and absence of automatic Generate. They cannot prove Chrome WebContents activation or which surface receives physical keyboard input. Real Chrome validation owns that browser-host observation. Final M10 manual validation passed all first-invocation focus behavior and, on repeated invocation, passed panel visibility, capture, Context replacement, state preservation, and the internal focus/caret implementation and test contract; automatic browser-level focus was unavailable because of the platform limitation. The limitation is non-blocking, M10 is complete, and supported activation of an already-visible Side Panel remains an unassigned future capability.

## Decision 31: M11 Saved Default Ollama Model Settings

Milestone 11 introduces one small local Settings capability. Its only configurable value is the application-owned aggregate `Settings { defaultModel: string | null }`. A non-null string initializes the model field when a new Workspace Side Panel session starts; `null` means no saved default and initializes that field blank. The application default is `null`. Example text such as `qwen2.5:7b` may remain a placeholder but is never an implicit or persisted default, and the extension assumes no model is installed.

The model identifier is opaque. The focused save application boundary trims leading and trailing whitespace, saves non-empty trimmed text unchanged, and saves `null` for empty or whitespace-only input. Saving performs no model discovery, Ollama request, availability check, model pull, health check, retry, timeout, or character restriction. Provider availability remains a Generate-time concern.

### Settings Surface and Save Behavior

Settings is the third top-level section within the existing options-page UI beside Knowledge and Snippets. M11 reuses the current options-page shell and lightweight local navigation, creates no separate extension page or routing dependency, and changes no popup action. The section contains one labelled text input, concise help explaining new-session initialization and transient Workspace overrides, and one explicit `Save settings` button. It adds no generic schema renderer, category framework, provider card, accordion, or generalized preference system.

The form loads before becoming editable. Save is disabled while loading or saving and whenever the normalized input equals the loaded value. It is enabled only for a normalized change. Saving is one atomic single-setting operation; on success the normalized saved value becomes the new loaded baseline. Navigation may discard unsaved edits, no confirmation is required, no cross-page concurrency system is added, and the last successful save wins. Exact feedback is `Settings saved.`, `Couldn't load settings. Reload and try again.`, and `Couldn't save settings. Try again.` through an accessible live status region without raw persistence errors.

### Typed Boundary and Persistence

The domain/application boundary owns the `Settings` type, normalization, default resolution, and focused load/save services. A minimal project-owned `SettingsRepository` loads the optional aggregate and saves the aggregate. React does not call Dexie, the repository exposes no Dexie record identity, and arbitrary string key/value storage is prohibited. The infrastructure adapter maps the application aggregate to the singleton physical record `{ id: 'global', defaultModel }`.

M11 uses Dexie/IndexedDB and no `chrome.storage`, `localStorage`, filesystem, remote storage, or Chrome `storage` permission. Implementation incremented database `ai-support-workspace` from schema version 1 to version 2 and added only `settings: 'id'`. The table has no secondary indexes or timestamps. The forward-only migration preserves all Knowledge and Snippet records without transformation, creates no Settings record automatically, changes no existing store or index, and does not support rollback to version 1.

An absent physical record is normal. The repository reports absence, and the application load boundary resolves it to `{ defaultModel: null }`. The repository supports only singleton load and save; there is no list, create, update-by-ID, delete UI, or unrelated CRUD. Saving blank input is the supported clear operation.

### Workspace Initialization

The Side Panel composition root loads Settings once at startup and resolves the initial model before establishing editable Workspace model state. It passes that initial value into presentation so no later asynchronous result can overwrite text the user has begun typing. A successful non-null default initializes the model field; `null` or a missing record initializes it blank. A load failure also initializes blank, keeps Workspace usable, and shows the non-blocking message `Couldn't load the saved model. Enter a model manually.` without exposing the raw cause.

After initialization, the Workspace model remains transient and editable. Workspace edits do not save Settings. Generate uses the current Workspace field and the existing `GenerationRequest` shape. Closing and reopening the Side Panel reloads the latest saved default; an already-mounted panel does not live-sync options-page changes. M11 adds no runtime message, database subscription, global state framework, or change to Merchant Context, Guidance, Output, M9 generation behavior, or M10 capture state preservation.

The dependency flow is `SettingsRepository` to the focused Settings application boundary to the Side Panel composition root to initial Workspace model state to `GenerationRequest` to `OllamaProvider`. Prompt Builder never reads Settings, `OllamaProvider` never reads Dexie, React presentation never calls Dexie directly, provider identity remains `ollama`, and the provider endpoint remains fixed.

### Scope, Profile, Security, and Permissions

Settings is one extension-wide singleton local to the current Chrome browser profile. M11 adds no merchant-, site-, tab-, provider-, or named-profile configuration. It stores no API key, token, password, remote credential, customer Context, Guidance, or generated Output. A model identifier is not a supported place for a URL or credential, and M11 requires no encryption or secret-storage architecture.

Provider selection is deferred until M16 — OpenAI Provider Expansion, when more than one provider exists. Endpoint configuration requires provider expansion or a dedicated architecture review. Behavior tuning, tone, response length, language, structure, terminology, signatures, persistent custom instructions, generation parameters, theme, shortcut enablement, configured-shortcut detection, in-app remapping, Snippet triggers, Rich Snippets, multimodal Context, Workspace persistence, history, reset, import, export, backup, restore, and migration from another extension are excluded. Chrome continues to own shortcut assignment and remapping through `chrome://extensions/shortcuts`; M12 retains import/export ownership.

M11 changes no manifest permission or host. The existing `sidePanel`, `activeTab`, and `scripting` permissions, fixed `http://localhost/*` host access, content-script match, and M10 command contract remain unchanged.

### Validation Contract

Automated coverage must prove application defaults, trim/clear normalization, opaque model preservation, safe load/save failure mapping, schema version 1 to version 2 upgrade, singleton persistence and reopen, absence of automatic record creation, Knowledge and Snippet preservation, no unrelated schema change, Settings UI loading/dirty/saving/success/error/accessibility behavior, Workspace initialization and load-failure fallback, transient overrides, reopen behavior, no live synchronization, current-field generation, and regressions across M9, M10, popup, Libraries, Retrieval Engine, Prompt Builder, `OllamaProvider`, generated manifest, and production build. Normal tests require no live Ollama.

After implementation review, real Chrome validation must cover first-run blank state, save and options-page reload, new Side Panel initialization, transient Workspace override and generation, Side Panel reopen, clear-to-null behavior, safe feedback where practical, Library data preservation through migration, M10 capture, popup navigation, unchanged permissions, and generation with an already installed valid model.

### Implementation and Closeout Status

M11 implemented Decision 31 without amendment. The focused typed boundary, Dexie version 2 singleton, options-page form, pre-editable-state Side Panel bootstrap, transient Workspace semantics, and M10 handshake protection all match the approved dependency and scope contracts. React does not call Dexie, Prompt Builder and `OllamaProvider` remain Settings-independent, and `GenerationRequest`, provider identity, fixed endpoint, manifest, permissions, dependencies, and configuration remain unchanged.

Automated validation passed 69 focused tests in 9 files and 200 tests in 25 files in the normal suite; 1 opt-in live Ollama test in 1 file remained skipped. Lint, formatting, type-checking, Playwright discovery, the production Chrome MV3 build, generated-output and manifest validation, and `git diff --check` passed. Real Chrome validation separately passed first-run and migration behavior, save/reload persistence, new-session initialization, transient override and reopen restoration, real `qwen2.5:7b` generation, clear-to-null, Library preservation, M10 capture, popup navigation, and unchanged permissions. Persistence load/save fault UI was covered by automation rather than manual database fault injection.

No new architecture decision resulted from implementation or validation. M11 is complete and M12 retains its existing Import / Export ownership without architecture or scope expansion here. The M11 implementation and closeout were later committed and synchronized at checkpoint `d40e031` (`feat: add default Ollama model settings`).

## Decision 32: Milestone Task Governance and Future Capability Assignments

This is a workflow-governance and roadmap-assignment decision, not an implementation or application-architecture decision.

Every Principal Engineer or coding-agent task inside a milestone must have a unique identifier formed from the milestone number and a sequential letter, such as `M12-A`, `M12-B`, and `M12-C`. Identifiers are never reused for independent tasks. Every task heading and completion-report heading uses the same identifier, `PROJECT_STATE.md` records the active task, and each completion report confirms that work remained within that identified scope. Every task ends with an independent Principal-readiness self-check before completion is reported.

Focused corrections or continuations of the same task use sequential decimal suffixes, such as `M12-C.1` and `M12-C.2`. A correction remains part of its original task, does not consume the next normal letter, and must not be represented as a new independent task. M12-A.1 is the corrective execution of the M12-A documentation work after M12-A ran only a readiness self-check and produced no repository changes.

Roadmap ownership is assigned as follows:

- M12 remains Import / Export.
- M13 remains Provider Expansion / OpenAI.
- M14 is Multimodal Context Attachments only.
- M15 is Rich Snippet Templates & Trigger Expansion only.

M12 will use an independently versioned export-file format whose version remains separate from the Dexie schema version. Future export-format versions may support future persisted data types. Transient screenshot Context does not enter M12. Future Rich Snippet data does not enter the initial M12 scope because that capability does not exist yet. Detailed Import / Export decisions begin with the unstarted M12-B — Import / Export Architecture Readiness Review.

The M14 and M15 assignments establish high-level roadmap ownership only. Detailed multimodal and Rich Snippet architecture remains deferred to future tasks within those milestones, and neither screenshot nor Rich Snippet implementation may enter M12.

Decision 34 supersedes these original M13–M15 assignments before M13 work began. They remain here only as historical context.

## Decision 33: Import / Export v1 Architecture

M12 defines a manual, local backup and replace-only restore workflow for recovery after reinstall or local browser-data loss and for user-mediated transfer to another Chrome profile or computer. It is not cloud sync, collaboration, sharing, bulk editing, automatic backup, or scheduled backup. M12-B completed its readiness review with verdict `ARCHITECTURE DEFINITION REQUIRED`; M12-C supplied this architecture, and the corrected M12-D/M12-D.1 implementation is complete at checkpoint `d304f90`.

The public backup is a strict application-owned JSON contract independent of physical Dexie records and schema versions. Version 1 requires exactly `format: "ai-support-workspace-backup"`, integer `formatVersion: 1`, a valid UTC ISO `exportedAt`, and `data` containing exactly `knowledge`, `snippets`, and `settings`. Knowledge records contain exactly `id`, `title`, `body`, `tags`, `createdAt`, `updatedAt`, and `source`; Snippet records contain exactly `id`, `title`, `content`, `tags`, `createdAt`, and `updatedAt`; Settings always contains exactly `defaultModel: string | null`. Physical table names, database versions, and the Settings singleton ID `global` are excluded. Transient Workspace state, browser/page data, Ollama availability, secrets, credentials, screenshots and future M14 data, and future M15 rich-Snippet fields are excluded.

Export orders each Library by `createdAt` ascending and then `id` ascending while preserving tag order and all text. It serializes in memory and downloads a JSON Blob through a temporary object URL and anchor, then revokes the URL. The UTC filename is `ai-support-workspace-backup-YYYY-MM-DDTHH-mm-ssZ.json`; no downloads or filesystem permission is needed. Import rejects a `File.size` above 25 MiB before reading, and export rejects serialized UTF-8 output above the same `26,214,400`-byte limit. There are no additional record-count, per-store, or field-length limits.

Every import is untrusted and must pass, without repair, a file read, JSON parse, exact identifier/version/envelope check, strict full-domain validation, dangerous-key rejection, and duplicate-ID rejection before persistence. Missing or unexpected keys, invalid types or nullability, noncanonical UUIDs, invalid timestamps, invalid Settings, or any invalid record reject the whole file. The parser performs no persistence and uses no evaluation, executable HTML, external-resource loading, prototype-based merge, path, URL fetch, or script interpretation. Unknown versions use the unsupported-version result; future format migration belongs at the import boundary and never redefines version 1.

Restore has one mode: replace all Knowledge, Snippets, and Settings. A focused application restore service preserves every imported ID, timestamp, logical field, tag order, and metadata and does not call ordinary create/update operations. Its infrastructure port clears and writes all three stores in one Dexie read/write transaction, maps Settings back to physical ID `global`, and rolls back completely on failure. `defaultModel: null` clears the saved default. A valid empty backup clears both Libraries and restores Settings. Export followed by controlled restore must yield equivalent persisted logical data.

Import / Export is the fourth section in the existing options-page shell. Export shows a short explanation, the privacy warning `Backup files may contain merchant knowledge, internal notes, and reusable support replies. Store them securely.`, `Export backup`, busy state, and status. Import uses one labelled `.json,application/json` file input and no drag-and-drop or paste. A valid preview shows filename, export timestamp, Knowledge and Snippet counts, and the saved model or `No saved default model`; it never shows record bodies, content, or a diff.

Before restore, the UI shows `Restoring this backup will replace your current Knowledge, Snippets, and saved Settings.` and an unchecked checkbox labelled `I understand that my current local data will be replaced.` Restore is natively disabled until acknowledgement. Selecting another file, validation failure, successful restore, or cancelling resets the applicable selection, preview, confirmation, and status state. The exact outcome messages are `Backup exported.`, `Couldn't export your data. Try again.`, `This backup file is too large. Choose a file smaller than 25 MB.`, `Couldn't read this backup file. Choose another file.`, `This isn't a valid AI Support Workspace backup file.`, `This backup version isn't supported by this version of AI Support Workspace.`, `Couldn't restore the backup. Your existing data was not changed.`, and `Backup restored.` The restore-success summary includes Knowledge count, Snippet count, and that Settings was restored.

After restore, options-page-local navigation refreshes Knowledge, Snippets, and Settings without a browser restart by the smallest local refresh or remount mechanism. No event bus, runtime broadcast, or subscription framework is added. An already-mounted Side Panel does not live-sync restored Settings or transient Workspace state; a recreated panel loads the restored default under M11. Controls remain labelled, keyboard operable, narrow-width safe, and accessible through native disabled semantics, focus placement, busy states, and live status announcements.

M12 added no popup action, Side Panel UI, router, new extension page, generic data-management framework, per-Library import, merge, JSON editor, history, scheduler, encryption, password protection, compression, ZIP, signing, dependency, configuration, manifest permission, host permission, or database migration. Database schema remained version 2. M13 Decision 34 separately approves schema version 3 and Backup Format v2 without redefining the completed M12 contract.

## Decision 34: M13 Snippet Trigger Expansion v1 and Backup Format v2

The product-priority order is now M13 Snippet Trigger Expansion v1, M14 Rich Snippet Templates, M15 Multimodal Screenshot Context, and M16 OpenAI Provider Expansion, followed by separately approved workflow polish and integrations. This decision supersedes Decision 32 only for those roadmap assignments. The previously documented M13-A OpenAI readiness review did not start and is superseded by M13-A.1. M13-A.1 is complete and Principal Engineer approved; M13-B — Snippet Trigger Expansion Implementation is active but has not started, and no M13 source implementation exists yet.

### Trigger Domain and Persistence

Every current plain-text `SnippetEntry` has `trigger: string | null`. A blank Trigger field maps to `null`. A non-null trigger includes its semicolon, contains 2–32 ASCII characters total, is canonicalized with locale-independent lowercase conversion, and must match `^;[a-z0-9]+(?:-[a-z0-9]+)*$`. Uppercase input is accepted and stored lowercase. Non-empty input is not trimmed; whitespace, unsupported punctuation, non-ASCII characters, consecutive hyphens, and trailing hyphens are invalid. Canonical triggers are unique.

The application layer owns normalization, validation, duplicate feedback, and focused errors. The Snippet repository adds trigger to create/update input and one exact canonical `findByTrigger` lookup. Dexie remains authoritative for uniqueness through database version 3 declaration `snippetEntries: 'id, createdAt, &trigger'`. A triggerless physical record omits the indexed property and maps to domain `null`, avoiding a shared indexed null. The version 2-to-3 migration changes no other store or index, preserves all records, generates no trigger, and is forward-only.

### Expansion and Editor Boundary

Expansion observes only trusted, cancelable Space `beforeinput` events in an actively focused supported editor when selection is collapsed and composition is inactive. The complete trigger-shaped candidate must end at the caret and begin at editor start or after Unicode whitespace. It is lowercased for case-insensitive exact catalog lookup while its original range remains the replacement range. No partial, fuzzy, remote, selected-text, paste, programmatic, or away-from-caret expansion exists.

On a cache hit, the adapter prevents the pending Space and replaces exactly the trigger range with the saved plain-text Snippet content plus one U+0020 space. It preserves surrounding content and line breaks, collapses the caret after the inserted space, and emits the normal bubbling composed input notification without synthesizing `change`; the host retains its normal commit/blur lifecycle. Inserted content is guarded from recursive expansion. A miss, unsafe range, unsupported editor, unavailable cache, noncancelable event, or runtime failure leaves normal Space behavior untouched.

V1 adapters support native `textarea`; free-form input type absent, `text`, or `search`; and generic `contenteditable`. Textarea supports single-line and multiline Snippet content through selection ranges and native value replacement. A supported single-line input may expand only content containing no carriage-return or line-feed characters; when a matched Snippet contains `\r` or `\n`, its adapter declines before preventing Space, does not mutate the host value, and lets normal Space behavior continue unchanged. It never flattens, truncates, normalizes, or partially inserts Snippet content to fit an input. Contenteditable supports single-line and multiline content through a bounded backward walk and DOM Range within the active editing root, stops at block, `<br>`, embedded-element, or root boundaries, and inserts only safe text nodes plus extension-created `<br>` boundaries for plain-text line breaks without parsing content as HTML. Password and specialized inputs are unsupported. Destination-specific handling is allowed only behind the same adapter contract after observed incompatibility.

The generic M13 content script uses exactly `matches: ['https://example.com/*', 'https://app.intercom.com/*']` and `allFrames: true`, with frame-local behavior only where that frame URL matches. Intercom is a required validation target, not a domain dependency. There is no `match_about_blank`, fallback-origin injection, `<all_urls>`, cross-frame traversal, arbitrary-site injection, clipboard permission, storage permission, provider host expansion, or generalized automation framework.

### Transient Trigger Catalog and Failure Safety

Content scripts never access Dexie. The service worker coordinates a derived in-memory catalog from canonical trigger to Snippet ID and plain-text content. Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port` connection and may enable its cache only while that port is connected and it holds one completely validated atomic snapshot. Ordered port messages carry a worker-session epoch, monotonic revision, invalidation, and complete snapshot. No catalog is persisted in `chrome.storage`, `localStorage`, another IndexedDB database, or a durable queue.

Port disconnection immediately clears and disables the frame cache; a disconnected frame cannot expand from its former snapshot, and normal typing remains available. Reconnection requests a complete snapshot before expansion is re-enabled. Worker restart creates a new epoch, and older-epoch snapshots are rejected. Before Snippet create, edit, delete, import, or restore persistence, the coordinator sends invalidation through the ordered ports to every currently connected frame, which clears its cache immediately. Successful persistence rebuilds and publishes one complete snapshot; persistence failure republishes the unchanged snapshot. Publication failure leaves affected frames disabled until reconnect or successful refresh. No stale cache expansion, polling loop, or per-keystroke service-worker lookup is permitted.

### Backup Format v2

Backup Format v1 is frozen and remains importable. Its exact Snippet DTO has no trigger; valid v1 imports map every Snippet to current `trigger: null`. New exports after M13 use the same identifier with `formatVersion: 2`. V2 retains the v1 envelope, Knowledge and Settings DTOs, deterministic ordering, filename, 25 MiB limits, preview, acknowledgement, security checks, and explicit mappings. Its exact Snippet DTO adds required `trigger: string | null`.

V2 validation requires non-null triggers to be canonical, pattern- and length-valid, and unique across the complete file. It rejects missing or unexpected keys, invalid values, duplicate triggers, and unsupported future versions without normalization or repair. Both v1 and v2 import paths create trusted current models only after full validation and restore through one atomic Dexie transaction across Knowledge, Snippets, and Settings. V1 restores null triggers and its preview states `This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.` V2 preserves triggers. Existing M12 rollback, identity, timestamp, tag-order, source, Settings, and failed-validation preservation guarantees remain unchanged.

### UI, Security, Scope, and Validation

The Snippet form adds one optional Trigger input. Exact guidance is `Optional. Use 2–32 characters starting with ;. Letters, numbers, and single hyphens only.` Invalid input shows `Use 2–32 characters starting with ;. Use only letters, numbers, and single hyphens.` Duplicate input shows `That trigger is already used by another Snippet.` Configured canonical triggers appear in the Snippet list; triggerless Snippets remain editable. No rich-text editor is added.

Insertion is plain text only and uses no `innerHTML`, executable markup, external resources, clipboard, password fields, secret capture, editor-content logging, telemetry, analytics, AI provider, or network transmission. M13 does not change Ollama, `GenerationProvider`, `OutputWorkflow`, Retrieval Engine, Prompt Builder, Side Panel generation, M10 capture, or Settings.

Automated validation must cover normalization, format and length rejection, uniqueness and race mapping, version 2-to-3 migration, legacy Snippets, port connection and initial snapshot, ordered invalidation and refresh, disconnect cache clearing, worker-restart epoch replacement, stale-snapshot rejection, normal typing while disconnected, and no expansion from a pre-mutation snapshot after disconnect or invalidation. It must also cover single-line Snippet expansion in supported inputs; multiline safe fallback with no host-value mutation; complete multiline preservation in textarea and contenteditable; exact caret and host-input behavior; CRUD and restore catalog coordination; v1 import; v2 export/import; strict validation; atomic rollback; and AI/provider regressions. Risk-based real Chrome validation must cover the single-line input limitation, textarea, contenteditable, Intercom or the current primary support editor, live CRUD refresh, v2 backup round trip, v1 compatibility, and existing core extension workflows.

## Decision 35: M13-B.2 All-Sites and Isolated-World Correction

The product owner requires Snippet expansion on all normal HTTP and HTTPS websites. The M13 content script therefore uses exactly `matches: ['http://*/*', 'https://*/*']` with `allFrames: true`. This decision supersedes Decision 34 only for its restricted `example.com` and Intercom origin set. It does not introduce `<all_urls>`, `file://`, `match_about_blank`, fallback-origin injection, cross-frame DOM traversal, `tabs`, clipboard or storage permission, provider-host changes, or support for Chrome-protected, extension, browser-internal, or other non-HTTP(S) pages.

Broad website access does not broaden the editor or data boundary. Expansion still reads only the bounded candidate of at most 32 trigger characters plus its left boundary immediately before the active collapsed caret. It supports only textarea, absent/text/search input, and generic contenteditable; password and specialized inputs remain prohibited. Full-editor scanning, editor or candidate logging, telemetry, analytics, persistent catalogs, clipboard access, network or provider transmission, executable HTML, and visible page UI remain prohibited. Unsupported, unsafe, disconnected, invalidated, or unavailable states preserve normal typing.

Chrome content scripts execute in an isolated JavaScript world, so supported browser events and DOM nodes must not depend on current-global or page-world constructor identity. The content-script listener structurally validates the project-owned `beforeinput` event-like boundary and leaves the controller responsible for trusted, cancelable, Space, composition, and catalog checks. Generic editor detection and replacement use realm-safe node type, local name, owner document, capabilities, and internally branded candidate state rather than `instanceof InputEvent`, `Element`, `HTMLTextAreaElement`, `HTMLInputElement`, `Text`, or `Range` requirements.

M13-B.2 is a corrective continuation of the existing uncommitted M13-B implementation and M13-B.1 mutation barrier. Intercom evidence confirmed the approved trusted, cancelable Space `beforeinput` event, so Space activation and the generic adapter remain authoritative; no `keydown` or destination-specific adapter is approved. M13 remains incomplete, and real Chrome validation must follow Principal Engineer source review and a rebuilt/reloaded extension.

## Decision 36: Rich Snippet Template Architecture

M14 extends the existing M13 `SnippetEntry` aggregate and trigger/editor system. A Rich Snippet retains its existing ID, title, tags, optional trigger, timestamps, repository identity, CRUD behavior, and unique-trigger semantics. The product keeps one Snippet Library, one repository concept, and one trigger system; it does not introduce `TemplateEntry`, duplicate plain/template records, or a parallel Template Library.

The canonical content field becomes one discriminated `SnippetContent` union: plain content has `kind: 'plain'` and exact `text`; rich content has `kind: 'rich'` and ordered `blocks`. Rich blocks are limited to paragraphs with ordered text or link inline nodes and image-reference blocks with `referenceType: 'image'`, a readable label, and URL. Text and link inline nodes carry explicit bold and italic booleans. The structure is project-owned, non-recursive data. Persisted HTML, arbitrary DOM, CSS, tables, scripts, event handlers, iframes, video, and embeds are prohibited.

M14 v1 image ownership is URL-reference-only. Ordinary links allow `https:`, `http:`, and `mailto:`; image references allow only `https:` and `http:`. Persistence and untrusted Backup v3 import validate those protocols. Executable or unapproved schemes are rejected. No Blob, base64 data, local-file ownership, `snippetAssets` table, clipboard ingestion, automatic fetch, file upload, cloud host, or image provider is introduced. M15 screenshot Context remains a separate transient input-to-generation domain and is not reusable Snippet asset storage.

One deterministic project-owned plain projection is authoritative outside rich rendering. Plain content returns its text exactly. Rich blocks preserve order and are separated by exactly `\n\n`; paragraph inline text remains readable without emphasis markers; a link renders `label (url)` unless label equals URL, in which case it renders the URL; an image reference renders `[Image: label] url`. No block may disappear. Retrieval Engine scoring and Prompt Builder provider-facing Snippet content consume only this projection, never rich markup or DOM.

Destination-aware rendering extends the M13 editor-adapter boundary. The catalog expansion payload may evolve to include canonical trigger, Snippet ID, plain projection, and optional validated rich data. A target adapter chooses safe rich insertion or plain fallback; destination names do not enter the domain. Textareas always use plain projection. Supported single-line inputs decline a multiline projection before Space prevention and never truncate or flatten it. A generic supported contenteditable may create only text, paragraph separation, `strong`, `em`, and validated anchor nodes through its own `ownerDocument`; it uses no `innerHTML`, `insertAdjacentHTML`, `DOMParser`, or `document.write`, and it does not create or fetch images. Image references retain their position through plain representation unless a separately approved destination capability exists.

M13 trigger behavior remains unchanged: semicolon syntax and validation, canonical exact lookup, trusted cancelable Space `beforeinput`, collapsed caret, immediate-before-caret and left-boundary rules, exact trigger-range replacement, one trailing U+0020 space, bubbling composed `input`, no synthetic `change`, predictable caret, recursion prevention, and fail-safe normal typing. Colon activation and alternate syntax are excluded.

The runtime catalog remains transient and service-worker-derived from Dexie. Content scripts never access Dexie or persist a catalog. M13-B.1's long-lived typed frame ports, complete snapshots, worker epochs, monotonic revisions, invalidation-before-mutation, global publication barrier, and fail-closed stale/disconnected/invalid behavior remain authoritative. No durable queue, browser-storage catalog, polling, or per-keystroke service-worker lookup is approved.

M14 implementation will add forward-only Dexie version 4 without changing historical v1-v3 declarations. It retains `snippetEntries: 'id, createdAt, &trigger'`, adds no table or index, and maps every v3 `content: string` exactly to `{ kind: 'plain', text: formerContent }`. ID, title, tags and order, trigger, `createdAt`, and `updatedAt` are preserved without timestamp rewrites; a null trigger remains physically omitted. Repository contracts expose `SnippetContent`, while physical record types and explicit mapping stay infrastructure-owned. Version 4 is approved but not implemented by M14-A.

Backup Formats v1 and v2 remain permanently frozen and importable. M14 implementation will create Backup Format v3 with dedicated exact DTOs and explicit field mapping independent of live domain and Dexie types. V1 content maps to plain content with null trigger; v2 content maps to plain content with its trigger preserved. V3 carries the existing Knowledge and Settings data plus exact Snippet metadata, trigger, and discriminated content. Strict validation rejects the whole backup for unknown or malformed blocks, inlines, marks, references, URL schemes, keys, identity, timestamps, IDs, or triggers and performs no repair or HTML interpretation. Existing 25 MiB, deterministic ordering, replace-only acknowledgement, one-transaction atomicity, rollback, and preview guarantees remain.

The existing Snippet Library remains the only product surface. New Snippets default to plain content. Plain-to-rich conversion is explicit and preserves readable content; rich-to-plain conversion is deferred as a potentially destructive workflow. Rich editing owns structured state rather than HTML and initially supports paragraphs, bold, italic, links, image references, and keyboard-accessible block ordering without requiring drag-and-drop. No third-party rich-text editor dependency is approved without a separate dependency/architecture review.

M14 preserves local-first ownership and introduces no variables, placeholders, merge fields, customer-field interpolation, conditions, loops, scripting, AI-generated fields, provider changes, OpenAI, screenshot Context, page scraping, surrounding-editor capture, editor or trigger-usage logging, telemetry, analytics, clipboard access, collaboration, sync, automatic external image loading, or new Chrome permissions. Rich Snippet payloads are extension-owned user data and are not sent to an AI provider. Content-script scope remains exactly normal `http://*/*` and `https://*/*`; protected browser pages and other schemes remain unsupported. No `<all_urls>`, `file://`, `tabs`, clipboard, downloads, `webRequest`, cookies, identity, or new host permission is approved. M14-A is documentation-only; M14 implementation has not started.

## Decision 37: Rich Snippet Delivery, Local Assets, and Clipboard-Assisted Fallback

M14-C product testing changes three parts of Decision 36. This decision supersedes Decision 36 only where it made URL-only image references the final reusable-image boundary, prohibited locally owned binary Snippet assets throughout M14, and treated direct editor rendering as the primary Rich delivery path without a peer clipboard-assisted strategy. Decision 36 remains authoritative for one `SnippetEntry` aggregate and Library, project-owned structured content rather than persisted HTML, deterministic plain projection, Retrieval and Prompt Builder text compatibility, the M13 trigger/catalog architecture, local-first ownership, provider independence, safe URL validation for legacy references, and all unrelated non-goals.

The target Rich authoring experience is one continuous document surface containing paragraphs, text, bold, italic, links, and visually inline images. The M14-C Image Reference form is a transitional compatibility UI, not the final image workflow. New image authoring will use the normal user-initiated `paste` event inside the extension editor or a standard Insert Image file control; handling paste-event `clipboardData` does not require `clipboardRead`. Drag/drop is deferred. It will never require the user to host an image, enter a public URL, understand an asset ID, or provide a label merely to represent image content. No third-party editor dependency or persisted HTML is approved by this decision.

Locally owned images use a first-class Snippet asset boundary. A future local image block is project-owned structured data with `type: 'image'`, an `assetId`, and an `altText` string that may be empty and is not a URL or required technical label. The block records document placement; a separate `SnippetAsset` owns the bytes. An asset has exactly `id`, `snippetId`, `mimeType`, `blob`, `byteSize`, `originalFilename: string | null`, and `createdAt`. Image bytes never live in paragraph text, inline nodes, base64 inside `SnippetContent`, or duplicated content structures. A local image projects deterministically to `[Image: alt text]` when non-empty alt text exists and `[Image]` otherwise; an external delivery planner must classify use of that text as intentional degradation rather than silently claiming image delivery.

Existing `{ type: 'reference', referenceType: 'image', label, url }` blocks remain valid, readable, editable, importable through Backup v3, and rendered by their existing deterministic projection. They are legacy/reference images, distinct from local image blocks. The future unified editor displays them as legacy URL references and allows removal or explicit replacement, but does not present them as the primary Add Image flow. The application never fetches, previews, downloads, or converts their remote URLs automatically.

Each local asset belongs to exactly one Snippet. Shared/global assets, cross-Snippet references, deduplication, and reference counting are excluded. Each local image block references one asset owned by the same Snippet, and each stored asset must be referenced by at least one block in its owner; initial implementation should create a separate asset when the same bytes are inserted twice. Deleting a Snippet deletes all owned assets in the same transaction. Repository/application operations reject missing, foreign-owned, and orphan assets.

Newly pasted or selected images remain draft assets in application/editor memory, receive local validation and an object-URL preview, and are persisted only in the successful Snippet Save transaction. Cancel, replacement, removal, and editor unmount revoke temporary object URLs and discard unsaved bytes. Removing an already-persisted image changes only the draft until Save; Cancel preserves the stored asset. Save creates the Snippet/content and new assets, applies content changes, and deletes removed assets atomically. Failed validation or transactions leave the prior Snippet and assets unchanged and create no orphan. Persisted preview object URLs are runtime-only, recreated from stored Blob data, never used as identity, and explicitly revoked.

Initial local image ingestion accepts only `image/png`, `image/jpeg`, and `image/webp`; validates MIME, file signature, integer byte length, and payload consistency; and treats bytes as opaque non-executable data. SVG, GIF, HTML, scripts, video, documents, unknown MIME types, and malformed files are rejected. Implementation constants are: 5 MiB (`5,242,880` bytes) per asset, 20 MiB (`20,971,520` bytes) of assets per Snippet, and 40 MiB (`41,943,040` bytes) of assets for the local project/profile. These checks precede persistence and do not rely only on browser quota. M14-E may tighten, but not enlarge, a limit without a new architecture review supported by measured browser evidence.

Dexie version 5 adds `snippetAssets: 'id, snippetId, createdAt'` while preserving all historical v1-v4 declarations and the existing v4 tables and indexes unchanged. The physical asset record contains the exact asset fields above; `id` is the primary key and `snippetId` and `createdAt` are indexes. The v4-to-v5 migration adds the table without rewriting existing Knowledge, Settings, Plain Snippets, Rich Snippets, URL references, IDs, timestamps, triggers, or content. It performs no network access or legacy-reference conversion. IndexedDB has no foreign-key enforcement, so project-owned repositories and transactional application services enforce ownership and reference integrity. Snippet create/update/delete and asset mutations use one Dexie read-write transaction over `snippetEntries` and `snippetAssets`; backup restore includes every participating table and rolls back as one unit.

Backup Formats v1, v2, and v3 are frozen and remain importable. Locally owned assets require Backup Format v4; binary data is not added to v3. V4 retains the single-file JSON workflow and exact top-level envelope, and its `data` object contains exact `knowledge`, `snippets`, `snippetAssets`, and `settings` members. V4 Snippet DTOs support current plain/rich structures, legacy URL-reference blocks, and local image blocks. Each exact asset DTO contains `id`, `snippetId`, `mimeType`, `byteSize`, `originalFilename`, `createdAt`, `encoding: 'base64'`, and canonical RFC 4648 base64 `data`. Assets sort by `createdAt` ascending then `id` ascending, matching the existing deterministic record policy.

V4 import first applies a 96 MiB (`100,663,296` byte) serialized-file guard, then exact-key/version validation, canonical base64 validation, decoded size and aggregate limits, MIME/signature checks, identity/timestamp checks, and full Snippet/asset graph validation before persistence. It rejects duplicate IDs, missing or foreign assets, unreferenced assets, ownership mismatches, invalid local-image blocks, unsupported payloads, and any partial or future shape. V4 export uses the same serialized guard and one user-facing operation; restore uses the existing preview/acknowledgement flow and one atomic replacement transaction. Base64 increases binary size by about one third and JSON parsing temporarily duplicates data in memory; the 40 MiB stored-asset ceiling and 96 MiB v4 file guard make that trade-off explicit. A package/archive and compression are deferred because one strict provider-independent JSON file is the simplest continuation. No import performs remote fetching.

Delivery becomes an application-level planning boundary:

```text
SnippetContent + referenced local assets
→ Delivery Planner
→ target capabilities and user-enabled capabilities
→ direct plain | direct rich | clipboard-assisted | unsupported
→ completed-direct | prepared-for-native-paste | intentionally-degraded | unsupported-with-reason
```

The domain model contains no Crisp, Intercom, Zendesk, or other destination name. Destination evidence is resolved behind editor adapters/capability resolution. Capabilities are behavioral and initially cover direct plain text, direct rich text, hyperlinks, inline images, clipboard assistance, clipboard rich HTML, and clipboard images. Controllers consume a typed plan/outcome rather than giant destination conditionals. An image-containing delivery cannot be reported complete if the selected strategy cannot preserve the image; explicit user-approved plain degradation or an unsupported reason is required.

M13 direct insertion remains preferred where evidence shows it is reliable. Plain-capable targets receive deterministic plain projection; proven rich targets may later receive safe project-created rich DOM. All M13 semicolon, Space, exact replacement, surrounding-content, trailing U+0020, caret, input notification, bounded inspection, mutation barrier, epoch/revision, and fail-closed catalog guarantees remain. A failing destination does not by itself authorize a destination-specific adapter.

Clipboard assistance is real copy followed by a real user `Ctrl+V`, never synthetic paste. The extension prepares a clipboard payload, reports `Snippet copied — press Ctrl+V` only after the write succeeds, and lets the destination's native paste/upload pipeline consume it. Clipboard overwrite is a globally user-enabled capability, not mandatory behavior and not silently enabled per site. The Settings/options surface must explain the clipboard warning and request permission from an explicit user action; trigger handling must not request permission opportunistically. Denial or revocation leaves direct delivery available and returns a safe unavailable outcome.

The future manifest declares `clipboardWrite` and `offscreen` as optional permissions for this capability; M14-D adds neither. `clipboardRead` is prohibited. Chrome's [permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list) documents that `clipboardWrite` displays “Modify data you copy and paste”; the [Permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions) supports runtime grants for optional capabilities; and the [MV3 offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen) documents that service workers have no DOM/window and that an offscreen document with reason `CLIPBOARD` supplies the hidden document context. The service worker therefore coordinates one packaged offscreen document and runtime messages only after both optional permissions are granted; it creates the document only for a pending write and closes it after completion. Permission denial, document creation failure, service-worker restart, serialization failure, or clipboard write failure produces no trigger removal and no success claim. M14-G must verify WXT manifest generation, optional `offscreen` runtime granting, user-activation behavior, `ClipboardItem` support, and offscreen lifecycle in the minimum supported Chrome before implementation is accepted. If that proof invalidates optional `offscreen`, a focused architecture correction is required; `clipboardWrite` remains optional.

Clipboard payload generation is project-owned and separate from transport. `text/plain` always contains deterministic plain projection. `text/html` is generated only from validated structured paragraphs, text, `strong`, `em`, and validated anchors; it contains no stored HTML, arbitrary CSS, script, iframe, event handler, parser output, or untrusted markup. The serializer returns explicit representations and capability requirements to transport. Local image clipboard representations are excluded until Chrome/destination evidence proves a safe multi-part payload for ordered text, formatting, and multiple images. If a Snippet contains a local image and `clipboardImages` is unproven, the planner must return unsupported or an explicitly chosen degradation; it must not omit the image, expose `assetId`, or silently substitute projection text.

Clipboard trigger removal is compare-and-swap safe. The controller does not remove the trigger merely because a clipboard path was planned or requested. Normal Space behavior is preserved while an asynchronous write is pending. After a confirmed write, the adapter may remove only the still-unchanged exact trigger plus its activation space and place the caret predictably; if the host content, selection, editor root, catalog epoch/revision, or request identity changed, it leaves user input untouched and reports copied-without-cleanup. This asynchronous interaction and the offscreen clipboard path require real-Chrome proof; an explicit extension UI copy action is the safe fallback if browser user-activation constraints prevent trigger-initiated writing.

Current evidence is recorded without overclaiming: direct DOM insertion of an ordinary Plain Snippet fails in the tested Crisp editor and leaves apparently blank content, while the same persisted Snippet, projection, catalog, frame delivery, and trigger work in another rich editor. A speculative generic controlled-contenteditable patch did not fix Crisp and was removed. Manual native paste into Crisp works. Crisp direct insertion remains unresolved; this supports capability-based clipboard investigation but does not approve a Crisp-specific implementation.

Local image bytes remain local unless the user initiates delivery, are not uploaded by AI Support Workspace, are not sent to Ollama, OpenAI, another provider, analytics, telemetry, or logs, and are not page-scraped. Durable Rich Snippet assets remain separate from M15 transient screenshot Context even if later low-level byte validation utilities are shared. No cloud sync, collaboration, proprietary hosting, provider request, or new host permission is introduced.

The revised sequence is M14-D architecture/documentation; M14-E Local Image Asset Foundation and Backup v4; M14-F Unified Rich Editor Inline Image Authoring; M14-G Delivery Planner and Clipboard-Assisted Fallback; and M14-H Rich Browser Rendering and Image Delivery Capability Validation. M14-D implements none of those runtime capabilities. M14-C remains the last completed implementation task.

## Decision 38: Pre-Delivery Local Image Trigger Fail-Closed Behavior

Decision 37 defines deterministic plain projection for local-image blocks but requires external use of that projection to be an explicit delivery outcome. M14-E introduces persisted local-image Snippets before M14-G introduces the Delivery Planner. Until M14-G is implemented, a Snippet containing one or more `{ type: 'image', assetId, altText }` blocks must not be published into the transient trigger catalog.

This is deliberately fail-closed. An omitted catalog entry makes its typed trigger behave exactly like an unknown trigger, so existing M13 behavior preserves normal typing and performs no replacement. The current expansion path must not insert `[Image]` or `[Image: alt text]` as though image delivery succeeded, partially insert other blocks, leak an asset ID, publish Blob/base64 data, or report a plain degradation as complete delivery.

The temporary exclusion applies only to Snippets containing a Decision 37 local-image block. Plain Snippets, Rich Snippets containing paragraphs/text/marks/links only, and Rich Snippets containing legacy URL Image References retain their current deterministic catalog projection and M13/M14 behavior. Local-image Snippets remain valid Library and persistence data, remain exportable/restorable through Backup v4, and remain available to Retrieval Engine and Prompt Builder through `renderSnippetPlainText()`. Plain projection is a text-consumer boundary, not proof of external image delivery.

M14-E must implement this catalog filter without changing M13-B.1 port, epoch/revision, invalidation, publication-barrier, or unknown-trigger guarantees. M14-G will supersede the temporary exclusion with typed direct, clipboard-assisted, intentionally degraded, and unsupported delivery planning. Decision 38 adds no planner, clipboard transport, permission, destination adapter, or host renderer.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
