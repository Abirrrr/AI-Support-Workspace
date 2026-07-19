# UI Workflow

## 1. Purpose

This document describes the planned user workflows for the application from the user’s perspective. It is not a UI mockup and it is not a design specification. Its purpose is to define how a person moves through the product so that future implementation work can follow a consistent and documented experience.

This document is intentionally implementation-independent and should be read alongside the product vision, requirements, architecture, and engineering principles.

## 2. Primary Navigation

The product is organized around a small set of top-level areas:

- Support
- Knowledge Library
- Snippets
- Settings

These areas represent the primary navigation for the application.

Future functionality may be introduced later, but any additional navigation areas should be treated as future workflows rather than part of the current documented experience.

## 3. Support Workspace Workflow

The Support experience is the primary workflow for day-to-day assistance work.

```text
Open Extension

↓

Support Workspace

↓

Merchant Context

↓

Paste Images (optional)

↓

Gist / Guidance (optional)

↓

Retrieve Local Knowledge

↓

Generate

↓

Editable Output

↓

Copy Reply

↓

Save as Knowledge (optional)

↓

Save as Snippet (optional)
```

### Workflow Notes

- The user begins in a support-oriented workspace that is designed for speed and clarity.
- Merchant context is the central input for the support task.
- Images and guidance may be added when useful, but they remain optional.
- The system should help the user retrieve local knowledge before generating a reply.
- The generated response should be editable before it is used or shared.
- The user may save valuable content as knowledge or as a snippet for future reuse.

## 4. Knowledge Library Workflow

The Knowledge Library is the place where reusable support knowledge is created, maintained, and reused.

```text
Open Knowledge Library

↓

Create or Edit Knowledge

↓

Add Title, Content, and Tags

↓

Save Locally

↓

Search or Browse Knowledge

↓

Reuse in Support Workflow
```

### Workflow Notes

- Knowledge is created when the user wants to preserve a useful answer, reference, or explanation.
- Knowledge should be editable so the user can refine it over time.
- Knowledge should be searchable so the user can quickly find relevant material during support work.
- Knowledge is stored locally and remains available without a backend.
- Knowledge is intended to support the support experience rather than replace it.

## 5. Snippet Workflow

The Snippet workflow is focused on reusable short-form content such as canned replies, message fragments, or other response building blocks.

```text
Open Snippets

↓

Create Snippet

↓

Add Content and Organization Details

↓

Save Snippet

↓

Edit or Reuse Snippet

↓

Expand Snippet into Response
```

### Workflow Notes

- Snippets are intended for reusable short content.
- Knowledge and snippets are related but distinct: knowledge is broader and more contextual, while snippets are compact and reusable.
- Users should be able to create, edit, organize, and reuse snippets.
- Snippets should support future variable-based expansion, but that capability is not part of the current core workflow definition.

## 6. Keyboard Shortcut Workflow

The keyboard shortcut workflow is designed to make the extension feel fast and responsive during support work.

```text
Highlight Merchant Text

↓

Keyboard Shortcut

↓

Extension Opens

↓

Selected Text Becomes Merchant Context

↓

Ready to Generate
```

### Workflow Notes

- The user should be able to launch the extension quickly from the browser context.
- The selected text should become the starting point for merchant context.
- The shortcut workflow is intended to reduce friction and accelerate the support task.
- The exact shortcut key will be determined later.

## 7. AI Generation Workflow

The AI generation workflow describes the logical flow from context to draft output.

```text
Merchant Context

+

Images

+

Optional Gist

+

Retrieved Knowledge

↓

Prompt Builder

↓

Configured AI Provider

↓

Draft Reply
```

### Workflow Notes

- The workflow begins with the support context and any supporting information the user provides.
- Local knowledge may be used to enrich the request.
- The prompt builder creates a structured request for the chosen AI provider.
- The final result is a draft reply that the user can review and edit.
- This workflow remains provider-independent and should not depend on a specific implementation path.

## 8. Local Data Workflow

The application is local-first. User data should remain under local control and be available without a backend.

```text
Knowledge

↓

IndexedDB

Snippets

↓

IndexedDB

Settings

↓

IndexedDB
```

### Workflow Notes

- Knowledge, snippets, and settings are treated as local user data.
- The product should remain usable even when the user is offline.
- Local data access should be fast, predictable, and reliable.

## 9. Future Workflows

The following workflows are intentionally deferred and are not part of the current core user experience definition:

- Import Library
- Export Library
- Provider Selection
- Prompt Management
- History
- Advanced Search

These workflows should be documented separately when they become part of the planned product scope.
