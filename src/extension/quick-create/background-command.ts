import {
  QUICK_CREATE_COMMAND,
  QUICK_CREATE_AVAILABLE,
  isQuickCreateSignal,
  type QuickCreateIntent,
} from '../../shared/quick-create-messages';

type MessageListener = (
  message: unknown,
  sender: { readonly id?: string; readonly url?: string },
  reply: (value: unknown) => void,
) => void;
export interface QuickCreateCommandApi {
  readonly commands: {
    readonly onCommand: {
      addListener(listener: (command: string) => void): void;
      removeListener(listener: (command: string) => void): void;
    };
  };
  readonly runtime: {
    readonly id: string;
    getURL(path: string): string;
    openOptionsPage(): Promise<void>;
    sendMessage(value: unknown): Promise<unknown>;
    readonly onMessage: {
      addListener(listener: MessageListener): void;
      removeListener(listener: MessageListener): void;
    };
  };
}

export function registerQuickCreateCommand(
  api: QuickCreateCommandApi,
  now: () => number = Date.now,
): () => void {
  let pending: { readonly intent: QuickCreateIntent } | undefined;
  const command = (name: string) => {
    if (name !== QUICK_CREATE_COMMAND) return;
    const request = {
      intent: {
        type: 'quick-create-intent',
        id: crypto.randomUUID(),
        expiresAt: now() + 60_000,
      } as const,
    };
    pending = request;
    try {
      void api.runtime.openOptionsPage().then(
        () =>
          api.runtime
            .sendMessage(QUICK_CREATE_AVAILABLE)
            .catch(() => undefined),
        () => {
          if (pending === request) pending = undefined;
        },
      );
    } catch {
      if (pending === request) pending = undefined;
    }
  };
  const claim: MessageListener = (message, sender, reply) => {
    if (
      sender.id !== api.runtime.id ||
      sender.url !== api.runtime.getURL('options.html') ||
      !isQuickCreateSignal(message, 'quick-create-claim')
    )
      return;
    const request = pending;
    pending = undefined;
    reply(
      request !== undefined && now() <= request.intent.expiresAt
        ? request.intent
        : null,
    );
  };
  api.commands.onCommand.addListener(command);
  api.runtime.onMessage.addListener(claim);
  return () => {
    pending = undefined;
    api.commands.onCommand.removeListener(command);
    api.runtime.onMessage.removeListener(claim);
  };
}

export function getQuickCreateCommandApi(): QuickCreateCommandApi | undefined {
  return (globalThis as typeof globalThis & { chrome?: QuickCreateCommandApi })
    .chrome;
}
