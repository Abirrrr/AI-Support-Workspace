# Architecture

## Architectural Intent

The architecture for this project is intentionally simple. The repository should remain easy to navigate, easy to test, and easy to evolve without introducing unnecessary layers.

## High-Level Structure

The project is expected to evolve around a small set of responsibilities:

- Extension shell: hosts the user experience in the browser.
- Local storage layer: persists knowledge, snippets, and settings locally.
- Retrieval engine: searches and ranks relevant content quickly.
- Prompt builder: constructs provider-independent request payloads.
- Provider adapters: connect the system to Ollama first and OpenAI later.
- Output workspace: lets the user review and refine generated content.

## Design Principles

- No microservices.
- No unnecessary abstraction.
- No provider-specific logic leaking into business logic.
- No premature plugin systems.
- Performance is a primary design goal.
- Business logic should remain independent from specific AI providers.

## Technical Direction

- The extension should remain self-contained as much as possible.
- Local data persistence should be the default path.
- Any provider integration should be kept behind a narrow interface.
- The system should be designed for fast local retrieval rather than complex orchestration.

## Current Status

The architecture is documented at a planning level only. No implementation modules are present yet.
