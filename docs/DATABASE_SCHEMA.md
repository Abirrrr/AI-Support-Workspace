# Database Schema

## Purpose

This document describes the planned local data model for the project. Persistence is not implemented yet. Milestone 3 — Local Database is current, and this planning document must guide its exact Principal Engineer implementation task.

## Core Entities

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

Represents user preferences and extension configuration.

Fields:

- id: string
- provider: string
- providerBaseUrl: string
- model: string
- theme: string
- shortcutsEnabled: boolean

## Storage Approach

Dexie is the approved storage abstraction over browser-local IndexedDB. Application and domain layers will depend on project-owned storage contracts rather than Dexie directly. The schema should remain simple and support fast retrieval by keyword and tag.

Dexie table definitions, schema versions, indexes, migrations, and transaction boundaries remain planning work for the storage milestone. No schema is implemented by the platform architecture milestone.

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

No database implementation exists yet. Milestone 3 — Local Database is current; schema versions, tables, indexes, migrations, and transaction boundaries require an approved implementation task before they are introduced.
