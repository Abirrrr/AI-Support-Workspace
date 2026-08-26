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

The future manifest declares `clipboardWrite` and `offscreen` as optional permissions for this capability; M14-D adds neither. `clipboardRead` is prohibited. Chrome's [permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list) documents that `clipboardWrite` displays “Modify data you copy and paste”; the [Permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions) supports runtime grants for optional capabilities; and the [MV3 offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen) documents that service workers have no DOM/window and that an offscreen document with reason `CLIPBOARD` supplies the hidden document context. The service worker therefore coordinates one packaged offscreen document and runtime messages only after both optional permissions are granted; it creates the document only for a pending write and closes it after completion. Permission denial, document creation failure, service-worker restart, serialization failure, or clipboard write failure produces no trigger removal and no success claim. Decision 37 assigned WXT manifest generation, optional `offscreen` runtime granting, user-activation behavior, `ClipboardItem` support, and offscreen lifecycle proof to the then-planned M14-G. Decision 39 supersedes that milestone ownership: current implementation acceptance requires M14-I to verify the proof in the minimum supported Chrome. If that proof invalidates optional `offscreen`, a focused architecture correction is required; `clipboardWrite` remains optional.

Clipboard payload generation is project-owned and separate from transport. `text/plain` always contains deterministic plain projection. `text/html` is generated only from validated structured paragraphs, text, `strong`, `em`, and validated anchors; it contains no stored HTML, arbitrary CSS, script, iframe, event handler, parser output, or untrusted markup. The serializer returns explicit representations and capability requirements to transport. Local image clipboard representations are excluded until Chrome/destination evidence proves a safe multi-part payload for ordered text, formatting, and multiple images. If a Snippet contains a local image and `clipboardImages` is unproven, the planner must return unsupported or an explicitly chosen degradation; it must not omit the image, expose `assetId`, or silently substitute projection text.

Clipboard trigger removal is compare-and-swap safe. The controller does not remove the trigger merely because a clipboard path was planned or requested. Normal Space behavior is preserved while an asynchronous write is pending. After a confirmed write, the adapter may remove only the still-unchanged exact trigger plus its activation space and place the caret predictably; if the host content, selection, editor root, catalog epoch/revision, or request identity changed, it leaves user input untouched and reports copied-without-cleanup. This asynchronous interaction and the offscreen clipboard path require real-Chrome proof; an explicit extension UI copy action is the safe fallback if browser user-activation constraints prevent trigger-initiated writing.

Current evidence is recorded without overclaiming: direct DOM insertion of an ordinary Plain Snippet fails in the tested Crisp editor and leaves apparently blank content, while the same persisted Snippet, projection, catalog, frame delivery, and trigger work in another rich editor. A speculative generic controlled-contenteditable patch did not fix Crisp and was removed. Manual native paste into Crisp works. Crisp direct insertion remains unresolved; this supports capability-based clipboard investigation but does not approve a Crisp-specific implementation.

Local image bytes remain local unless the user initiates delivery, are not uploaded by AI Support Workspace, are not sent to Ollama, OpenAI, another provider, analytics, telemetry, or logs, and are not page-scraped. Durable Rich Snippet assets remain separate from M15 transient screenshot Context even if later low-level byte validation utilities are shared. No cloud sync, collaboration, proprietary hosting, provider request, or new host permission is introduced.

At the time of Decision 37, the planned sequence was M14-D architecture/documentation, M14-E asset foundation, M14-F unified inline-image authoring, M14-G clipboard fallback, and M14-H destination rendering. M14-E was later implemented at `1828f09`; Decision 39 cancels M14-F and supersedes the remaining sequence.

## Decision 38: Pre-Delivery Local Image Trigger Fail-Closed Behavior

Decision 37 defines deterministic plain projection for local-image blocks but requires external use of that projection to be an explicit delivery outcome. M14-E introduces persisted local-image Rich records without a safe delivery path. A Snippet containing one or more `{ type: 'image', assetId, altText }` blocks must not be published into the transient trigger catalog while that legacy content shape remains supported without an explicitly approved migration or delivery strategy.

This is deliberately fail-closed. An omitted catalog entry makes its typed trigger behave exactly like an unknown trigger, so existing M13 behavior preserves normal typing and performs no replacement. The current expansion path must not insert `[Image]` or `[Image: alt text]` as though image delivery succeeded, partially insert other blocks, leak an asset ID, publish Blob/base64 data, or report a plain degradation as complete delivery.

The temporary exclusion applies only to Snippets containing a Decision 37 local-image block. Plain Snippets, Rich Snippets containing paragraphs/text/marks/links only, and Rich Snippets containing legacy URL Image References retain their current deterministic catalog projection and M13/M14 behavior. Local-image Snippets remain valid Library and persistence data, remain exportable/restorable through Backup v4, and remain available to Retrieval Engine and Prompt Builder through `renderSnippetPlainText()`. Plain projection is a text-consumer boundary, not proof of external image delivery.

M14-E implements this catalog filter without changing M13-B.1 port, epoch/revision, invalidation, publication-barrier, or unknown-trigger guarantees. Decision 39 preserves it as a compatibility safety rule for legacy Rich local-image records; typed Image Snippet delivery does not supersede or reinterpret it. Retirement requires an explicitly approved lossless migration or legacy delivery decision. Decision 38 adds no planner, clipboard transport, permission, destination adapter, or host renderer.

## Decision 39: Text/Rich Snippet and Image Snippet Product Boundary

Product evidence after M14-E establishes that images embedded among reusable Rich text are not valuable enough to justify destination-dependent placement semantics. Some destination editors paste an image inline while others turn it into an attachment or separate message. M14-F Unified Rich Editor Inline Image Authoring is therefore cancelled before implementation. This decision supersedes Decision 37 only where Decision 37 made locally owned images a normal future Rich-authoring block, promised inline image placement among Rich blocks, or made Rich image rendering/delivery a normal M14 target.

Decision 37 remains authoritative history for the implemented local-first `SnippetAsset` foundation, PNG/JPEG/WebP validation, one-Snippet ownership, atomic Snippet/asset persistence, Dexie v5, Backup v4, no synthetic paste, no cloud hosting, and separation from M15 Context images. Decision 38 remains authoritative for legacy Rich records containing local-image blocks. Decision 39 does not revert M14-E.

### Product and Content Boundary

The product has three distinct concepts:

- A Plain Snippet stores exact reusable plain text.
- A Rich Snippet stores reusable formatted text made only from paragraphs, bold, italic, validated links, unordered lists, and ordered lists. New Rich authoring cannot create, paste, preview, reorder, replace, or remove locally owned image blocks as normal Rich content.
- An Image Snippet is an image-only reusable shortcut containing normal Snippet identity, metadata, trigger, and exactly one locally owned image. It is not a general Image Library, does not share assets, and has no "Use as Context" action.

Context images remain future M15 generation inputs with separate transient lifecycle, provider-capability, and privacy rules. They are not Image Snippets, cannot reuse Image Snippet ownership merely because both contain bytes, and are not implemented by M14.

`SnippetEntry` remains the only Snippet aggregate, Library record, repository identity, and trigger owner. The approved target union is:

```ts
type SnippetContent =
  | PlainSnippetContent
  | RichSnippetContent
  | ImageSnippetContent;

interface ImageSnippetContent {
  kind: 'image';
  assetId: string;
}
```

The exact implementation naming must follow existing conventions. The image Blob remains only in `SnippetAsset`; Blob, base64, filenames, and storage metadata never enter `SnippetContent`. No second top-level Image Snippet table, Library, repository, trigger parser, or keyboard command is approved.

Rich lists use the smallest non-recursive block:

```ts
interface RichSnippetList {
  type: 'list';
  listType: 'unordered' | 'ordered';
  items: readonly RichSnippetListItem[];
}

interface RichSnippetListItem {
  children: readonly RichSnippetInline[];
}
```

List items reuse the existing ordered text/link inline nodes and their explicit bold/italic marks. Nested lists, tables, task lists, arbitrary HTML, custom CSS, and embeds are prohibited. Plain projection preserves item and inline order. Unordered items use `- `; ordered items use one-based `${index}. `; items are joined by `\n`; and the list remains one Rich block separated from adjacent blocks by the existing exact `\n\n` boundary.

An Image Snippet has no truthful text payload. Its deterministic text projection is the empty string, and text-only Retrieval and Prompt Builder consumers exclude Image Snippets rather than inserting `[Image]`, an asset ID, or a filename. This empty compatibility projection is never a delivery representation.

### Image Ownership and Authoring

One Image Snippet owns and references exactly one `SnippetAsset`; that asset belongs to the same Snippet and no additional owned asset may exist. Existing 5 MiB per-asset and 20 MiB per-Snippet and 40 MiB project/profile limits remain. PNG, JPEG, and WebP validation, opaque Blob storage, ownership checks, orphan rejection, atomic Save/update/delete, and rollback reuse M14-E unchanged.

The Image Snippet editor is separate from the Rich editor. New Snippet creation exposes Plain Snippet, Rich Snippet, and Image Snippet choices while retaining Plain as the default. Image authoring provides Title, Trigger, existing tags/metadata, one labelled paste/select target, local preview, replace, remove-before-Save, Save, Cancel, reopen, and the existing Delete Snippet workflow. Save is disabled while an Image Snippet draft has no image; a saved Image Snippet cannot persist with zero or multiple assets. Asset ID, Blob, base64, and storage implementation are never user-facing.

Pasting into the extension-owned Image Snippet authoring surface uses the user-initiated paste event's `clipboardData`; it does not require clipboard read permission. Selecting from disk uses a labelled file input. Both paths validate before persistence and persist only through the existing atomic aggregate transaction.

### Legacy Rich Local-Image Compatibility

M14-E Rich local-image blocks remain a frozen legacy-compatible content shape. They remain parseable, preservable, importable through Backup v4, reopenable without destructive mutation, and fail-closed under Decision 38. No new Rich local-image block can be authored. The compatibility UI may identify that legacy image content is preserved, but it must not expose normal Rich image manipulation or imply current delivery.

There is no automatic migration. A later M14-H implementation may offer an explicit, user-confirmed conversion only when a legacy Rich record has exactly one block, that block is one local-image block, the referenced asset is valid and owned by the same Snippet, and the Snippet owns no other asset. Empty paragraphs, references, text, lists, additional image blocks, missing/foreign assets, or any mixed content make conversion ineligible. Eligible conversion preserves Snippet identity, metadata, trigger, timestamps according to normal update semantics, and the same owned asset. Mixed Rich text/image records remain legacy Rich data indefinitely unless a separately approved migration preserves their complete semantics.

### Persistence and Backup Evolution

Dexie v5 remains the physical schema. `snippetEntries.content` is stored as project-owned structured JSON and is not indexed by discriminant or block shape, so adding list blocks and `ImageSnippetContent` requires no store or index change and does not justify Dexie v6. Historical v1-v5 declarations remain unchanged. A future physical index/store requirement must receive its own architecture review.

Backup v4 is frozen and remains importable exactly as implemented. It cannot faithfully represent list blocks or the new top-level image discriminant, so Backup Format v5 is required. V5 remains one strict application-owned JSON envelope, owns dedicated exact v5 asset DTOs with the same byte/metadata semantics as v4, and retains the 96 MiB guard unless implementation evidence requires a separately approved tightening. Its exact version-owned content DTOs add lists and `ImageSnippetContent`, and restore Knowledge, Snippets, Settings, and assets atomically. V1 and v2 map strings to Plain content; v3 maps its exact Plain/Rich shapes; v4 maps its exact Plain/Rich and legacy local-image shapes without conversion; v5 round-trips Plain, text-only Rich with lists, legacy Rich local-image compatibility data, Image Snippets, and assets.

M14-G introduces the list model, the minimal `ImageSnippetContent` public/domain discriminant needed to freeze one complete v5 contract, and Backup v5 together. It does not add Image Snippet authoring or delivery. This deliberate contract-only sequencing prevents a list-only Backup v5 immediately followed by an image-only Backup v6. Until M14-H creates Image Snippets through normal UI, the new discriminant remains protected by domain, backup, graph, and catalog validation.

### Typed Trigger and Image Delivery Boundary

Image Snippets reuse M13 trigger syntax, uniqueness, catalog publication barriers, frame ports, epochs/revisions, and bounded activation. The future catalog becomes a discriminated descriptor boundary:

```ts
type TriggerCatalogEntry =
  | {
      kind: 'text';
      trigger: string;
      snippetId: string;
      plainText: string;
    }
  | {
      kind: 'image';
      trigger: string;
      snippetId: string;
    };
```

The exact field names remain an implementation detail. An image entry carries no Blob, base64, asset ID, filename, or continuously replicated binary. On activation, the content script sends the minimal Snippet/request identity to the service-worker delivery coordinator. The coordinator reloads the current Snippet and its one owned asset from Dexie on demand, revalidates catalog/request freshness and ownership, and sends only that requested Blob to the clipboard transport. M13-B.1 invalidation and publication guarantees remain mandatory.

Before M14-I implements typed delivery, Image Snippets are omitted from the current plain catalog by a Decision 39 transitional guard. This is separate from Decision 38, which continues to govern legacy Rich local-image records. Unknown-trigger behavior preserves normal typing in both cases.

Image delivery v1 is clipboard preparation followed by trusted user paste:

```text
activate Image Snippet trigger
-> request and validate the owned image on demand
-> prepare and successfully write an image to the system clipboard
-> revalidate and remove only the unchanged trigger activation range
-> show "Image copied — press Ctrl+V"
-> user presses real Ctrl+V
-> destination chooses inline/attachment/message behavior
```

The extension does not synthesize paste, fake keyboard input, reverse-engineer upload controls, or promise that a destination inserts or sends the image. It reports copy success, not destination delivery.

Ordinary Space is allowed while the asynchronous copy is pending. After confirmed clipboard success, compare-and-swap cleanup may remove exactly the unchanged canonical trigger plus its activation U+0020 and collapse the caret at the start of the removed range. It leaves no trailing space or placeholder. If the editor root, exact text/range, selection, request identity, epoch, or revision changed, the image remains copied but user text is untouched and feedback reports that cleanup was skipped. Permission denial, asset/serialization/offscreen/write failure, or stale state leaves the trigger and surrounding editor content untouched and reports no successful delivery.

### Verified Clipboard Platform Boundary

The platform boundary was rechecked on 2026-08-09 against primary documentation:

- Chrome documents `clipboardWrite` as allowing copy/cut through the web Clipboard API and displaying the warning "Modify data you copy and paste." `clipboardRead` is not approved. See [Chrome extension permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list).
- Chrome documents runtime optional permission requests, recommends optional permissions for optional features, and lists the permissions that cannot be optional; `clipboardWrite` and `offscreen` are not in that exception list. Permission requests must originate from a user gesture. See [`chrome.permissions`](https://developer.chrome.com/docs/extensions/reference/api/permissions).
- MV3 service workers have no DOM. Chrome's Offscreen API is available in Chrome 109+, requires the `offscreen` manifest permission, uses one packaged static document, exposes only `chrome.runtime` from extension APIs, and explicitly provides the `CLIPBOARD` reason. See [`chrome.offscreen`](https://developer.chrome.com/docs/extensions/reference/api/offscreen).
- The web Clipboard API writes `ClipboardItem` values in a secure document context. PNG is the mandatory/common portable image representation; JPEG and WebP are not a baseline clipboard-write guarantee. See [Clipboard API](https://www.w3.org/TR/clipboard-apis/#mandatory-data-types) and [MDN `Clipboard.write()`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write).
- Chromium writing requires transient activation or granted clipboard-write capability; extension documentation states that the `clipboardWrite` extension permission removes the transient-activation requirement. See [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) and [MDN extension clipboard guidance](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard).

The approved implementation direction is an explicit Settings/options enable action that explains and requests optional `clipboardWrite` and `offscreen` from a user gesture. WXT should express these only as generated MV3 `optional_permissions`; M14-F.1 changes no manifest. M14-I must prove in the minimum supported Chrome that WXT preserves both optional declarations, runtime grant makes `chrome.offscreen` usable without extension reload, a service-worker request can create/message/close the single packaged offscreen document, and granted `clipboardWrite` permits the offscreen write. If optional `offscreen` fails that proof, implementation stops for a focused architecture correction; it must not silently promote clipboard access or add clipboard read.

The clipboard transport normalizes every stored PNG/JPEG/WebP asset to a validated `image/png` `ClipboardItem` in the offscreen document. Direct JPEG/WebP clipboard types are not assumed. M14-I must prove decoding, PNG conversion, transparency/orientation behavior, `ClipboardItem.supports('image/png')`, destination paste, memory bounds, and decoded-pixel safety in real Chrome. A decode/conversion or support failure preserves the trigger. The current 5 MiB encoded-byte limit is not by itself proof against excessive decoded dimensions, so M14-I must define and test a decoded-pixel guard before accepting transport.

### Revised Milestone Sequence and Security

- **M14-F.1 — Snippet Image Product Boundary Architecture Correction:** documentation only; cancels the former M14-F before implementation.
- **M14-G — Rich Snippet Structured Lists and Backup v5 Foundation:** adds unordered/ordered lists, the minimal Image Snippet content contract needed for one Backup v5 transition, deterministic projections, strict Backup v5, and compatibility coverage; no Image Snippet UI or delivery.
- **M14-H — Image Snippet Domain Completion and Authoring:** enforces exactly one asset, provides paste/select/preview/replace/remove-before-Save/reopen flows, supports explicit eligible legacy conversion, and keeps Image triggers excluded until M14-I.
- **M14-I — Typed Trigger Delivery Planner and Clipboard Image Delivery:** adds typed catalog descriptors, on-demand Blob retrieval, optional permission UX, offscreen PNG transport, compare-and-swap cleanup, truthful feedback, and native-paste validation.
- **M14-J — Rich Text Delivery and Destination Capability Validation:** delivers only paragraphs, marks, links, and lists through proven direct or clipboard-assisted text/HTML strategies and records Crisp/Intercom evidence. It has no normal Rich image delivery target.

### Architecture Debt Classification

#### Keep

`SnippetAsset`, Blob persistence, MIME/signature/size validation, Dexie `snippetAssets`, the asset repository, atomic Snippet/asset transactions, Backup v4 import, base64 utilities, and ownership validation remain current infrastructure.

#### Repurpose

Asset graph validation, draft image ingestion, local preview lifecycle, and atomic replacement support the exactly-one Image Snippet workflow instead of inline Rich-image authoring.

#### Legacy Compatibility Only

Rich local-image blocks, their Backup v4 DTO/parser path, preservation UI, and Decision 38 catalog exclusion remain only to protect historical/imported data. They receive no new normal authoring or Rich delivery capability.

#### Remove Later Only If Safe

Potentially unreachable Rich-image authoring/rendering helpers may be removed only in a future implementation task after reference analysis, backup/import review, and regression proof. No architecture-only deletion is approved, and any retained unreachable path must have an explicit cleanup backlog item rather than becoming hidden debt.

Image Snippet bytes remain local, are copied only after explicit trigger activation with the capability enabled, and are never uploaded, remotely fetched, sent to providers, included in telemetry/logs, page-scraped, or placed in every frame. No clipboard read, arbitrary HTML persistence, destination upload integration, shared asset library, cloud image hosting, or synthetic paste is approved.

## Decision 40: Future Toolbar Action Opens Global Workspace Side Panel

The current implementation remains unchanged: the generated action declares `default_popup: popup.html`; that popup's Open Workspace action opens the global Side Panel, and Open Libraries opens `options.html` in a normal browser tab. Decision 26 and the M9/M11 records remain authoritative history for that implemented flow.

The approved future target is different. Clicking the extension toolbar action must open or show the existing global AI Support Workspace Side Panel directly, without an intermediate popup, using Chrome's supported `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` behavior documented by the [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel). Decision 54 later locks the Side Panel navigation control as a compact Settings gear that opens the existing full Options / Libraries page. The full Knowledge compatibility, Snippets, Settings, Import / Export, and future management experience remains in the options page; this decision does not move full management into the panel or turn the panel into a second options shell.

The existing `sidePanel` permission is expected to be sufficient. This decision adds no permission, manifest change, source change, test change, configuration change, or popup removal now. When the requirement is implemented, the task must inspect WXT's generated manifest and action configuration, retire the default popup/`action.default_popup` cleanly so the toolbar has no competing behaviors, preserve `side_panel.default_path`, and verify normal options-page navigation. The `capture-selection-to-workspace` keyboard shortcut and its established open/activate behavior remain unchanged.

Acceptance requires real Chrome proof that a toolbar-action click opens or shows the global Workspace Side Panel directly with no intermediate popup; the compact Settings gear opens the existing Options / Libraries page; full management stays in Options; the keyboard shortcut remains unchanged; no broader permission appears; and the generated manifest/action wiring contains no competing default-popup behavior.

Decision 54 later supersedes only this decision's generic panel “Library action” wording and originally assigned the compact accessible Settings gear and shell/navigation implementation to M15. Decision 56 preserves that architecture and moves implementation ownership to M14-P.4. Decision 40 remains the historical source of the direct-toolbar Side Panel direction.

## Decision 41: Unified Snippet Authoring and Native-Paste Delivery Direction

The Snippet Library exposes exactly two authoring choices: **Text Snippet** and **Image Snippet**. Text Snippets use a conventional project-owned Tiptap v3 WYSIWYG surface for paragraphs, line breaks, bold, italic, validated HTTP/HTTPS/mailto links, bullet lists, and numbered lists. New Text Snippets persist as project-owned Rich `SnippetContent`; Plain/Rich is no longer a normal user-facing choice. Historical Plain records remain compatible, are presented as Text, and convert to equivalent Rich content only after a successful user Save. Untouched Plain records are never bulk migrated. Legacy Rich image/reference records that cannot round-trip through the supported editor remain preserved, read-only compatibility data.

Tiptap is UI infrastructure, not the business or backup model. A focused adapter maps between constrained Tiptap JSON and validated project-owned `SnippetContent`. Arbitrary HTML, ProseMirror objects, editor instances, and DOM state are never persisted. Unsupported StarterKit features and nested lists are excluded; new embedded-image authoring inside Text Snippets remains prohibited. This supersedes earlier user-facing targets that exposed explicit Plain/Rich conversion or block/segment forms, without invalidating the structured Rich domain, Decision 39, Backup v5, or Decision 40.

Image Snippet authoring is implemented as part of M14-G.2 and M14-H is absorbed rather than remaining active. The primary input is a user-initiated `paste` event containing a clipboard screenshot; secondary input is a PNG/JPEG/WebP file chooser. No `clipboardRead`, `clipboardWrite`, `offscreen`, or new permission is required for authoring. The image remains an in-memory validated draft with a local, revocation-safe Blob preview until Save. Create, replace, and delete reuse M14-E's exactly-one ownership and atomic Snippet/asset transaction boundary. Asset IDs, Blob bytes, and base64 remain hidden from the UI and trigger catalog.

The future delivery target is native paste fidelity. M14-I — Unified Snippet Clipboard Delivery and Trigger Planner will own both Text and Image delivery. Text delivery prepares safe project-owned `text/html` plus deterministic `text/plain`; Image delivery retrieves the owned local asset and prepares a portable image clipboard representation. Both use native destination paste and safe trigger-cleanup planning rather than brittle reconstruction of complex destination DOM. M14-G.2 implements no external clipboard delivery, permission transport, or final trigger planner. Until M14-I, Image Snippets remain excluded from the trigger catalog and Decision 38 continues to fail closed for legacy Rich local images. M14-J remains later destination validation for Crisp, Intercom, representative editors, native-paste fidelity, graceful fallback, and only evidence-backed direct-insertion optimizations.

Decision 40's future Workspace Shell and M15 Context Images remain separate, unimplemented scopes. Backup v5 and Dexie v5 remain current; Backup v1-v4 meanings and imports remain frozen.

Current implementation continuity: M14-I implements the typed metadata-only catalog, authoritative planner, optional clipboard/offscreen transport, freshness revalidation, and compare-and-swap cleanup described above. Real Chrome proved that the original offscreen Text `navigator.clipboard.write()` operation failed at the final write. M14-I.1.3 corrected only Text to one temporary `copy` event handler that supplies exact `text/plain` and safe `text/html`, calls `preventDefault()`, and invokes `document.execCommand('copy')`; safe HTML is never inserted into the offscreen DOM. Real Chrome now validates Text clipboard preparation, trigger cleanup, copied notice, bold, italic, links, bullets, and numbering through native paste.

The product owner accepts manual native `Ctrl+V` for the current version. Automatic paste is not a current M14-I requirement. Decision 43 later defines an optional Windows Native Messaging companion for clipboard preparation only; focus-safe OS-level paste remains a separate future investigation with no AutoHotkey or keyboard-injection approval. Manual `Ctrl+V` remains the fallback.

Real Chrome proved the Decision 42-gated offscreen `ClipboardItem` / `navigator.clipboard.write()` Image path fails at `stage=offscreen-write`, `code=clipboard-write-failed`, `kind=image`, `phase=clipboard-write`. M14-I.1.4 then replaced the normal final Image write with a temporary copy event that synchronously adds a genuine `image/png` File after all existing validation and conversion complete. Real Chrome reported command success but native paste produced `snippet.png`, not the intended image. That File-item path is therefore `REAL-CHROME FAILED` for Image Snippet semantics and is not an inline/native-image fallback. JPEG/WebP repetition or renaming cannot correct this post-conversion representation mismatch.

M14-I.1.5.2 is a feasibility conclusion, not a new architecture decision. Real Chrome produced `TEXT` from focused-content A1 and `VISIBLE IMAGE` from focused extension-page Candidate B using the same deterministic non-user PNG. A1 is failed for genuine Image semantics; B proves focused-extension capability but is not acceptable trigger-workflow UX. A2/F9 was not run and is no longer required for the current decision. No transparent extension-only normal-trigger route is proven. Decision 43 later defines the M14-I.2 Windows Native Clipboard Companion architecture without implementing it or adding `nativeMessaging`. The metadata-only catalog, Decision 42, Text path, current permissions, Backup v5, and Dexie v5 remain unchanged. See `NATIVE_IMAGE_CLIPBOARD_FEASIBILITY.md`.

Current implementation continuity: M14-I.3 through M14-I.4.1 implement Decision 43's native host, Chrome integration, stable development registration, callback-aligned Native Messaging, and truthful Settings readiness. Real Chrome validates Settings `Ready` and end-to-end Windows Image delivery through trigger activation, native clipboard preparation, exact cleanup, copied notice, and visible native `Ctrl+V`. M14-I.5 removes the failed browser Image transports and all A1/A2/B runtime probes while retaining this historical evidence. Text remains on its validated offscreen copy-event path; no browser Image fallback, automatic paste, or production installer is introduced.

## Decision 42: Clipboard Image Decode Safety Policy

M14-I clipboard delivery applies a permanent decoded-image allocation boundary in addition to M14-E's unchanged 5 MiB encoded asset limit. This policy affects delivery/conversion only. It does not change persisted `SnippetAsset` validity, frozen Backup v1-v5 parsing, existing Image Snippets, or Dexie v5.

The approved limits are maximum width 8,192 pixels, maximum height 8,192 pixels, maximum total pixels 16,777,216 (`2^24`), and maximum canonical decoded RGBA surface 67,108,864 bytes (64 MiB) using `width × height × 4`. Every value must be a positive safe integer and satisfy all four limits with overflow-safe arithmetic. Clipboard conversion may intentionally retain at most one full decoded `ImageBitmap` and one same-size canvas simultaneously, for a planned two-surface raster working-set ceiling of 134,217,728 bytes (128 MiB). This is an application allocation policy, not a claim about undocumented Chromium decoder/encoder temporaries.

No raster decoder or canvas may run before the bounded encoded bytes pass project-owned metadata inspection. PNG dimensions come from the mandatory first `IHDR`; JPEG dimensions come from a safely scanned usable SOF segment with validated marker lengths; WebP dimensions come from `VP8X`, `VP8`, or `VP8L` structure. Malformed, truncated, zero-dimension, missing-dimension, ambiguous, or oversized input fails closed before decode. Animated WebP also fails closed for M14-I delivery and is neither flattened nor reduced to its first frame.

Safety is evaluated on encoded intrinsic dimensions before decoding and again on decoder-reported display-oriented dimensions before canvas allocation. Conversion uses normal `from-image` orientation. Symmetric axis limits and the invariant pixel limit prevent a 90°/270° orientation swap from bypassing the guard. A post-decode rejection closes the bitmap before allocating a canvas.

PNG may retain its validated original bytes for `image/png` clipboard transport. JPEG and WebP are genuinely decoded and re-encoded as PNG; MIME relabeling is prohibited. Oversized images are rejected rather than resized, cropped, downsampled, or recompressed to fit. Failure leaves the clipboard unchanged, preserves the trigger and surrounding page content, and reports a concise delivery error.

## Decision 43: Optional Windows Native Clipboard Companion

The browser-only feasibility work establishes that offscreen Async Clipboard, the M14-I.1.4 copy-event `File`, and focused-content A1 do not produce the required genuine native Image semantics in the normal trigger workflow. Focused extension-page Candidate B does produce a visible pasted image, but requiring a focused extension document is unacceptable production UX. A2 was not run and is no longer required. M14-I therefore adopts an optional Windows-only Native Clipboard Companion as the technically sound production direction, subject to Principal approval and separately assigned implementation and validation tasks.

The service worker remains authoritative for catalog freshness, Snippet/asset loading, exactly-one ownership, Decision 42 validation and JPEG/WebP-to-PNG conversion, request correlation, and success-gated compare-and-swap trigger cleanup. A platform-independent application capability conceptually named `ImageClipboardTransport.writePng` isolates transport. A future `WindowsNativeImageClipboardTransport` infrastructure adapter may send only the validated PNG through Chrome Native Messaging. Content scripts, the Snippet domain, metadata-only trigger catalogs, Dexie v5, Backup v5, Retrieval, Prompt Builder, Text delivery, Decision 40, and M15 remain native-host unaware and unchanged.

The selected host is a self-contained C#/.NET 10 LTS Windows application using direct Win32 interop and Windows Imaging Component. V1 uses `runtime.sendNativeMessage()` and a fresh process per capabilities check or Image write; a persistent `connectNative()` process is rejected until measured startup latency proves it necessary. `nativeMessaging` is a future optional permission requested only from an explanatory Settings user gesture. Text remains independent and must never launch the helper.

Protocol v1 is strict UTF-8 JSON over Chrome's length-prefixed stdio framing. It supports only `get-capabilities` and data operation `write-image-png`; the latter carries a 128-bit, 32-lowercase-hex request ID, `encoding: "base64"`, declared byte length, and canonical base64 PNG data. Requests accept no arbitrary command, path, URL, filename, HTML, asset/Snippet metadata, trigger, title, or page content. Unknown/duplicate/dangerous keys and inexact shapes fail closed. Decision 42's 5,242,880-byte encoded ceiling expands to 6,990,508 base64 bytes; the exact compact maximum request is 6,990,667 bytes. V1 sets a 7,000,000-byte request ceiling and 4,096-byte response ceiling, safely inside Chrome's documented 64 MiB host-bound and 1 MiB extension-bound limits. Chunking, streaming, network transfer, and temporary image files are prohibited.

For the selected one-process-per-`sendNativeMessage()` model, the declared frame is the request boundary. The host reads exactly the 4-byte prefix and declared body, processes and responds without waiting for stdin EOF, performs no post-body read or pipe peek, and exits after at most one response. Premature EOF within the declared frame and an oversized declared length still fail closed; process-lifetime stdin after the one request is not inspected.

The host independently verifies the frame and decoded lengths, canonical base64, PNG signature and IHDR, 1..8,192 width/height, at most 16,777,216 pixels, checked `width * height * 4` at most 67,108,864 bytes, WIC PNG/single-frame identity, and exact post-decode dimensions. It does not accept or decode JPEG/WebP. WIC converts to premultiplied 32bpp BGRA. The companion eagerly writes the exact registered `PNG` representation first and a bottom-up, sRGB, alpha-masked `CF_DIBV5` representation second, following current Chromium compatibility evidence. Both formats are required for success. `CF_HDROP`, `CF_BITMAP`, file objects, `snippet.png`, filenames, and filesystem staging are forbidden.

Clipboard ownership uses an unshown companion-owned top-level HWND on a dedicated STA request thread. `OpenClipboard(NULL)`, Chrome's service-worker parent handle of zero, and delayed rendering are rejected. The host preallocates both movable HGLOBAL values, then performs Open, Empty, registered-PNG Set, CF_DIBV5 Set, and Close. System ownership begins separately after each successful `SetClipboardData`; application-owned memory is released on all other paths. Clipboard data is eagerly rendered and survives host exit. Open contention alone receives six total attempts with 10, 20, 40, 80, and 160 ms backoff, at most 310 ms. No post-mutation step or whole Native Messaging request is automatically retried.

If registered PNG transfers but CF_DIBV5 fails, the operation remains `clipboard-write-failed`, no transaction retry occurs, and the host attempts one best-effort `EmptyClipboard` while it still owns the open clipboard before attempting `CloseClipboard`. A failed cleanup does not replace the original write failure or claim the clipboard is clean; a subsequent close failure retains the approved `clipboard-close-failed` precedence. Successfully transferred HGLOBALs are never directly freed by the host, while every handle not accepted by `SetClipboardData` remains application-owned and is released. The previous clipboard is not snapshotted or restored.

Native success means only that the complete required clipboard sequence, including `CloseClipboard`, succeeded and both approved representations were prepared. It does not claim that a destination pasted. Only an exact, correlated success response authorizes cleanup. Failure, disconnect, invalid/stale response, or version mismatch leaves the trigger and page untouched and shows no copied notice. A successful write followed by a lost response can leave the clipboard prepared while the trigger remains; automatic replay is forbidden. One extension Image write may be in flight, a second rapid activation fails safely as busy, and a per-user/session host mutex rejects overlapping host processes.

The host manifest and binary enforce the access boundary twice: exactly one non-wildcard `allowed_origins` entry and byte-for-byte host-side verification of Chrome's caller-origin argument. Production uses host name `com.ai_support_workspace.clipboard` and a release artifact compiled for the exact eventual Chrome Web Store origin. Development uses a stable unpacked extension ID established by a development manifest public `key`, a separate `.dev` host name/manifest/artifact, exact development origin, and HKCU registration. Production never trusts the development ID or an installer-supplied arbitrary ID.

Production distribution is a signed, self-contained, per-user installation below `%LOCALAPPDATA%\AI Support Workspace\Clipboard Companion\`, with an exact HKCU Google Chrome Native Messaging registration, stable manifest location, absolute executable path, staged versioned upgrade, rollback-compatible prior version, repair, and complete uninstall/orphan cleanup. Installer technology remains an implementation decision because MSI versus signed EXE does not change the architecture. Host semantic version and integer protocol version are separate; protocol v1 is frozen, newer hosts must preserve its exact behavior, and incompatible combinations produce update-required UX through capabilities/version checks without polling.

The helper requires no network access and production logging defaults off. Stdout is protocol-only; explicitly enabled diagnostics may use bounded payload-free stderr events. PNG/base64, clipboard content, user/Snippet/page data, filenames, paths, raw JSON, exception text, and stack traces are never logged or dumped. The host is not a general executor and never launches commands from requests.

Automatic native paste is a separate future capability with distinct focus, race, permission, trust, and approval requirements. Decision 43 includes no AutoHotkey, `SendInput`, keyboard hook, or automatic `Ctrl+V`; manual native `Ctrl+V` remains accepted. The application boundary may support another platform adapter later, but this companion and its installation contract are Windows-only.

After an approved native path is implemented and real-Chrome validated, M14-I must remove the failed M14-I.1.4 File-based Image branch, obsolete Image-only errors/tests, and obsolete offscreen Image transport while preserving the runtime-validated Text offscreen path and historical evidence. Before the final M14-I commit it must also remove all feasibility-probe runtime/dev UI and probe-only tests, retaining the feasibility document and only a generic deterministic PNG fixture that a real native conformance test genuinely uses. Neither cleanup occurs in M14-I.2. M14-J remains not started until the companion is implemented, Image delivery is validated, cleanup and final M14-I review complete, and an M14-I checkpoint is approved.

Implementation status: M14-I.5 completes that required cleanup. The validated Text offscreen copy-event path and native Image path remain separate. M14-J.2 is real-Crisp Text PASS. M14-J.3 adds only generic trusted-event Shadow DOM editor/range resolution before delivery and is real-Intercom validated for activation and ordinary rich Text. M14-J.4 changes only safe HTML serialization of supported inline hard breaks to `<br>` while retaining canonical direct list-item HTML. M14-J.5 proves the first apparent list failure was an invalid two-item fixture; the corrected record passes persistence, serializer, delivery-payload equality, and normal Intercom paste. Crisp and Intercom Image paste pass. The production-excluded, explicitly invoked diagnostic changes no clipboard or native boundary. Intercom bullet triggering after Shift+Enter remains a known low-priority limitation. Decision 42 and Decision 43 are unchanged. M14-J.6 implements the lifecycle recovery and host-access choice recorded by Decision 44.

The exact protocol, validation order, clipboard header/pixel contract, error taxonomy, logging rules, installation lifecycle, threat model, alternatives, risks, and future test gates are normative in `NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md`.

## Decision 44: Persistent HTTP/HTTPS Access for Lifecycle Recovery

M14-J.6 preserves WXT's static content-script registration at exactly `http://*/*` and `https://*/*` with `allFrames: true` for ordinary navigation. To recover eligible pages that were already open when the extension is installed, updated, or reloaded—and restored loaded pages at browser startup—the generated manifest grants persistent host access at those same two exact patterns. The service worker uses `runtime.onInstalled` and `runtime.onStartup`, queries only those patterns, and injects the current packaged static content-script files with `scripting.executeScript()` into all matching frames. `activeTab` remains required by the existing M10 explicit user-gesture workflow but is insufficient and is not treated as recovery authority. No `tabs`, `<all_urls>`, `file://`, or `clipboardRead` permission is added. The HTTP permission includes the existing fixed localhost Ollama endpoint, so the former narrower localhost entry is not duplicated.

Recovery is bounded, idempotent, frame-aware, and best-effort. It skips discarded tabs, limits concurrent tab injection to four, coalesces overlapping lifecycle cycles, and isolates query or per-tab injection denial without surfacing page-specific errors. Each isolated frame global has one versioned runtime owner: executing the current script reconnects that owner without adding listeners, while an obsolete or failed owner is disposed and replaced exactly once. Ordinary service-worker termination does not trigger global reinjection or a keepalive; the next focus or qualifying `beforeinput` reconnects the frame catalog and accepts only a complete snapshot from the current worker epoch before enabling activation.

Persistent host access authorizes only the existing supported-page runtime and this lifecycle recovery. It does not authorize page scraping, full-editor scans, page text or DOM logging, telemetry, network transmission, direct DOM insertion, automatic paste, keyboard injection, AutoHotkey, `SendInput`, destination-specific behavior, protected browser pages, or non-HTTP(S) schemes. Chrome user-controlled site-access restrictions remain authoritative; denied or restricted targets fail quietly. There is no polling, alarm, durable recovery queue, artificial service-worker keepalive, or native-companion change. Decisions 42 and 43, metadata-only catalogs, success-gated cleanup, manual native `Ctrl+V`, Dexie v5, and Backup v5 remain unchanged.

Automated lifecycle, duplicate-runtime, reconnect, partial-failure, concurrency, generated-manifest, and build validation passes. Principal real-Chrome acceptance is also complete: already-open Intercom and Crisp pages recovered after extension reload without webpage refresh, and repeated reloads produced exactly one activation, cleanup, copied notice, and clipboard payload. Decision 44 is final and active. M14-J is complete and real-browser validated; M14-K remains not started.

## Decision 45: Optional Focus-Safe Windows Automatic Paste

M14-K adds automatic paste as an optional capability after authoritative clipboard preparation; it does not replace clipboard delivery. The user-selectable Settings value is conceptually `snippetPasteMode: 'clipboard-only' | 'automatic'`, defaults to `clipboard-only`, and uses the existing singleton Settings repository and Dexie record. Manual `Ctrl+V` remains a permanent supported mode and fallback. Clipboard content is never cleared after an automatic attempt or success. M14-K.2 may extend the unindexed Settings record without a Dexie version change, but Backup v5 remains frozen: new exports must advance to strict Backup v6 if this preference is included, while v1-v5 imports map the absent preference to `clipboard-only`.

Text and Image retain their current, separate clipboard transports and converge only after a correlated `ClipboardDeliveryResult` success at a project-owned `AutomaticPasteTransport.requestPaste` boundary. Clipboard failure never requests paste. M14-K.2.3.4 establishes the synchronous activation boundary from real-browser evidence: only after trusted/cancelable Space, composition, collapsed-caret, supported-editor, exact-trigger/boundary, current catalog, and single-line eligibility checks all pass does the document runtime call `preventDefault()` and start asynchronous delivery. Rejected activation leaves ordinary Space untouched. Accepted activation consumes Space as the command in both clipboard-only and automatic modes and does not replay it after an asynchronous failure. In automatic mode, the approved order after that activation is clipboard success, service-worker/browser foreground check plus native foreground-context capture, exact compare-and-swap trigger-only cleanup, immediate post-cleanup editor/caret revalidation, one authorization consumption, final browser sender/tab/window revalidation, and one native paste attempt. Failure of an automatic-only precheck or native-context capture does not revoke clipboard success or suppress the normal exact cleanup attempt; it skips automatic input and continues with copied/manual-fallback UX. Cleanup failure or any stale proof declines automatic paste; the prepared clipboard remains available. No arbitrary delay or input-event grace period is approved. If evidence later requires a bounded delay, all browser and native evidence must be revalidated after it.

The content script owns the activation/editor proof using the existing generic input, textarea, contenteditable, composed-path, target-range, and live Shadow-DOM focus/selection architecture. The activation guard is one-use and permanently invalidated by editor disconnection, navigation/page lifecycle change, document visibility loss, focus/selection/caret departure, or any input/content change other than its own exact authorized cleanup; returning focus later does not revive it. Successful cleanup atomically transitions the guard to the expected collapsed cleanup caret and then immediately revalidates it. The service worker owns request correlation and the exact `MessageSender` document/frame/tab/window identity, catalog epoch/revision, active-tab and focused-window checks, one-use in-memory authorization, and a global no-queue delivery critical section from clipboard preparation through the paste result. Worker restart, sender mismatch, tab/window change, or a concurrent activation declines automatic paste. Chrome documents that `MessageSender` can identify the document, frame, and source tab; it also documents that an active tab does not imply a focused window, so both tab and window state are required.

The native companion owns no DOM, editor, provider, site, profile, or Snippet knowledge. It captures the provider-independent Windows foreground root `HWND`, owning process ID, and clipboard sequence after clipboard success, then validates those exact values immediately before input. A null/different foreground window, different process, or changed clipboard sequence declines paste. It never calls `SetForegroundWindow`, moves focus, searches Chrome internals, or hardcodes Crisp/Intercom. Exact root-window identity distinguishes multiple browser windows; profile identity remains browser-owned and is not inferred by the host. This layered design prevents a later different window from receiving input, but Windows cannot prove the browser's internal editor object at the exact injection instant. M14-K.2 and M14-K.3 must explicitly test the residual last-moment same-window focus race; evidence that the guard is insufficient blocks automatic-mode release rather than weakening the invariant.

Decision 43 protocol v1 remains frozen. M14-K.2 may add strict protocol v2 support to the same companion while preserving exact v1 behavior. V2 is limited to capability discovery, the existing compatible image operation, `capture-paste-context`, and `paste-clipboard`. The capture success contains only a fixed-format foreground-root-window token, unsigned process ID, and unsigned clipboard sequence number. The paste request contains only correlation/one-use authorization identity and those expected native values. Arbitrary key names/codes/sequences, `send-keys`, commands, processes, paths, page/Snippet content, HTML, and image bytes are prohibited from the paste operation.

M14-K's first Windows automatic-input implementation uses one direct `SendInput` array for exactly Ctrl down, V down, V up, and Ctrl up after checking the high-order `GetAsyncKeyState` bit for left/right Ctrl, Shift, Alt, and Windows keys. Any active modifier declines the attempt; there is no keyboard hook or input blocking. The virtual-key accelerator pastes the already-prepared clipboard and does not type Snippet text, so keyboard layout does not alter the payload. A full return count means only that Windows accepted all four input events, not that the destination inserted content. Zero means `input-injection-failed`; a partial return, host disconnect, or lost response after injection may have begun is `indeterminate`. The requested balanced array is the only approved modifier-state measure: the host must not retry the sequence or issue speculative key-up/follow-up input after an uncertain result. `SendInput` is subject to UIPI and can inject only into equal- or lower-integrity targets; Windows does not identify UIPI as the cause of a zero return.

One activation permits at most one `SendInput` call. The authorization is consumed before that call and is never replayed, including after partial acceptance, disconnect, timeout, worker restart, or lost response. A separate immediate-fail per-user/session paste mutex complements the extension critical section; stale paste requests are never queued. Typed automatic-paste outcomes are `paste-issued`, `clipboard-only`, `unsafe-focus`, `not-foreground`, `clipboard-changed`, `unsafe-keyboard-state`, `busy`, `native-unavailable`, `input-injection-failed`, and `indeterminate`. `Paste sent` is the truthful success notice; it does not claim insertion. After confirmed clipboard success, every declined/failed/indeterminate automatic outcome uses `Snippet copied — press Ctrl+V` or `Image copied — press Ctrl+V`, with `(trigger unchanged)` when exact cleanup did not occur. A second fully validated activation consumes its activation Space before the extension-wide guard can asynchronously decline clipboard preparation; its trigger remains and the retry-later delivery-busy message must not claim that second Snippet was copied. Low-level Windows details do not enter UI errors.

The existing self-contained C#/.NET companion with direct Win32 interop is selected for Windows. AutoHotkey was evaluated and rejected as a permanent dependency: uncompiled scripts require its runtime, compiled scripts embed an additional interpreter/script artifact, deployment/version/signing and diagnostics expand, and its default SendInput-based behavior does not improve focus ownership, UIPI, modifier, or race guarantees. Windows is the only automatic-paste scope for M14-K; non-Windows platforms retain clipboard-only delivery. Native logging remains off by default, no network telemetry is added, and optional diagnostics contain only correlation, result category, bounded timing, and safety category—never clipboard, Snippet, editor, page, customer, or merchant content.

Implementation status: M14-K.2 implements Decision 45 with the existing Settings singleton, strict Backup v6, a shared Text/Image post-clipboard boundary, request-lifetime one-use browser authorization, sender/tab/window safety, strict protocol v2, native context/modifier/mutex checks, and at most one four-event `SendInput` call. M14-K.2.3.4 adds synchronous accepted-Space suppression and trigger-only cleanup while retaining exact owned cleanup input notification and permanent invalidation for every later genuine input. Clipboard-only remains default, manual `Ctrl+V` remains permanent, and no automatic result is retried. Decisions 42, 43, and 44; protocol-v1 Image behavior; native clipboard semantics; Dexie v5; and frozen Backup v1-v5 contracts remain unchanged. M14-K.3 authoritative evidence passes automatic and clipboard-only Text/Image in Intercom and Crisp, unknown-trigger safety, live paste-mode switching, and a successful 4/4, last-error-0, 40-byte native input trace. M14-K.3 is Principal-approved, and M14-K is complete/closed at implementation checkpoint `e34cd76` (`feat: add automatic snippet paste delivery`).

## Decision 46: Future AI Drafting Reference, Guidance / Gist, and Grounding Contract

The next AI drafting workflow will make Text Snippets the sole active user-managed AI reference library. Text Snippets may supply relevant user-stored support information, reusable phrasing, response patterns, prior examples, and workflow/reference wording. They are evidence and reference material, not the current command. Image Snippets remain delivery assets and are excluded from AI retrieval and Prompt Builder reference content.

The user-facing Knowledge Library will retire from the active AI workflow and future primary Library UI. This product decision does not delete the implemented Knowledge domain, `KnowledgeEntryRepository`, Dexie records/store, Backup v1-v6 contracts, restore compatibility, tests, or historical documentation. That implementation remains dormant-compatible while the new workflow is validated. Permanent removal, data migration, backup-format evolution, schema cleanup, and deletion of Knowledge code require a separately approved future cleanup architecture and migration task.

The current implemented M6 Retrieval Engine and M7/M9 Prompt Builder still expose separate Knowledge and Snippet collections and remain unchanged by this documentation task. A future versioned AI-workflow implementation must explicitly amend those application contracts so active retrieval uses relevant Text Snippets without requiring Knowledge records. It must not silently reinterpret the existing v1 contracts or destructively migrate user data.

The user-facing field name is **Guidance / Gist**. It is optional request-specific direction, not a requirement to write a complete prompt. Minimal values such as `follow up`, `keep it short`, `buy some time`, `ask for the URL`, and `explain what we changed` are valid. When Merchant Context is present, the drafting workflow infers the pending/latest subject from that Context instead of requiring the user to restate it. Without Merchant Context, a sufficiently specific Gist may directly define the requested message. With Merchant Context but no Gist, Generate infers that a sensible grounded reply is required. Application-owned default drafting instructions always apply and need not be repeated by the user.

Generate eligibility is:

| Merchant Context | Guidance / Gist | Generate |
| --- | --- | --- |
| Present | Empty | Enabled |
| Present | Present | Enabled |
| Empty | Present | Enabled |
| Empty | Empty | Disabled |

The product-level authority and grounding model is:

```text
Safety / application rules
→ current Guidance / Gist intent and presentation
→ Merchant Context current-case facts
→ relevant Text Snippet reference material
→ default drafting behavior for remaining gaps
```

Guidance / Gist controls the current intent, requested action, desired length, structure, tone modification, and specific drafting direction. It may change how or why to reply, but it does not authorize facts contradicted by or unsupported in Merchant Context. Retrieved Text Snippets never override current Gist, current Context facts, or safety/application rules, and must not introduce unsupported case-specific facts. Default drafting behavior fills gaps only after those higher-authority inputs.

## Decision 47: Future Compact AI Workspace and Request-Scoped Context Images

The future Side Panel order is fixed as Merchant Context, its Context Image attachments when present, Guidance / Gist, one horizontal provider-independent Model/Generate row, then Generated Output with **Save as Snippet** and **Copy** on the same output-header row. Generated Output does not move above the inputs.

Merchant Context and Guidance / Gist each begin at approximately one visual text line, auto-grow with content to a sensible maximum, and then scroll internally. This is a compact initial height, not a single-line content restriction. Merchant Context continues to accept pasted text. Guidance / Gist v1 accepts text only.

Merchant Context accepts pasted request-scoped Context Images. A Context Image is a transient multimodal AI input belonging to the current drafting request; it is visibly represented as a compact removable attachment or thumbnail. It is not an Image Snippet, Knowledge record, permanent AI-library record, or automatic Snippet asset. Any persistence needed only for mounted-workspace continuity must remain separate from reusable Snippet ownership. Provider capability checks and multimodal translation belong to the future M15 implementation architecture; unsupported images may not disappear silently.

The user-facing model control becomes a compact dropdown beside Generate. The Workspace remains provider-independent: model discovery/selection flows through project-owned provider/application boundaries and is not hard-coded to Ollama, even while Ollama is the current provider. Decision 31's implemented saved opaque default-model string and the current M9/M11 free-text UI remain current behavior until that future UI/application boundary is implemented and migrated deliberately.

Generated Output remains editable, is preserved while Context/Gist are adjusted and generation is repeated, and has Save as Snippet plus Copy on its header row. Save as Snippet opens or navigates to Text Snippet authoring with the current generated response prefilled; title, trigger, tags, and content remain editable, and only explicit user Save creates the record. Generation success never auto-creates or silently saves a Snippet. Generation does not automatically clear Context or Gist. No direct Insert/Paste action is approved. The compact primary workflow removes permanent explanatory copy equivalent to “Local support drafting,” redundant product headings, introductory prose, and persistent Ollama installation/help text; configuration and troubleshooting stay outside the main drafting surface.

## Decision 48: Future Snippet Hardening Metadata and Local Automatic Backup

Periodic automatic local backup is approved with user-facing cadence `Off | Daily | Weekly` and recommended/default behavior `Weekly`. It reuses the current canonical application-owned Backup/Export format rather than inventing a second representation. Manual Export remains available. Automatic backup failure never blocks Snippet use. Retention is bounded and execution remains local. Decision 52 and M14-L.1 later resolve the formerly deferred values as Daily latest seven and Weekly latest four, selected-folder architecture, a mandatory pre-migration feasibility gate, and exact permission/failure contracts. No scheduler, permission, or backup-format change is authorized by this decision alone.

Automatically generated Text Snippet tags are approved as provider-independent metadata for improving retrieval. Generated tags are non-authoritative hints, never the sole retrieval eligibility condition, never override Snippet content, and never apply to Image Snippets as AI knowledge. The current `SnippetEntry.tags: string[]` contract stores caller-authored ordered tags without provenance. A future implementation must preserve those authored values and explicitly decide a coexistence representation for generated metadata; it must not silently overwrite the current array or falsely treat existing tags as generated. Any new field/store, migration, or Backup evolution requires its own schema decision. Tag generation uses the project-owned provider-independent AI boundary, not an Ollama-specific subsystem.

Lightweight Snippet usage statistics are approved conceptually as `snippetId`, `usageCount`, and `lastUsedAt`, with a minimal Library count presentation. One use is counted only after authoritative clipboard preparation and successful exact trigger cleanup, in automatic or clipboard-only mode. A later automatic-paste failure does not erase that successful delivery-for-use. The system does not attempt to detect a later physical manual `Ctrl+V`. Usage persistence is best-effort and must never block or change delivery. Because usage is mutable operational metadata rather than authored Snippet content, implementation should prefer a separate sidecar/repository boundary when consistent with the eventual schema review; no current `SnippetEntry`, Dexie, or Backup field is implied.

Future retrieval keeps textual relevance primary. Generated-tag relevance is supporting evidence. Usage count and recency are weak secondary or tie-breaking signals only; popularity never dominates actual relevance, and missing or incorrect generated tags cannot make otherwise relevant Text Snippets impossible to retrieve.

## Decision 49: M14-K Approval, Class-C Deferral, and Native Distribution Boundary

M14-K.3 is Principal-approved. M14-K implementation is real-browser validated and Principal-approved, including automatic and clipboard-only Text/Image behavior in Intercom and Crisp, unknown-trigger safety, live paste-mode propagation, and the successful 4/4, last-error-0, 40-byte native trace. M14-K is complete and closed at implementation checkpoint `e34cd76` (`feat: add automatic snippet paste delivery`).

The M14-K.3 performance classification remains **C — ARCHITECTURAL PERFORMANCE OPPORTUNITY**, not a correctness defect. Direct PNG preparation is efficient; normal screenshot PNG preparation is inexpensive; JPEG/WebP conversion is materially slower; and repeated one-shot native-host startup has measured overhead. There was no M14-K pre-closeout optimization, and optimization remains deferred while hardening foundations are active. Before M14-P closes, real-world Snippet delivery must be re-measured; if meaningful user-visible delay remains, a focused optimization gate occurs before M15 rather than being automatically deferred until after AI Workspace implementation. M14-M.2 assigns no optimization implementation ID. Persistent Native Messaging, a revised non-PNG conversion architecture, compression/downsampling, AutoHotkey, or relaxed Decision 42 limits require that separate approved gate and are not authorized by this recording task.

M14-P.1 executes that focused gate without changing the architectural decisions. Current stable local Chromium fixtures confirm Text and guarded PNG browser preparation as Category D, duplicate per-delivery byte reads/copies as Category B, and genuine JPEG/WebP conversion plus one-shot-process consolidation as Category C. The Category-A finding is protocol-v1 PNG request serialization: the previous monolithic binary-string base64 conversion measured 45.5 ms warm median for 1.06 MiB and 254.3 ms for 4.46 MiB. The equivalent byte-array encoder measures 0.6 ms and 1.5 ms respectively, with a bounded exact fallback and canonical-output tests. This is an implementation optimization inside the frozen request contract, not a protocol revision.

Current content-free native evidence measures v1 capability startup/round-trip at 64.3 ms median / 70.3 ms p95 and v2 context capture at 69.4 ms median / 77.7 ms p95 over 20 warm runs. That overhead is material but still Category C: no persistent daemon/Port, long-lived host, combined operation, expanded authority, or synthetic paste benchmark is approved. Decision 42 predecode/postdecode safety, genuine JPEG/WebP decoding, Decision 45 clipboard-first and no-retry semantics, M14-M.3 receipt authority, canonical `;`, and manual fallback remain exact.

Functional local/development capability is validated separately from production distribution. A production installer, stable host registration/location, code signing and publisher identity, update/rollback, and version migration remain future packaging work. They do not block the current local working product or M14 closeout.

## Decision 50: Coordinated Snippet-Hardening Persistence and Backup Evolution

The Principal approves Decisions 50–53 in substance. M14-L.1 preserves their product architecture and corrects only feasibility ordering, approved Daily retention, and restored-cadence activation semantics. M14-L defines one coordinated data evolution rather than three independent migrations, but **M14-M.0 — Selected-Folder Backup Feasibility Gate** must pass before any permanent foundation work. Only after that PASS may M14-M.1 advance physical Dexie version 5 to version 6 once, add separate `snippetUsageStats` and `snippetGeneratedMetadata` stores, extend the existing Settings singleton with `automaticBackupCadence: 'off' | 'daily' | 'weekly'`, advance new canonical exports from Backup v6 to strict Backup v7, and commit the gate-proven physical design for local `automaticBackupState`. Backup v1-v6 remain frozen and importable. No M14-L/L.1 documentation change implements this migration.

`SnippetEntry` remains authored content and does not gain frequently mutated statistics or AI-generated tags. `snippetUsageStats` is keyed by `snippetId`; absence means `usageCount = 0` and `lastUsedAt = null`. `snippetGeneratedMetadata` is keyed by `snippetId` and contains only validated generated tags, the exact source fingerprint, and `generatedAt`; absence means no usable generated metadata. The intended `automaticBackupState` is machine/profile-local operational state containing the structured-clone directory handle when selected, a random destination/backup-set identity, due/attempt/success/failure state, one expiring run lease, and the bounded manifest of successfully verified managed files; its final physical declaration is conditional on M14-M.0 evidence. The directory handle, filesystem permission, operational-enabled state, schedule state, failure state, run lease, and managed-file manifest are not portable user data and are never serialized into a backup.

Backup v7 preserves Knowledge compatibility data, every Text/Image Snippet and asset, authored tags, generated Text-tag metadata, usage statistics, `defaultModel`, `snippetPasteMode`, and the preferred `automaticBackupCadence`. It adds required canonical `backupId`, `creationMode: 'manual' | 'automatic'`, and `backupSetId` metadata; `backupSetId` is required only for automatic output. Both manual and automatic output use one application-owned snapshot builder, exact v7 mapper, validator, serializer, existing 96 MiB byte limit, and digest boundary. Output adapters differ only after canonical construction. Valid v1-v6 imports map missing usage/generated metadata to absence and missing cadence to the product default `weekly`. Restore remains one all-or-nothing transaction across Knowledge, Snippets, assets, Settings, usage statistics, and generated metadata, while machine/profile-local automatic-backup state remains independently preserved and outside the portable transaction. Existing local authorization is neither cleared nor replaced by import. For restored `daily` or `weekly`, operational automatic writing requires an existing local handle and current read/write permission: without them, no alarm-driven write or permission prompt starts, no rapid failure loop runs, Settings reports `Backup location needs attention`, and manual Export remains available. Explicit folder selection/reauthorization may then make scheduling operational using the restored preferred cadence. Restored `off` remains intentionally inactive, retains any existing selected-folder authorization for later reuse, and does not require a location-attention warning. No import creates filesystem authority.

Snippet deletion removes its usage and generated-metadata sidecars in the same authored-data transaction. Restored usage must reference an existing Text or Image Snippet. Restored generated metadata must reference a Text Snippet and match its recomputed source fingerprint. Invalid counts, timestamps, tags, references, fingerprints, duplicate IDs, or unknown fields reject the whole v7 import. M14-M.1 implements this decision at physical Dexie v6 and canonical Backup v7 while leaving usage delivery behavior, automatic backup execution, generated-tag AI/retrieval, and M15 outside the foundation.

## Decision 51: Deterministic Non-Blocking Snippet Usage Statistics

One user-facing Snippet use occurs only after authoritative clipboard preparation succeeds and the content frame completes exact trigger cleanup. It applies to Text and Image Snippets in automatic and clipboard-only modes. A later automatic native-paste failure does not erase the use; a later physical manual `Ctrl+V` is neither observed nor required. Failed/unknown activation, clipboard failure, stale cleanup failure, AI retrieval, Library viewing/editing, backup, and export never increment usage.

Clipboard success responses carry a service-worker-owned random one-use delivery receipt bound in memory to `requestId`, `snippetId`, delivery kind, exact sender document/frame/tab/window identity, catalog epoch/revision, and a 30-second expiry. After cleanup returns true, the content frame sends a separate receipt acknowledgement. The delivery flow does not await statistics persistence; automatic finalization may continue immediately. The service worker validates and consumes the receipt exactly once, captures the acknowledgement time from its injected clock, and handles a separate best-effort `SnippetUsageStatsRepository.recordUse(snippetId, usedAt)` message lifetime. Failure is swallowed at the statistics boundary, never changes a delivery result or notice, and is not automatically replayed because an ambiguous retry could double-count.

`recordUse` atomically creates `{ snippetId, usageCount: 1, lastUsedAt }` on first use or increments the non-negative safe integer and replaces `lastUsedAt` in one Dexie transaction. At `Number.MAX_SAFE_INTEGER`, the count saturates while `lastUsedAt` still advances; it never overflows. `lastUsedAt` is the service-worker receipt-acceptance instant serialized as canonical UTC ISO 8601. If the write fails, neither field changes; undercounting is preferred to duplicate counting or delivery failure. Tests inject the clock and failures. Usage writes never invalidate/rebuild the trigger catalog or mutate `SnippetEntry.updatedAt`. After M14-M.3.1, Library v1 joins the sidecar and displays only the numeric count, with absence as `0` and an accessible `Usage count: <count>` label; there is no dashboard, chart, remote analytics, history, or telemetry. Usage and recency do not participate in M14-O retrieval ranking.

M14-M.3 implements Decision 51 over the committed Dexie v6 sidecar. Receipts remain transient service-worker memory with no reconstruction after worker loss; Text/Image and clipboard-only/automatic flows share the same acknowledgement authority, and automatic paste success, decline, or failure after accepted cleanup cannot change the recorded use. The Library displays the approved lightweight count without changing ordering. Backup remains v7, and no permission, dependency, scheduler, generated-tag, F1/F2, or M15 behavior is added.

## Decision 52: User-Selected Automatic Backup, Scheduling, and Managed Retention

Automatic Backup Settings expose `Off | Daily | Weekly`, default/recommended `Weekly`, plus `Backup Location: Choose folder...`. The selected destination uses the File System Access API: an extension page calls `window.showDirectoryPicker({ mode: 'readwrite' })` only from the explicit Choose-folder or Change-folder user gesture and stores the returned `FileSystemDirectoryHandle` in extension-origin IndexedDB through the application boundary. Handles are structured-clone data, but permission is not assumed to survive. Every scheduled run retrieves the handle and calls `queryPermission({ mode: 'readwrite' })`; it proceeds only for `granted`. A `prompt` or `denied` result, revoked permission, missing/deleted/unavailable directory, or file operation failure records a bounded safe status, advances to the next scheduled opportunity, and leaves Snippet use and local data untouched. Scheduled/service-worker code never calls a picker or attempts a permission prompt. Reauthorization happens only from a later explicit Settings gesture using `requestPermission()` or `showDirectoryPicker()`. A newly chosen handle is compared with the stored handle using `isSameEntry()`: choosing the same directory preserves its backup set and manifest; choosing a different directory creates a fresh backup-set identity and abandons the old manifest without deleting any old-location files.

M14-M.0 must first validate the selected-folder model in real Chrome without a production migration or `alarms` permission. From an explicit Options-page gesture it must obtain the directory handle, structured-clone it through a task-scoped scratch IndexedDB boundary, cross the relevant extension/service-worker lifecycle, query current read/write permission, and prove that an already-granted handle can perform a later background-context write without prompting. `prompt`/`denied` must require a new user gesture. The gate creates one exact random test file, closes it, reopens and verifies its identity/content, removes only that exact file, and proves unrelated files untouched; it also covers revoked/unavailable destinations. Scratch state is cleaned without touching production data. If any required result fails, M14-M.1 is blocked and the architecture returns to Principal review. If it passes, M14-M.1 may commit the coordinated Dexie v6/Backup v7 foundation and the proven local operational-state design; M14-N later implements and revalidates production scheduling/output.

M14-M.0 is now **PASS / REAL-CHROME VALIDATED**. Principal evidence proves the critical picker, structured-clone persistence, Options reload, browser restart, permission query, independent service-worker reuse, exact owned-file creation/read verification/deletion, no remaining artifact, same-folder identity, unrelated-file isolation, and unavailable/deleted-location fail-safe premises without new manifest authority. Exploratory different-folder distinction was not reliably proven and is explicitly non-blocking for this feasibility result. M14-N must prove any such behavior over the final production adapter before using it in backup-set identity or deletion/retention decisions; an unproven comparison must fail safe and can never replace exact manifest/digest ownership proof.

File System Access needs no extension manifest permission; eventual scheduled execution requires the manifest `alarms` permission. `chrome.downloads` is rejected as the selected-folder adapter: it requires `downloads`, accepts only a path relative to the default Downloads directory, and `saveAs` prompts instead of granting reusable arbitrary-folder authority. No `downloads`, legacy Chrome App `fileSystem`, broad path, or silent Downloads fallback is approved. Current manual Export remains the fallback and remains permanently supported.

`Daily` means one due opportunity every 24 hours and `Weekly` every 168 hours, anchored when the cadence is enabled or changed. The singleton state persists `nextDueAt`. One named one-shot `chrome.alarms` alarm is reconciled whenever the service worker starts and after each attempt; overdue intervals coalesce into at most one catch-up attempt, then `nextDueAt` advances by whole cadence intervals until it is future. Browser sleep/offline time creates no backlog. One in-memory mutex plus a persisted 30-minute lease prevents overlapping or duplicate runs; an expired lease is abandoned without deleting files. Failure receives no rapid retry and waits until the next due opportunity or an explicit manual Export.

`backupSetId` and `backupId` are lowercase random UUIDs. Automatic filenames are unique and Windows-safe: `ai-support-workspace-managed-{backupSetId}-{YYYYMMDDTHHmmssSSSZ}-{backupId}.json`, using the canonical UTC creation instant without punctuation. One automatic execution creates one canonical Backup v7 identity and exact managed filename. Collision never overwrites: that cadence execution fails without generating a replacement ID/name or scheduling an immediate retry, and the next normal cadence is the next opportunity. A run writes the already validated canonical bytes, closes the writable, reopens the file, verifies exact byte length, SHA-256 digest, and strict Backup v7 identity, then records a successful managed-file manifest entry. Only after that success may retention run.

For Weekly cadence, retention is locked to exactly the latest four successful managed backups for the selected backup set/location. Ordering is create → close and verify success → identify candidates from the local managed manifest → sort oldest by `createdAt` then `backupId` → re-prove each deletion candidate → remove the oldest until four remain. Proof requires the current directory handle to match the stored destination with `isSameEntry`, an exact manifest record (`backupId`, `backupSetId`, `createdAt`, exact filename, destination identity, Backup version, byte length, SHA-256, successful status), and re-reading the exact file to validate matching automatic Backup v7 metadata and digest. Only then may `FileSystemDirectoryHandle.removeEntry(exactFilename)` run. A name pattern alone is never proof. Missing, moved, replaced, unverifiable, unrelated, manually exported, or pre-manifest files are never deleted. If proof or removal fails, pruning stops, reports a non-blocking retention warning, and may temporarily leave more than four recovery points; it retries only after a later successful backup. Losing local ownership metadata safely leaks recovery files rather than risking deletion. An existing recovery point is never deleted before its replacement succeeds.

For Daily cadence, retention is locked to exactly the latest seven successful managed backups for the selected backup set/location. It uses the same success-first, deterministic ownership-proof, oldest-first, and fail-safe pruning rules as Weekly. Weekly four and Daily seven are final Principal-approved product values. `Off` clears scheduling but retains the selected handle and verified manifest for later reuse; an explicit Forget-location action clears local authority/metadata without deleting files.

M14-N.1 implements the non-UI runtime portion of this decision. It keeps Dexie at v6 and Backup at v7; adds only `alarms`; uses one stable named one-shot alarm, anchor-aligned startup/catch-up reconciliation, an in-memory guard, and an atomic 30-minute lease; promotes the production File System Access query/identity/exact-file adapter; shares the canonical v7 builder with manual Export; verifies closed-file byte length, SHA-256, and strict identity before manifest success; and applies exact manifest-driven Daily-seven/Weekly-four retention with safe overflow. Different or uncertain directory identity rotates the backup set without touching old files. M14-N.2 implements the explicit user-gesture picker/reauthorization/status UI and automated runtime wiring; M14-N.3 remains responsible for real-Chrome production-path validation and closeout.

## Decision 53: Generated Text Snippet Metadata and Deterministic Retrieval Integration

Generated retrieval tags are separate provider-produced metadata for Text Snippets only. Authored `SnippetEntry.tags` remain ordered user-owned values and are never overwritten, relabelled, or inferred as generated. A successful generated record contains at most eight unique normalized tags, each 1–40 Unicode code points, plus a SHA-256 source fingerprint over a versioned canonical serialization of title, rendered Text content, and authored tags, and a canonical UTC `generatedAt`. Image Snippets reject generated metadata.

On Text creation, or update of title/content/authored tags, authored persistence succeeds independently. The same local authored-data transaction removes prior generated metadata when the source fingerprint changes, so stale tags are immediately ineligible. After save, a best-effort `GenerateSnippetTags` application service may run without blocking or reverting the save. Trigger-only edits do not invalidate matching metadata. Provider/model unavailability, cancellation, timeout, malformed output, or persistence failure leaves metadata absent and produces only safe non-blocking Library status; there is no automatic retry loop or durable generation queue.

The application service uses the existing project-owned `GenerationProvider` abstraction through dependency injection and a focused metadata prompt factory; it does not use Prompt Builder drafting semantics, import `OllamaProvider`, make a direct Ollama fetch, or branch on provider names. A focused model resolver supplies the configured provider/model. Under the current runtime, that means the existing saved `defaultModel` and injected current provider. If no usable configured model exists, generation is skipped; no model is guessed, hard-coded, pulled, installed, or allowed to make Snippet save fail. Future provider/model selection may replace the resolver without changing Snippet domain logic.

The request sends only the Text Snippet title, deterministic rendered plain text, and authored tags to the already configured provider, with a system-owned instruction to return one JSON array. The canonical UTF-8 metadata request payload is capped at 64 KiB; an oversized record skips generation without affecting Save rather than silently truncating user content. Raw output is bounded to 4 KiB, must parse as the complete top-level array with no prose/object/trailing data, and must contain only strings. Each string is NFKC-normalized, trimmed, internal whitespace-collapsed, lowercased, rejected for control characters, line breaks, `<`/`>`, emptiness, or length outside 1–40 code points, then case-insensitively deduplicated and capped at eight. Any structural or bounds failure rejects the entire result. Raw provider output, prompt, and Snippet content are not persisted or logged.

Historical Text Snippets are not processed at startup, delivery time, or retrieval time. They gain tags on the next qualifying edit, or through a future explicit user-invoked “Generate missing tags” batch limited to 20 records per invocation with concurrency one and cancellation. There is no unbounded queue or automatic historical provider burst.

M14-O keeps the existing deterministic lexical engine and current Text-only Snippet eligibility. Per unique query token, title remains weight 5, authored tags weight 3, content weight 1, and generated tags add weight 1 only when the stored source fingerprint matches the current Text Snippet. A missing/wrong generated tag cannot remove title/content/authored evidence or make a record ineligible. Sort remains total textual score, then existing `createdAt` and ID order. Usage and recency remain excluded in this package; popularity cannot outrank relevance. M14-O does not add embeddings, vectors, remove Knowledge retrieval, or change Prompt Builder v1. Decision 56 moves only Knowledge's active UI hiding to M14-P.4; the versioned AI retrieval/Prompt Builder transition remains future M15 work under Decision 46.

## Decision 54: Primary Extension Navigation Uses Toolbar-to-Side-Panel and Settings Gear-to-Options

M14-L audits and locks the future primary navigation model without implementing it. Current WXT behavior remains unchanged: the `src/extension/popup` entry point generates `action: { default_title: 'AI Support Workspace', default_popup: 'popup.html' }`; `PopupShell` contains **Open Workspace** and **Open Libraries**; the popup calls `chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })` or links to `/options.html`; the generated manifest retains `side_panel.default_path: 'sidepanel.html'` and `options_ui: { page: 'options.html', open_in_tab: false }`; and build/component tests require the popup. The current Side Panel header has no Settings control, while the existing WXT Options entry point owns Knowledge, Text/Image Snippets, Settings, and Import / Export.

The locked future entry flow is **toolbar extension action → native global Workspace Side Panel open/toggle**. At the Decision 54 checkpoint, implementation was assigned to M15; Decision 56 moves it to M14-P.4. The implementation removes the competing popup behavior by retiring the popup entry point and `action.default_popup`, preserves or explicitly declares a popup-free WXT `action` with the existing title so the toolbar icon remains, preserves `side_panel.default_path`, and idempotently applies `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` from extension startup. Chrome owns the action-click Side Panel behavior; no custom popup or hand-built `chrome.action.onClicked` toggle state is added. The existing `sidePanel` permission is sufficient, and keyboard-command `chrome.sidePanel.open({ windowId })` behavior remains separate and unchanged.

The locked management flow is **Side Panel compact Settings gear → existing Options / Libraries page**. The gear is an icon-only native button in the same header row as **AI Support Workspace**, calls `chrome.runtime.openOptionsPage()`, and adds no large **Open Libraries** row, dropdown, menu, router, or duplicate management UI. Its icon is decorative; the button has the accessible name `Open Settings and Libraries`, a visible keyboard focus indication, a compact visual footprint with an adequate pointer target, native Enter/Space behavior, and safe non-blocking failure announcement. Options remains responsible for Text Snippets, Image Snippets, backup/export, paste behavior, model/provider settings, other settings, and current Knowledge compatibility. Decision 55 later retires automatic-backup configuration without changing this navigation ownership. V1 requires no deep link to a particular Options tab.

At the Decision 54 checkpoint, this validation was assigned to M15: update generated-manifest validation and retire/replace popup tests; add Settings-control coverage; preserve Options, narrow layout, selected-text shortcut, and permissions; and prove the action/gear path in real Chrome. Decision 56 supersedes only that milestone assignment and moves the same shell validation to M14-P.4. M14-L itself changed no WXT configuration, manifest, entry point, source, test, permission, or file layout.

## Decision 55: Retire Current Automatic Filesystem Backup and Use Manual v7 Reminder

The current product will not ship unattended automatic filesystem backup. The previously planned M14-N.3 real-Chrome automatic-backup validation is cancelled. M14-N.1 and M14-N.2 remain valid historical technical-feasibility and implementation checkpoints rather than being rewritten away, but Decision 55 supersedes Decisions 48 and 52 for current product-facing behavior.

The authoritative backup strategy is **Manual Backup v7 Export + local `lastSuccessfulBackupAt` + a 30-elapsed-day advisory reminder**. Existing Manual Export remains authoritative and continues to use frozen Backup v7 with Knowledge compatibility, Text/Image Snippets, assets, authored tags, generated metadata, usage statistics, portable Settings, strict validation, the existing size limit, atomic restore, and v1–v7 import compatibility. Backup v8 is not created. Historical v7 `automaticBackupCadence` remains accepted as required by the frozen contract but is neither exposed nor acted upon.

`lastSuccessfulBackupAt` means the extension's canonical UTC acknowledgement instant after Manual Export completes successfully. Click, serialization/preparation, failure, and cancellation do not update it; a later successful export replaces it. It is local operational reminder state, not portable proof. It uses a focused boundary over the existing Dexie v6 Settings singleton record and is excluded from backup mapping. Import preserves the current local value and cannot fabricate a fresh local success or filesystem authority. Invalid or future state fails safe as no trusted success.

When the backup UI loads, no success means `Never` and a recommendation. Less than 30 elapsed 24-hour days is current. Exactly 30 days and any greater age is recommended. A successful export resets the state. The reminder is informational: it never blocks Snippet use/startup, forces or automatically creates an export, loops a modal, polls, schedules a timer/alarm, sends a notification/email, or asks for folder permission.

Production automatic-backup startup/alarm registration, scheduling, execution, File System Access adapters and selection/reauthorization UI, automatic retention/deletion, and automatic-specific application ports are retired where isolated and safe. The `alarms` permission has no remaining owner and is removed; `downloads`, notifications, and new host permissions are not added. The M14-M.0 selected-folder diagnostic has no remaining engineering owner and is removed from native development as isolated cleanup.

Dexie remains v6. Existing `automaticBackupState` rows may remain physically dormant; current product code does not read or activate them, and no destructive migration is introduced. Previously created managed backup files are user-owned and must never be enumerated, deleted, pruned, migrated, renamed, or otherwise cleaned up by this pivot. At the Decision 55 checkpoint, M14-O was expected after M14-N.3 and F1/F2 remained pre-closeout work; Decision 56 now makes M14-P.4 the next implementation before M14-O. F3 remains M15, and the canonical Snippet trigger prefix remains `;`.

## Decision 56: Complete Visible Navigation and Snippet Management Before Generated Retrieval

M14-P.3 records an intentional product-priority refinement without runtime implementation. M14-P.1 delivery performance and M14-P.2 F1/F2 daily-use UX are completed at their approved checkpoints. The authoritative remaining sequence is **M14-P.3 documentation → M14-P.4 Navigation & Snippet Library UI Completion → M14-O Generated Text Snippet Tags & Retrieval → M14-P final Snippet Completion Gate → M15 AI Workspace**. Overall M14-P remains incomplete until its final post-M14-O gate.

Decision 54's toolbar-to-Side-Panel and Settings-gear architecture remains approved, but this decision supersedes its implementation ownership: M14-P.4, not M15, may retire the popup/default popup, configure the pinned toolbar action to open/toggle the existing global Side Panel through Chrome's supported behavior, and add the compact Settings gear. The gear remains an explicit, keyboard-accessible icon action with the accessible name `Open Settings and Libraries`, visible focus, adequate target, safe failure feedback, and one call to the existing Options-opening boundary. It navigates to existing management/configuration; it does not duplicate Settings state or create a menu, router, hidden navigation, or new permission.

M14-P.4 owns the approved AI Workspace **presentation/shell**, not merely its title row. It renders the established compact structure: Merchant Context, a structural Context Images area, Guidance / Gist, a provider-neutral Model selector location, Generate, and editable Generated Output with **Save as Snippet** and **Copy**. The layout is responsive at normal narrow Chrome Side Panel widths, uses available width, and permits action reflow without horizontal scrolling. Where no independently approved behavior exists, controls remain honestly disabled or structural and do not imply success.

M15 retains every functional AI behavior behind that presentation: Context Image ingestion/provider translation, provider/model discovery and selection, Prompt Builder integration, Generate execution, provider calls, generated-output lifecycle and persistence semantics, Generated Output Copy, and F3 **Save as Snippet**. M14-P.4 does not invent a provider/model catalog, generate placeholder output, call a provider, persist AI state merely from rendering, reuse Image Snippet storage for Context Images, or create/prefill/save a Snippet. The editable fields establish component boundaries only.

The Settings gear continues to invoke the existing Options-opening boundary, while the manifest configures that single authoritative Options application with `options_ui.open_in_tab: true`. Therefore Settings opens in a normal browser tab rather than Chrome's embedded Options dialog. No duplicate Settings page, custom window, popup, website injection, `tabs`/`windows` permission, host permission, or other broader authority is introduced.

M14-P.4 hides Knowledge Library from active user-facing navigation and management UI. This is UI retirement only: Knowledge records, domain/repository code, Dexie v6 `knowledgeEntries`, historical data, tests, Backup v1–v7 and import/restore compatibility all remain. No migration, record deletion, schema removal, destructive cleanup, or Backup v8 is authorized. The current M6/M7/M9 retrieval and Prompt Builder contracts are not silently changed by presentation work; their versioned AI-workflow transition remains M15-owned. Text Snippets are the active user-managed reference library, Image Snippets remain delivery-only and excluded from AI retrieval, and Knowledge is retained as dormant-compatible data until a future explicit cleanup decision.

After Knowledge is hidden, the existing management surface exposes only the established necessary destinations: Snippet Library, Settings, and Import / Export. No additional navigation item is inferred. The Side Panel remains the primary day-to-day product surface, while Options remains the management/configuration surface.

The Snippet Library's approved visible hierarchy is Name/Title, Trigger, Type, Usage count, bounded Details/content preview, and Actions. Type and Usage are separate compact chips. User-facing types remain exactly Text and Image. Usage remains visually numeric-only—such as `[Text] [12]`—with an accessible label equivalent to `Usage count: 12`; usage remains informational and excluded from retrieval/ranking. Text Details use safe bounded rich/plain preview conventions; Image Details use a bounded image preview. Exact styling and truncation are implementation-owned and require no data-model change.

The approved action order is **Delete → Edit → Copy**. Final actions prefer compact icon buttons rather than textual action buttons, while retaining exact accessible names equivalent to `Delete Snippet`, `Edit Snippet`, and `Copy Snippet`, keyboard operation, visible focus, and tooltip/title support. Copy remains supported. Delete must never destroy on the initial icon activation: it opens a simple target-identifying confirmation equivalent to `Delete "<Snippet name>"?`, `This Snippet will be permanently removed.`, and `[Cancel] [Delete]`. Cancel is non-destructive; only explicit confirmation invokes the existing atomic Snippet/associated-data deletion boundary. No typed-name or elaborate multi-step confirmation is required.

M14-P.4.1 clarifies the Copy authority after implementation correctly stopped on the previously missing management boundary. `CopySnippetToClipboard` is a dedicated application operation from stable Snippet ID to authoritative record/asset loading and the existing clipboard preparation/writer capabilities. It is not trigger activation and creates no trigger input, catalog identity, editor cleanup, delivery receipt, usage update, or Automatic Paste state. Text retains the established rich/plain serializer and Image retains authoritative stored bytes, Decision 42 validation/preparation, and the existing native clipboard writer; preview bytes are never clipboard authority. Library Copy is explicit clipboard-only preparation and does not increment usage under Decision 51.

M14-P.4 owns the observed existing-Image Edit preview defect: a valid retained image must render as the actual image rather than a browser-native broken-image/alt-text area and must remain available while metadata is edited without requiring reselection. The editor presents a bounded **Current image** preview, established explicit replacement through screenshot `Ctrl+V` and supported file selection, and explicit Remove. CSS/object-fit containment may constrain only the visual preview; it must not resize, crop, downsample, re-encode, or otherwise mutate the persisted/delivered asset. A genuine render failure receives an intentional application fallback/error state without silent deletion, replacement, or mutation. M14-P.1 image quality, Decision 42 safety, PNG/JPEG/WebP delivery, ownership, replacement/removal, no automatic picker, and no automatic clipboard action remain authoritative.

M14-P.4 is presentation/navigation work. It adds no generated tags/fingerprints/backfill, retrieval scoring, embeddings, provider/model call or selection behavior, Merchant Context or Guidance semantics, Context Image ingestion, Generate or Generated Output lifecycle behavior, F3, AI settings, trigger redesign, immediate no-Space activation, image-processing optimization, Snippet type, Knowledge deletion, Dexie migration, Backup version, or permission. Canonical activation remains `;trigger + Space`; `/`, `\`, immediate activation, activation-mode Settings, and prefix-conflict enforcement remain declined explorations rather than roadmap work. M14-P.1 is accepted: Text planning/serialization is effectively instantaneous, guarded PNG preparation is efficient, native PNG serialization is optimized, JPEG/WebP retain genuine decode/re-encode semantics, quality is unchanged, and one-shot native startup remains an accepted future architectural opportunity unless a regression is introduced.

M14-O follows M14-P.4 with Decision 53 unchanged: Text-only generated metadata, provider-independent `GenerateSnippetTags`, versioned fingerprinting, strict normalization, explicit maximum-20/concurrency-one backfill, and lexical weights title 5/authored tags 3/content 1/valid generated tag 1. Usage remains excluded, Image Snippets remain excluded, and no production provider call is introduced. The final M14-P gate then confirms navigation, Library hierarchy/actions, deletion safety, Image editing, F1/F2, delivery performance, generated retrieval, regressions, documentation, and appropriate manual evidence before M15 begins.

## Rationale

These decisions keep the project focused on the long term and reduce the risk of overengineering in the early stages.
