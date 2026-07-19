# Database Schema

## Purpose

This document describes the planned local data model for the project. The current milestone does not implement persistence, but the schema should guide future development.

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

The initial implementation should use a local database stored on the machine. The schema should remain simple and support fast retrieval by keyword and tag.

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

No database implementation exists yet. This document is a planning artifact for future milestones.
