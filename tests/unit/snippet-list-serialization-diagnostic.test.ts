import { describe, expect, it, vi } from 'vitest';

import type { SnippetAssetRepository } from '../../src/application/persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import {
  diagnoseSnippetListSerialization,
  SnippetListDiagnosticError,
} from '../../src/application/snippet/snippet-list-serialization-diagnostic';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import {
  registerSnippetListSerializationDiagnostic,
  SNIPPET_LIST_DIAGNOSTIC_GLOBAL,
  type SnippetListDiagnosticApi,
} from '../../src/extension/options/snippet-list-serialization-diagnostic';

const entry: SnippetEntry = {
  id: 'snippet-real-record',
  title: 'Diagnostic fixture',
  content: {
    kind: 'rich',
    blocks: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Bullet:', bold: true, italic: false },
        ],
      },
      {
        type: 'list',
        listType: 'unordered',
        items: [
          {
            children: [
              { type: 'text', text: '1st line', bold: false, italic: false },
            ],
          },
          {
            children: [
              { type: 'text', text: '2nd\nline', bold: false, italic: true },
            ],
          },
          {
            children: [
              {
                type: 'link',
                text: '3rd line',
                url: 'https://example.com/help',
                bold: false,
                italic: false,
              },
            ],
          },
        ],
      },
    ],
  },
  tags: [],
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
  trigger: ';list-test',
};

function repositories(snippet: SnippetEntry | undefined = entry) {
  const snippetRepository = {
    create: vi.fn(),
    get: vi.fn<SnippetEntryRepository['get']>(async () => snippet),
    list: vi.fn(),
    findByTrigger: vi.fn<SnippetEntryRepository['findByTrigger']>(
      async () => snippet,
    ),
    update: vi.fn(),
    delete: vi.fn(),
  } satisfies SnippetEntryRepository;
  const assetRepository = {
    get: vi.fn(),
    listBySnippet: vi.fn(),
  } satisfies SnippetAssetRepository;
  return { snippetRepository, assetRepository };
}

describe('real Snippet list serialization diagnostic', () => {
  it('reads through the repository and production planner/serializer without mutation', async () => {
    const { snippetRepository, assetRepository } = repositories();
    const paragraphChildren =
      entry.content.kind === 'rich' &&
      entry.content.blocks[0]?.type === 'paragraph'
        ? entry.content.blocks[0].children
        : [];

    await expect(
      diagnoseSnippetListSerialization(
        snippetRepository,
        assetRepository,
        ';LIST-TEST',
      ),
    ).resolves.toEqual({
      record: {
        id: entry.id,
        kind: 'text',
        trigger: entry.trigger,
        content: entry.content,
      },
      structure: {
        topLevelBlocks: [
          { index: 0, type: 'paragraph' },
          { index: 1, type: 'list', listType: 'unordered' },
        ],
        paragraphs: [
          {
            blockIndex: 0,
            children: paragraphChildren,
            marks: [{ inlineIndex: 0, marks: ['bold'] }],
            hardBreaks: [],
          },
        ],
        lists: [
          {
            blockIndex: 1,
            listType: 'unordered',
            itemCount: 3,
            items: [
              {
                itemIndex: 0,
                children:
                  entry.content.kind === 'rich' &&
                  entry.content.blocks[1]?.type === 'list'
                    ? entry.content.blocks[1].items[0]?.children
                    : [],
                marks: [{ inlineIndex: 0, marks: [] }],
                hardBreaks: [],
              },
              {
                itemIndex: 1,
                children:
                  entry.content.kind === 'rich' &&
                  entry.content.blocks[1]?.type === 'list'
                    ? entry.content.blocks[1].items[1]?.children
                    : [],
                marks: [{ inlineIndex: 0, marks: ['italic'] }],
                hardBreaks: [{ inlineIndex: 0, offset: 3, sequence: 'LF' }],
              },
              {
                itemIndex: 2,
                children:
                  entry.content.kind === 'rich' &&
                  entry.content.blocks[1]?.type === 'list'
                    ? entry.content.blocks[1].items[2]?.children
                    : [],
                marks: [{ inlineIndex: 0, marks: ['link'] }],
                hardBreaks: [],
              },
            ],
          },
        ],
      },
      clipboard: {
        html:
          '<p><strong>Bullet:</strong></p><ul><li>1st line</li>' +
          '<li><em>2nd<br>line</em></li>' +
          '<li><a href="https://example.com/help">3rd line</a></li></ul>',
        plainText:
          'Bullet:\n\n- 1st line\n- 2nd\nline\n' +
          '- 3rd line (https://example.com/help)',
      },
      delivery: {
        request: {
          snippetId: entry.id,
          trigger: entry.trigger,
          kind: 'text',
        },
        payload: {
          kind: 'text',
          snippetId: entry.id,
          html:
            '<p><strong>Bullet:</strong></p><ul><li>1st line</li>' +
            '<li><em>2nd<br>line</em></li>' +
            '<li><a href="https://example.com/help">3rd line</a></li></ul>',
          plainText:
            'Bullet:\n\n- 1st line\n- 2nd\nline\n' +
            '- 3rd line (https://example.com/help)',
        },
        matchesSerializer: { html: true, plainText: true },
      },
    });
    expect(snippetRepository.findByTrigger).toHaveBeenCalledWith(';list-test');
    expect(snippetRepository.get).toHaveBeenCalledWith(entry.id);
    expect(snippetRepository.create).not.toHaveBeenCalled();
    expect(snippetRepository.update).not.toHaveBeenCalled();
    expect(snippetRepository.delete).not.toHaveBeenCalled();
    expect(assetRepository.get).not.toHaveBeenCalled();
    expect(assetRepository.listBySnippet).not.toHaveBeenCalled();
  });

  it('registers an explicitly invoked console helper that prompts for one trigger', async () => {
    const { snippetRepository, assetRepository } = repositories();
    const globalScope = {
      prompt: vi.fn(() => ';list-test'),
    } as {
      prompt(message: string): string | null;
      [SNIPPET_LIST_DIAGNOSTIC_GLOBAL]?: SnippetListDiagnosticApi;
    };
    const runtime = {
      sendMessage: vi.fn(async (message: unknown) =>
        (message as { type?: unknown }).type ===
        'native-dev-automatic-paste-trace'
          ? {
              persistedPasteMode: 'automatic',
              workerPasteMode: 'automatic',
              activationPasteMode: 'automatic',
              selectedBranch: 'automatic',
              firstAutomaticPhase: 'automatic-precheck-started',
              lastPhase: 'native-paste-result',
              result: 'input-injection-failed',
              requestId: 'request-1',
              serviceWorkerLifecycle: 'same-worker',
              postCleanupFailure: 'composed-focus-mismatch',
              postCleanupChecks: {
                authorizationStillValid: false,
                editorConnected: true,
                sameDocument: true,
                composedFocusValid: false,
                selectionExists: true,
                selectionCollapsed: true,
                caretRootMatches: true,
                caretPathMatches: true,
                caretOffsetMatches: true,
                structureMatches: true,
                lifecycleValid: true,
                mutationValid: true,
                selectionValid: true,
                focusValid: true,
              },
              firstInvalidationCause: 'predicate-failed',
              focusTopology: 'no-valid-composed-focus',
              noticePhase: 'fallback-mounted-after-post-cleanup-failure',
              noticeExistedBeforePostCleanupCheck: false,
              noticeExistsAfterPostCleanupFailure: true,
              fallbackNoticeMountedAfterAutomaticResult: true,
              fallbackNoticeSuppressed: false,
              noticeCallsFocus: false,
              noticeHasAutofocus: false,
              activeElementChangedByNoticeMount: false,
              selectionchangeDuringNoticeMount: false,
              noticeMutationWithinAuthorizationObserverScope: true,
              noticeMountedInsideEditor: false,
              cleanupInputProvenance: 'external-input',
              firstInvalidatingInputPhase:
                'outside-authorized-cleanup-dispatch',
              activationBeforeInputPrevented: false,
              activationInputObserved: false,
              externalInputTrusted: true,
              externalInputType: 'insertText',
              externalInputSameEditor: true,
              externalInputSameRoot: true,
              externalInputComposed: true,
              externalInputSameActivationTask: false,
              externalInputRelativePhase: 'pre-cleanup',
              externalInputSequenceRelation: 'before-owned-cleanup-input',
              nativePasteDiagnostic: null,
            }
          : {
              kind: 'text',
              phase: 'native-paste-request',
              requestId: 'request-1',
              result: 'input-injection-failed',
            },
      ),
    };
    registerSnippetListSerializationDiagnostic(
      globalScope,
      snippetRepository,
      assetRepository,
      runtime,
    );

    const result =
      await globalScope[
        SNIPPET_LIST_DIAGNOSTIC_GLOBAL
      ]?.diagnoseSnippetListSerialization();

    expect(globalScope.prompt).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      record: { id: entry.id, trigger: entry.trigger },
      delivery: { matchesSerializer: { html: true, plainText: true } },
    });
    await expect(
      globalScope[SNIPPET_LIST_DIAGNOSTIC_GLOBAL]?.getAutomaticPasteResult(),
    ).resolves.toMatchObject({
      kind: 'text',
      phase: 'native-paste-request',
      requestId: 'request-1',
      result: 'input-injection-failed',
    });
    await expect(
      globalScope[SNIPPET_LIST_DIAGNOSTIC_GLOBAL]?.getAutomaticPasteTrace(),
    ).resolves.toMatchObject({
      persistedPasteMode: 'automatic',
      workerPasteMode: 'automatic',
      activationPasteMode: 'automatic',
      selectedBranch: 'automatic',
      firstAutomaticPhase: 'automatic-precheck-started',
      lastPhase: 'native-paste-result',
      result: 'input-injection-failed',
      requestId: 'request-1',
      serviceWorkerLifecycle: 'same-worker',
      postCleanupFailure: 'composed-focus-mismatch',
      focusTopology: 'no-valid-composed-focus',
      noticePhase: 'fallback-mounted-after-post-cleanup-failure',
    });
  });

  it('fails safely for missing triggers, missing records, and Image Snippets', async () => {
    const blank = repositories();
    await expect(
      diagnoseSnippetListSerialization(
        blank.snippetRepository,
        blank.assetRepository,
        '',
      ),
    ).rejects.toMatchObject({ code: 'trigger-required' });
    expect(blank.snippetRepository.findByTrigger).not.toHaveBeenCalled();

    const missing = repositories();
    missing.snippetRepository.findByTrigger.mockResolvedValueOnce(undefined);
    await expect(
      diagnoseSnippetListSerialization(
        missing.snippetRepository,
        missing.assetRepository,
        ';missing',
      ),
    ).rejects.toMatchObject({ code: 'snippet-not-found' });

    const image = repositories({
      ...entry,
      content: {
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      },
    });
    await expect(
      diagnoseSnippetListSerialization(
        image.snippetRepository,
        image.assetRepository,
        ';list-test',
      ),
    ).rejects.toBeInstanceOf(SnippetListDiagnosticError);
  });
});
