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
  isTriggerActivationRequestMessage,
  type SnippetDeliveryFailureCode,
  type TriggerActivationRequestMessage,
  type TriggerActivationResponseMessage,
} from '../../shared/snippet-delivery-messages';

type RuntimeMessageListener = (message: unknown) => unknown;

interface RuntimeMessageEvent {
  addListener(listener: RuntimeMessageListener): void;
  removeListener(listener: RuntimeMessageListener): void;
}

export interface SnippetDeliveryRuntime {
  readonly onMessage: RuntimeMessageEvent;
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
  constructor(
    private readonly planner: SnippetDeliveryPlanner,
    private readonly transport: ClipboardTransport,
    private readonly catalog: CatalogActivationIdentity,
    private readonly reportDiagnostic: SnippetDeliveryDiagnosticSink = (
      diagnostic,
    ) => {
      console.error('[AI Support Workspace][Snippet Delivery]', diagnostic);
    },
  ) {}

  handleMessage(message: unknown): Promise<unknown> | undefined {
    if (!isTriggerActivationRequestMessage(message)) return undefined;
    return this.handleActivation(message);
  }

  private async handleActivation(
    message: TriggerActivationRequestMessage,
  ): Promise<TriggerActivationResponseMessage> {
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
    if (!this.catalog.isCurrentSnapshot(message.epoch, message.revision)) {
      return failure(
        'stale-catalog',
        'catalog',
        'pre-planning',
        'failed',
        'Snippet changed. Type the trigger again.',
      );
    }
    try {
      const plan = await this.planner.plan(message);
      if (!this.catalog.isCurrentSnapshot(message.epoch, message.revision)) {
        return failure(
          'stale-catalog',
          'catalog',
          'pre-write',
          'failed',
          'Snippet changed. Type the trigger again.',
        );
      }
      await this.transport.write(plan, message.requestId);
      return {
        type: 'snippet-trigger-activation-result',
        requestId: message.requestId,
        outcome: 'copied',
        kind: plan.kind,
      } satisfies TriggerActivationResponseMessage;
    } catch (error) {
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
}

export function registerSnippetDeliveryCoordinator(
  runtime: SnippetDeliveryRuntime,
  coordinator: SnippetDeliveryCoordinator,
): () => void {
  const listener: RuntimeMessageListener = (message) =>
    coordinator.handleMessage(message);
  runtime.onMessage.addListener(listener);
  return () => runtime.onMessage.removeListener(listener);
}
