export interface TriggerCandidate {
  readonly text: string;
}

export interface StaticRangeLike {
  readonly startContainer: Node;
  readonly startOffset: number;
  readonly endContainer: Node;
  readonly endOffset: number;
}

export interface EditorActivationEventLike {
  readonly target: EventTarget | null;
  readonly composedPath?: () => EventTarget[];
  readonly getTargetRanges?: () => readonly StaticRangeLike[];
}

export interface EditorAdapter {
  readonly kind: 'textarea' | 'textInput' | 'contenteditable';
  readTriggerCandidate(maxLength: number): TriggerCandidate | undefined;
  captureActivation(
    candidate: TriggerCandidate,
  ): TriggerActivationSnapshot | undefined;
}

export interface TriggerActivationSnapshot {
  cleanupAfterClipboardSuccess(): boolean;
}

interface TextTriggerCandidate extends TriggerCandidate {
  readonly start: number;
  readonly end: number;
}

interface DomTriggerCandidate extends TriggerCandidate {
  readonly range: Range;
  readonly root: HTMLElement;
}

const COMPLETE_TRIGGER_AT_END = /(?:^|\s)(;[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)$/;
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const INLINE_TEXT_CONTAINER_NAMES = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'del',
  'em',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
]);
const LOGICAL_BLOCK_CONTAINER_NAMES = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

function isElementNode(value: unknown): value is Element {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { nodeType?: unknown }).nodeType === ELEMENT_NODE &&
    typeof (value as { localName?: unknown }).localName === 'string'
  );
}

function isTextNode(value: unknown): value is Text {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { nodeType?: unknown }).nodeType === TEXT_NODE &&
    typeof (value as { data?: unknown }).data === 'string'
  );
}

function isInlineTextContainer(node: Node): boolean {
  return isElementNode(node) && INLINE_TEXT_CONTAINER_NAMES.has(node.localName);
}

function isNodeWithinEditor(node: Node, root: HTMLElement): boolean {
  return node === root || root.contains(node);
}

function toCollapsedEditorRange(
  value: unknown,
  root: HTMLElement,
  document: Document,
): Range | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  let candidate: Partial<StaticRangeLike>;
  try {
    candidate = value as Partial<StaticRangeLike>;
    if (
      typeof candidate.startContainer !== 'object' ||
      candidate.startContainer === null ||
      candidate.startContainer !== candidate.endContainer ||
      typeof candidate.startOffset !== 'number' ||
      !Number.isInteger(candidate.startOffset) ||
      candidate.startOffset < 0 ||
      candidate.endOffset !== candidate.startOffset ||
      candidate.startContainer.ownerDocument !== document ||
      !isNodeWithinEditor(candidate.startContainer, root)
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  const range = document.createRange();
  try {
    range.setStart(candidate.startContainer, candidate.startOffset);
    range.setEnd(candidate.endContainer, candidate.endOffset);
  } catch {
    return undefined;
  }
  return range.collapsed ? range : undefined;
}

function readEventPath(
  event: EditorActivationEventLike,
): EventTarget[] | undefined {
  if (typeof event.composedPath !== 'function') return undefined;
  try {
    const path = event.composedPath();
    return Array.isArray(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

function readSingleEventTargetRange(
  event: EditorActivationEventLike,
): unknown | undefined {
  if (typeof event.getTargetRanges !== 'function') return undefined;
  try {
    const ranges = event.getTargetRanges();
    return Array.isArray(ranges) && ranges.length === 1 ? ranges[0] : undefined;
  } catch {
    return undefined;
  }
}

function isEditorFocused(element: HTMLElement, document: Document): boolean {
  const active = document.activeElement;
  if (active === element || element.contains(active)) return true;
  const root = element.getRootNode();
  if (root === document || typeof root !== 'object' || root === null) {
    return false;
  }
  const rootActive = (root as Partial<DocumentOrShadowRoot>).activeElement;
  return rootActive === element || element.contains(rootActive ?? null);
}

function readCurrentCaretRange(
  root: HTMLElement,
  document: Document,
): { readonly range: Range; readonly selection: Selection } | undefined {
  const selection = document.getSelection();
  if (selection === null) return undefined;
  if (selection.rangeCount === 1 && selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    if (isNodeWithinEditor(range.startContainer, root)) {
      return { range, selection };
    }
  }

  const nodeRoot = root.getRootNode();
  if (
    nodeRoot === document ||
    typeof selection.getComposedRanges !== 'function'
  ) {
    return undefined;
  }
  let composedRanges: readonly StaticRange[];
  try {
    composedRanges = selection.getComposedRanges({
      shadowRoots: [nodeRoot as ShadowRoot],
    });
  } catch {
    return undefined;
  }
  if (composedRanges.length !== 1) return undefined;
  const range = toCollapsedEditorRange(composedRanges[0], root, document);
  return range === undefined ? undefined : { range, selection };
}

function readTextCandidate(
  value: string,
  caret: number,
  maxLength: number,
): TextTriggerCandidate | undefined {
  const start = Math.max(0, caret - maxLength - 1);
  const segment = value.slice(start, caret);
  const match = COMPLETE_TRIGGER_AT_END.exec(segment);
  const text = match?.[1];
  if (text === undefined || text.length > maxLength) return undefined;
  return { text, start: caret - text.length, end: caret };
}

function createInputNotification(document: Document): InputEvent | undefined {
  try {
    const InputEventConstructor = document.defaultView?.InputEvent;
    if (InputEventConstructor === undefined) return undefined;
    return new InputEventConstructor('input', {
      bubbles: true,
      composed: true,
      inputType: 'deleteContentBackward',
      data: null,
    });
  } catch {
    return undefined;
  }
}

class TextControlAdapter implements EditorAdapter {
  private readonly candidates = new WeakSet<object>();

  constructor(
    readonly kind: 'textarea' | 'textInput',
    private readonly element: HTMLTextAreaElement | HTMLInputElement,
    private readonly document: Document,
  ) {}

  readTriggerCandidate(maxLength: number): TriggerCandidate | undefined {
    if (!isEditorFocused(this.element, this.document)) return undefined;
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    if (start === null || end === null || start !== end) return undefined;
    const candidate = readTextCandidate(this.element.value, end, maxLength);
    if (candidate !== undefined) this.candidates.add(candidate);
    return candidate;
  }

  captureActivation(
    candidate: TriggerCandidate,
  ): TriggerActivationSnapshot | undefined {
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      !this.candidates.delete(candidate)
    ) {
      return undefined;
    }
    const typedCandidate = candidate as Partial<TextTriggerCandidate>;
    if (
      typeof typedCandidate.start !== 'number' ||
      typeof typedCandidate.end !== 'number'
    ) {
      return undefined;
    }
    const start = typedCandidate.start;
    const end = typedCandidate.end;
    const expected = `${candidate.text} `;
    let consumed = false;
    return {
      cleanupAfterClipboardSuccess: () => {
        if (consumed) return false;
        consumed = true;
        if (
          !isEditorFocused(this.element, this.document) ||
          this.element.selectionStart !== end + 1 ||
          this.element.selectionEnd !== end + 1 ||
          this.element.value.slice(start, end + 1) !== expected
        ) {
          return false;
        }
        const notification = createInputNotification(this.document);
        if (notification === undefined) return false;
        this.element.setRangeText('', start, end + 1, 'start');
        this.element.dispatchEvent(notification);
        return true;
      },
    };
  }
}

function isSupportedInput(element: HTMLInputElement): boolean {
  const type = element.getAttribute('type')?.toLowerCase();
  return (
    type === null || type === undefined || type === 'text' || type === 'search'
  );
}

function findContenteditableRoot(
  target: EventTarget | null,
  document: Document,
): HTMLElement | undefined {
  if (!isElementNode(target) || target.ownerDocument !== document)
    return undefined;
  const root = target.closest('[contenteditable]');
  if (
    root === null ||
    root.ownerDocument !== document ||
    root.getAttribute('contenteditable')?.toLowerCase() === 'false'
  ) {
    return undefined;
  }
  return root as HTMLElement;
}

interface TextPiece {
  readonly node: Text;
  readonly start: number;
  readonly text: string;
}

function previousAdjacentText(node: Text, root: HTMLElement): Text | undefined {
  let cursor: Node = node;
  while (cursor !== root) {
    const previous = cursor.previousSibling;
    if (previous !== null) {
      let adjacent: Node = previous;
      if (isElementNode(adjacent) && !isInlineTextContainer(adjacent)) {
        return undefined;
      }
      while (adjacent.lastChild !== null) {
        adjacent = adjacent.lastChild;
        if (isElementNode(adjacent) && !isInlineTextContainer(adjacent)) {
          return undefined;
        }
      }
      return isTextNode(adjacent) ? adjacent : undefined;
    }

    const parent = cursor.parentNode;
    if (parent === null || parent === root) return undefined;
    if (!isInlineTextContainer(parent)) return undefined;
    cursor = parent;
  }
  return undefined;
}

function lastAdjacentText(node: Node): Text | undefined {
  let adjacent = node;
  if (isElementNode(adjacent) && !isInlineTextContainer(adjacent)) {
    return undefined;
  }
  while (adjacent.lastChild !== null) {
    adjacent = adjacent.lastChild;
    if (isElementNode(adjacent) && !isInlineTextContainer(adjacent)) {
      return undefined;
    }
  }
  return isTextNode(adjacent) ? adjacent : undefined;
}

function isAtValidStructuralBoundary(node: Text, root: HTMLElement): boolean {
  let current: Node = node;
  while (current !== root) {
    const previous = current.previousSibling;
    if (previous !== null) {
      return isElementNode(previous) && previous.localName === 'br';
    }
    const parent = current.parentNode;
    if (parent === null) return false;
    if (parent === root) return true;
    if (
      isElementNode(parent) &&
      LOGICAL_BLOCK_CONTAINER_NAMES.has(parent.localName)
    ) {
      return true;
    }
    if (!isInlineTextContainer(parent)) return false;
    current = parent;
  }
  return true;
}

function collectTextBeforeCaret(
  root: HTMLElement,
  container: Node,
  offset: number,
  limit: number,
): TextPiece[] | undefined {
  let node: Text | undefined;
  let nodeOffset: number;
  if (isTextNode(container)) {
    node = container;
    nodeOffset = offset;
  } else if (isElementNode(container) && offset > 0) {
    const preceding = container.childNodes[offset - 1];
    if (preceding === undefined) return undefined;
    const precedingText = lastAdjacentText(preceding);
    if (precedingText === undefined) return undefined;
    node = precedingText;
    nodeOffset = precedingText.data.length;
  } else {
    return undefined;
  }

  const pieces: TextPiece[] = [];
  let remaining = limit;
  while (node !== undefined && remaining > 0 && root.contains(node)) {
    const take = Math.min(nodeOffset, remaining);
    const start = nodeOffset - take;
    pieces.unshift({ node, start, text: node.data.slice(start, nodeOffset) });
    remaining -= take;
    if (start > 0) break;
    node = previousAdjacentText(node, root);
    nodeOffset = node?.data.length ?? 0;
  }
  return pieces;
}

class ContenteditableAdapter implements EditorAdapter {
  readonly kind = 'contenteditable' as const;
  private readonly candidates = new WeakSet<object>();

  constructor(
    private readonly root: HTMLElement,
    private readonly document: Document,
    private readonly activationCaretRange?: Range,
  ) {}

  readTriggerCandidate(maxLength: number): TriggerCandidate | undefined {
    if (!isEditorFocused(this.root, this.document)) return undefined;
    const caretRange =
      this.activationCaretRange ??
      readCurrentCaretRange(this.root, this.document)?.range;
    if (caretRange === undefined || !caretRange.collapsed) return undefined;
    if (!this.root.contains(caretRange.startContainer)) return undefined;
    const pieces = collectTextBeforeCaret(
      this.root,
      caretRange.startContainer,
      caretRange.startOffset,
      maxLength + 1,
    );
    if (pieces === undefined) return undefined;
    const combined = pieces.map(({ text }) => text).join('');
    const match = COMPLETE_TRIGGER_AT_END.exec(combined);
    const text = match?.[1];
    if (text === undefined || text.length > maxLength) return undefined;
    const candidateOffset = combined.length - text.length;
    const firstPiece = pieces[0];
    if (
      candidateOffset === 0 &&
      (firstPiece === undefined ||
        firstPiece.start !== 0 ||
        !isAtValidStructuralBoundary(firstPiece.node, this.root))
    ) {
      return undefined;
    }
    let consumed = 0;
    let startNode: Text | undefined;
    let startOffset = 0;
    for (const piece of pieces) {
      if (candidateOffset <= consumed + piece.text.length) {
        startNode = piece.node;
        startOffset = piece.start + candidateOffset - consumed;
        break;
      }
      consumed += piece.text.length;
    }
    if (startNode === undefined) return undefined;
    const range = this.document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(caretRange.endContainer, caretRange.endOffset);
    const candidate = { text, range, root: this.root } as DomTriggerCandidate;
    this.candidates.add(candidate);
    return candidate;
  }

  captureActivation(
    candidate: TriggerCandidate,
  ): TriggerActivationSnapshot | undefined {
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      !this.candidates.delete(candidate)
    ) {
      return undefined;
    }
    const typedCandidate = candidate as Partial<DomTriggerCandidate>;
    if (
      typedCandidate.range === undefined ||
      typedCandidate.root !== this.root ||
      !this.root.isConnected ||
      typedCandidate.range.startContainer.ownerDocument !== this.document ||
      typedCandidate.range.endContainer.ownerDocument !== this.document
    ) {
      return undefined;
    }
    const range = typedCandidate.range.cloneRange();
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const expected = `${candidate.text} `;
    let consumed = false;
    return {
      cleanupAfterClipboardSuccess: () => {
        if (consumed) return false;
        consumed = true;
        const currentCaret = readCurrentCaretRange(this.root, this.document);
        if (
          !this.root.isConnected ||
          !startContainer.isConnected ||
          startContainer.ownerDocument !== this.document ||
          currentCaret === undefined
        ) {
          return false;
        }
        const { range: caret, selection } = currentCaret;
        if (
          !this.root.contains(caret.startContainer) ||
          !isEditorFocused(this.root, this.document)
        ) {
          return false;
        }
        const cleanupRange = this.document.createRange();
        try {
          cleanupRange.setStart(startContainer, startOffset);
          cleanupRange.setEnd(caret.startContainer, caret.startOffset);
        } catch {
          return false;
        }
        const actual = cleanupRange.toString();
        if (actual !== expected && actual !== `${candidate.text}\u00a0`) {
          return false;
        }
        const notification = createInputNotification(this.document);
        if (notification === undefined) return false;
        cleanupRange.deleteContents();
        cleanupRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(cleanupRange);
        this.root.dispatchEvent(notification);
        return true;
      },
    };
  }
}

type SupportedEditor =
  | { readonly kind: 'textarea'; readonly element: HTMLTextAreaElement }
  | { readonly kind: 'textInput'; readonly element: HTMLInputElement }
  | { readonly kind: 'contenteditable'; readonly element: HTMLElement };

function resolveSupportedEditor(
  target: EventTarget | null,
  document: Document,
): SupportedEditor | undefined {
  if (!isElementNode(target) || target.ownerDocument !== document) {
    return undefined;
  }
  if (target.localName === 'textarea') {
    return { kind: 'textarea', element: target as HTMLTextAreaElement };
  }
  if (
    target.localName === 'input' &&
    isSupportedInput(target as HTMLInputElement)
  ) {
    return { kind: 'textInput', element: target as HTMLInputElement };
  }
  const root = findContenteditableRoot(target, document);
  return root === undefined
    ? undefined
    : { kind: 'contenteditable', element: root };
}

function createResolvedAdapter(
  editor: SupportedEditor,
  document: Document,
  activationCaretRange?: Range,
): EditorAdapter {
  return editor.kind === 'contenteditable'
    ? new ContenteditableAdapter(editor.element, document, activationCaretRange)
    : new TextControlAdapter(editor.kind, editor.element, document);
}

export function createEditorAdapter(
  event: EditorActivationEventLike,
  document: Document,
): EditorAdapter | undefined {
  const directEditor = resolveSupportedEditor(event.target, document);
  if (directEditor !== undefined) {
    return createResolvedAdapter(directEditor, document);
  }

  const path = readEventPath(event);
  if (path === undefined) return undefined;
  for (const pathTarget of path) {
    if (!isElementNode(pathTarget) || pathTarget.ownerDocument !== document) {
      continue;
    }
    const nearestEditable = pathTarget.closest('[contenteditable]');
    if (
      nearestEditable?.getAttribute('contenteditable')?.toLowerCase() ===
      'false'
    ) {
      return undefined;
    }
    const editor = resolveSupportedEditor(pathTarget, document);
    if (editor === undefined || !path.includes(editor.element)) continue;
    if (editor.kind !== 'contenteditable') {
      return createResolvedAdapter(editor, document);
    }
    const targetRange = toCollapsedEditorRange(
      readSingleEventTargetRange(event),
      editor.element,
      document,
    );
    return targetRange === undefined
      ? undefined
      : createResolvedAdapter(editor, document, targetRange);
  }
  return undefined;
}
