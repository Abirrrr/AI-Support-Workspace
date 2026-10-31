import { describe, expect, it, vi } from 'vitest';
import {
  registerQuickCreateCommand,
  type QuickCreateCommandApi,
} from '../../src/extension/quick-create/background-command';
import { createQuickCreateNavigation } from '../../src/extension/quick-create/options-navigation';
import { QUICK_CREATE_COMMAND } from '../../src/shared/quick-create-messages';

function event<T>() {
  let listener: T | undefined;
  return {
    addListener: vi.fn((fn: T) => {
      listener = fn;
    }),
    removeListener: vi.fn(),
    get listener() {
      return listener;
    },
  };
}
function setup() {
  const commands = event<(command: string) => void>();
  const messages =
    event<
      (
        message: unknown,
        sender: { id?: string; url?: string },
        reply: (value: unknown) => void,
      ) => void
    >();
  const runtime = {
    id: 'self',
    getURL: (path: string) => `chrome-extension://self/${path}`,
    openOptionsPage: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: messages,
  };
  const api: QuickCreateCommandApi = {
    commands: { onCommand: commands },
    runtime,
  };
  const sender = { id: 'self', url: runtime.getURL('options.html') };
  const claim = (from = sender) => {
    const reply = vi.fn();
    messages.listener?.({ type: 'quick-create-claim' }, from, reply);
    return reply.mock.calls[0]?.[0];
  };
  return { api, runtime, commands, claim, messages, sender };
}
describe('Quick Create transient command navigation', () => {
  it.each([false, true])(
    'never delivers an expired claimed intent after focus loss or delayed response (delayed=%s)',
    async (delayedReply) => {
      const s = setup();
      let now = 0,
        focused = true;
      const documentEvents = new EventTarget(),
        windowEvents = new EventTarget();
      let resolve!: (value: unknown) => void;
      s.runtime.sendMessage
        .mockImplementationOnce(
          () =>
            new Promise((r) => {
              resolve = r;
            }),
        )
        .mockResolvedValue(null);
      const navigation = createQuickCreateNavigation(
        s.runtime,
        {
          document: Object.assign(documentEvents, {
            visibilityState: 'visible' as const,
            hasFocus: () => focused,
          }),
          window: windowEvents,
        },
        () => now,
      );
      const listener = vi.fn();
      const stop = navigation.subscribe(listener);
      focused = false;
      if (delayedReply) now = 60_001;
      resolve({
        type: 'quick-create-intent',
        id: '123e4567-e89b-42d3-a456-426614174000',
        expiresAt: 60_000,
      });
      await Promise.resolve();
      now = 60_001;
      focused = true;
      windowEvents.dispatchEvent(new Event('focus'));
      await Promise.resolve();
      expect(listener).not.toHaveBeenCalled();
      stop();
    },
  );
  it('dispatches only the new command, opens immediately, accepts exactly one same-extension claim', async () => {
    const s = setup();
    registerQuickCreateCommand(s.api);
    s.commands.listener?.('capture-selection-to-workspace');
    expect(s.runtime.openOptionsPage).not.toHaveBeenCalled();
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    expect(s.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
    expect(s.claim({ id: 'wrong', url: s.sender.url })).toBeUndefined();
    expect(
      s.claim({ id: 'self', url: 'https://example.test' }),
    ).toBeUndefined();
    expect(s.claim()).toMatchObject({
      type: 'quick-create-intent',
      id: expect.any(String),
    });
    expect(s.claim()).toBeNull();
    await Promise.resolve();
    expect(s.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'quick-create-available',
    });
  });
  it('keeps only the newest intent, expires it, and clears failed navigation', async () => {
    const s = setup();
    let now = 0;
    registerQuickCreateCommand(s.api, () => now);
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    const first = s.claim();
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    expect(s.claim()).not.toEqual(first);
    expect(s.claim()).toBeNull();
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    now = 60_001;
    expect(s.claim()).toBeNull();
    s.runtime.openOptionsPage.mockRejectedValue(new Error('private error'));
    s.commands.listener?.(QUICK_CREATE_COMMAND);
    await Promise.resolve();
    expect(s.claim()).toBeNull();
  });
  it('claims only while focused, survives subscriber replacement during an async claim, and carries no content/URL marker', async () => {
    const s = setup();
    let focused = false;
    const documentEvents = new EventTarget();
    const windowEvents = new EventTarget();
    let resolve!: (value: unknown) => void;
    s.runtime.sendMessage.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const navigation = createQuickCreateNavigation(
      s.runtime,
      {
        document: Object.assign(documentEvents, {
          visibilityState: 'visible' as const,
          hasFocus: () => focused,
        }),
        window: windowEvents,
      },
      () => 0,
    );
    const lost = vi.fn(),
      listener = vi.fn();
    const dispose = navigation.subscribe(lost);
    expect(s.runtime.sendMessage).not.toHaveBeenCalled();
    focused = true;
    windowEvents.dispatchEvent(new Event('focus'));
    dispose();
    const cleanup = navigation.subscribe(listener);
    resolve({
      type: 'quick-create-intent',
      id: '123e4567-e89b-42d3-a456-426614174000',
      expiresAt: 60_000,
    });
    await Promise.resolve();
    expect(lost).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(s.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'quick-create-claim',
    });
    cleanup();
  });
});
