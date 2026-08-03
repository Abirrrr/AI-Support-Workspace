import { describe, expect, it } from 'vitest';

import {
  InvalidSnippetTriggerError,
  isCanonicalSnippetTrigger,
  normalizeSnippetTrigger,
  SNIPPET_TRIGGER_MAX_LENGTH,
} from '../../src/application/snippet/snippet-trigger';

describe('Snippet trigger domain contract', () => {
  it.each([
    [';hello', ';hello'],
    [';refund2', ';refund2'],
    [';shopify-limit', ';shopify-limit'],
    [';A', ';a'],
    [`;${'a'.repeat(SNIPPET_TRIGGER_MAX_LENGTH - 1)}`, `;${'a'.repeat(31)}`],
  ])('normalizes valid trigger %s to canonical %s', (input, expected) => {
    expect(normalizeSnippetTrigger(input)).toBe(expected);
    expect(isCanonicalSnippetTrigger(expected)).toBe(true);
  });

  it.each([null, ''] as const)('maps %s to null', (input) => {
    expect(normalizeSnippetTrigger(input)).toBeNull();
  });

  it.each([
    ';',
    'hello',
    ' ;hello',
    ';hello ',
    ';hello_world',
    ';hÃ©llo',
    ';hello!',
    ';hello--world',
    ';hello-',
    `;${'a'.repeat(32)}`,
  ])('rejects noncanonical input %s without trimming', (input) => {
    expect(() => normalizeSnippetTrigger(input)).toThrow(
      InvalidSnippetTriggerError,
    );
    expect(isCanonicalSnippetTrigger(input)).toBe(false);
  });
});
