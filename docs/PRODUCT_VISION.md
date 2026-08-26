# Product Vision

## Purpose

This project is a local-first, Chrome-based AI support workspace that helps support agents work faster with reusable Text Snippet reference material, contextual drafting inputs, and AI-assisted drafting.

## Product Definition

The product is intended to be:

- Local-first
- A Chrome extension
- An AI-assisted support workspace
- One active user-managed Text Snippet reference/delivery Library, plus Image Snippet delivery assets
- Optimized for fast local retrieval
- Provider-independent, with Ollama as the initial implementation target and OpenAI as a future provider
- Backend-free and cloud-free
- Fully local in storage and execution
- Primarily tailored to Intercom support workflows

## Core User Value

The product should reduce the time required to find the right information, reuse proven replies, and compose support responses with AI assistance without sending sensitive data to an external service.

The implemented Knowledge Library remains available before M14-P.4. Decision 56 assigns its active-navigation/UI hiding to M14-P.4 without destructive deletion or migration; underlying data, schema, code, tests, and Backup/import support remain until separately approved cleanup work.

## Guiding Principles

- User data stays local whenever possible.
- The experience should be fast, lightweight, and responsive.
- The first version should favor a simple architecture that is easy to reason about and extend.
- The product should remain useful even if the AI provider changes.

## Milestone 0 Non-Goals

Milestone 0 did not implement the product experience itself. It did not create a Chrome extension UI, an AI provider integration, a local database, or any business-facing features.
