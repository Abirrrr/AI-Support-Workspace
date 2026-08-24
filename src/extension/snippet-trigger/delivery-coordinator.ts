import {
  ClipboardPermissionRequiredError,
  ClipboardTransportError,
  type ClipboardTransport,
  type ClipboardTransportErrorCode,
} from './clipboard-transport';
import { ClipboardImageSafetyError } from '../../application/snippet/clipboard-image-safety';
import {
  SnippetDeliveryError,
  type SnippetDeliveryPlanner,
} from '../../application/snippet/snippet-delivery-planner';
import {
  isAutomaticPasteFinalizeMessage,
  isTriggerActivationRequestMessage,
  type AutomaticPasteFinalizeMessage,
  type AutomaticPasteFinalizeResponse,
  type SnippetDeliveryFailureCode,
  type TriggerActivationRequestMessage,
  type TriggerActivationResponseMessage,
} from '../../shared/snippet-delivery-messages';
import type {
  AutomaticPasteResult,
  AutomaticPasteTransport,
  NativePasteAttemptDiagnostic,
  NativePasteContext,
} from '../../application/snippet/automatic-paste-transport';
import type { SettingsRepository } from '../../application/persistence/settings-repository';
import type { SnippetPasteMode } from '../../domain/settings';
import { createNativeClipboardRequestId } from '../../infrastructure/clipboard/native-clipboard-protocol';

export interface SnippetDeliveryMessageSender {
  readonly documentId?: string;
  readonly frameId?: number;
  readonly tab?: {
    readonly id?: number;
    readonly windowId?: number;
  };
}

type RuntimeMessageListener = (
  message: unknown,
  sender: SnippetDeliveryMessageSender,
) => unknown;

interface RuntimeMessageEvent {
  addListener(listener: RuntimeMessageListener): void;
  removeListener(listener: RuntimeMessageListener): void;
}

export interface SnippetDeliveryRuntime {
  readonly onMessage: RuntimeMessageEvent;
}

export interface SnippetDeliveryBrowserSafetyApi {
  readonly tabs: {
    get(tabId: number): Promise<{
      readonly id?: number;
      readonly windowId?: number;
      readonly active?: boolean;
    }>;
  };
  readonly windows: {
    get(windowId: number): Promise<{
      readonly id?: number;
      readonly focused?: boolean;
    }>;
  };
}

interface TrustedSenderIdentity {
  readonly documentId: string;
  readonly frameId: number;
  readonly tabId: number;
  readonly windowId: number;
}

interface PendingAutomaticPaste {
  readonly requestId: string;
  readonly authorizationId: string;
  readonly kind: 'text' | 'image';
  readonly sender: TrustedSenderIdentity;
  readonly context: NativePasteContext;
  readonly timeout: ReturnType<typeof setTimeout>;
}

export interface CatalogActivationIdentity {
  isCurrentSnapshot(epoch: string, revision: number): boolean;
}

export interface SnippetDeliveryFailureDiagnostic {
  readonly stage:
    | 'catalog'
    | 'planner'
    | 'permission'
    | 'offscreen-create'
    | 'offscreen-message'
    | 'offscreen-write'
    | 'native-capability'
    | 'native-message'
    | 'image-preparation'
    | 'delivery';
  readonly code: SnippetDeliveryFailureCode;
  readonly kind: 'text' | 'image';
  readonly phase:
    'pre-planning' | 'planning' | 'pre-write' | 'transport' | 'clipboard-write';
}

export type SnippetDeliveryDiagnosticSink = (
  diagnostic: SnippetDeliveryFailureDiagnostic,
) => void;

export interface SnippetDeliveryTimingDiagnostic {
  readonly kind: 'text' | 'image';
  readonly phase:
    | 'clipboard-preparation'
    | 'clipboard-write'
    | 'automatic-safety'
    | 'native-paste-request';
  readonly durationMs: number;
  readonly outcome: 'success' | 'fallback' | 'failed' | 'indeterminate';
}

export type SnippetDeliveryTimingSink = (
  diagnostic: SnippetDeliveryTimingDiagnostic,
) => void;

export interface AutomaticPasteResultDiagnostic {
  readonly kind: 'text' | 'image';
  readonly phase:
    | 'preflight'
    | 'browser-precheck'
    | 'native-context-capture'
    | 'editor-finalize'
    | 'browser-finalize'
    | 'native-paste-request'
    | 'finalize-timeout';
  readonly requestId: string;
  readonly result: AutomaticPasteFinalizeResponse['result'];
}

export type AutomaticPasteResultDiagnosticSink = (
  diagnostic: AutomaticPasteResultDiagnostic,
) => void;

export type AutomaticPasteTracePhase =
  | 'activation-received'
  | 'paste-mode-resolved'
  | 'clipboard-started'
  | 'clipboard-succeeded'
  | 'automatic-precheck-started'
  | 'native-context-capture-started'
  | 'native-context-captured'
  | 'cleanup-started'
  | 'cleanup-succeeded'
  | 'post-cleanup-check'
  | 'authorization-consumed'
  | 'final-browser-check'
  | 'native-paste-requested'
  | 'native-paste-result'
  | 'finalize-timeout'
  | 'manual-fallback';

export interface AutomaticPasteTraceDiagnostic {
  readonly kind?: 'text' | 'image';
  readonly requestId: string;
  readonly phase: AutomaticPasteTracePhase;
  readonly persistedPasteMode?: SnippetPasteMode | null;
  readonly workerPasteMode?: SnippetPasteMode;
  readonly selectedBranch?: SnippetPasteMode;
  readonly result?: AutomaticPasteFinalizeResponse['result'];
  readonly resultPhase?: AutomaticPasteResultDiagnostic['phase'];
  readonly nativePasteDiagnostic?: NativePasteAttemptDiagnostic;
}

export type AutomaticPasteTraceDiagnosticSink = (
  diagnostic: AutomaticPasteTraceDiagnostic,
) => void;

function transportDiagnosticStage(
  code: ClipboardTransportErrorCode,
  kind: 'text' | 'image',
): {
  readonly stage: SnippetDeliveryFailureDiagnostic['stage'];
  readonly phase: SnippetDeliveryFailureDiagnostic['phase'];
} {
  if (code === 'offscreen-create-failed') {
    return { stage: 'offscreen-create', phase: 'transport' };
  }
  if (
    code === 'offscreen-message-failed' ||
    code === 'invalid-offscreen-response'
  ) {
    return { stage: 'offscreen-message', phase: 'transport' };
  }
  if (
    code === 'native-permission-required' ||
    code === 'host-version-mismatch' ||
    code === 'native-delivery-busy'
  ) {
    return { stage: 'native-capability', phase: 'pre-write' };
  }
  if (code === 'host-unavailable' || code === 'invalid-host-response') {
    return { stage: 'native-message', phase: 'transport' };
  }
  if (
    kind === 'image' &&
    (code === 'image-invalid' ||
      code === 'image-decode-failed' ||
      code === 'image-too-large')
  ) {
    return { stage: 'image-preparation', phase: 'transport' };
  }
  if (kind === 'image' && code === 'clipboard-write-failed') {
    return { stage: 'native-message', phase: 'clipboard-write' };
  }
  return { stage: 'offscreen-write', phase: 'clipboard-write' };
}

export class SnippetDeliveryCoordinator {
  private automaticDeliveryInProgress = false;
  private pendingAutomaticPaste: PendingAutomaticPaste | undefined;

  constructor(
    private readonly planner: SnippetDeliveryPlanner,
    private readonly transport: ClipboardTransport,
    private readonly catalog: CatalogActivationIdentity,
    private readonly reportDiagnostic: SnippetDeliveryDiagnosticSink = (
      diagnostic,
    ) => {
      console.error('[AI Support Workspace][Snippet Delivery]', diagnostic);
    },
    private readonly automaticPasteTransport?: AutomaticPasteTransport,
    private readonly settingsRepository?: SettingsRepository,
    private readonly browserSafety?: SnippetDeliveryBrowserSafetyApi,
    private readonly reportAutomaticPasteResult: AutomaticPasteResultDiagnosticSink = () =>
      undefined,
    private readonly reportAutomaticPasteTrace: AutomaticPasteTraceDiagnosticSink = () =>
      undefined,
    private readonly createAuthorizationId: () => string = () =>
      createNativeClipboardRequestId(),
    private readonly reportTiming: SnippetDeliveryTimingSink = () => undefined,
    private readonly now: () => number = () => performance.now(),
  ) {}

  handleMessage(
    message: unknown,
    sender: SnippetDeliveryMessageSender = {},
  ): Promise<unknown> | undefined {
    if (isTriggerActivationRequestMessage(message)) {
      return this.handleActivation(message, sender);
    }
    if (isAutomaticPasteFinalizeMessage(message)) {
      return this.handleAutomaticFinalize(message, sender);
    }
    return undefined;
  }

  private async handleActivation(
    message: TriggerActivationRequestMessage,
    sender: SnippetDeliveryMessageSender,
  ): Promise<TriggerActivationResponseMessage> {
    this.recordAutomaticPasteTrace({
      kind: message.kind,
      requestId: message.requestId,
      phase: 'activation-received',
    });
    const failure = (
      code: SnippetDeliveryFailureCode,
      stage: SnippetDeliveryFailureDiagnostic['stage'],
      phase: SnippetDeliveryFailureDiagnostic['phase'],
      outcome: 'permission-required' | 'failed',
      text: string,
    ): TriggerActivationResponseMessage => {
      try {
        this.reportDiagnostic({ stage, code, kind: message.kind, phase });
      } catch {
        // Diagnostics must never change the fail-safe delivery outcome.
      }
      return {
        type: 'snippet-trigger-activation-result',
        requestId: message.requestId,
        outcome,
        code,
        message: `${text} [${code}]`,
      };
    };
    let persistedPasteMode: SnippetPasteMode | null = null;
    try {
      persistedPasteMode =
        (await this.settingsRepository?.load())?.snippetPasteMode ?? null;
    } catch {
      // A missing or unreadable preference fails closed to clipboard-only.
    }
    const workerPasteMode: SnippetPasteMode =
      persistedPasteMode === 'automatic' ? 'automatic' : 'clipboard-only';
    const automaticMode = workerPasteMode === 'automatic';
    this.recordAutomaticPasteTrace({
      kind: message.kind,
      requestId: message.requestId,
      phase: 'paste-mode-resolved',
      persistedPasteMode,
      workerPasteMode,
      selectedBranch: workerPasteMode,
    });
    if (automaticMode && this.automaticDeliveryInProgress) {
      this.recordAutomaticPasteResult(
        message.kind,
        message.requestId,
        'preflight',
        'busy',
      );
      return failure(
        'automatic-delivery-busy',
        'delivery',
        'pre-planning',
        'failed',
        'Another automatic Snippet delivery is active. Try again.',
      );
    }
    if (automaticMode) this.automaticDeliveryInProgress = true;

    if (!this.catalog.isCurrentSnapshot(message.epoch, message.revision)) {
      if (automaticMode) this.releaseAutomaticDelivery();
      return failure(
        'stale-catalog',
        'catalog',
        'pre-planning',
        'failed',
        'Snippet changed. Type the trigger again.',
      );
    }
    try {
      this.recordAutomaticPasteTrace({
        kind: message.kind,
        requestId: message.requestId,
        phase: 'clipboard-started',
      });
      const preparationStartedAt = this.now();
      const plan = await this.planner.plan(message);
      this.recordTiming(
        message.kind,
        'clipboard-preparation',
        preparationStartedAt,
        'success',
      );
      if (!this.catalog.isCurrentSnapshot(message.epoch, message.revision)) {
        if (automaticMode) this.releaseAutomaticDelivery();
        return failure(
          'stale-catalog',
          'catalog',
          'pre-write',
          'failed',
          'Snippet changed. Type the trigger again.',
        );
      }
      const clipboardWriteStartedAt = this.now();
      await this.transport.write(plan, message.requestId);
      this.recordAutomaticPasteTrace({
        kind: plan.kind,
        requestId: message.requestId,
        phase: 'clipboard-succeeded',
      });
      this.recordTiming(
        plan.kind,
        'clipboard-write',
        clipboardWriteStartedAt,
        'success',
      );
      if (automaticMode) {
        this.recordAutomaticPasteTrace({
          kind: plan.kind,
          requestId: message.requestId,
          phase: 'automatic-precheck-started',
        });
        const automaticSafetyStartedAt = this.now();
        const identity = this.toTrustedSenderIdentity(sender);
        if (identity === undefined) {
          this.recordTiming(
            plan.kind,
            'automatic-safety',
            automaticSafetyStartedAt,
            'fallback',
          );
          this.recordAutomaticPasteResult(
            plan.kind,
            message.requestId,
            'browser-precheck',
            'not-foreground',
          );
          this.releaseAutomaticDelivery();
          return {
            type: 'snippet-trigger-activation-result',
            requestId: message.requestId,
            outcome: 'copied',
            kind: plan.kind,
          };
        }
        if (!(await this.isBrowserContextSafe(identity))) {
          this.recordTiming(
            plan.kind,
            'automatic-safety',
            automaticSafetyStartedAt,
            'fallback',
          );
          this.recordAutomaticPasteResult(
            plan.kind,
            message.requestId,
            'browser-precheck',
            'not-foreground',
          );
          this.releaseAutomaticDelivery();
          return {
            type: 'snippet-trigger-activation-result',
            requestId: message.requestId,
            outcome: 'copied',
            kind: plan.kind,
          };
        }
        if (this.automaticPasteTransport === undefined) {
          this.recordTiming(
            plan.kind,
            'automatic-safety',
            automaticSafetyStartedAt,
            'fallback',
          );
          this.recordAutomaticPasteResult(
            plan.kind,
            message.requestId,
            'native-context-capture',
            'native-unavailable',
            'automatic-precheck-started',
          );
          this.releaseAutomaticDelivery();
          return {
            type: 'snippet-trigger-activation-result',
            requestId: message.requestId,
            outcome: 'copied',
            kind: plan.kind,
          };
        }
        const authorizationId = this.createAuthorizationId();
        let context: NativePasteContext;
        this.recordAutomaticPasteTrace({
          kind: plan.kind,
          requestId: message.requestId,
          phase: 'native-context-capture-started',
        });
        try {
          context =
            await this.automaticPasteTransport.capturePasteContext(
              authorizationId,
            );
        } catch {
          this.recordTiming(
            plan.kind,
            'automatic-safety',
            automaticSafetyStartedAt,
            'fallback',
          );
          this.recordAutomaticPasteResult(
            plan.kind,
            message.requestId,
            'native-context-capture',
            'native-unavailable',
          );
          this.releaseAutomaticDelivery();
          return {
            type: 'snippet-trigger-activation-result',
            requestId: message.requestId,
            outcome: 'copied',
            kind: plan.kind,
          };
        }
        this.recordAutomaticPasteTrace({
          kind: plan.kind,
          requestId: message.requestId,
          phase: 'native-context-captured',
        });
        this.recordTiming(
          plan.kind,
          'automatic-safety',
          automaticSafetyStartedAt,
          'success',
        );
        const timeout = setTimeout(() => {
          if (this.pendingAutomaticPaste?.authorizationId === authorizationId) {
            this.recordAutomaticPasteResult(
              plan.kind,
              message.requestId,
              'finalize-timeout',
              'indeterminate',
            );
            this.releaseAutomaticDelivery();
          }
        }, 15_000);
        this.pendingAutomaticPaste = {
          requestId: message.requestId,
          authorizationId,
          kind: plan.kind,
          sender: identity,
          context,
          timeout,
        };
        return {
          type: 'snippet-trigger-activation-result',
          requestId: message.requestId,
          outcome: 'automatic-ready',
          kind: plan.kind,
          authorizationId,
        };
      }
      this.recordAutomaticPasteTrace({
        kind: plan.kind,
        requestId: message.requestId,
        phase: 'manual-fallback',
      });
      return {
        type: 'snippet-trigger-activation-result',
        requestId: message.requestId,
        outcome: 'copied',
        kind: plan.kind,
      } satisfies TriggerActivationResponseMessage;
    } catch (error) {
      if (automaticMode) this.releaseAutomaticDelivery();
      if (error instanceof SnippetDeliveryError) {
        return failure(
          error.code,
          'planner',
          'planning',
          'failed',
          'Could not prepare this Snippet. Try again.',
        );
      }
      if (error instanceof ClipboardPermissionRequiredError) {
        return failure(
          'permission-required',
          'permission',
          'pre-write',
          'permission-required',
          'Enable clipboard delivery in extension Settings.',
        );
      }
      if (
        error instanceof ClipboardImageSafetyError &&
        error.code === 'image-too-large'
      ) {
        return failure(
          'image-too-large',
          'planner',
          'planning',
          'failed',
          'Image is too large for clipboard delivery.',
        );
      }
      if (
        error instanceof ClipboardImageSafetyError &&
        error.code === 'animated-webp'
      ) {
        return failure(
          'animated-webp',
          'planner',
          'planning',
          'failed',
          'Animated WebP is not supported for clipboard delivery.',
        );
      }
      if (error instanceof ClipboardTransportError) {
        const diagnostic = transportDiagnosticStage(error.code, message.kind);
        const nativeFailure =
          error.code === 'native-permission-required' ||
          error.code === 'host-unavailable' ||
          error.code === 'host-version-mismatch' ||
          error.code === 'invalid-host-response';
        return failure(
          error.code,
          diagnostic.stage,
          diagnostic.phase,
          error.code === 'native-permission-required'
            ? 'permission-required'
            : 'failed',
          nativeFailure
            ? "Windows Image Snippets aren't ready. Check Settings."
            : error.code === 'native-delivery-busy'
              ? 'Another Image Snippet is being prepared. Try again.'
              : 'Could not prepare this Snippet. Try again.',
        );
      }
      return failure(
        'unexpected-delivery-failure',
        'delivery',
        'transport',
        'failed',
        'Could not prepare this Snippet. Try again.',
      );
    }
  }

  private async handleAutomaticFinalize(
    message: AutomaticPasteFinalizeMessage,
    sender: SnippetDeliveryMessageSender,
  ): Promise<AutomaticPasteFinalizeResponse | undefined> {
    const pending = this.pendingAutomaticPaste;
    if (
      pending === undefined ||
      pending.requestId !== message.requestId ||
      pending.authorizationId !== message.authorizationId ||
      !this.senderMatches(pending.sender, sender)
    ) {
      return undefined;
    }

    // Consume the one-use authorization before any final check or native call.
    clearTimeout(pending.timeout);
    this.pendingAutomaticPaste = undefined;
    this.automaticDeliveryInProgress = false;

    if (message.editorState === 'cleanup-failed') {
      this.recordAutomaticPasteTrace({
        kind: pending.kind,
        requestId: message.requestId,
        phase: 'cleanup-started',
      });
    } else {
      this.recordAutomaticPasteTrace({
        kind: pending.kind,
        requestId: message.requestId,
        phase: 'cleanup-succeeded',
      });
      this.recordAutomaticPasteTrace({
        kind: pending.kind,
        requestId: message.requestId,
        phase:
          message.editorState === 'ready'
            ? 'authorization-consumed'
            : 'post-cleanup-check',
      });
    }

    let result: AutomaticPasteFinalizeResponse['result'];
    let diagnosticPhase: AutomaticPasteResultDiagnostic['phase'];
    let tracePhase: AutomaticPasteTracePhase;
    if (message.editorState !== 'ready') {
      result = 'unsafe-focus';
      diagnosticPhase = 'editor-finalize';
      tracePhase =
        message.editorState === 'cleanup-failed'
          ? 'cleanup-started'
          : 'post-cleanup-check';
    } else {
      this.recordAutomaticPasteTrace({
        kind: pending.kind,
        requestId: message.requestId,
        phase: 'final-browser-check',
      });
      if (!(await this.isBrowserContextSafe(pending.sender))) {
        result = 'not-foreground';
        diagnosticPhase = 'browser-finalize';
        tracePhase = 'final-browser-check';
      } else if (this.automaticPasteTransport === undefined) {
        result = 'native-unavailable';
        diagnosticPhase = 'native-paste-request';
        tracePhase = 'final-browser-check';
      } else {
        this.recordAutomaticPasteTrace({
          kind: pending.kind,
          requestId: message.requestId,
          phase: 'native-paste-requested',
        });
        const nativePasteStartedAt = this.now();
        let nativeResult: AutomaticPasteResult;
        let nativePasteDiagnostic: NativePasteAttemptDiagnostic | undefined;
        try {
          nativeResult = await this.automaticPasteTransport.requestPaste({
            activationId: pending.authorizationId,
            ...pending.context,
          });
          if (
            import.meta.env.MODE === 'native-dev' ||
            import.meta.env.MODE === 'test'
          ) {
            try {
              nativePasteDiagnostic =
                this.automaticPasteTransport.takeLastPasteAttemptDiagnostic?.();
            } catch {
              // Native-development diagnostics must never change delivery behavior.
            }
          }
        } catch {
          nativeResult = 'indeterminate';
          this.recordTiming(
            pending.kind,
            'native-paste-request',
            nativePasteStartedAt,
            'indeterminate',
          );
        }
        if (nativeResult !== 'indeterminate') {
          this.recordTiming(
            pending.kind,
            'native-paste-request',
            nativePasteStartedAt,
            nativeResult === 'paste-issued' ? 'success' : 'fallback',
          );
        }
        result =
          nativeResult === 'clipboard-only'
            ? 'native-unavailable'
            : nativeResult;
        diagnosticPhase = 'native-paste-request';
        tracePhase = 'native-paste-result';
        this.recordAutomaticPasteResult(
          pending.kind,
          message.requestId,
          diagnosticPhase,
          result,
          tracePhase,
          nativePasteDiagnostic,
        );
        return {
          type: 'snippet-automatic-paste-result',
          requestId: message.requestId,
          kind: pending.kind,
          result,
        };
      }
    }
    this.recordAutomaticPasteResult(
      pending.kind,
      message.requestId,
      diagnosticPhase,
      result,
      tracePhase,
    );
    return {
      type: 'snippet-automatic-paste-result',
      requestId: message.requestId,
      kind: pending.kind,
      result,
    };
  }

  private toTrustedSenderIdentity(
    sender: SnippetDeliveryMessageSender,
  ): TrustedSenderIdentity | undefined {
    const tabId = sender.tab?.id;
    const windowId = sender.tab?.windowId;
    return typeof sender.documentId === 'string' &&
      sender.documentId.length > 0 &&
      Number.isInteger(sender.frameId) &&
      (sender.frameId as number) >= 0 &&
      Number.isInteger(tabId) &&
      (tabId as number) >= 0 &&
      Number.isInteger(windowId) &&
      (windowId as number) >= 0
      ? {
          documentId: sender.documentId,
          frameId: sender.frameId as number,
          tabId: tabId as number,
          windowId: windowId as number,
        }
      : undefined;
  }

  private senderMatches(
    expected: TrustedSenderIdentity,
    actual: SnippetDeliveryMessageSender,
  ): boolean {
    const identity = this.toTrustedSenderIdentity(actual);
    return (
      identity !== undefined &&
      identity.documentId === expected.documentId &&
      identity.frameId === expected.frameId &&
      identity.tabId === expected.tabId &&
      identity.windowId === expected.windowId
    );
  }

  private async isBrowserContextSafe(
    identity: TrustedSenderIdentity,
  ): Promise<boolean> {
    if (this.browserSafety === undefined) return false;
    try {
      const [tab, window] = await Promise.all([
        this.browserSafety.tabs.get(identity.tabId),
        this.browserSafety.windows.get(identity.windowId),
      ]);
      return (
        tab.id === identity.tabId &&
        tab.windowId === identity.windowId &&
        tab.active === true &&
        window.id === identity.windowId &&
        window.focused === true
      );
    } catch {
      return false;
    }
  }

  private releaseAutomaticDelivery(): void {
    if (this.pendingAutomaticPaste !== undefined) {
      clearTimeout(this.pendingAutomaticPaste.timeout);
      this.pendingAutomaticPaste = undefined;
    }
    this.automaticDeliveryInProgress = false;
  }

  private recordTiming(
    kind: 'text' | 'image',
    phase: SnippetDeliveryTimingDiagnostic['phase'],
    startedAt: number,
    outcome: SnippetDeliveryTimingDiagnostic['outcome'],
  ): void {
    try {
      this.reportTiming({
        kind,
        phase,
        durationMs: Math.max(0, this.now() - startedAt),
        outcome,
      });
    } catch {
      // Optional diagnostics must never change delivery behavior.
    }
  }

  private recordAutomaticPasteResult(
    kind: 'text' | 'image',
    requestId: string,
    phase: AutomaticPasteResultDiagnostic['phase'],
    result: AutomaticPasteFinalizeResponse['result'],
    tracePhaseOverride?: AutomaticPasteTracePhase,
    nativePasteDiagnostic?: NativePasteAttemptDiagnostic,
  ): void {
    try {
      this.reportAutomaticPasteResult({ kind, phase, requestId, result });
    } catch {
      // Native-development diagnostics must never change delivery behavior.
    }
    const tracePhase: AutomaticPasteTracePhase =
      tracePhaseOverride ??
      (phase === 'browser-precheck' || phase === 'preflight'
        ? 'automatic-precheck-started'
        : phase === 'native-context-capture'
          ? 'native-context-capture-started'
          : phase === 'editor-finalize'
            ? 'post-cleanup-check'
            : phase === 'browser-finalize'
              ? 'final-browser-check'
              : phase === 'finalize-timeout'
                ? 'finalize-timeout'
                : 'native-paste-result');
    this.recordAutomaticPasteTrace({
      kind,
      requestId,
      phase: tracePhase,
      result,
      resultPhase: phase,
      ...(import.meta.env.MODE === 'native-dev' ||
      import.meta.env.MODE === 'test'
        ? nativePasteDiagnostic === undefined
          ? {}
          : { nativePasteDiagnostic }
        : {}),
    });
  }

  private recordAutomaticPasteTrace(
    diagnostic: AutomaticPasteTraceDiagnostic,
  ): void {
    try {
      this.reportAutomaticPasteTrace(diagnostic);
    } catch {
      // Native-development diagnostics must never change delivery behavior.
    }
  }
}

export function registerSnippetDeliveryCoordinator(
  runtime: SnippetDeliveryRuntime,
  coordinator: SnippetDeliveryCoordinator,
): () => void {
  const listener: RuntimeMessageListener = (message, sender) =>
    coordinator.handleMessage(message, sender);
  runtime.onMessage.addListener(listener);
  return () => runtime.onMessage.removeListener(listener);
}
