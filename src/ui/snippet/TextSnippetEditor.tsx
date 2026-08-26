import { useEffect, useRef, useState } from 'react';
import {
  EditorContent,
  Extension,
  mergeAttributes,
  Node,
  useEditor,
  type JSONContent,
} from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';

import {
  isSafeSnippetLinkUrl,
  type RichSnippetContent,
} from '../../domain/snippet-content';
import {
  snippetContentToTextEditorDocument,
  textEditorDocumentToRichSnippetContent,
  type TextEditorNode,
} from './text-editor-document';

interface TextSnippetEditorProps {
  readonly content: RichSnippetContent;
  readonly disabled?: boolean;
  readonly focusRequest?: number;
  readonly onChange: (content: RichSnippetContent) => void;
}

interface ConstrainedListItemOptions {
  readonly HTMLAttributes: Record<string, unknown>;
}

const ConstrainedListItem = Node.create<ConstrainedListItemOptions>({
  name: 'listItem',
  addOptions() {
    return { HTMLAttributes: {} };
  },
  content: 'paragraph',
  defining: true,
  parseHTML() {
    return [{ tag: 'li' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.isActive(this.name),
      'Shift-Tab': () => this.editor.isActive(this.name),
    };
  },
});

function isRepresentableEditorDocument(document: TextEditorNode): boolean {
  try {
    textEditorDocumentToRichSnippetContent(document);
    return true;
  } catch {
    return false;
  }
}

const ConstrainedLists = Extension.create({
  name: 'constrainedLists',
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.isActive('listItem'),
      'Shift-Tab': () => this.editor.isActive('listItem'),
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (transaction) =>
          isRepresentableEditorDocument(
            transaction.doc.toJSON() as TextEditorNode,
          ),
      }),
    ];
  },
});

export const textSnippetExtensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    dropcursor: false,
    gapcursor: false,
    heading: false,
    horizontalRule: false,
    listItem: false,
    strike: false,
    trailingNode: false,
    underline: false,
    link: {
      autolink: false,
      openOnClick: false,
      isAllowedUri: (url) => isSafeSnippetLinkUrl(url),
    },
  }),
  ConstrainedListItem,
  ConstrainedLists,
];

export function TextSnippetEditor({
  content,
  disabled = false,
  focusRequest,
  onChange,
}: TextSnippetEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [feedback, setFeedback] = useState<string>();
  const handledFocusRequest = useRef<number | undefined>(undefined);
  const editor = useEditor(
    {
      extensions: textSnippetExtensions,
      content: snippetContentToTextEditorDocument(content) as JSONContent,
      editable: !disabled,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          'aria-label': 'Text snippet content',
          class:
            'min-h-40 px-3 py-3 text-sm text-slate-950 focus:outline-none [&_a]:text-blue-700 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_p]:my-2',
        },
        handlePaste: (_view, event) => {
          const hasImage = Array.from(event.clipboardData?.items ?? []).some(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          );
          if (!hasImage) return false;
          setFeedback('Images belong in an Image Snippet.');
          return true;
        },
      },
      onUpdate: ({ editor: updatedEditor }) => {
        setFeedback(undefined);
        onChange(
          textEditorDocumentToRichSnippetContent(
            updatedEditor.getJSON() as TextEditorNode,
          ),
        );
      },
    },
    [],
  );

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (
      editor === null ||
      disabled ||
      focusRequest === undefined ||
      handledFocusRequest.current === focusRequest
    ) {
      return;
    }
    editor.commands.focus('start', { scrollIntoView: false });
    handledFocusRequest.current = focusRequest;
  }, [disabled, editor, focusRequest]);

  if (editor === null)
    return <p className="text-sm text-slate-600">Loading editor…</p>;

  function openLinkEditor() {
    if (editor === null) return;
    setLinkUrl(String(editor.getAttributes('link').href ?? ''));
    setLinkOpen(true);
    setFeedback(undefined);
  }

  function applyLink() {
    if (editor === null) return;
    if (!isSafeSnippetLinkUrl(linkUrl)) {
      setFeedback('Use an HTTP, HTTPS, or mailto link.');
      return;
    }
    if (editor.state.selection.empty) {
      setFeedback('Select text before adding a link.');
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();
    setLinkOpen(false);
  }

  const toolbarButton =
    'rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 aria-pressed:border-blue-600 aria-pressed:bg-blue-100 disabled:opacity-50';

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div
        aria-label="Text formatting"
        className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-2"
        role="toolbar"
      >
        <button
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
          className={toolbarButton}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
        >
          B
        </button>
        <button
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
          className={`${toolbarButton} italic`}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
        >
          I
        </button>
        <button
          aria-label="Link"
          aria-pressed={editor.isActive('link')}
          className={toolbarButton}
          disabled={disabled}
          onClick={openLinkEditor}
          type="button"
        >
          Link
        </button>
        <button
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
          className={toolbarButton}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
        >
          • List
        </button>
        <button
          aria-label="Numbered list"
          aria-pressed={editor.isActive('orderedList')}
          className={toolbarButton}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
        >
          1. List
        </button>
        <button
          aria-label="Undo"
          className={toolbarButton}
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          type="button"
        >
          Undo
        </button>
        <button
          aria-label="Redo"
          className={toolbarButton}
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          type="button"
        >
          Redo
        </button>
      </div>
      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-2">
          <label className="sr-only" htmlFor="snippet-link-url">
            Link URL
          </label>
          <input
            className="min-w-56 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            id="snippet-link-url"
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            type="url"
            value={linkUrl}
          />
          <button className={toolbarButton} onClick={applyLink} type="button">
            Apply
          </button>
          <button
            className={toolbarButton}
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              setLinkOpen(false);
            }}
            type="button"
          >
            Remove
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {feedback ? (
        <p
          className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
