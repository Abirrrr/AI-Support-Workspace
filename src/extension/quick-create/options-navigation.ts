import type { QuickCreateNavigation } from '../../application/snippet/quick-create-snippet';
import {
  QUICK_CREATE_CLAIM,
  isQuickCreateIntent,
  isQuickCreateSignal,
  type QuickCreateIntent,
} from '../../shared/quick-create-messages';

export interface QuickCreateOptionsRuntime {
  readonly id: string;
  sendMessage(value: unknown): Promise<unknown>;
  readonly onMessage: {
    addListener(
      listener: (value: unknown, sender: { readonly id?: string }) => void,
    ): void;
    removeListener(
      listener: (value: unknown, sender: { readonly id?: string }) => void,
    ): void;
  };
}
interface NavigationEnvironment {
  readonly document: Pick<
    Document,
    'visibilityState' | 'hasFocus' | 'addEventListener' | 'removeEventListener'
  >;
  readonly window: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export function createQuickCreateNavigation(
  runtime: QuickCreateOptionsRuntime,
  environment: NavigationEnvironment = { document, window },
  now: () => number = Date.now,
): QuickCreateNavigation {
  let subscriber: ((id: string) => void) | undefined;
  let pending: QuickCreateIntent | undefined;
  let claiming = false,
    again = false;
  const focused = () =>
    environment.document.visibilityState === 'visible' &&
    environment.document.hasFocus();
  const deliver = () => {
    if (
      pending !== undefined &&
      (pending.expiresAt < now() || pending.expiresAt > now() + 60_000)
    )
      pending = undefined;
    if (!focused() || subscriber === undefined || pending === undefined) return;
    const id = pending.id;
    pending = undefined;
    subscriber(id);
  };
  const claim = async () => {
    if (!focused() || subscriber === undefined) return;
    deliver();
    if (claiming) {
      again = true;
      return;
    }
    claiming = true;
    try {
      const reply = await runtime.sendMessage(QUICK_CREATE_CLAIM);
      if (isQuickCreateIntent(reply)) pending = reply;
      deliver();
    } catch {
      /* Lost worker/intent is recoverable through another shortcut. */
    } finally {
      claiming = false;
      if (again) {
        again = false;
        void claim();
      }
    }
  };
  const ready = () => {
    void claim();
  };
  const available = (value: unknown, sender: { readonly id?: string }) => {
    if (
      sender.id === runtime.id &&
      isQuickCreateSignal(value, 'quick-create-available')
    )
      ready();
  };
  return {
    subscribe(listener) {
      subscriber = listener;
      runtime.onMessage.addListener(available);
      environment.window.addEventListener('focus', ready);
      environment.document.addEventListener('visibilitychange', ready);
      ready();
      return () => {
        if (subscriber === listener) subscriber = undefined;
        runtime.onMessage.removeListener(available);
        environment.window.removeEventListener('focus', ready);
        environment.document.removeEventListener('visibilitychange', ready);
      };
    },
  };
}
