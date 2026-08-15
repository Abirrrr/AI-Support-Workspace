import { describe, expect, it, vi } from 'vitest';

import {
  SnippetDeliveryError,
  type SnippetDeliveryPlanner,
} from '../../src/application/snippet/snippet-delivery-planner';
import { ClipboardImageSafetyError } from '../../src/application/snippet/clipboard-image-safety';
import {
  ChromeClipboardDeliveryPermission,
  CLIPBOARD_DELIVERY_PERMISSIONS,
} from '../../src/extension/snippet-trigger/clipboard-permission';
import {
  ClipboardPermissionRequiredError,
  ClipboardTransportError,
  type ClipboardTransportErrorCode,
  type ClipboardTransport,
} from '../../src/extension/snippet-trigger/clipboard-transport';
import { SnippetDeliveryCoordinator } from '../../src/extension/snippet-trigger/delivery-coordinator';

const request = {
  type: 'snippet-trigger-activation' as const,
  requestId: 'request-1',
  snippetId: 'snippet-1',
  trigger: ';hello',
  kind: 'text' as const,
  epoch: 'epoch-1',
  revision: 2,
};

function coordinator(
  options: {
    current?: boolean;
    currentSequence?: readonly boolean[];
    plan?: object;
    plannerError?: Error;
    transportError?: Error;
    defaultDiagnostic?: boolean;
  } = {},
) {
  const plan = options.plan ?? {
    kind: 'text',
    snippetId: 'snippet-1',
    plainText: 'plain',
    html: '<p>plain</p>',
  };
  const plannerPlan = vi.fn(async () => {
    if (options.plannerError !== undefined) throw options.plannerError;
    return plan;
  });
  const planner = { plan: plannerPlan } as unknown as SnippetDeliveryPlanner;
  const transport: ClipboardTransport = {
    write: vi.fn(async () => {
      if (options.transportError !== undefined) throw options.transportError;
    }),
  };
  const currentSequence = options.currentSequence ?? [options.current ?? true];
  let currentIndex = 0;
  const catalog = {
    isCurrentSnapshot: vi.fn(
      () =>
        currentSequence[Math.min(currentIndex++, currentSequence.length - 1)] ??
        true,
    ),
  };
  const diagnostic = vi.fn();
  const value = options.defaultDiagnostic
    ? new SnippetDeliveryCoordinator(planner, transport, catalog)
    : new SnippetDeliveryCoordinator(planner, transport, catalog, diagnostic);
  return {
    value,
    planner,
    plannerPlan,
    transport,
    catalog,
    diagnostic,
  };
}

describe('service-worker delivery activation coordinator', () => {
  it('plans authoritatively, writes first, and only then reports copied', async () => {
    const subject = coordinator({ currentSequence: [true, true] });
    await expect(subject.value.handleMessage(request)).resolves.toEqual({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenCalledTimes(2);
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenNthCalledWith(
      1,
      'epoch-1',
      2,
    );
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenNthCalledWith(
      2,
      'epoch-1',
      2,
    );
    expect(subject.plannerPlan).toHaveBeenCalledWith(request);
    expect(subject.transport.write).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'text' }),
      'request-1',
    );
    const firstFreshnessCheck = subject.catalog.isCurrentSnapshot.mock
      .invocationCallOrder[0] as number;
    const planning = subject.plannerPlan.mock.invocationCallOrder[0] as number;
    const secondFreshnessCheck = subject.catalog.isCurrentSnapshot.mock
      .invocationCallOrder[1] as number;
    const clipboardWrite = (subject.transport.write as ReturnType<typeof vi.fn>)
      .mock.invocationCallOrder[0] as number;
    expect(firstFreshnessCheck).toBeLessThan(planning);
    expect(planning).toBeLessThan(secondFreshnessCheck);
    expect(secondFreshnessCheck).toBeLessThan(clipboardWrite);
    expect(subject.diagnostic).not.toHaveBeenCalled();
  });

  it('rejects stale frame identity before storage or clipboard work', async () => {
    const subject = coordinator({ current: false });
    await expect(subject.value.handleMessage(request)).resolves.toMatchObject({
      outcome: 'failed',
      code: 'stale-catalog',
      message: 'Snippet changed. Type the trigger again. [stale-catalog]',
    });
    expect(subject.plannerPlan).not.toHaveBeenCalled();
    expect(subject.transport.write).not.toHaveBeenCalled();
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenCalledTimes(1);
    expect(subject.diagnostic).toHaveBeenCalledWith({
      stage: 'catalog',
      code: 'stale-catalog',
      kind: 'text',
      phase: 'pre-planning',
    });
  });

  it('rejects an activation that becomes stale during planning before clipboard work', async () => {
    const subject = coordinator({ currentSequence: [true, false] });
    await expect(subject.value.handleMessage(request)).resolves.toMatchObject({
      outcome: 'failed',
      code: 'stale-catalog',
      message: 'Snippet changed. Type the trigger again. [stale-catalog]',
    });
    expect(subject.plannerPlan).toHaveBeenCalledWith(request);
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenCalledTimes(2);
    expect(subject.transport.write).not.toHaveBeenCalled();
    expect(
      subject.catalog.isCurrentSnapshot.mock.invocationCallOrder[0],
    ).toBeLessThan(subject.plannerPlan.mock.invocationCallOrder[0] as number);
    expect(subject.plannerPlan.mock.invocationCallOrder[0]).toBeLessThan(
      subject.catalog.isCurrentSnapshot.mock.invocationCallOrder[1] as number,
    );
    expect(subject.diagnostic).toHaveBeenCalledWith({
      stage: 'catalog',
      code: 'stale-catalog',
      kind: 'text',
      phase: 'pre-write',
    });
  });

  it.each(['snippet-unavailable', 'unsupported-content'] as const)(
    'preserves planner failure classification %s without clipboard work',
    async (code) => {
      const subject = coordinator({
        plannerError: new SnippetDeliveryError(code),
      });
      await expect(subject.value.handleMessage(request)).resolves.toMatchObject(
        {
          outcome: 'failed',
          code,
          message: `Could not prepare this Snippet. Try again. [${code}]`,
        },
      );
      expect(subject.plannerPlan).toHaveBeenCalledWith(request);
      expect(subject.catalog.isCurrentSnapshot).toHaveBeenCalledTimes(1);
      expect(subject.transport.write).not.toHaveBeenCalled();
      expect(subject.diagnostic).toHaveBeenCalledWith({
        stage: 'planner',
        code,
        kind: 'text',
        phase: 'planning',
      });
    },
  );

  it('fails closed with an explicit fallback code for an unexpected planner failure', async () => {
    const subject = coordinator({ plannerError: new Error('unavailable') });
    await expect(subject.value.handleMessage(request)).resolves.toMatchObject({
      outcome: 'failed',
      code: 'unexpected-delivery-failure',
    });
    expect(subject.plannerPlan).toHaveBeenCalledWith(request);
    expect(subject.catalog.isCurrentSnapshot).toHaveBeenCalledTimes(1);
    expect(subject.transport.write).not.toHaveBeenCalled();
  });

  it.each(['image-too-large', 'animated-webp'] as const)(
    'preserves explicit image safety classification %s',
    async (code) => {
      const subject = coordinator({
        plannerError: new ClipboardImageSafetyError(code),
      });
      await expect(
        subject.value.handleMessage({ ...request, kind: 'image' }),
      ).resolves.toMatchObject({
        outcome: 'failed',
        code,
        message: expect.stringContaining(`[${code}]`),
      });
      expect(subject.transport.write).not.toHaveBeenCalled();
      expect(subject.diagnostic).toHaveBeenCalledWith({
        stage: 'planner',
        code,
        kind: 'image',
        phase: 'planning',
      });
    },
  );

  it('returns permission guidance without claiming copy success', async () => {
    const subject = coordinator({
      transportError: new ClipboardPermissionRequiredError(),
    });
    await expect(subject.value.handleMessage(request)).resolves.toEqual({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'permission-required',
      code: 'permission-required',
      message:
        'Enable clipboard delivery in extension Settings. [permission-required]',
    });
    expect(subject.diagnostic).toHaveBeenCalledWith({
      stage: 'permission',
      code: 'permission-required',
      kind: 'text',
      phase: 'pre-write',
    });
  });

  it.each([
    ['offscreen-create-failed', 'offscreen-create', 'transport'],
    ['offscreen-message-failed', 'offscreen-message', 'transport'],
    ['invalid-offscreen-response', 'offscreen-message', 'transport'],
    ['clipboard-write-failed', 'native-message', 'clipboard-write'],
    ['clipboard-copy-event-unavailable', 'offscreen-write', 'clipboard-write'],
    ['clipboard-copy-command-failed', 'offscreen-write', 'clipboard-write'],
    ['clipboard-copy-data-failed', 'offscreen-write', 'clipboard-write'],
    ['image-invalid', 'image-preparation', 'transport'],
    ['image-decode-failed', 'image-preparation', 'transport'],
    ['native-permission-required', 'native-capability', 'pre-write'],
    ['host-unavailable', 'native-message', 'transport'],
    ['host-version-mismatch', 'native-capability', 'pre-write'],
    ['invalid-host-response', 'native-message', 'transport'],
    ['native-delivery-busy', 'native-capability', 'pre-write'],
  ] as const)(
    'preserves transport failure classification %s through the activation response',
    async (code, stage, phase) => {
      const kind =
        code.startsWith('image-') ||
        code.startsWith('native-') ||
        code.startsWith('host-') ||
        code === 'clipboard-write-failed' ||
        code === 'invalid-host-response'
          ? 'image'
          : 'text';
      const subject = coordinator({
        plan:
          kind === 'image'
            ? {
                kind: 'image',
                snippetId: 'private-snippet-id',
                mimeType: 'image/png',
                blob: new Blob(['private image bytes']),
              }
            : {
                kind: 'text',
                snippetId: 'private-asset-id',
                plainText: 'private plain content',
                html: '<p>private html</p>',
              },
        transportError: new ClipboardTransportError(
          code as ClipboardTransportErrorCode,
        ),
      });
      await expect(
        subject.value.handleMessage({ ...request, kind }),
      ).resolves.toMatchObject({
        outcome:
          code === 'native-permission-required'
            ? 'permission-required'
            : 'failed',
        code,
        message:
          code === 'native-permission-required' ||
          code === 'host-unavailable' ||
          code === 'host-version-mismatch' ||
          code === 'invalid-host-response'
            ? `Windows Image Snippets aren't ready. Check Settings. [${code}]`
            : code === 'native-delivery-busy'
              ? `Another Image Snippet is being prepared. Try again. [${code}]`
              : `Could not prepare this Snippet. Try again. [${code}]`,
      });
      expect(subject.diagnostic).toHaveBeenCalledOnce();
      const diagnostic = subject.diagnostic.mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(diagnostic).toEqual({ stage, code, kind, phase });
      expect(Object.keys(diagnostic).sort()).toEqual([
        'code',
        'kind',
        'phase',
        'stage',
      ]);
      expect(JSON.stringify(diagnostic)).not.toContain('private');
      expect(JSON.stringify(diagnostic)).not.toContain('<p>');
      expect(subject.transport.write).toHaveBeenCalledOnce();
    },
  );

  it('writes one prefixed structured service-worker diagnostic by default', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const subject = coordinator({
      defaultDiagnostic: true,
      transportError: new ClipboardTransportError('clipboard-copy-data-failed'),
    });
    await subject.value.handleMessage(request);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      '[AI Support Workspace][Snippet Delivery]',
      {
        stage: 'offscreen-write',
        code: 'clipboard-copy-data-failed',
        kind: 'text',
        phase: 'clipboard-write',
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(';hello');
    consoleError.mockRestore();
  });

  it('fails closed for malformed and unknown runtime messages', async () => {
    const subject = coordinator();
    expect(
      subject.value.handleMessage({ ...request, assetId: 'leak' }),
    ).toBeUndefined();
    expect(subject.value.handleMessage({ type: 'unknown' })).toBeUndefined();
    expect(subject.plannerPlan).not.toHaveBeenCalled();
  });
});

describe('explicit optional clipboard permission enablement', () => {
  it('checks and requests exactly clipboardWrite plus offscreen', async () => {
    const permissions = {
      contains: vi.fn(async () => false),
      request: vi.fn(async () => true),
    };
    const capability = new ChromeClipboardDeliveryPermission(permissions);
    await expect(capability.isEnabled()).resolves.toBe(false);
    await expect(capability.requestEnable()).resolves.toBe(true);
    expect(permissions.contains).toHaveBeenCalledWith({
      permissions: CLIPBOARD_DELIVERY_PERMISSIONS,
    });
    expect(permissions.request).toHaveBeenCalledWith({
      permissions: CLIPBOARD_DELIVERY_PERMISSIONS,
    });
    expect(CLIPBOARD_DELIVERY_PERMISSIONS).not.toContain('clipboardRead');
  });
});
