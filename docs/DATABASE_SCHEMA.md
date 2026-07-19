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

## Current Status

No database implementation exists yet. This document is a planning artifact for future milestones.
