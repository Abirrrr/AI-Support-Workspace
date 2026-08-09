import type {
  RichSnippetBlock,
  RichSnippetContent,
  RichSnippetInline,
} from '../../domain/snippet-content';
import {
  isSafeSnippetImageUrl,
  isSafeSnippetLinkUrl,
} from '../../domain/snippet-content';

interface RichSnippetEditorProps {
  content: RichSnippetContent;
  disabled?: boolean;
  onChange: (content: RichSnippetContent) => void;
}

function createTextInline(): RichSnippetInline {
  return { type: 'text', text: '', bold: false, italic: false };
}

function createLinkInline(): RichSnippetInline {
  return { type: 'link', text: '', url: '', bold: false, italic: false };
}

function createParagraphBlock(): RichSnippetBlock {
  return { type: 'paragraph', children: [createTextInline()] };
}

function createImageReferenceBlock(): RichSnippetBlock {
  return {
    type: 'reference',
    referenceType: 'image',
    label: '',
    url: '',
  };
}

export function isRichSnippetDraftValid(content: RichSnippetContent): boolean {
  return content.blocks.every((block) =>
    block.type === 'paragraph'
      ? block.children.every(
          (inline) =>
            inline.type === 'text' || isSafeSnippetLinkUrl(inline.url),
        )
      : block.type === 'reference'
        ? isSafeSnippetImageUrl(block.url)
        : true,
  );
}

export function RichSnippetEditor({
  content,
  disabled = false,
  onChange,
}: RichSnippetEditorProps) {
  function replaceBlocks(blocks: readonly RichSnippetBlock[]) {
    onChange({ kind: 'rich', blocks });
  }

  function updateBlock(index: number, block: RichSnippetBlock) {
    replaceBlocks(
      content.blocks.map((candidate, candidateIndex) =>
        candidateIndex === index ? block : candidate,
      ),
    );
  }

  function removeBlock(index: number) {
    replaceBlocks(content.blocks.filter((_, candidate) => candidate !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= content.blocks.length) return;
    const blocks = [...content.blocks];
    const moving = blocks[index];
    const displaced = blocks[destination];
    if (moving === undefined || displaced === undefined) return;
    blocks[index] = displaced;
    blocks[destination] = moving;
    replaceBlocks(blocks);
  }

  function updateInline(
    blockIndex: number,
    inlineIndex: number,
    inline: RichSnippetInline,
  ) {
    const block = content.blocks[blockIndex];
    if (block?.type !== 'paragraph') return;
    updateBlock(blockIndex, {
      type: 'paragraph',
      children: block.children.map((candidate, candidateIndex) =>
        candidateIndex === inlineIndex ? inline : candidate,
      ),
    });
  }

  function addInline(blockIndex: number, inline: RichSnippetInline) {
    const block = content.blocks[blockIndex];
    if (block?.type !== 'paragraph') return;
    updateBlock(blockIndex, {
      type: 'paragraph',
      children: [...block.children, inline],
    });
  }

  function removeInline(blockIndex: number, inlineIndex: number) {
    const block = content.blocks[blockIndex];
    if (block?.type !== 'paragraph') return;
    updateBlock(blockIndex, {
      type: 'paragraph',
      children: block.children.filter(
        (_, candidateIndex) => candidateIndex !== inlineIndex,
      ),
    });
  }

  return (
    <section
      aria-label="Rich snippet content editor"
      className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4"
    >
      <div>
        <h4 className="font-semibold text-slate-900">Rich content</h4>
        <p className="mt-1 text-xs text-slate-600">
          Build ordered paragraphs and image references. Formatting applies to
          each text segment.
        </p>
      </div>

      {content.blocks.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          This Rich Snippet has no blocks. Add a paragraph or image reference.
        </p>
      ) : null}

      {content.blocks.map((block, blockIndex) => {
        const blockNumber = blockIndex + 1;
        return (
          <fieldset
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={`${block.type}-${blockIndex}`}
          >
            <legend className="px-1 text-sm font-semibold text-slate-800">
              {block.type === 'paragraph'
                ? `Paragraph ${blockNumber}`
                : block.type === 'reference'
                  ? `Image reference ${blockNumber}`
                  : `Local image ${blockNumber}`}
            </legend>

            {block.type !== 'image' ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  aria-label={`Move block ${blockNumber} up`}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled || blockIndex === 0}
                  onClick={() => moveBlock(blockIndex, -1)}
                  type="button"
                >
                  Move up
                </button>
                <button
                  aria-label={`Move block ${blockNumber} down`}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    disabled || blockIndex === content.blocks.length - 1
                  }
                  onClick={() => moveBlock(blockIndex, 1)}
                  type="button"
                >
                  Move down
                </button>
                <button
                  aria-label={`Remove block ${blockNumber}`}
                  className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => removeBlock(blockIndex)}
                  type="button"
                >
                  Remove block
                </button>
              </div>
            ) : null}

            {block.type === 'paragraph' ? (
              <div className="space-y-3">
                {block.children.length === 0 ? (
                  <p className="text-xs text-slate-600">
                    This paragraph has no text segments.
                  </p>
                ) : null}
                {block.children.map((inline, inlineIndex) => {
                  const inlineNumber = inlineIndex + 1;
                  const textId = `rich-${blockIndex}-${inlineIndex}-text`;
                  const urlId = `rich-${blockIndex}-${inlineIndex}-url`;
                  const errorId = `rich-${blockIndex}-${inlineIndex}-url-error`;
                  const invalidLink =
                    inline.type === 'link' && !isSafeSnippetLinkUrl(inline.url);
                  return (
                    <fieldset
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      key={`${inline.type}-${inlineIndex}`}
                    >
                      <legend className="px-1 text-xs font-semibold text-slate-700">
                        {inline.type === 'text'
                          ? `Text segment ${inlineNumber}`
                          : `Link ${inlineNumber}`}
                      </legend>
                      <label
                        className="block text-xs font-medium text-slate-700"
                        htmlFor={textId}
                      >
                        {inline.type === 'text' ? 'Text' : 'Link text'}
                      </label>
                      <textarea
                        className="mt-1 block min-h-20 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        disabled={disabled}
                        id={textId}
                        onChange={(event) =>
                          updateInline(blockIndex, inlineIndex, {
                            ...inline,
                            text: event.target.value,
                          })
                        }
                        value={inline.text}
                      />

                      {inline.type === 'link' ? (
                        <div className="mt-3">
                          <label
                            className="block text-xs font-medium text-slate-700"
                            htmlFor={urlId}
                          >
                            URL
                          </label>
                          <input
                            aria-describedby={invalidLink ? errorId : undefined}
                            aria-invalid={invalidLink || undefined}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            disabled={disabled}
                            id={urlId}
                            onChange={(event) =>
                              updateInline(blockIndex, inlineIndex, {
                                ...inline,
                                url: event.target.value,
                              })
                            }
                            type="text"
                            value={inline.url}
                          />
                          {invalidLink ? (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={errorId}
                              role="alert"
                            >
                              Enter a valid HTTP, HTTPS, or mailto URL.
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          aria-label={`Bold paragraph ${blockNumber} segment ${inlineNumber}`}
                          aria-pressed={inline.bold}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white aria-pressed:border-blue-600 aria-pressed:bg-blue-100 aria-pressed:text-blue-800 disabled:opacity-50"
                          disabled={disabled}
                          onClick={() =>
                            updateInline(blockIndex, inlineIndex, {
                              ...inline,
                              bold: !inline.bold,
                            })
                          }
                          type="button"
                        >
                          Bold
                        </button>
                        <button
                          aria-label={`Italic paragraph ${blockNumber} segment ${inlineNumber}`}
                          aria-pressed={inline.italic}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium italic text-slate-700 hover:bg-white aria-pressed:border-blue-600 aria-pressed:bg-blue-100 aria-pressed:text-blue-800 disabled:opacity-50"
                          disabled={disabled}
                          onClick={() =>
                            updateInline(blockIndex, inlineIndex, {
                              ...inline,
                              italic: !inline.italic,
                            })
                          }
                          type="button"
                        >
                          Italic
                        </button>
                        {inline.type === 'text' ? (
                          <button
                            aria-label={`Convert paragraph ${blockNumber} segment ${inlineNumber} to link`}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                            disabled={disabled}
                            onClick={() =>
                              updateInline(blockIndex, inlineIndex, {
                                type: 'link',
                                text: inline.text,
                                url: '',
                                bold: inline.bold,
                                italic: inline.italic,
                              })
                            }
                            type="button"
                          >
                            Make link
                          </button>
                        ) : (
                          <button
                            aria-label={`Remove link from paragraph ${blockNumber} segment ${inlineNumber}`}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                            disabled={disabled}
                            onClick={() =>
                              updateInline(blockIndex, inlineIndex, {
                                type: 'text',
                                text: inline.text,
                                bold: inline.bold,
                                italic: inline.italic,
                              })
                            }
                            type="button"
                          >
                            Remove link
                          </button>
                        )}
                        <button
                          aria-label={`Remove paragraph ${blockNumber} segment ${inlineNumber}`}
                          className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          disabled={disabled}
                          onClick={() => removeInline(blockIndex, inlineIndex)}
                          type="button"
                        >
                          Remove segment
                        </button>
                      </div>
                    </fieldset>
                  );
                })}

                <div className="flex flex-wrap gap-2">
                  <button
                    aria-label={`Add text segment to paragraph ${blockNumber}`}
                    className="rounded-md border border-blue-300 px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => addInline(blockIndex, createTextInline())}
                    type="button"
                  >
                    Add text segment
                  </button>
                  <button
                    aria-label={`Add link to paragraph ${blockNumber}`}
                    className="rounded-md border border-blue-300 px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => addInline(blockIndex, createLinkInline())}
                    type="button"
                  >
                    Add link
                  </button>
                </div>
              </div>
            ) : block.type === 'reference' ? (
              <div className="space-y-3">
                <label
                  className="block text-xs font-medium text-slate-700"
                  htmlFor={`rich-${blockIndex}-image-label`}
                >
                  Label
                </label>
                <input
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={disabled}
                  id={`rich-${blockIndex}-image-label`}
                  onChange={(event) =>
                    updateBlock(blockIndex, {
                      ...block,
                      label: event.target.value,
                    })
                  }
                  type="text"
                  value={block.label}
                />
                <label
                  className="block text-xs font-medium text-slate-700"
                  htmlFor={`rich-${blockIndex}-image-url`}
                >
                  URL
                </label>
                <input
                  aria-describedby={
                    isSafeSnippetImageUrl(block.url)
                      ? undefined
                      : `rich-${blockIndex}-image-url-error`
                  }
                  aria-invalid={!isSafeSnippetImageUrl(block.url) || undefined}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={disabled}
                  id={`rich-${blockIndex}-image-url`}
                  onChange={(event) =>
                    updateBlock(blockIndex, {
                      ...block,
                      url: event.target.value,
                    })
                  }
                  type="text"
                  value={block.url}
                />
                {!isSafeSnippetImageUrl(block.url) ? (
                  <p
                    className="text-xs text-red-700"
                    id={`rich-${blockIndex}-image-url-error`}
                    role="alert"
                  >
                    Enter a valid HTTP or HTTPS URL.
                  </p>
                ) : null}
                <p className="text-xs text-slate-600">
                  Stored as a reference only. The image is not loaded or
                  previewed here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 rounded-md bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">
                  Local image asset
                </p>
                <p className="text-xs text-slate-600">
                  {block.altText.length > 0
                    ? `Alternative text: ${block.altText}`
                    : 'No alternative text.'}
                </p>
                <p className="text-xs text-slate-600">
                  Image preview and editing arrive in M14-F. Saving other
                  Snippet fields preserves this block.
                </p>
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50"
          disabled={disabled}
          onClick={() =>
            replaceBlocks([...content.blocks, createParagraphBlock()])
          }
          type="button"
        >
          Add paragraph
        </button>
        <button
          className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50"
          disabled={disabled}
          onClick={() =>
            replaceBlocks([...content.blocks, createImageReferenceBlock()])
          }
          type="button"
        >
          Add image reference
        </button>
      </div>
    </section>
  );
}
