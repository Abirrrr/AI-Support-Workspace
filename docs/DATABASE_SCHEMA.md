# Database Schema

## Purpose

This document defines the local data model and implemented physical persistence schema. Milestone 3 introduced version 1 for Knowledge and Snippets, Milestone 11 added the version 2 singleton Settings store, and M13 implemented version 3 with an optional unique Snippet-trigger index without rewriting either historical declaration.

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
- content: SnippetContent
- tags: string[]
- createdAt: string
- updatedAt: string
- trigger: string | null

`trigger` is the optional M13 plain-text expansion identity. A non-null value is stored in canonical lowercase, includes its leading semicolon, is unique, is 2–32 ASCII characters in total, and matches `^;[a-z0-9]+(?:-[a-z0-9]+)*$`. `null` means the Snippet has no expansion trigger.

M14's approved future domain content is one canonical discriminated union:

```ts
type SnippetContent =
  | { kind: 'plain'; text: string }
  | { kind: 'rich'; blocks: RichSnippetBlock[] };
```

Rich blocks are ordered paragraph blocks with ordered text/link inline nodes or image-reference blocks with a label and HTTP(S) URL. The exact implementation names may be refined, but the discriminated union, non-recursive project-owned structure, and prohibition on persisted HTML are fixed by Decision 36. Current source still implements `content: string`; this planned shape becomes live only through M14 implementation and Dexie version 4.

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

All version 1 and version 2 persisted fields are required. M13's version 3 physical Snippet record adds only an optional omitted-when-null `trigger` property as defined below.

## Approved Milestone 13 Physical Schema Migration

M13 advances database `ai-support-workspace` from Dexie schema version 2 to version 3. It preserves the historical version 1 and version 2 declarations and changes only the current `snippetEntries` declaration:

```text
knowledgeEntries: 'id, createdAt'
snippetEntries: 'id, createdAt, &trigger'
settings: 'id'
```

`&trigger` is a unique secondary index over canonical non-null triggers. A physical Snippet with no trigger omits the `trigger` property, because indexing a shared `null` value would conflict with uniqueness. The Dexie adapter maps an omitted physical property to domain `trigger: null` and maps domain `null` back to an omitted property. A non-null physical value is the canonical trigger string.

```ts
interface SnippetEntryRecordV3 {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  trigger?: string;
}
```

The forward-only version 2 to version 3 migration preserves every existing Knowledge, Snippet, and Settings record and does not synthesize a trigger. Existing Snippet records remain physically unchanged and read as `trigger: null`. No table, primary key, other field, or other index changes. Rollback to version 2 is unsupported.

## Approved Future Milestone 14 Physical Schema Migration

Implemented today: Dexie version 3.

Approved for M14 implementation: Dexie version 4.

Version 4 must preserve historical v1, v2, and v3 declarations unchanged and retain exactly the current indexes:

```text
knowledgeEntries: 'id, createdAt'
snippetEntries: 'id, createdAt, &trigger'
settings: 'id'
```

No new table, primary key, secondary index, compound index, or multi-entry index is approved. The future v4 physical Snippet record changes only `content` from a string to the exact canonical `SnippetContent` structure. Triggerless records still omit the indexed `trigger` property.

The forward-only v3-to-v4 migration must transform every existing record:

```text
content: <former string>

→

content: {
  kind: 'plain',
  text: <former string exactly>
}
```

It must preserve exactly the record's ID, title, tags and tag order, trigger, `createdAt`, and `updatedAt`. Migration alone must not normalize text, synthesize rich blocks, generate or remove a trigger, or rewrite a timestamp. The infrastructure mapper remains explicit between physical records and the project-owned domain; presentation, catalog, Retrieval Engine, and Prompt Builder code must not depend on Dexie record shape.

Dexie version 4 and this migration do not exist in the current source after M14-A. They are approved architecture for later implementation, beginning no earlier than M14-B.

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

- Create and update inputs require every caller-authored field for their entity. The persistence boundary supplies only `id`, `createdAt`, and `updatedAt`; M13 Snippet input includes explicit `trigger: string | null`.
- Milestone 3 defines no default title, body, content, source, or tag values.
- `tags` is required and may be an empty array. An empty array is stored as supplied. The persistence layer does not trim, deduplicate, rank, or otherwise reinterpret tags.
- Strings are stored as supplied. M14 content validation additionally enforces the exact discriminated structure, supported block/inline types, boolean mark fields, and approved URL protocols without interpreting HTML. Product validation such as non-empty content rules belongs to the product milestones that own the corresponding workflows.
- Update uses full replacement semantics for all caller-authored mutable fields. Knowledge Entry updates provide `title`, `body`, `tags`, and `source`; M13 Snippet Entry updates provide `title`, `content`, `tags`, and `trigger`.
- The Snippet application boundary validates and canonicalizes triggers before persistence. The adapter stores only canonical non-null values and omits the physical field for `null`; it does not trim, repair, or independently reinterpret trigger text.
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
  'title' | 'content' | 'tags' | 'trigger'
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
  findByTrigger(trigger: string): Promise<SnippetEntry | undefined>;
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

The Knowledge repository retains its existing operations. M13 adds only canonical `findByTrigger` lookup to the Snippet repository:

| Operation | Semantics |
| --- | --- |
| `create(input)` | Generates identity and timestamps, persists the record, and resolves with the complete created record. |
| `get(id)` | Resolves with the record when present or `undefined` when absent. |
| `list()` | Resolves with all records in the deterministic generic order defined above. |
| `findByTrigger(trigger)` | Resolves with the Snippet carrying the supplied canonical trigger or `undefined`; callers normalize and validate before lookup. |
| `update(id, input)` | Fully replaces caller-authored mutable fields, preserves `id` and `createdAt`, advances `updatedAt`, and resolves with the complete updated record. |
| `delete(id)` | Deletes the record and resolves with `true`; resolves with `false` when the record did not exist. |

The contract does not include fuzzy or prefix trigger search, retrieval ranking, pagination, synchronization, provider-specific operations, bulk operations, or cross-entity workflows.

## Error Behavior

- Missing `get` and `delete` targets are normal results represented by `undefined` and `false`, respectively.
- A missing Settings singleton is also normal: the Settings repository resolves `undefined`, and the application load boundary supplies `{ defaultModel: null }`.
- Updating a missing ID rejects with one project-owned `RecordNotFoundError` carrying the entity kind (`knowledgeEntry` or `snippetEntry`) and requested ID.
- Underlying IndexedDB or Dexie failures reject with a project-owned `PersistenceError` that preserves the original failure as its cause.
- A unique-index conflict maps to a focused duplicate-trigger application error so create, edit, and restore never expose raw Dexie constraint details. Preflight duplicate checks improve UI feedback, while the unique index remains authoritative for races.
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
- Version 3 adds only optional Snippet `trigger` data and unique index `&trigger`, preserves every version 2 record without generating triggers, and does not support rollback to version 2.
- Approved future version 4 changes only Snippet `content` from a string to canonical `SnippetContent`, preserves every other logical field and the version 3 indexes, adds no table, and does not support rollback to version 3. Version 4 is not implemented by M14-A.

## Storage Approach

Dexie is the approved storage abstraction over browser-local IndexedDB. Application and domain layers depend on project-owned storage contracts rather than Dexie directly. The schema remains intentionally minimal; search and retrieval access patterns and any indexes they require belong to later milestones.

The version 1 physical schema, Knowledge and Snippet persistence contracts, error behavior, transaction policy, and test environment were implemented in Milestone 3 as approved. M11 implemented the version 2 Settings addition. M13 implemented the focused version 3 Snippet-trigger extension described above. M14-A approves version 4 without implementing it. Dexie configuration remains centralized in the infrastructure layer.

## Milestone 12 Backup and Restore Contract

M12 does not change the physical database. Database `ai-support-workspace` remains schema version 2 with the existing `knowledgeEntries`, `snippetEntries`, and `settings` stores and indexes. The public backup format is an independently versioned application DTO, not a dump of Dexie tables.

Version 1 contains required top-level `format`, `formatVersion`, `exportedAt`, and `data` keys. Its `data` object contains exactly:

- `knowledge`: records with exactly `id`, `title`, `body`, `tags`, `createdAt`, `updatedAt`, and `source`.
- `snippets`: records with exactly `id`, `title`, `content`, `tags`, `createdAt`, and `updatedAt`.
- `settings`: always present with exactly `defaultModel: string | null`.

The physical Settings singleton identity `{ id: 'global' }`, table names, database name, schema version, and indexes are not exported. Infrastructure resolves an absent Settings record to the public `null` default and recreates the physical `global` identity during restore. No transient Workspace state or future M14/M15 field enters version 1.

A focused backup snapshot reader obtains a logically consistent read of all three domains for export. A focused transactional restore port accepts already parsed and validated trusted application data. The parser and validator perform no persistence. React never accesses Dexie.

Restore is replace-only. After complete validation, infrastructure clears and writes Knowledge, Snippets, and Settings in one Dexie read/write transaction covering all three stores. A write failure aborts and rolls back the transaction so existing data remains unchanged. Ordinary repository create or update methods are not used because restore must preserve imported UUIDs, `createdAt`, `updatedAt`, text, tag order, Knowledge `source`, and Settings exactly. `defaultModel: null` clears the saved default. Empty valid Library arrays clear their corresponding stores.

Export orders public Knowledge and Snippet arrays deterministically by `createdAt` ascending and then `id` ascending. Restore equivalence concerns logical record content, not IndexedDB iteration order. Backup format evolution is separate from database migration: future database versions must not redefine version 1, and future format migration belongs at the import boundary.

M12 introduced no new store, field, index, migration, rollback path, storage technology, permission, dependency, or configuration. M13 now explicitly supersedes only the earlier “future field” deferral by approving database version 3 and Backup Format v2; it does not redefine frozen Backup Format v1.

## Milestone 13 Backup Format Evolution

Backup Format v1 remains byte-contract frozen: its Snippet DTO still has exactly `id`, `title`, `content`, `tags`, `createdAt`, and `updatedAt`. The importer continues accepting valid v1 files and maps each trusted v1 Snippet to the current domain with `trigger: null` before the transactional restore port.

After M13 implementation, every new export uses `formatVersion: 2`. The envelope identifier, `exportedAt`, Knowledge DTO, Settings DTO, ordering, filename, 25 MiB limits, explicit mapping, validation security, preview, acknowledgement, and replace-only transaction policy remain unchanged. A version 2 Snippet DTO contains exactly:

- `id: string`
- `title: string`
- `content: string`
- `tags: string[]`
- `createdAt: string`
- `updatedAt: string`
- `trigger: string | null`

The `trigger` key is required even when `null`. A non-null value must already be canonical lowercase, satisfy the M13 pattern and length, and be unique across the complete v2 Snippet array. Version 2 validation rejects missing or unexpected keys, noncanonical or duplicate triggers, invalid values, and unsupported future versions without normalization or repair.

Both v1 and v2 import paths construct trusted current-domain records before persistence. Restore remains one atomic Dexie read/write transaction across Knowledge, Snippets, and Settings; v1 sets every Snippet trigger to `null` and triggers an explicit preview warning, while v2 preserves each trigger exactly. The adapter maps `null` to an omitted physical property and non-null to the unique indexed property. Any validation or persistence failure preserves all existing data.

## Approved Milestone 14 Backup Format Evolution

Backup Format v1 and v2 are permanently frozen and remain importable. Their string `content` contracts do not change when the domain migrates. V1 import maps the exact string to `{ kind: 'plain', text }`, maps the trigger to `null`, and retains its existing trigger warning. V2 import maps the exact string to plain content and preserves the validated v2 trigger.

After M14 implementation, new exports will use Backup Format v3. V3 keeps the existing envelope identifier, Knowledge data, Settings data, exported timestamp, deterministic order, filename, 25 MiB limits, metadata-only preview, acknowledgement, replace-only restore, and atomic transaction guarantees. Each exact v3 Snippet DTO contains the existing ID, title, tags, timestamps, and trigger plus the exact discriminated plain or rich content. Dedicated v3 DTOs and field-by-field mappings must remain independent of live domain objects and physical Dexie records; record-level object spreads are prohibited at this versioned public boundary.

Untrusted v3 import strictly validates exact keys and version; record identity and timestamps; duplicate IDs and triggers; content discriminants; exact block, inline, mark, and reference types; strings and boolean mark fields; and allowed URL protocols. An unknown or malformed block, inline, mark, reference, URL, or future field rejects the entire file. The importer performs no repair, HTML interpretation, or partial persistence. Backup Format v3 is approved but not implemented by M14-A.

## Future Capability Guidance

### Structured Knowledge

Knowledge should evolve beyond a single body-text field into structured troubleshooting knowledge. The exact structure must be decided and documented in the milestone that introduces it rather than assumed by this planning document.

### Richer Snippets

M14 extends the M13 Snippet and trigger foundation with the Decision 36 structured model, URL-reference-only images, and deterministic fallback. Local binary assets, variables, categories, usage statistics, additional block types, and rich-to-plain conversion remain future decisions.

### Prompt Templates

Prompt Templates are a future persistent entity for reusable prompt configuration. Their schema and implementation milestone have not yet been decided.

### History

History is an intentionally undecided future capability. It is not an assumed feature, persistent entity, or commitment in the current roadmap.

## Current Status

Milestones 3 through 13 are complete. Database `ai-support-workspace` currently uses implemented schema version 3 with unchanged `knowledgeEntries` and `settings` declarations plus `snippetEntries: 'id, createdAt, &trigger'`. The version 2-to-3 migration preserves Knowledge, existing Snippets, and Settings; triggerless physical records omit the indexed property and map to domain `null`. Backup Format v2 preserves triggers while valid version 1 imports remain supported with null triggers. M14-A approves Dexie version 4 and Backup Format v3, but neither exists in source yet; string Snippet content remains implemented. The existing Ollama, Workspace, shortcut, and M12/M13 integrity boundaries remain unchanged. The completed M13 implementation is at checkpoint `b76fcb4`, with closeout checkpoint `9a3c7ef`.
