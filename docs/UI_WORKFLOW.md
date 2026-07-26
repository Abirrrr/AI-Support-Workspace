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
- The approved future Multimodal Context direction allows one or more screenshots or images to be pasted directly from the clipboard into the current Context alongside text. Attachments should be visible, previewable where appropriate, and removable before generation; reordering remains unresolved.
- Future Context images are transient by default and flow to AI generation only through a provider-independent capability boundary. Unsupported images must not be silently discarded.
- The system should help the user retrieve local knowledge before generating a reply.
- The generated response should be editable before it is used or shared.
- The user may save valuable content as knowledge or as a snippet for future reuse.
- Milestone 9 completed the first extension-owned global Chrome Side Panel Workspace with manual Merchant Context, manual Guidance, transient blank-initial model input, Generate, editable plain-text output, and Copy. It remains visible beside the active support website so the user does not switch to a standalone Workspace tab. Images, explicit reset, Save actions, shortcuts, page capture, and reply insertion remain outside M9.
- The popup remains a launcher. Open Workspace opens the global Side Panel for the current browser window from the direct user action; Open Libraries continues to open the options page, where Knowledge and Snippet CRUD remain.
- The Side Panel is global rather than site-specific or tab-configured. It does not read the active page, and normal Chrome Side Panel lifecycle behavior may discard its transient state when the panel page is closed, destroyed, or reloaded.

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

This workflow remains distinct from the Knowledge Library workflow. Snippets are compact, reusable response building blocks, while knowledge is broader contextual material intended to support troubleshooting and retrieval over time.

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
- The approved future Rich Snippet direction adds a Shortcut or Trigger field such as `;shopify-limit` and ordered structured content whose text, image/reference, and following text positions are preserved.
- Trigger expansion should replace only the typed trigger, preserve surrounding editor content, and place the caret predictably. Rich editors may receive inline images; plain-text editors require a deterministic positional fallback rather than silently losing image references.

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
- This application-level keyboard shortcut is distinct from future Snippet Trigger Expansion. M10 opens or invokes extension behavior through a key combination; typed text such as `;hello` expands saved Snippet content inside a supported editor.

## 7. AI Generation Workflow

The AI generation workflow describes the logical flow from context to draft output.

```text
Merchant Context

+

Optional Guidance

+

Transient Ollama Model

↓

OutputWorkflow

↓

Retrieval Engine

↓

Prompt Builder

↓

GenerationProvider

↓

OllamaProvider

↓

Editable Draft Reply

↓

Copy
```

### Workflow Notes

- The workflow begins with Merchant Context, Guidance, or both; retrieved Library material cannot independently define the current task.
- M9 `OutputWorkflow` constructs the deterministic Context-then-Guidance retrieval query, invokes Retrieval Engine, and supplies already-ranked Knowledge and Snippet results to Prompt Builder.
- Prompt Builder creates a structured provider-independent assembly; the implemented `OllamaProvider` owns Ollama-specific serialization and execution behind the project-owned generation boundary.
- Guidance has the highest dynamic authority, followed by Merchant Context, Knowledge, and Snippets.
- The final result is a draft reply that the user can review and edit.
- This workflow remains provider-independent and should not depend on a specific implementation path.
- M9 runs this workflow directly from the foreground Side Panel page with no background generation messaging. Inputs, model, output, and feedback remain transient while that panel instance is mounted and may be lost when Chrome closes, destroys, or reloads it.
- The Side Panel layout uses fluid available width, remains usable at normal narrow panel sizes without horizontal scrolling, permits vertical scrolling, and does not attempt to control Chrome's panel width.
- Generate is available only with non-whitespace Context or Guidance, a non-whitespace model, and no active request. Repeated Generate reruns the complete workflow; M9 has no separate Regenerate, Cancel, Clear, Save, history, or prompt-preview action.
- Prompt Builder's permanent provider-independent Instructions remain active whether Guidance is present or empty; Guidance is transient case-specific steering and does not replace those Instructions.
- Successful repeated generation replaces the previous draft, while a failed generation preserves the current editable draft. Copy writes the current edited output with line breaks intact from the direct user action and needs no clipboard permission.
- Manual Chrome validation passed for the complete Side Panel workflow, real local `qwen2.5:7b` generation, Guidance influence, edited-output Copy, repeated generation, safe provider and missing-model errors with draft preservation, and both Library regressions.
- Images shown in the broader planned Support workflow remain deferred from Prompt Builder v1 and require a later architecture decision.
- Multimodal Context Attachments are now an approved future product direction, while their Prompt Builder, provider-capability, serialization, limit, unsupported-provider, and persistence architecture remains deferred.

## 8. Local Data Workflow

The application is local-first. User data should remain under local control and be available without a backend.

```text
Knowledge

↓

Local persistence

Snippets

↓

Local persistence

Settings

↓

Local persistence
```

### Workflow Notes

- Knowledge, snippets, and settings are treated as local user data.
- The product should remain usable even when the user is offline.
- Local data access should be fast, predictable, and reliable.

## 9. Future Workflows

### Approved Unassigned Product Directions

- **Multimodal Context Attachments:** combine text with one or more transient clipboard screenshots or visual assets for capable generation providers, with attachment indication, preview, removal, and explicit unsupported-provider handling.
- **Rich Snippet Templates & Trigger Expansion:** expand semicolon triggers into ordered structured Snippet content through a destination-aware editor boundary, with safe positional fallback for editors that cannot insert rich content.

Context images provide transient visual information to generation. Snippet images are reusable Library-owned response content intended for editor expansion. Their domain ownership must remain separate.

The following potential workflows are not part of the current core user experience definition and require their own approved scope before implementation:

- Import Library
- Export Library
- Provider Selection
- Prompt Management
- Advanced Search

History is not an assumed workflow or feature. Whether it should be introduced remains an intentionally undecided future product decision.

Any future workflow should be documented separately when it becomes part of the approved product scope.
