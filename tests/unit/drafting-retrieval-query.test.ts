import { describe, expect, it } from 'vitest';

import { buildDraftingRetrievalQuery } from '../../src/application/retrieval/drafting-retrieval-query';

describe('buildDraftingRetrievalQuery', () => {
  it.each([
    {
      name: 'Context only',
      input: { merchantContext: 'Current conversation' },
      expected: 'Current conversation',
    },
    {
      name: 'Gist only',
      input: { gist: 'Draft a concise reply' },
      expected: 'Draft a concise reply',
    },
    {
      name: 'Context and Gist',
      input: {
        merchantContext: 'Current conversation',
        gist: 'Draft a concise reply',
      },
      expected: 'Current conversation\n\nDraft a concise reply',
    },
    {
      name: 'surrounding whitespace',
      input: {
        merchantContext: ' \n Current conversation \t',
        gist: '\t Draft a concise reply \n',
      },
      expected: 'Current conversation\n\nDraft a concise reply',
    },
    { name: 'neither', input: {}, expected: '' },
    {
      name: 'whitespace only',
      input: { merchantContext: ' \t ', gist: '\n ' },
      expected: '',
    },
  ])('builds the lexical query for $name', ({ input, expected }) => {
    expect(buildDraftingRetrievalQuery(input)).toBe(expected);
  });

  it('joins two non-empty inputs with exactly two newline characters', () => {
    const result = buildDraftingRetrievalQuery({
      merchantContext: 'context',
      gist: 'gist',
    });

    expect(result).toBe('context\n\ngist');
    expect(result.match(/\n/g)).toHaveLength(2);
  });
});
