// @vitest-environment jsdom

import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { RichSnippetContent } from '../../src/domain/snippet-content';
import {
  isRichSnippetDraftValid,
  RichSnippetEditor,
} from '../../src/ui/snippet/RichSnippetEditor';

function EditorHarness({ initial }: { initial: RichSnippetContent }) {
  const [content, setContent] = useState(initial);
  return (
    <>
      <RichSnippetEditor content={content} onChange={setContent} />
      <output data-testid="content-state">{JSON.stringify(content)}</output>
    </>
  );
}

function currentContent(): RichSnippetContent {
  return JSON.parse(screen.getByTestId('content-state').textContent ?? '');
}

afterEach(cleanup);

describe('RichSnippetEditor', () => {
  it('loads ordered blocks, inline order, marks, links, and image references', () => {
    const content: RichSnippetContent = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Start ', bold: true, italic: false },
            {
              type: 'link',
              text: 'guide',
              url: 'mailto:help@example.com',
              bold: false,
              italic: true,
            },
          ],
        },
        {
          type: 'reference',
          referenceType: 'image',
          label: 'Diagram',
          url: 'https://example.com/diagram.png',
        },
      ],
    };
    render(<EditorHarness initial={content} />);

    expect(screen.getByText('Paragraph 1')).toBeTruthy();
    expect(screen.getByText('Image reference 2')).toBeTruthy();
    expect(screen.getByLabelText('Text')).toHaveProperty('value', 'Start ');
    expect(screen.getByLabelText('Link text')).toHaveProperty('value', 'guide');
    expect(
      screen
        .getByLabelText('Bold paragraph 1 segment 1')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen
        .getByLabelText('Italic paragraph 1 segment 2')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getAllByLabelText('URL')[0]).toHaveProperty(
      'value',
      'mailto:help@example.com',
    );
    expect(screen.getByLabelText('Label')).toHaveProperty('value', 'Diagram');
    expect(currentContent()).toEqual(content);
    expect(document.querySelector('img')).toBeNull();
  });

  it('adds, edits, and removes paragraph blocks without a minimum-block rule', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Paragraph text' },
    });
    expect(currentContent().blocks).toEqual([
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Paragraph text',
            bold: false,
            italic: false,
          },
        ],
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove block 1' }));
    expect(currentContent().blocks).toEqual([]);
    expect(screen.getByText(/has no blocks/)).toBeTruthy();
  });

  it('applies and removes bold and italic, including combined marks', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    const bold = screen.getByLabelText('Bold paragraph 1 segment 1');
    const italic = screen.getByLabelText('Italic paragraph 1 segment 1');

    fireEvent.click(bold);
    fireEvent.click(italic);
    expect(currentContent().blocks[0]).toMatchObject({
      children: [{ bold: true, italic: true }],
    });
    fireEvent.click(bold);
    fireEvent.click(italic);
    expect(currentContent().blocks[0]).toMatchObject({
      children: [{ bold: false, italic: false }],
    });
  });

  it('creates, edits, validates, and removes links while retaining text and marks', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Support guide' },
    });
    fireEvent.click(screen.getByLabelText('Bold paragraph 1 segment 1'));
    fireEvent.click(
      screen.getByLabelText('Convert paragraph 1 segment 1 to link'),
    );

    const url = screen.getByLabelText('URL');
    expect(url.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(url, { target: { value: 'https://example.com/guide' } });
    expect(screen.queryByText(/valid HTTP, HTTPS, or mailto/)).toBeNull();
    expect(isRichSnippetDraftValid(currentContent())).toBe(true);
    expect(currentContent().blocks[0]).toMatchObject({
      children: [
        {
          type: 'link',
          text: 'Support guide',
          url: 'https://example.com/guide',
          bold: true,
          italic: false,
        },
      ],
    });

    fireEvent.change(url, { target: { value: 'javascript:alert(1)' } });
    expect(screen.getByText(/valid HTTP, HTTPS, or mailto/)).toBeTruthy();
    expect(isRichSnippetDraftValid(currentContent())).toBe(false);
    fireEvent.change(url, { target: { value: 'mailto:help@example.com' } });
    fireEvent.click(
      screen.getByLabelText('Remove link from paragraph 1 segment 1'),
    );
    expect(currentContent().blocks[0]).toMatchObject({
      children: [
        {
          type: 'text',
          text: 'Support guide',
          bold: true,
          italic: false,
        },
      ],
    });
  });

  it('adds and removes inline segments in deterministic order', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Before ' },
    });
    fireEvent.click(screen.getByLabelText('Add link to paragraph 1'));
    fireEvent.change(screen.getByLabelText('Link text'), {
      target: { value: 'details' },
    });
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'http://example.com/details' },
    });
    fireEvent.click(screen.getByLabelText('Add text segment to paragraph 1'));
    const textareas = screen.getAllByLabelText('Text');
    const trailingText = textareas[1];
    if (trailingText === undefined) throw new Error('Missing trailing text.');
    fireEvent.change(trailingText, { target: { value: ' after' } });

    expect(currentContent().blocks[0]).toMatchObject({
      children: [
        { type: 'text', text: 'Before ' },
        { type: 'link', text: 'details' },
        { type: 'text', text: ' after' },
      ],
    });
    fireEvent.click(screen.getByLabelText('Remove paragraph 1 segment 2'));
    expect(currentContent().blocks[0]).toMatchObject({
      children: [
        { type: 'text', text: 'Before ' },
        { type: 'text', text: ' after' },
      ],
    });
  });

  it('authors image references structurally, rejects unsafe URLs, and renders no image', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Add image reference' }),
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Product diagram' },
    });
    const url = screen.getByLabelText('URL');
    fireEvent.change(url, { target: { value: 'data:image/png;base64,AA==' } });
    expect(screen.getByText(/valid HTTP or HTTPS URL/)).toBeTruthy();
    expect(isRichSnippetDraftValid(currentContent())).toBe(false);
    fireEvent.change(url, {
      target: { value: 'https://example.com/product.png' },
    });
    expect(currentContent().blocks[0]).toEqual({
      type: 'reference',
      referenceType: 'image',
      label: 'Product diagram',
      url: 'https://example.com/product.png',
    });
    expect(document.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove block 1' }));
    expect(currentContent().blocks).toEqual([]);
  });

  it('renders a non-fetching local-image guard without exposing or flattening its asset ID', () => {
    const assetId = '123e4567-e89b-42d3-a456-426614174000';
    render(
      <EditorHarness
        initial={{
          kind: 'rich',
          blocks: [{ type: 'image', assetId, altText: 'Receipt' }],
        }}
      />,
    );

    expect(screen.getByText('Local image asset')).toBeTruthy();
    expect(screen.getByText('Alternative text: Receipt')).toBeTruthy();
    expect(
      screen.getByLabelText('Rich snippet content editor').textContent,
    ).not.toContain(assetId);
    expect(document.querySelector('img')).toBeNull();
    expect(isRichSnippetDraftValid(currentContent())).toBe(true);
    expect(screen.queryByLabelText('Move block 1 up')).toBeNull();
    expect(screen.queryByLabelText('Move block 1 down')).toBeNull();
    expect(screen.queryByLabelText('Remove block 1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    expect(currentContent().blocks[0]).toEqual({
      type: 'image',
      assetId,
      altText: 'Receipt',
    });
  });

  it('moves blocks with keyboard-operable buttons and disables boundaries', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'First' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Add image reference' }),
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Second' },
    });
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://example.com/second.png' },
    });

    expect(screen.getByLabelText('Move block 1 up')).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByLabelText('Move block 2 down')).toHaveProperty(
      'disabled',
      true,
    );
    fireEvent.click(screen.getByLabelText('Move block 2 up'));
    expect(currentContent().blocks.map((block) => block.type)).toEqual([
      'reference',
      'paragraph',
    ]);
    fireEvent.click(screen.getByLabelText('Move block 1 down'));
    expect(currentContent().blocks.map((block) => block.type)).toEqual([
      'paragraph',
      'reference',
    ]);
  });

  it('keeps pasted or typed markup as inert readable text', () => {
    render(<EditorHarness initial={{ kind: 'rich', blocks: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add paragraph' }));
    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: '<strong onclick="run()">Readable</strong>' },
    });

    expect(currentContent().blocks[0]).toMatchObject({
      children: [
        {
          type: 'text',
          text: '<strong onclick="run()">Readable</strong>',
        },
      ],
    });
    expect(document.querySelector('[contenteditable]')).toBeNull();
    expect(document.querySelector('strong')).toBeNull();
  });
});
