// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import type {
  SnippetAsset,
  SnippetAssetMimeType,
} from '../../src/domain/snippet-asset';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import { SnippetLibraryView } from '../../src/ui/snippet/SnippetLibraryView';

const CREATED = '2026-08-09T00:00:00.000Z';
const SNIPPET_ID = '123e4567-e89b-42d3-a456-426614174000';
const ASSET_ID = '223e4567-e89b-42d3-a456-426614174000';
const SECOND_ASSET_ID = '523e4567-e89b-42d3-a456-426614174000';

const plain: SnippetEntry = {
  id: SNIPPET_ID,
  title: 'Welcome response',
  content: { kind: 'plain', text: 'Hello\nthere' },
  tags: ['greeting'],
  trigger: ';welcome',
  createdAt: CREATED,
  updatedAt: CREATED,
};
const rich: SnippetEntry = {
  ...plain,
  id: '323e4567-e89b-42d3-a456-426614174000',
  title: 'Widget setup',
  content: {
    kind: 'rich',
    blocks: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Open settings', bold: true, italic: false },
        ],
      },
    ],
  },
};
const linkedRich: SnippetEntry = {
  ...rich,
  id: '723e4567-e89b-42d3-a456-426614174000',
  title: 'Linked setup',
  content: {
    kind: 'rich',
    blocks: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            text: 'Open help',
            url: 'https://example.com/help',
            bold: false,
            italic: false,
          },
          { type: 'text', text: ' safely', bold: false, italic: false },
        ],
      },
    ],
  },
};
const imageEntry: SnippetEntry = {
  ...plain,
  id: '423e4567-e89b-42d3-a456-426614174000',
  title: 'Limitation screenshot',
  content: { kind: 'image', assetId: ASSET_ID },
  trigger: ';limitation',
};
const secondImageEntry: SnippetEntry = {
  ...imageEntry,
  id: '623e4567-e89b-42d3-a456-426614174000',
  title: 'Second screenshot',
  content: { kind: 'image', assetId: SECOND_ASSET_ID },
  trigger: ';second-image',
};

function bytesFor(mimeType: SnippetAssetMimeType): number[] {
  if (mimeType === 'image/png')
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (mimeType === 'image/jpeg') return [0xff, 0xd8, 0xff];
  return [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
}

function localFile(
  mimeType: SnippetAssetMimeType,
  filename = 'capture.bin',
): File {
  const file = new File([Uint8Array.from(bytesFor(mimeType))], filename, {
    type: mimeType,
  });
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => Uint8Array.from(bytesFor(mimeType)).buffer,
  });
  return file;
}

function asset(overrides: Partial<SnippetAsset> = {}): SnippetAsset {
  const file = localFile('image/png', 'original.png');
  return {
    id: ASSET_ID,
    snippetId: imageEntry.id,
    mimeType: 'image/png',
    blob: file,
    byteSize: file.size,
    originalFilename: file.name,
    createdAt: CREATED,
    ...overrides,
  };
}

function deferred<T>() {
  let resolvePromise: (value: T) => void = () => {
    throw new Error('Deferred promise was not initialized.');
  };
  let rejectPromise: (reason?: unknown) => void = () => {
    throw new Error('Deferred promise was not initialized.');
  };
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function library(entries: readonly SnippetEntry[] = []): SnippetLibrary {
  return {
    load: vi.fn(async () => entries),
    loadAsset: vi.fn(async () => asset()),
    create: vi.fn(async (input) => ({
      id: SNIPPET_ID,
      ...input,
      createdAt: CREATED,
      updatedAt: CREATED,
    })),
    update: vi.fn(async (id, input) => ({
      id,
      ...input,
      createdAt: CREATED,
      updatedAt: CREATED,
    })),
    delete: vi.fn(async () => true),
  };
}

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => `blob:${(blob as File).name || 'preview'}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('unified Snippet Library', () => {
  it('shows zero-by-absence and persisted usage for Text and Image without reordering', async () => {
    const service = library([plain, rich, imageEntry]);
    service.loadUsageStats = vi.fn(async () => [
      {
        snippetId: rich.id,
        usageCount: 1,
        lastUsedAt: CREATED,
      },
      {
        snippetId: imageEntry.id,
        usageCount: 7,
        lastUsedAt: CREATED,
      },
    ]);
    render(<SnippetLibraryView snippetLibrary={service} />);

    expect(await screen.findByText('Welcome response')).toBeTruthy();
    expect(screen.getByLabelText('Usage count: 0').textContent).toBe('0');
    expect(screen.getByLabelText('Usage count: 1').textContent).toBe('1');
    expect(screen.getByLabelText('Usage count: 7').textContent).toBe('7');
    expect(screen.queryByText(/^\d+ uses$/)).toBeNull();
    const text = document.body.textContent ?? '';
    expect(text.indexOf('Welcome response')).toBeLessThan(
      text.indexOf('Widget setup'),
    );
    expect(text.indexOf('Widget setup')).toBeLessThan(
      text.indexOf('Limitation screenshot'),
    );
  });

  it('shows Plain and Rich as Text, Image as Image, and supports search and filters', async () => {
    render(
      <SnippetLibraryView
        snippetLibrary={library([plain, rich, imageEntry])}
      />,
    );
    expect(await screen.findByText('Welcome response')).toBeTruthy();
    expect(screen.getAllByText('Text')).toHaveLength(2);
    expect(screen.getByText('Image')).toBeTruthy();
    expect(document.body.textContent).not.toContain(ASSET_ID);
    fireEvent.click(screen.getByRole('button', { name: 'images' }));
    expect(screen.queryByText('Welcome response')).toBeNull();
    expect(screen.getByText('Limitation screenshot')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'all' }));
    fireEvent.change(screen.getByPlaceholderText('Search snippets...'), {
      target: { value: 'widget' },
    });
    expect(screen.getByText('Widget setup')).toBeTruthy();
    expect(screen.queryByText('Welcome response')).toBeNull();
  });

  it('offers only Text and Image creation and new Text records are Rich', async () => {
    const service = library();
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('No matching snippets.');
    fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
    expect(screen.getByRole('button', { name: /Text Snippet/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Image Snippet/ })).toBeTruthy();
    expect(screen.queryByText(/Plain/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Text Snippet/ }));
    expect(
      await screen.findByRole('toolbar', { name: 'Text formatting' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeTruthy();
    expect(screen.queryByText(/Convert to rich/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(service.create).toHaveBeenCalled());
    expect(vi.mocked(service.create).mock.calls[0]?.[0].content.kind).toBe(
      'rich',
    );
  });

  it('opens historical Plain as Text and converts only on successful Save', async () => {
    const service = library([plain]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Welcome response');
    expect(service.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      await screen.findByRole('toolbar', { name: 'Text formatting' }),
    ).toBeTruthy();
    expect(service.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(vi.mocked(service.update).mock.calls[0]?.[1].content).toMatchObject({
      kind: 'rich',
    });
  });

  it('scopes blue underlined safe-link presentation to the Text editor across Save and reopen', async () => {
    const service = library([linkedRich]);
    render(
      <>
        <a href="https://outside.example">Outside application link</a>
        <SnippetLibraryView snippetLibrary={service} />
      </>,
    );
    await screen.findByText('Linked setup');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const editor = await screen.findByLabelText('Text snippet content');
    expect(editor.className).toContain('[&_a]:text-blue-700');
    expect(editor.className).toContain('[&_a]:underline');
    expect(editor.querySelector('a')?.textContent).toBe('Open help');
    expect(editor.querySelector('p')?.className).not.toContain('text-blue');
    expect(editor.querySelector('p')?.className).not.toContain('underline');
    const outside = screen.getByText('Outside application link');
    expect(outside.className).not.toContain('text-blue');
    expect(outside.className).not.toContain('underline');
    expect(
      screen.queryByRole('button', { name: /underline|text color/i }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(service.update).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const reopened = await screen.findByLabelText('Text snippet content');
    expect(reopened.className).toContain('[&_a]:text-blue-700');
    expect(reopened.className).toContain('[&_a]:underline');
    expect(reopened.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/help',
    );
  });

  it('scrolls and focuses Text content only for explicit repeated Edit requests', async () => {
    render(<SnippetLibraryView snippetLibrary={library([plain, rich])} />);
    await screen.findByText('Widget setup');
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Text snippet content')).toBeNull();

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const editPlain = editButtons[0];
    const editRich = editButtons[1];
    if (editPlain === undefined || editRich === undefined)
      throw new Error('Expected two Edit buttons.');

    fireEvent.click(editPlain);
    const plainEditor = await screen.findByLabelText('Text snippet content');
    await waitFor(() => expect(document.activeElement).toBe(plainEditor));
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Welcome response',
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      behavior: 'auto',
      block: 'start',
    });

    fireEvent.click(editPlain);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByLabelText('Text snippet content'),
      ),
    );

    fireEvent.click(editRich);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(3));
    const richEditor = await screen.findByLabelText('Text snippet content');
    await waitFor(() => expect(document.activeElement).toBe(richEditor));
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Widget setup',
    );
  });

  it('does not move focus or scroll for load, filtering, or new authoring', async () => {
    render(<SnippetLibraryView snippetLibrary={library([plain])} />);
    await screen.findByText('Welcome response');
    expect(scrollIntoView).not.toHaveBeenCalled();

    const search = screen.getByPlaceholderText('Search snippets...');
    search.focus();
    fireEvent.change(search, { target: { value: 'welcome' } });
    fireEvent.click(screen.getByRole('button', { name: 'text' }));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(search);

    fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
    fireEvent.click(screen.getByRole('button', { name: /Text Snippet/ }));
    await screen.findByLabelText('Text snippet content');
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(
      screen.getByLabelText('Text snippet content'),
    );
  });

  it('protects legacy image-containing Rich content with a read-only compatibility state', async () => {
    const legacy: SnippetEntry = {
      ...rich,
      content: {
        kind: 'rich',
        blocks: [{ type: 'image', assetId: ASSET_ID, altText: 'legacy' }],
      },
    };
    const service = library([legacy]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Widget setup');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('This Text Snippet is read-only')).toBeTruthy();
    expect(service.update).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain(ASSET_ID);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp'] as const)(
    'accepts a pasted %s image as a draft and sends it only on Save',
    async (mimeType) => {
      const service = library();
      render(<SnippetLibraryView snippetLibrary={service} />);
      await screen.findByText('No matching snippets.');
      fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
      fireEvent.click(screen.getByRole('button', { name: /Image Snippet/ }));
      const file = localFile(mimeType);
      fireEvent.paste(screen.getByLabelText('Paste image'), {
        clipboardData: {
          items: [{ kind: 'file', type: mimeType, getAsFile: () => file }],
        },
      });
      expect(service.create).not.toHaveBeenCalled();
      expect(await screen.findByAltText('Image snippet preview')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(service.create).toHaveBeenCalled());
      const input = vi.mocked(service.create).mock.calls[0]?.[0];
      expect(input?.content.kind).toBe('image');
      expect(input?.newAssets).toHaveLength(1);
      expect(input?.newAssets?.[0]?.mimeType).toBe(mimeType);
    },
  );

  it.each(['image/png', 'image/jpeg', 'image/webp'] as const)(
    'supports %s file selection, removal, and Cancel without persistence',
    async (mimeType) => {
      const service = library();
      render(<SnippetLibraryView snippetLibrary={service} />);
      await screen.findByText('No matching snippets.');
      fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
      fireEvent.click(screen.getByRole('button', { name: /Image Snippet/ }));
      fireEvent.change(screen.getByLabelText('Choose Image'), {
        target: { files: [localFile(mimeType)] },
      });
      expect(await screen.findByAltText('Image snippet preview')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
      expect(
        screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled'),
      ).toBe(true);
      const cancel = screen.getAllByRole('button', { name: 'Cancel' }).at(-1);
      if (cancel === undefined) throw new Error('Expected a Cancel button.');
      fireEvent.click(cancel);
      expect(service.create).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed images and ignores non-image clipboard content', async () => {
    const service = library();
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('No matching snippets.');
    fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
    fireEvent.click(screen.getByRole('button', { name: /Image Snippet/ }));
    const malformed = new File([Uint8Array.from([1, 2, 3])], 'bad.png', {
      type: 'image/png',
    });
    Object.defineProperty(malformed, 'arrayBuffer', {
      value: async () => Uint8Array.from([1, 2, 3]).buffer,
    });
    fireEvent.paste(screen.getByLabelText('Paste image'), {
      clipboardData: {
        items: [
          { kind: 'file', type: 'image/png', getAsFile: () => malformed },
        ],
      },
    });
    expect(
      await screen.findByText('The image data does not match its file type.'),
    ).toBeTruthy();
    fireEvent.paste(screen.getByLabelText('Paste image'), {
      clipboardData: { items: [{ kind: 'string', type: 'text/plain' }] },
    });
    expect(screen.queryByAltText('Image snippet preview')).toBeNull();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('reopens an Image Snippet through the application asset-read boundary', async () => {
    const service = library([imageEntry]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(await screen.findByAltText('Image snippet preview')).toBeTruthy();
    expect(service.loadAsset).toHaveBeenCalledWith(ASSET_ID);
    expect(document.body.textContent).not.toContain(ASSET_ID);
  });

  it('scrolls Image Edit into view and focuses Title without opening the file picker', async () => {
    const fileInputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const service = library([imageEntry]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const form = await screen.findByRole('form', {
      name: 'Edit image snippet',
    });
    const title = screen.getByLabelText('Title');
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(form.contains(title)).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      behavior: 'auto',
      block: 'start',
    });
    expect(fileInputClick).not.toHaveBeenCalled();
    expect(await screen.findByAltText('Image snippet preview')).toBeTruthy();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('keeps the original persisted image when a replacement draft is cancelled', async () => {
    const service = library([imageEntry]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      (await screen.findByAltText('Image snippet preview')).getAttribute('src'),
    ).toBe('blob:original.png');

    fireEvent.change(screen.getByLabelText('Replace Image'), {
      target: { files: [localFile('image/png', 'replacement.png')] },
    });
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:replacement.png'),
    );
    const cancel = screen.getAllByRole('button', { name: 'Cancel' }).at(-1);
    if (cancel === undefined) throw new Error('Expected a Cancel button.');
    fireEvent.click(cancel);
    expect(service.update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:original.png'),
    );
  });

  it('submits exactly one replacement draft when an existing image is saved', async () => {
    const service = library([imageEntry]);
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await screen.findByAltText('Image snippet preview');
    fireEvent.change(screen.getByLabelText('Replace Image'), {
      target: { files: [localFile('image/webp', 'replacement.webp')] },
    });
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:replacement.webp'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(service.update).toHaveBeenCalledTimes(1));
    const input = vi.mocked(service.update).mock.calls[0]?.[1];
    expect(input?.newAssets).toHaveLength(1);
    const replacement = input?.newAssets?.[0];
    expect(replacement?.mimeType).toBe('image/webp');
    expect(input?.content).toEqual({
      kind: 'image',
      assetId: replacement?.id,
    });
  });

  it('retains replacement metadata and preview after a failed Save', async () => {
    const service = library([imageEntry]);
    service.update = vi.fn(async () => {
      throw new Error('forced update failure');
    });
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await screen.findByAltText('Image snippet preview');
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated screenshot title' },
    });
    fireEvent.change(screen.getByLabelText('Replace Image'), {
      target: { files: [localFile('image/jpeg', 'replacement.jpg')] },
    });
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:replacement.jpg'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        'We could not update this snippet. Your draft is still here.',
      ),
    ).toBeTruthy();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Updated screenshot title',
    );
    expect(
      screen.getByAltText('Image snippet preview').getAttribute('src'),
    ).toBe('blob:replacement.jpg');
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('ignores a late Image A success after Image B becomes active', async () => {
    const loadA = deferred<SnippetAsset | undefined>();
    const loadB = deferred<SnippetAsset | undefined>();
    const callCounts = new Map<string, number>();
    const originalA = asset();
    const secondFile = localFile('image/png', 'second.png');
    const originalB = asset({
      id: SECOND_ASSET_ID,
      snippetId: secondImageEntry.id,
      blob: secondFile,
      byteSize: secondFile.size,
      originalFilename: secondFile.name,
    });
    const loadAsset = vi.fn((id: string) => {
      const count = (callCounts.get(id) ?? 0) + 1;
      callCounts.set(id, count);
      if (count === 1)
        return Promise.resolve(id === ASSET_ID ? originalA : originalB);
      return id === ASSET_ID ? loadA.promise : loadB.promise;
    });
    const service = { ...library([imageEntry, secondImageEntry]), loadAsset };
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Second screenshot');
    await waitFor(() => expect(loadAsset).toHaveBeenCalledTimes(2));

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const editA = editButtons[0];
    const editB = editButtons[1];
    if (editA === undefined || editB === undefined)
      throw new Error('Expected two Edit buttons.');
    fireEvent.click(editA);
    await waitFor(() => expect(callCounts.get(ASSET_ID)).toBe(2));
    fireEvent.click(editB);
    await waitFor(() => expect(callCounts.get(SECOND_ASSET_ID)).toBe(2));
    loadB.resolve(originalB);
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:second.png'),
    );
    const previewCallsBeforeLateA = vi.mocked(URL.createObjectURL).mock.calls
      .length;
    loadA.resolve(originalA);
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:second.png'),
    );
    expect(vi.mocked(URL.createObjectURL)).toHaveBeenCalledTimes(
      previewCallsBeforeLateA,
    );
  });

  it('ignores a stale Image A failure after Image B loads successfully', async () => {
    const loadA = deferred<SnippetAsset | undefined>();
    const loadB = deferred<SnippetAsset | undefined>();
    const callCounts = new Map<string, number>();
    const secondFile = localFile('image/png', 'second.png');
    const originalB = asset({
      id: SECOND_ASSET_ID,
      snippetId: secondImageEntry.id,
      blob: secondFile,
      byteSize: secondFile.size,
      originalFilename: secondFile.name,
    });
    const loadAsset = vi.fn((id: string) => {
      const count = (callCounts.get(id) ?? 0) + 1;
      callCounts.set(id, count);
      if (count === 1)
        return Promise.resolve(id === ASSET_ID ? asset() : originalB);
      return id === ASSET_ID ? loadA.promise : loadB.promise;
    });
    const service = { ...library([imageEntry, secondImageEntry]), loadAsset };
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Second screenshot');
    await waitFor(() => expect(loadAsset).toHaveBeenCalledTimes(2));
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const editA = editButtons[0];
    const editB = editButtons[1];
    if (editA === undefined || editB === undefined)
      throw new Error('Expected two Edit buttons.');
    fireEvent.click(editA);
    await waitFor(() => expect(callCounts.get(ASSET_ID)).toBe(2));
    fireEvent.click(editB);
    await waitFor(() => expect(callCounts.get(SECOND_ASSET_ID)).toBe(2));
    loadB.resolve(originalB);
    await screen.findByAltText('Image snippet preview');
    loadA.reject(new Error('late A failure'));
    await waitFor(() =>
      expect(
        screen.getByAltText('Image snippet preview').getAttribute('src'),
      ).toBe('blob:second.png'),
    );
    expect(
      screen.queryByText(
        'We could not load this image. The saved Snippet was not changed.',
      ),
    ).toBeNull();
  });

  it('ignores an old image load after Cancel and New Image Snippet', async () => {
    const editLoad = deferred<SnippetAsset | undefined>();
    let loadCount = 0;
    const loadAsset = vi.fn(() => {
      loadCount += 1;
      return loadCount === 1 ? Promise.resolve(asset()) : editLoad.promise;
    });
    const service = { ...library([imageEntry]), loadAsset };
    render(<SnippetLibraryView snippetLibrary={service} />);
    await screen.findByText('Limitation screenshot');
    await waitFor(() => expect(loadAsset).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(loadAsset).toHaveBeenCalledTimes(2));
    const cancel = screen.getAllByRole('button', { name: 'Cancel' }).at(-1);
    if (cancel === undefined) throw new Error('Expected a Cancel button.');
    fireEvent.click(cancel);
    fireEvent.click(screen.getByRole('button', { name: '+ New Snippet' }));
    fireEvent.click(screen.getByRole('button', { name: /Image Snippet/ }));
    editLoad.resolve(asset());

    await waitFor(() =>
      expect(screen.queryByAltText('Image snippet preview')).toBeNull(),
    );
    expect(
      screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
