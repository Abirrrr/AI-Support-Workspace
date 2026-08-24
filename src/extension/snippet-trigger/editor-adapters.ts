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
  beginAutomaticPasteAuthorization(): void;
  recordAutomaticPasteActivationBeforeInputOutcome?(prevented: boolean): void;
  isAutomaticPasteSafe(): boolean;
  cleanupAfterClipboardSuccess(): boolean;
  consumeAutomaticPasteAuthorization(): boolean;
  invalidateAutomaticPasteAuthorization(): void;
  readAutomaticPasteDiagnostic?(): AutomaticPasteEditorDiagnostic;
}

export type PostCleanupFailure =
  | 'authorization-invalidated'
  | 'editor-disconnected'
  | 'document-changed'
  | 'composed-focus-mismatch'
  | 'selection-missing'
  | 'selection-not-collapsed'
  | 'caret-root-mismatch'
  | 'caret-path-mismatch'
  | 'caret-offset-mismatch'
  | 'structure-mismatch'
  | 'lifecycle-invalidated'
  | 'mutation-invalidated'
  | 'selection-invalidated'
  | 'focus-invalidated'
  | 'other'
  | null;

export type AutomaticPasteInvalidationCause =
  | 'mutation'
  | 'selectionchange'
  | 'focusout'
  | 'focusin'
  | 'window-blur'
  | 'editor-disconnected'
  | 'pagehide'
  | 'visibility-hidden'
  | 'unrelated-input'
  | 'lifecycle'
  | 'explicit-cancellation'
  | 'predicate-failed'
  | null;

export type AutomaticPasteFocusTopology =
  'direct-editor' | 'shadow-host-retargeted' | 'no-valid-composed-focus';

export type AutomaticPasteSafeInputType =
  | 'insertText'
  | 'insertLineBreak'
  | 'insertParagraph'
  | 'insertFromPaste'
  | 'insertFromDrop'
  | 'insertCompositionText'
  | 'deleteContentBackward'
  | 'deleteContentForward'
  | 'deleteByCut'
  | 'historyUndo'
  | 'historyRedo'
  | 'other';

export type AutomaticPasteExternalInputRelativePhase =
  | 'activation'
  | 'pre-cleanup'
  | 'cleanup-before-owned-input'
  | 'during-owned-cleanup-input'
  | 'cleanup-after-owned-input'
  | 'post-cleanup'
  | 'unknown';

export type AutomaticPasteExternalInputSequenceRelation =
  | 'before-owned-cleanup-input'
  | 'during-owned-cleanup-input'
  | 'immediately-after-owned-cleanup-input'
  | 'later'
  | 'unknown';

export interface PostCleanupChecks {
  readonly authorizationStillValid: boolean;
  readonly editorConnected: boolean;
  readonly sameDocument: boolean;
  readonly composedFocusValid: boolean;
  readonly selectionExists: boolean;
  readonly selectionCollapsed: boolean;
  readonly caretRootMatches: boolean;
  readonly caretPathMatches: boolean;
  readonly caretOffsetMatches: boolean;
  readonly structureMatches: boolean;
  readonly lifecycleValid: boolean;
  readonly mutationValid: boolean;
  readonly selectionValid: boolean;
  readonly focusValid: boolean;
}

export interface AutomaticPasteEditorDiagnostic {
  readonly postCleanupFailure: PostCleanupFailure;
  readonly postCleanupChecks: PostCleanupChecks;
  readonly firstInvalidationCause: AutomaticPasteInvalidationCause;
  readonly focusTopology: AutomaticPasteFocusTopology;
  readonly noticeMutationWithinAuthorizationObserverScope: boolean;
  readonly noticeMountedInsideEditor: false;
  readonly cleanupInputProvenance:
    | 'extension-owned'
    | 'nested-destination-input'
    | 'external-input'
    | 'none'
    | 'unknown';
  readonly firstInvalidatingInputPhase:
    | 'during-authorized-cleanup-dispatch'
    | 'outside-authorized-cleanup-dispatch'
    | null;
  readonly activationBeforeInputPrevented: boolean;
  readonly activationInputObserved: boolean;
  readonly externalInputTrusted: boolean | null;
  readonly externalInputType: AutomaticPasteSafeInputType | null;
  readonly externalInputSameEditor: boolean | null;
  readonly externalInputSameRoot: boolean | null;
  readonly externalInputComposed: boolean | null;
  readonly externalInputSameActivationTask: boolean | null;
  readonly externalInputRelativePhase: AutomaticPasteExternalInputRelativePhase | null;
  readonly externalInputSequenceRelation: AutomaticPasteExternalInputSequenceRelation | null;
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

type AutomaticGuardState =
  | 'inactive'
  | 'activation'
  | 'pre-cleanup'
  | 'post-cleanup'
  | 'invalid'
  | 'consumed';

type PostCleanupPredicateTuple = readonly [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

const SAFE_INPUT_TYPES = new Set<AutomaticPasteSafeInputType>([
  'insertText',
  'insertLineBreak',
  'insertParagraph',
  'insertFromPaste',
  'insertFromDrop',
  'insertCompositionText',
  'deleteContentBackward',
  'deleteContentForward',
  'deleteByCut',
  'historyUndo',
  'historyRedo',
]);

function readSafeInputType(event: Event): AutomaticPasteSafeInputType {
  try {
    const inputType = (event as Partial<InputEvent>).inputType;
    return typeof inputType === 'string' &&
      SAFE_INPUT_TYPES.has(inputType as AutomaticPasteSafeInputType)
      ? (inputType as AutomaticPasteSafeInputType)
      : 'other';
  } catch {
    return 'other';
  }
}

class EditorAutomaticPasteGuard {
  private state: AutomaticGuardState = 'inactive';
  private observer: MutationObserver | undefined;
  private lifecycleObserver: MutationObserver | undefined;
  private internalCleanup = false;
  private firstCause: AutomaticPasteInvalidationCause = null;
  private lastPostCleanupChecks: PostCleanupPredicateTuple | undefined;
  private ownedCleanupInput: Event | undefined;
  private ownedCleanupInputObserved = false;
  private ownedCleanupInputDispatchStarted = false;
  private ownedCleanupInputDispatchFinished = false;
  private activationPreventedEvidence = false;
  private activationInputSeenEvidence = false;
  private activationTaskOpen = false;
  private firstInvalidatingInputProvenance:
    'nested-destination-input' | 'external-input' | 'unknown' | undefined;
  private firstInvalidatingInputDuringOwnedDispatch: boolean | undefined;
  private invalidInputTrustedEvidence: boolean | null = null;
  private invalidInputTypeEvidence: AutomaticPasteSafeInputType | null = null;
  private invalidInputEditorEvidence: boolean | null = null;
  private invalidInputRootEvidence: boolean | null = null;
  private invalidInputComposedEvidence: boolean | null = null;
  private invalidInputActivationTaskEvidence: boolean | null = null;
  private invalidInputPhaseEvidence: AutomaticPasteExternalInputRelativePhase | null =
    null;
  private invalidInputSequenceEvidence: AutomaticPasteExternalInputSequenceRelation | null =
    null;

  private readonly invalidateOnPageHide = () => this.invalidate('pagehide');
  private readonly invalidateOnWindowBlur = () =>
    this.invalidate('window-blur');
  private readonly validateVisibility = () => {
    if (this.document.visibilityState === 'hidden')
      this.invalidate('visibility-hidden');
  };
  private readonly validateSelection = () => {
    if (this.internalCleanup && this.state === 'pre-cleanup') return;
    if (
      this.state !== 'inactive' &&
      this.state !== 'invalid' &&
      this.state !== 'consumed' &&
      !this.currentStateIsValid()
    ) {
      this.invalidate('selectionchange');
    }
  };
  private readonly handleFocusOut = (event: Event) => {
    if (this.editorContains(event.target)) this.invalidate('focusout');
  };
  private readonly handleFocusIn = (event: Event) => {
    if (!this.editorContains(event.target)) this.invalidate('focusin');
  };
  private readonly handleInput = (event: Event) => {
    if (event === this.ownedCleanupInput) {
      this.ownedCleanupInputObserved = true;
      return;
    }
    if (this.ownedCleanupInput !== undefined) {
      this.recordInvalidatingInput('nested-destination-input', true, event);
      this.invalidate('unrelated-input');
      return;
    }
    if (this.internalCleanup) {
      this.recordInvalidatingInput('external-input', false, event);
      this.invalidate('unrelated-input');
      return;
    }
    if (
      (import.meta.env.MODE === 'native-dev' ||
        import.meta.env.MODE === 'test') &&
      this.state === 'activation' &&
      readSafeInputType(event) === 'insertText' &&
      this.eventBelongsToEditor(event)
    ) {
      try {
        this.activationInputSeenEvidence =
          (event as Partial<InputEvent>).data === ' ';
      } catch {
        this.activationInputSeenEvidence = false;
      }
    }
    this.recordInvalidatingInput('external-input', false, event);
    this.invalidate('unrelated-input');
  };

  constructor(
    private readonly document: Document,
    private readonly editor: HTMLElement,
    private readonly validateActivation: () => boolean,
    private readonly validatePreCleanup: () => boolean,
    private readonly validatePostCleanup: () => PostCleanupPredicateTuple,
  ) {}

  begin(): void {
    if (this.state !== 'inactive') return;
    if (!this.validateActivation()) {
      this.state = 'invalid';
      return;
    }
    this.state = 'activation';
    if (
      import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
    ) {
      this.activationTaskOpen = true;
      void Promise.resolve().then(() => {
        this.activationTaskOpen = false;
      });
    }
    this.document.addEventListener(
      'selectionchange',
      this.validateSelection,
      true,
    );
    this.document.addEventListener(
      'visibilitychange',
      this.validateVisibility,
      true,
    );
    this.document.addEventListener('focusout', this.handleFocusOut, true);
    this.document.addEventListener('focusin', this.handleFocusIn, true);
    this.document.addEventListener('input', this.handleInput, true);
    this.document.defaultView?.addEventListener(
      'pagehide',
      this.invalidateOnPageHide,
      {
        once: true,
      },
    );
    this.document.defaultView?.addEventListener(
      'blur',
      this.invalidateOnWindowBlur,
      true,
    );
    const MutationObserverConstructor =
      this.document.defaultView?.MutationObserver;
    if (MutationObserverConstructor !== undefined) {
      this.observer = new MutationObserverConstructor(() => {
        if (this.internalCleanup) return;
        this.invalidate('mutation');
      });
      this.observer.observe(this.editor, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      this.lifecycleObserver = new MutationObserverConstructor((records) => {
        if (this.removedEditor(records)) this.invalidate('editor-disconnected');
      });
      this.lifecycleObserver.observe(this.editor.getRootNode(), {
        childList: true,
        subtree: true,
      });
    }
  }

  recordActivationBeforeInputOutcome(prevented: boolean): void {
    this.activationPreventedEvidence = prevented;
  }

  isSafeBeforeCleanup(): boolean {
    if (this.state === 'activation' && this.validatePreCleanup()) {
      this.state = 'pre-cleanup';
    }
    return this.state === 'pre-cleanup' && this.validatePreCleanup();
  }

  beginCleanup(): boolean {
    if (!this.isSafeBeforeCleanup()) return false;
    this.internalCleanup = true;
    this.observer?.takeRecords();
    return true;
  }

  acceptCleanupState(): boolean {
    if (
      !this.internalCleanup ||
      this.state !== 'pre-cleanup' ||
      !this.postCleanupIsValid()
    ) {
      this.invalidate('predicate-failed');
      return false;
    }
    this.state = 'post-cleanup';
    this.observer?.takeRecords();
    return true;
  }

  dispatchOwnedCleanupInput(target: HTMLElement, event: Event): boolean {
    if (
      target !== this.editor ||
      !this.internalCleanup ||
      this.state !== 'post-cleanup' ||
      this.ownedCleanupInput !== undefined
    ) {
      this.invalidate('predicate-failed');
      return false;
    }
    if (
      import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
    ) {
      this.ownedCleanupInputDispatchStarted = true;
    }
    this.ownedCleanupInput = event;
    try {
      return target.dispatchEvent(event);
    } catch {
      return false;
    } finally {
      this.ownedCleanupInput = undefined;
      if (
        import.meta.env.MODE === 'native-dev' ||
        import.meta.env.MODE === 'test'
      ) {
        this.ownedCleanupInputDispatchFinished = true;
      }
    }
  }

  finishCleanup(succeeded: boolean): boolean {
    const cleanupWasActive = this.internalCleanup;
    const editorWasRemoved = this.removedEditor(
      this.lifecycleObserver?.takeRecords() ?? [],
    );
    this.internalCleanup = false;
    if (
      !cleanupWasActive ||
      !succeeded ||
      editorWasRemoved ||
      this.state !== 'post-cleanup' ||
      !this.postCleanupIsValid()
    ) {
      this.invalidate(
        editorWasRemoved ? 'editor-disconnected' : 'predicate-failed',
      );
      return false;
    }
    this.observer?.takeRecords();
    return true;
  }

  consume(): boolean {
    if (this.state !== 'post-cleanup' || !this.postCleanupIsValid()) {
      this.invalidate('predicate-failed');
      return false;
    }
    this.state = 'consumed';
    this.detach();
    return true;
  }

  invalidate(
    cause: Exclude<
      AutomaticPasteInvalidationCause,
      null
    > = 'explicit-cancellation',
  ): void {
    if (this.state === 'consumed' || this.state === 'invalid') return;
    if (this.firstCause === null) {
      this.firstCause = cause;
    }
    this.state = 'invalid';
    this.detach();
  }

  readDiagnostic(): AutomaticPasteEditorDiagnostic {
    if (
      import.meta.env.MODE !== 'native-dev' &&
      import.meta.env.MODE !== 'test'
    ) {
      throw new Error('Unavailable outside diagnostic builds.');
    }
    const rawChecks = this.lastPostCleanupChecks ?? this.validatePostCleanup();
    const cause = this.firstCause;
    const checks: PostCleanupChecks = {
      editorConnected: rawChecks[1],
      sameDocument: rawChecks[2],
      composedFocusValid: rawChecks[3],
      selectionExists: rawChecks[4],
      selectionCollapsed: rawChecks[5],
      caretRootMatches: rawChecks[6],
      caretPathMatches: rawChecks[7],
      caretOffsetMatches: rawChecks[8],
      structureMatches: rawChecks[9],
      authorizationStillValid:
        this.state === 'post-cleanup' || this.state === 'consumed',
      lifecycleValid:
        cause !== 'pagehide' &&
        cause !== 'visibility-hidden' &&
        cause !== 'lifecycle' &&
        cause !== 'editor-disconnected',
      mutationValid: cause !== 'mutation',
      selectionValid: cause !== 'selectionchange',
      focusValid:
        cause !== 'focusout' && cause !== 'focusin' && cause !== 'window-blur',
    };
    const postCleanupFailure = classifyPostCleanupFailure(
      this.state,
      this.firstCause,
      checks,
    );
    const root = this.editor.getRootNode();
    return {
      postCleanupFailure,
      postCleanupChecks: checks,
      firstInvalidationCause: this.firstCause,
      focusTopology: readFocusTopology(this.editor, this.document),
      noticeMutationWithinAuthorizationObserverScope: root === this.document,
      noticeMountedInsideEditor: false,
      cleanupInputProvenance:
        this.firstInvalidatingInputProvenance ??
        (this.ownedCleanupInputObserved ? 'extension-owned' : 'none'),
      firstInvalidatingInputPhase:
        this.firstInvalidatingInputDuringOwnedDispatch === undefined
          ? null
          : this.firstInvalidatingInputDuringOwnedDispatch
            ? 'during-authorized-cleanup-dispatch'
            : 'outside-authorized-cleanup-dispatch',
      activationBeforeInputPrevented: this.activationPreventedEvidence,
      activationInputObserved: this.activationInputSeenEvidence,
      externalInputTrusted: this.invalidInputTrustedEvidence,
      externalInputType: this.invalidInputTypeEvidence,
      externalInputSameEditor: this.invalidInputEditorEvidence,
      externalInputSameRoot: this.invalidInputRootEvidence,
      externalInputComposed: this.invalidInputComposedEvidence,
      externalInputSameActivationTask: this.invalidInputActivationTaskEvidence,
      externalInputRelativePhase: this.invalidInputPhaseEvidence,
      externalInputSequenceRelation: this.invalidInputSequenceEvidence,
    };
  }

  private recordInvalidatingInput(
    provenance: 'nested-destination-input' | 'external-input' | 'unknown',
    duringOwnedDispatch: boolean,
    event: Event,
  ): void {
    if (
      import.meta.env.MODE !== 'native-dev' &&
      import.meta.env.MODE !== 'test'
    ) {
      return;
    }
    if (this.firstInvalidatingInputProvenance !== undefined) return;
    this.firstInvalidatingInputProvenance = provenance;
    this.firstInvalidatingInputDuringOwnedDispatch = duringOwnedDispatch;
    this.invalidInputTrustedEvidence = event.isTrusted;
    this.invalidInputTypeEvidence = readSafeInputType(event);
    this.invalidInputEditorEvidence = this.eventBelongsToEditor(event);
    this.invalidInputRootEvidence = this.eventBelongsToEditorRoot(event);
    this.invalidInputComposedEvidence = event.composed;
    this.invalidInputActivationTaskEvidence = this.activationTaskOpen;
    this.invalidInputPhaseEvidence = this.readExternalInputRelativePhase();
    this.invalidInputSequenceEvidence =
      this.readExternalInputSequenceRelation();
  }

  private readExternalInputRelativePhase(): AutomaticPasteExternalInputRelativePhase {
    if (this.ownedCleanupInput !== undefined) {
      return 'during-owned-cleanup-input';
    }
    if (this.internalCleanup) {
      return this.ownedCleanupInputDispatchFinished
        ? 'cleanup-after-owned-input'
        : 'cleanup-before-owned-input';
    }
    if (this.state === 'activation') return 'activation';
    if (this.state === 'pre-cleanup') return 'pre-cleanup';
    if (this.state === 'post-cleanup') return 'post-cleanup';
    return 'unknown';
  }

  private readExternalInputSequenceRelation(): AutomaticPasteExternalInputSequenceRelation {
    if (!this.ownedCleanupInputDispatchStarted) {
      return 'before-owned-cleanup-input';
    }
    if (this.ownedCleanupInput !== undefined) {
      return 'during-owned-cleanup-input';
    }
    if (this.internalCleanup && this.ownedCleanupInputDispatchFinished) {
      return 'immediately-after-owned-cleanup-input';
    }
    if (this.ownedCleanupInputDispatchFinished) return 'later';
    return 'unknown';
  }

  private eventBelongsToEditor(event: Event): boolean {
    return (
      this.eventPath(event).includes(this.editor) ||
      this.editorContains(event.target)
    );
  }

  private eventBelongsToEditorRoot(event: Event): boolean {
    const root = this.editor.getRootNode();
    const path = this.eventPath(event);
    if (path.includes(root)) return true;
    const target = event.target;
    return target instanceof Node && target.getRootNode() === root;
  }

  private eventPath(event: Event): readonly EventTarget[] {
    try {
      return event.composedPath();
    } catch {
      return [];
    }
  }

  private currentStateIsValid(): boolean {
    if (this.state === 'activation') {
      return this.validateActivation() || this.validatePreCleanup();
    }
    if (this.state === 'pre-cleanup') return this.validatePreCleanup();
    if (this.state === 'post-cleanup') return this.postCleanupIsValid();
    return false;
  }

  private postCleanupIsValid(): boolean {
    const checks = this.validatePostCleanup();
    this.lastPostCleanupChecks = checks;
    return checks.every(Boolean);
  }

  private editorContains(target: EventTarget | null): boolean {
    if (target === this.editor) return true;
    if (
      typeof target !== 'object' ||
      target === null ||
      !('nodeType' in target)
    ) {
      return false;
    }
    try {
      return this.editor.contains(target as Node);
    } catch {
      return false;
    }
  }

  private removedEditor(records: readonly MutationRecord[]): boolean {
    return records.some((record) =>
      Array.from(record.removedNodes).some(
        (node) => node === this.editor || node.contains(this.editor),
      ),
    );
  }

  private detach(): void {
    this.observer?.disconnect();
    this.lifecycleObserver?.disconnect();
    this.document.removeEventListener(
      'selectionchange',
      this.validateSelection,
      true,
    );
    this.document.removeEventListener(
      'visibilitychange',
      this.validateVisibility,
      true,
    );
    this.document.removeEventListener('focusout', this.handleFocusOut, true);
    this.document.removeEventListener('focusin', this.handleFocusIn, true);
    this.document.removeEventListener('input', this.handleInput, true);
    this.document.defaultView?.removeEventListener(
      'pagehide',
      this.invalidateOnPageHide,
    );
    this.document.defaultView?.removeEventListener(
      'blur',
      this.invalidateOnWindowBlur,
      true,
    );
  }
}

function classifyPostCleanupFailure(
  state: AutomaticGuardState,
  firstInvalidationCause: AutomaticPasteInvalidationCause,
  checks: PostCleanupChecks,
): PostCleanupFailure {
  if (state === 'consumed' && Object.values(checks).every(Boolean)) return null;
  if (!checks.editorConnected) return 'editor-disconnected';
  if (!checks.sameDocument) return 'document-changed';
  if (firstInvalidationCause === 'mutation') return 'mutation-invalidated';
  if (firstInvalidationCause === 'selectionchange') {
    return 'selection-invalidated';
  }
  if (
    firstInvalidationCause === 'focusout' ||
    firstInvalidationCause === 'focusin' ||
    firstInvalidationCause === 'window-blur'
  ) {
    return 'focus-invalidated';
  }
  if (firstInvalidationCause === 'editor-disconnected') {
    return 'editor-disconnected';
  }
  if (
    firstInvalidationCause === 'pagehide' ||
    firstInvalidationCause === 'visibility-hidden' ||
    firstInvalidationCause === 'lifecycle'
  ) {
    return 'lifecycle-invalidated';
  }
  if (!checks.composedFocusValid) return 'composed-focus-mismatch';
  if (!checks.selectionExists) return 'selection-missing';
  if (!checks.selectionCollapsed) return 'selection-not-collapsed';
  if (!checks.caretRootMatches) return 'caret-root-mismatch';
  if (!checks.caretPathMatches) return 'caret-path-mismatch';
  if (!checks.caretOffsetMatches) return 'caret-offset-mismatch';
  if (!checks.structureMatches) return 'structure-mismatch';
  if (!checks.lifecycleValid) return 'lifecycle-invalidated';
  if (!checks.mutationValid) return 'mutation-invalidated';
  if (!checks.selectionValid) return 'selection-invalidated';
  if (!checks.focusValid) return 'focus-invalidated';
  if (!checks.authorizationStillValid) return 'authorization-invalidated';
  return state === 'consumed' ? null : 'other';
}

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

function readFocusTopology(
  element: HTMLElement,
  document: Document,
): AutomaticPasteFocusTopology {
  const active = document.activeElement;
  if (active === element || element.contains(active)) return 'direct-editor';
  const root = element.getRootNode();
  if (
    root !== document &&
    typeof root === 'object' &&
    root !== null &&
    (root as Partial<DocumentOrShadowRoot>).activeElement !== null &&
    ((root as Partial<DocumentOrShadowRoot>).activeElement === element ||
      element.contains(
        (root as Partial<DocumentOrShadowRoot>).activeElement ?? null,
      )) &&
    active !== null &&
    active === (root as ShadowRoot).host
  ) {
    return 'shadow-host-retargeted';
  }
  return 'no-valid-composed-focus';
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
    const expected = candidate.text;
    const activationValue = this.element.value;
    const expectedPostCleanupValue = `${activationValue.slice(0, start)}${activationValue.slice(end)}`;
    const guard = new EditorAutomaticPasteGuard(
      this.document,
      this.element,
      () =>
        isEditorFocused(this.element, this.document) &&
        this.element.selectionStart === end &&
        this.element.selectionEnd === end &&
        this.element.value === activationValue,
      () =>
        isEditorFocused(this.element, this.document) &&
        this.element.selectionStart === end &&
        this.element.selectionEnd === end &&
        this.element.value === activationValue,
      () => {
        const selectionStart = this.element.selectionStart;
        const selectionEnd = this.element.selectionEnd;
        return [
          true,
          this.element.isConnected,
          this.element.ownerDocument === this.document,
          isEditorFocused(this.element, this.document),
          selectionStart !== null && selectionEnd !== null,
          selectionStart !== null && selectionStart === selectionEnd,
          true,
          true,
          selectionStart === start && selectionEnd === start,
          this.element.value === expectedPostCleanupValue,
          true,
          true,
          true,
          true,
        ];
      },
    );
    let automaticActive = false;
    let consumed = false;
    return {
      beginAutomaticPasteAuthorization: () => {
        automaticActive = true;
        guard.begin();
      },
      ...(import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
        ? {
            recordAutomaticPasteActivationBeforeInputOutcome: (
              prevented: boolean,
            ) => guard.recordActivationBeforeInputOutcome(prevented),
          }
        : {}),
      isAutomaticPasteSafe: () =>
        automaticActive && guard.isSafeBeforeCleanup(),
      cleanupAfterClipboardSuccess: () => {
        if (consumed) return false;
        consumed = true;
        const automaticCleanupAuthorized =
          automaticActive && guard.beginCleanup();
        if (
          !isEditorFocused(this.element, this.document) ||
          this.element.selectionStart !== end ||
          this.element.selectionEnd !== end ||
          this.element.value.slice(start, end) !== expected
        ) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        const notification = createInputNotification(this.document);
        if (notification === undefined) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        this.element.setRangeText('', start, end, 'start');
        const cleanupStateAccepted =
          !automaticActive ||
          (automaticCleanupAuthorized && guard.acceptCleanupState());
        const notificationDispatched = automaticCleanupAuthorized
          ? guard.dispatchOwnedCleanupInput(this.element, notification)
          : this.element.dispatchEvent(notification);
        if (!automaticActive) return true;
        return automaticCleanupAuthorized
          ? (guard.finishCleanup(
              cleanupStateAccepted && notificationDispatched,
            ),
            true)
          : (guard.invalidate(), true);
      },
      consumeAutomaticPasteAuthorization: () =>
        automaticActive && guard.consume(),
      invalidateAutomaticPasteAuthorization: () => guard.invalidate(),
      ...(import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
        ? { readAutomaticPasteDiagnostic: () => guard.readDiagnostic() }
        : {}),
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

interface EditorBoundarySnapshot {
  readonly path: readonly number[];
  readonly offset: number;
}

function captureEditorBoundary(
  root: HTMLElement,
  container: Node,
  offset: number,
): EditorBoundarySnapshot | undefined {
  if (!isNodeWithinEditor(container, root)) return undefined;
  const path: number[] = [];
  let current = container;
  while (current !== root) {
    const parent = current.parentNode;
    if (parent === null) return undefined;
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    if (index < 0) return undefined;
    path.unshift(index);
    current = parent;
  }
  return { path, offset };
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
    const expected = candidate.text;
    let postCleanupBoundary: EditorBoundarySnapshot | undefined;
    let postCleanupEditor: Node | undefined;
    const readCleanupState = () => {
      const currentCaret = readCurrentCaretRange(this.root, this.document);
      if (
        !this.root.isConnected ||
        !startContainer.isConnected ||
        startContainer.ownerDocument !== this.document ||
        currentCaret === undefined ||
        !isEditorFocused(this.root, this.document)
      ) {
        return undefined;
      }
      const cleanupRange = this.document.createRange();
      try {
        cleanupRange.setStart(startContainer, startOffset);
        cleanupRange.setEnd(
          currentCaret.range.startContainer,
          currentCaret.range.startOffset,
        );
      } catch {
        return undefined;
      }
      return { currentCaret, cleanupRange };
    };
    const guard = new EditorAutomaticPasteGuard(
      this.document,
      this.root,
      () => {
        const current = readCurrentCaretRange(this.root, this.document)?.range;
        return (
          this.root.isConnected &&
          isEditorFocused(this.root, this.document) &&
          current !== undefined &&
          current.startContainer === range.endContainer &&
          current.startOffset === range.endOffset &&
          range.toString() === candidate.text
        );
      },
      () => {
        const state = readCleanupState();
        if (state === undefined) return false;
        const actual = state.cleanupRange.toString();
        return actual === expected;
      },
      () => {
        const selection = this.document.getSelection();
        const current = readCurrentCaretRange(this.root, this.document)?.range;
        const currentBoundary =
          current === undefined
            ? undefined
            : captureEditorBoundary(
                this.root,
                current.startContainer,
                current.startOffset,
              );
        const caretRootMatches =
          current !== undefined &&
          isNodeWithinEditor(current.startContainer, this.root);
        return [
          true,
          this.root.isConnected,
          this.root.ownerDocument === this.document,
          isEditorFocused(this.root, this.document),
          selection !== null && current !== undefined,
          current?.collapsed === true,
          caretRootMatches,
          postCleanupBoundary !== undefined &&
            currentBoundary !== undefined &&
            postCleanupBoundary.path.length === currentBoundary.path.length &&
            postCleanupBoundary.path.every(
              (part, index) => currentBoundary.path[index] === part,
            ),
          postCleanupBoundary !== undefined &&
            currentBoundary !== undefined &&
            postCleanupBoundary.offset === currentBoundary.offset,
          postCleanupEditor !== undefined &&
            this.root.isEqualNode(postCleanupEditor),
          true,
          true,
          true,
          true,
        ];
      },
    );
    let automaticActive = false;
    let consumed = false;
    return {
      beginAutomaticPasteAuthorization: () => {
        automaticActive = true;
        guard.begin();
      },
      ...(import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
        ? {
            recordAutomaticPasteActivationBeforeInputOutcome: (
              prevented: boolean,
            ) => guard.recordActivationBeforeInputOutcome(prevented),
          }
        : {}),
      isAutomaticPasteSafe: () =>
        automaticActive && guard.isSafeBeforeCleanup(),
      cleanupAfterClipboardSuccess: () => {
        if (consumed) return false;
        consumed = true;
        const automaticCleanupAuthorized =
          automaticActive && guard.beginCleanup();
        const currentCaret = readCurrentCaretRange(this.root, this.document);
        if (
          !this.root.isConnected ||
          !startContainer.isConnected ||
          startContainer.ownerDocument !== this.document ||
          currentCaret === undefined
        ) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        const { range: caret, selection } = currentCaret;
        if (
          !this.root.contains(caret.startContainer) ||
          !isEditorFocused(this.root, this.document)
        ) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        const cleanupRange = this.document.createRange();
        try {
          cleanupRange.setStart(startContainer, startOffset);
          cleanupRange.setEnd(caret.startContainer, caret.startOffset);
        } catch {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        const actual = cleanupRange.toString();
        if (actual !== expected) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        const notification = createInputNotification(this.document);
        if (notification === undefined) {
          if (automaticActive) guard.finishCleanup(false);
          return false;
        }
        cleanupRange.deleteContents();
        cleanupRange.collapse(true);
        postCleanupBoundary = captureEditorBoundary(
          this.root,
          cleanupRange.startContainer,
          cleanupRange.startOffset,
        );
        postCleanupEditor = this.root.cloneNode(true);
        selection.removeAllRanges();
        selection.addRange(cleanupRange);
        const cleanupStateAccepted =
          !automaticActive ||
          (automaticCleanupAuthorized && guard.acceptCleanupState());
        const notificationDispatched = automaticCleanupAuthorized
          ? guard.dispatchOwnedCleanupInput(this.root, notification)
          : this.root.dispatchEvent(notification);
        if (!automaticActive) return true;
        return automaticCleanupAuthorized
          ? (guard.finishCleanup(
              cleanupStateAccepted && notificationDispatched,
            ),
            true)
          : (guard.invalidate(), true);
      },
      consumeAutomaticPasteAuthorization: () =>
        automaticActive && guard.consume(),
      invalidateAutomaticPasteAuthorization: () => guard.invalidate(),
      ...(import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
        ? { readAutomaticPasteDiagnostic: () => guard.readDiagnostic() }
        : {}),
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
