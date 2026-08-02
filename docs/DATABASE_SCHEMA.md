# Database Schema

## Purpose

This document defines the local data model and implemented physical persistence schema. Milestone 3 introduced version 1 for Knowledge and Snippets, and Milestone 11 added the approved version 2 singleton Settings store without modifying the version 1 declarations.

## Planned Domain Schema

The planned domain schema describes approved product entities and fields. It does not imply that every planned entity receives a physical table in Milestone 3.

### Knowledge Entry

Represents a reusable knowledge item that can be retrieved during support workflows.

Fields:

- id: string
- title: string
- body: string
- tags: string[]
- createdAt: string
- updatedAt: string
- source: string

### Snippet Entry

Represents a reusable response snippet or canned reply.

Fields:

- id: string
- title: string
- content: string
- tags: string[]
- createdAt: string
- updatedAt: string

### Settings

Represents the single local, extension-wide Settings aggregate approved for Milestone 11.

Fields:

- defaultModel: string | null

`defaultModel` is an opaque Ollama model identifier after leading and trailing whitespace are trimmed. `null` means that no default is saved and a new Workspace Side Panel session starts with a blank transient model field. M11 adds no provider, provider-base-URL, theme, shortcut, writing-preference, credential, or arbitrary key/value setting.

The application-owned aggregate does not expose persistence identity. Milestone 11 implemented the physical singleton record and typed Settings persistence contract described below in database version 2.

## Milestone 3 Physical Schema

### Database Identity and Version

- IndexedDB/Dexie database name: `ai-support-workspace`
- Initial physical schema version: `1`
- Version 1 is the first physical schema; there is no historical migration into it.
- The database is extension-owned, local-only, and must not use the legacy AI Reply Assistant database identity.

Version 1 is a permanent historical schema declaration after implementation. Every future physical schema change requires explicit version consideration and must not silently rewrite the version 1 declaration.

### Physical Tables

| Dexie store name | Record type | Primary key | Secondary indexes | Compound indexes | Multi-entry indexes |
| --- | --- | --- | --- | --- | --- |
| `knowledgeEntries` | Knowledge Entry | `id` | `createdAt` | None | None |
| `snippetEntries` | Snippet Entry | `id` | `createdAt` | None | None |

The `id` primary keys are inbound string keys. They are not auto-incrementing. `createdAt` is the only secondary index because it supports the deterministic generic list operation required by the initial persistence contract.

The exact Dexie version 1 store declaration is:

```text
knowledgeEntries: 'id, createdAt'
snippetEntries: 'id, createdAt'
```

No title, body, content, source, `updatedAt`, compound, or multi-entry indexes are approved for version 1. In particular, `tags` is not a multi-entry index: tag search and retrieval belong to later milestones and must justify their physical indexes when those access patterns are implemented.

### Persisted Record Shapes

The `knowledgeEntries` table stores exactly the approved Knowledge Entry fields:

- `id: string`
- `title: string`
- `body: string`
- `tags: string[]`
- `createdAt: string`
- `updatedAt: string`
- `source: string`

The `snippetEntries` table stores exactly the approved Snippet Entry fields:

- `id: string`
- `title: string`
- `content: string`
- `tags: string[]`
- `createdAt: string`
- `updatedAt: string`

## Implemented Milestone 11 Physical Schema

Milestone 11 incremented the Dexie schema from version 1 to version 2. Version 2 preserves the existing `knowledgeEntries` and `snippetEntries` declarations exactly and adds only:

```text
settings: 'id'
```

The `settings` table contains at most one physical record:

```ts
interface SettingsRecord {
  id: 'global';
  defaultModel: string | null;
}
```

`id` is the inbound primary key. The literal singleton identity is `global`. No secondary, compound, or multi-entry index is approved. The record has no timestamps because singleton load/save behavior does not require ordering or audit metadata, and the existing timestamp rules are entity-specific rather than a universal repository requirement.

The version 1 to version 2 migration performs no Knowledge or Snippet transformation and preserves every existing Library record. It does not create a Settings record automatically. Absence of the singleton record is normal and is resolved by the application layer to `{ defaultModel: null }`. Dexie schema rollback from version 2 to version 1 is not supported; migration is forward-only. No other table, field, or index changes were made in M11.

All persisted fields are required. Milestone 3 does not add fields to either record type.

## Record Identity

- Record IDs are UUID strings generated with the browser-native `crypto.randomUUID()` API.
- The project-owned repository creates the ID during `create`; callers do not supply IDs for new records.
- IDs are local, provider-independent, immutable after creation, and require no external service.
- An `update` operation identifies its target by ID but cannot replace the stored ID.

## Timestamp Semantics

- `createdAt` and `updatedAt` are UTC ISO 8601 strings produced in the same form as `Date.prototype.toISOString()`.
- The repository assigns both timestamps during creation. They have the same value on the newly created record.
- `createdAt` is immutable.
- Every successful update assigns a new `updatedAt` value. The value must be strictly later than the record's previous `updatedAt`; if clock resolution would repeat or move backward, the repository advances the previous timestamp by one millisecond.
- Failed or missing-record updates do not change timestamps.

## Defaults and Record Semantics

- Create and update inputs require every caller-authored field for their entity. The persistence boundary supplies only `id`, `createdAt`, and `updatedAt`.
- Milestone 3 defines no default title, body, content, source, or tag values.
- `tags` is required and may be an empty array. An empty array is stored as supplied. The persistence layer does not trim, deduplicate, rank, or otherwise reinterpret tags.
- Strings are stored as supplied. Product validation such as non-empty content rules belongs to the product milestones that own the corresponding workflows.
- Update uses full replacement semantics for all caller-authored mutable fields. Knowledge Entry updates provide `title`, `body`, `tags`, and `source`; Snippet Entry updates provide `title`, `content`, and `tags`.
- Generic `list` results are ordered by `createdAt` ascending, then by `id` ascending when timestamps are equal. This is deterministic storage ordering, not relevance ranking.

## Project-Owned Persistence Contracts

Milestone 3 defines separate typed `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts. Milestone 11 adds a minimal typed `SettingsRepository`. Dexie types, record identity, and APIs must not appear in these public project-owned interfaces.

The contract shapes are:

```ts
type KnowledgeEntryInput = Pick<
  KnowledgeEntry,
  'title' | 'body' | 'tags' | 'source'
>;

type SnippetEntryInput = Pick<
  SnippetEntry,
  'title' | 'content' | 'tags'
>;

interface KnowledgeEntryRepository {
  create(input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  get(id: string): Promise<KnowledgeEntry | undefined>;
  list(): Promise<readonly KnowledgeEntry[]>;
  update(id: string, input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  delete(id: string): Promise<boolean>;
}

interface SnippetEntryRepository {
  create(input: SnippetEntryInput): Promise<SnippetEntry>;
  get(id: string): Promise<SnippetEntry | undefined>;
  list(): Promise<readonly SnippetEntry[]>;
  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry>;
  delete(id: string): Promise<boolean>;
}

interface Settings {
  defaultModel: string | null;
}

interface SettingsRepository {
  load(): Promise<Settings | undefined>;
  save(settings: Settings): Promise<Settings>;
}
```

`SettingsRepository.load()` returns `undefined` when the physical singleton record is absent. A focused application load service resolves that normal result to `{ defaultModel: null }`. `save()` upserts the one global record and returns the saved application aggregate. A focused save service trims leading and trailing model whitespace, saves a non-empty result, and saves `null` for empty or whitespace-only input. No Settings list, create, update-by-ID, delete, search, or generic CRUD operation is approved.

The Knowledge and Snippet repositories expose only these operations:

| Operation | Semantics |
| --- | --- |
| `create(input)` | Generates identity and timestamps, persists the record, and resolves with the complete created record. |
| `get(id)` | Resolves with the record when present or `undefined` when absent. |
| `list()` | Resolves with all records in the deterministic generic order defined above. |
| `update(id, input)` | Fully replaces caller-authored mutable fields, preserves `id` and `createdAt`, advances `updatedAt`, and resolves with the complete updated record. |
| `delete(id)` | Deletes the record and resolves with `true`; resolves with `false` when the record did not exist. |

The contract does not include search, retrieval, ranking, pagination, synchronization, provider-specific operations, bulk operations, or cross-entity workflows.

## Error Behavior

- Missing `get` and `delete` targets are normal results represented by `undefined` and `false`, respectively.
- A missing Settings singleton is also normal: the Settings repository resolves `undefined`, and the application load boundary supplies `{ defaultModel: null }`.
- Updating a missing ID rejects with one project-owned `RecordNotFoundError` carrying the entity kind (`knowledgeEntry` or `snippetEntry`) and requested ID.
- Underlying IndexedDB or Dexie failures reject with a project-owned `PersistenceError` that preserves the original failure as its cause.
- Persistence failures are never silently swallowed.
- Settings load/save presentation maps persistence failures to the exact safe M11 messages without exposing the raw error or cause. M11 does not introduce a broader application error framework.

## Transaction Policy

- Single-call, single-table CRUD relies on Dexie's transaction behavior.
- An update may use one focused single-table read-write transaction when required to preserve immutable fields, validate target existence, and return the resulting record atomically.
- Milestone 3 introduces no multi-table transaction or cross-entity atomic workflow.
- Future workflows that require atomic changes across records or entities must define their transaction boundary when those workflows are approved.

## Automated Test Environment

`fake-indexeddb` is approved as a development/test-only IndexedDB adapter for Vitest persistence integration tests. It must never be imported by production modules or used as extension persistence.

Tests supply `fake-indexeddb`'s `indexedDB` and matching `IDBKeyRange` implementations through the centralized database-construction boundary. Production construction supplies neither override and therefore uses the browser's native IndexedDB globals.

Persistence tests must use isolated database names or delete their test database before and after each test, close database instances deterministically, and never access extension or user data. Reopen tests must close one Dexie instance and open a new instance against the same isolated test database name.

Milestone 3 validation passed all 13 persistence integration tests, including database close-and-reopen coverage. The full project Vitest suite passed with 4 files and 15 tests, and `fake-indexeddb` remains confined to test code.

## Migration Policy

- Version 1 is the initial physical schema and has no historical migration.
- Every later physical schema change requires explicit Dexie version consideration and, where applicable, a version increment.
- Future migrations must preserve existing user data unless a documented pre-release exception is explicitly approved.
- Existing version declarations must not be silently rewritten to apply later schema changes.
- No migration implementation was required for the initial version 1 schema. M11 implemented the first migration when it introduced a physical schema change.
- Version 2 adds only the singleton `settings` table, preserves the two version 1 stores and all their records, performs no Library transformation, creates no default record, and does not support rollback to version 1.

## Storage Approach

Dexie is the approved storage abstraction over browser-local IndexedDB. Application and domain layers depend on project-owned storage contracts rather than Dexie directly. The schema remains intentionally minimal; search and retrieval access patterns and any indexes they require belong to later milestones.

The version 1 physical schema, Knowledge and Snippet persistence contracts, error behavior, transaction policy, and test environment were implemented in Milestone 3 as approved. M11 implemented the version 2 Settings addition described above without changing the version 1 declarations or existing Library contracts. Dexie configuration remains centralized in the infrastructure layer.

## Future Capability Guidance

### Structured Knowledge

Knowledge should evolve beyond a single body-text field into structured troubleshooting knowledge. The exact structure must be decided and documented in the milestone that introduces it rather than assumed by this planning document.

### Richer Snippets

Snippets should eventually support reusable text with metadata such as variables, categories, and usage statistics. The exact field design remains a future decision.

### Prompt Templates

Prompt Templates are a future persistent entity for reusable prompt configuration. Their schema and implementation milestone have not yet been decided.

### History

History is an intentionally undecided future capability. It is not an assumed feature, persistent entity, or commitment in the current roadmap.

## Current Status

Milestones 3 through 11 are complete. Database `ai-support-workspace` now uses schema version 2 with unchanged `knowledgeEntries` and `snippetEntries` stores plus the singleton `settings` store. Automated migration coverage proved that representative version 1 Knowledge and Snippet records survive unchanged, no Settings record is created automatically, `global` saves and reloads across reopen, and `null` remains a persisted clear state. The M9 Output Workspace and M10 Keyboard Shortcut still keep Context, Guidance, generated or edited Output, capture results, delivery IDs, status, and feedback transient; only the optional default model is persisted through Settings. M12 — Import / Export is current and has not defined another schema change.
