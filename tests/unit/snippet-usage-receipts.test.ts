import { describe, expect, it, vi } from 'vitest';

import type { SnippetUsageStatsRepository } from '../../src/application/persistence/snippet-usage-stats-repository';
import type { SettingsRepository } from '../../src/application/persistence/settings-repository';
import type { AutomaticPasteTransport } from '../../src/application/snippet/automatic-paste-transport';
import type { SnippetDeliveryPlanner } from '../../src/application/snippet/snippet-delivery-planner';
import type { ClipboardTransport } from '../../src/extension/snippet-trigger/clipboard-transport';
import {
  SNIPPET_USAGE_RECEIPT_LIFETIME_MS,
  SnippetDeliveryCoordinator,
  type SnippetDeliveryMessageSender,
} from '../../src/extension/snippet-trigger/delivery-coordinator';
import type {
  AutomaticPasteFinalizeMessage,
  SnippetUsageReceiptAcknowledgementMessage,
  TriggerActivationRequestMessage,
} from '../../src/shared/snippet-delivery-messages';

const STARTED_AT = Date.parse('2026-08-25T01:02:03.000Z');
const RECEIPT_ID = 'usage-receipt-1';
const AUTHORIZATION_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const sender: SnippetDeliveryMessageSender = {
  documentId: 'document-1',
  frameId: 3,
  tab: { id: 7, windowId: 9 },
};
const request: TriggerActivationRequestMessage = {
  type: 'snippet-trigger-activation',
  requestId: 'request-1',
  snippetId: 'snippet-1',
  trigger: ';hello',
  kind: 'text',
  epoch: 'epoch-1',
  revision: 2,
};

function createSubject(
  options: {
    readonly mode?: 'clipboard-only' | 'automatic';
    readonly clipboardFailure?: boolean;
    readonly persistenceFailure?: boolean;
    readonly automaticPasteResult?:
      | 'paste-issued'
      | 'unsafe-focus'
      | 'not-foreground'
      | 'clipboard-changed'
      | 'unsafe-keyboard-state'
      | 'busy'
      | 'input-injection-failed'
      | 'indeterminate';
    readonly browserActive?: boolean;
  } = {},
) {
  let usageTime = STARTED_AT;
  const recordUse = vi.fn(async (snippetId: string, usedAt: string) => {
    if (options.persistenceFailure) throw new Error('stats unavailable');
    return { snippetId, usageCount: 1, lastUsedAt: usedAt };
  });
  const usageStatsRepository: SnippetUsageStatsRepository = {
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => []),
    save: vi.fn(async (stats) => stats),
    recordUse,
    delete: vi.fn(async () => false),
  };
  const planner = {
    plan: vi.fn(async (message: TriggerActivationRequestMessage) => ({
      kind: message.kind,
      snippetId: message.snippetId,
      ...(message.kind === 'text'
        ? { plainText: 'plain', html: '<p>plain</p>' }
        : {
            mimeType: 'image/png' as const,
            blob: new Blob(['png']),
          }),
    })),
  } as unknown as SnippetDeliveryPlanner;
  const transport: ClipboardTransport = {
    write: vi.fn(async () => {
      if (options.clipboardFailure) throw new Error('clipboard failed');
    }),
  };
  const settingsRepository: SettingsRepository = {
    load: vi.fn(async () => ({
      defaultModel: null,
      snippetPasteMode: options.mode ?? 'clipboard-only',
      automaticBackupCadence: 'weekly' as const,
    })),
    save: vi.fn(async (settings) => settings),
  };
  const automaticPasteTransport: AutomaticPasteTransport = {
    capturePasteContext: vi.fn(async () => ({
      foregroundWindowHandle: '0000000000001234',
      rootWindowHandle: '0000000000001000',
      processId: 44,
      clipboardSequenceNumber: 77,
    })),
    requestPaste: vi.fn(
      async () => options.automaticPasteResult ?? 'paste-issued',
    ),
  };
  const coordinator = new SnippetDeliveryCoordinator(
    planner,
    transport,
    { isCurrentSnapshot: () => true },
    vi.fn(),
    automaticPasteTransport,
    settingsRepository,
    {
      tabs: {
        get: vi.fn(async () => ({
          id: 7,
          windowId: 9,
          active: options.browserActive ?? true,
        })),
      },
      windows: {
        get: vi.fn(async () => ({ id: 9, focused: true })),
      },
    },
    undefined,
    undefined,
    () => AUTHORIZATION_ID,
    undefined,
    () => 0,
    usageStatsRepository,
    () => new Date(usageTime),
    () => RECEIPT_ID,
  );

  return {
    coordinator,
    recordUse,
    transport,
    automaticPasteTransport,
    setUsageTime(value: number) {
      usageTime = value;
    },
  };
}

function acknowledgement(
  overrides: Partial<SnippetUsageReceiptAcknowledgementMessage> = {},
): SnippetUsageReceiptAcknowledgementMessage {
  return {
    type: 'snippet-usage-receipt-acknowledgement',
    receiptId: RECEIPT_ID,
    requestId: request.requestId,
    snippetId: request.snippetId,
    kind: request.kind,
    epoch: request.epoch,
    revision: request.revision,
    ...overrides,
  };
}

async function activate(
  subject: ReturnType<typeof createSubject>,
  overrides: Partial<TriggerActivationRequestMessage> = {},
) {
  return subject.coordinator.handleMessage(
    { ...request, ...overrides },
    sender,
  );
}

describe('service-worker one-use Snippet usage receipts', () => {
  it('creates a receipt only after authoritative clipboard success', async () => {
    const successful = createSubject();
    await expect(activate(successful)).resolves.toMatchObject({
      outcome: 'copied',
      usageReceiptId: RECEIPT_ID,
    });

    const failed = createSubject({ clipboardFailure: true });
    await expect(activate(failed)).resolves.toMatchObject({
      outcome: 'failed',
    });
    expect(
      failed.coordinator.handleMessage(acknowledgement(), sender),
    ).toMatchObject({ accepted: false });
    expect(failed.recordUse).not.toHaveBeenCalled();
  });

  it('consumes an exact acknowledgement once with the worker UTC timestamp', async () => {
    const subject = createSubject();
    await activate(subject);
    subject.setUsageTime(STARTED_AT + 1_234);

    expect(
      subject.coordinator.handleMessage(acknowledgement(), sender),
    ).toEqual({
      type: 'snippet-usage-receipt-acknowledgement-result',
      requestId: request.requestId,
      accepted: true,
    });
    expect(subject.recordUse).toHaveBeenCalledOnce();
    expect(subject.recordUse).toHaveBeenCalledWith(
      request.snippetId,
      '2026-08-25T01:02:04.234Z',
    );
    expect(
      subject.coordinator.handleMessage(acknowledgement(), sender),
    ).toMatchObject({ accepted: false });
    expect(subject.recordUse).toHaveBeenCalledOnce();
  });

  it.each([
    ['request', { requestId: 'request-2' }],
    ['Snippet', { snippetId: 'snippet-2' }],
    ['delivery kind', { kind: 'image' as const }],
    ['catalog epoch', { epoch: 'epoch-2' }],
    ['catalog revision', { revision: 3 }],
  ] as const)(
    'rejects a mismatched %s without consuming usage',
    async (_, mismatch) => {
      const subject = createSubject();
      await activate(subject);
      expect(
        subject.coordinator.handleMessage(acknowledgement(mismatch), sender),
      ).toMatchObject({ accepted: false });
      expect(subject.recordUse).not.toHaveBeenCalled();
    },
  );

  it('rejects mismatched sender/frame identity', async () => {
    const subject = createSubject();
    await activate(subject);
    expect(
      subject.coordinator.handleMessage(acknowledgement(), {
        ...sender,
        frameId: 4,
      }),
    ).toMatchObject({ accepted: false });
    expect(subject.recordUse).not.toHaveBeenCalled();
  });

  it('rejects expired and unknown receipts without real waits', async () => {
    const expired = createSubject();
    await activate(expired);
    expired.setUsageTime(STARTED_AT + SNIPPET_USAGE_RECEIPT_LIFETIME_MS);
    expect(
      expired.coordinator.handleMessage(acknowledgement(), sender),
    ).toMatchObject({ accepted: false });

    const unknown = createSubject();
    expect(
      unknown.coordinator.handleMessage(
        acknowledgement({ receiptId: 'unknown-receipt' }),
        sender,
      ),
    ).toMatchObject({ accepted: false });
    expect(expired.recordUse).not.toHaveBeenCalled();
    expect(unknown.recordUse).not.toHaveBeenCalled();
  });

  it('does not reconstruct a receipt after service-worker recreation', async () => {
    const originalWorker = createSubject();
    await activate(originalWorker);
    const recreatedWorker = createSubject();
    expect(
      recreatedWorker.coordinator.handleMessage(acknowledgement(), sender),
    ).toMatchObject({ accepted: false });
    expect(recreatedWorker.recordUse).not.toHaveBeenCalled();
  });

  it.each([
    ['clipboard-only', 'text'],
    ['clipboard-only', 'image'],
    ['automatic', 'text'],
    ['automatic', 'image'],
  ] as const)(
    'records one %s %s activation through the same receipt semantics',
    async (mode, kind) => {
      const subject = createSubject({ mode });
      const activation = await activate(subject, { kind });
      expect(activation).toMatchObject({
        kind,
        usageReceiptId: RECEIPT_ID,
      });
      expect(
        subject.coordinator.handleMessage(acknowledgement({ kind }), sender),
      ).toMatchObject({ accepted: true });
      if (
        mode === 'automatic' &&
        typeof activation === 'object' &&
        activation !== null &&
        'authorizationId' in activation &&
        typeof activation.authorizationId === 'string'
      ) {
        await expect(
          subject.coordinator.handleMessage(
            {
              type: 'snippet-automatic-paste-finalize',
              requestId: request.requestId,
              authorizationId: activation.authorizationId,
              editorState: 'ready',
            },
            sender,
          ),
        ).resolves.toMatchObject({ result: 'paste-issued' });
      }
      expect(subject.recordUse).toHaveBeenCalledOnce();
    },
  );

  it('keeps one use when later automatic paste fails', async () => {
    const subject = createSubject({
      mode: 'automatic',
      automaticPasteResult: 'input-injection-failed',
    });
    const activation = (await activate(subject)) as {
      readonly authorizationId: string;
    };
    subject.coordinator.handleMessage(acknowledgement(), sender);
    const finalize: AutomaticPasteFinalizeMessage = {
      type: 'snippet-automatic-paste-finalize',
      requestId: request.requestId,
      authorizationId: activation.authorizationId,
      editorState: 'ready',
    };
    await expect(
      subject.coordinator.handleMessage(finalize, sender),
    ).resolves.toMatchObject({ result: 'input-injection-failed' });
    expect(subject.recordUse).toHaveBeenCalledOnce();
  });

  it('keeps one use when automatic delivery declines to clipboard fallback', async () => {
    const subject = createSubject({ mode: 'automatic', browserActive: false });
    await expect(activate(subject)).resolves.toMatchObject({
      outcome: 'copied',
      usageReceiptId: RECEIPT_ID,
    });
    subject.coordinator.handleMessage(acknowledgement(), sender);
    expect(subject.recordUse).toHaveBeenCalledOnce();
    expect(subject.automaticPasteTransport.requestPaste).not.toHaveBeenCalled();
  });

  it('swallows persistence failure without retrying or changing delivery', async () => {
    const subject = createSubject({ persistenceFailure: true });
    await expect(activate(subject)).resolves.toMatchObject({
      outcome: 'copied',
    });
    expect(
      subject.coordinator.handleMessage(acknowledgement(), sender),
    ).toMatchObject({ accepted: true });
    await Promise.resolve();
    expect(subject.recordUse).toHaveBeenCalledOnce();
  });
});
