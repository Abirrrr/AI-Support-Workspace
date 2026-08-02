import {
  isSelectionCaptureResult,
  type SelectionCaptureResult,
} from '../../shared/selection-capture';
import {
  CAPTURE_SELECTION_COMMAND,
  isWorkspaceCaptureAcknowledgement,
  isWorkspaceCaptureReadyMessage,
  type WorkspaceCaptureDeliveryMessage,
} from './messages';
import { extractSelectionFromPage } from './selection-extractor';

interface CommandTab {
  readonly id?: number;
  readonly windowId?: number;
}

type CommandListener = (command: string, tab?: CommandTab) => void;
type RuntimeMessageListener = (message: unknown) => void;

export interface WorkspaceCaptureChromeApi {
  readonly commands: {
    readonly onCommand: {
      addListener(listener: CommandListener): void;
      removeListener(listener: CommandListener): void;
    };
  };
  readonly runtime: {
    readonly onMessage: {
      addListener(listener: RuntimeMessageListener): void;
      removeListener(listener: RuntimeMessageListener): void;
    };
    sendMessage(message: unknown): Promise<unknown>;
  };
  readonly scripting: {
    executeScript(injection: {
      readonly target: { readonly tabId: number };
      readonly func: typeof extractSelectionFromPage;
    }): Promise<readonly { readonly result?: unknown }[]>;
  };
  readonly sidePanel: {
    open(options: { readonly windowId: number }): Promise<void>;
  };
}

export class TransientCaptureDelivery {
  private readonly queue: WorkspaceCaptureDeliveryMessage[] = [];
  private deliveryActive = false;
  private deliveryRequested = false;
  private nextDeliveryId = 1;

  constructor(private readonly runtime: WorkspaceCaptureChromeApi['runtime']) {}

  get pendingCount(): number {
    return this.queue.length;
  }

  enqueue(result: SelectionCaptureResult): number {
    const deliveryId = this.nextDeliveryId;
    this.nextDeliveryId += 1;
    this.queue.push({
      type: 'workspace-capture-delivery',
      deliveryId,
      result,
    });
    return deliveryId;
  }

  async deliverPending(): Promise<void> {
    if (this.deliveryActive) {
      this.deliveryRequested = true;
      return;
    }

    this.deliveryActive = true;

    try {
      do {
        this.deliveryRequested = false;

        while (this.queue.length > 0) {
          const delivery = this.queue[0];

          if (delivery === undefined) break;

          let response: unknown;

          try {
            response = await this.runtime.sendMessage(delivery);
          } catch {
            break;
          }

          if (
            !isWorkspaceCaptureAcknowledgement(response) ||
            response.deliveryId !== delivery.deliveryId
          ) {
            break;
          }

          this.queue.shift();
        }
      } while (this.deliveryRequested && this.queue.length > 0);
    } finally {
      this.deliveryActive = false;
    }
  }
}

async function captureSelection(
  chromeApi: WorkspaceCaptureChromeApi,
  tabId: number,
): Promise<SelectionCaptureResult> {
  try {
    const results = await chromeApi.scripting.executeScript({
      target: { tabId },
      func: extractSelectionFromPage,
    });
    const result = results[0]?.result;

    return isSelectionCaptureResult(result) ? result : { kind: 'failure' };
  } catch {
    return { kind: 'failure' };
  }
}

function openWorkspaceSidePanel(
  chromeApi: WorkspaceCaptureChromeApi,
  windowId: number,
): Promise<boolean> {
  try {
    return chromeApi.sidePanel.open({ windowId }).then(
      () => true,
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}

function isValidChromeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export async function handleWorkspaceCaptureCommand(
  chromeApi: WorkspaceCaptureChromeApi,
  delivery: TransientCaptureDelivery,
  command: string,
  tab?: CommandTab,
): Promise<void> {
  if (command !== CAPTURE_SELECTION_COMMAND) return;
  if (!isValidChromeId(tab?.windowId)) return;

  const capturePromise = isValidChromeId(tab.id)
    ? captureSelection(chromeApi, tab.id)
    : Promise.resolve({
        kind: 'failure',
      } satisfies SelectionCaptureResult);
  const panelOpenPromise = openWorkspaceSidePanel(chromeApi, tab.windowId);
  const [result, panelOpened] = await Promise.all([
    capturePromise,
    panelOpenPromise,
  ]);

  if (!panelOpened) return;

  delivery.enqueue(result);
  await delivery.deliverPending();
}

export function registerWorkspaceCaptureCommand(
  chromeApi: WorkspaceCaptureChromeApi,
): () => void {
  const delivery = new TransientCaptureDelivery(chromeApi.runtime);
  const commandListener: CommandListener = (command, tab) => {
    void handleWorkspaceCaptureCommand(chromeApi, delivery, command, tab);
  };
  const readyListener: RuntimeMessageListener = (message) => {
    if (isWorkspaceCaptureReadyMessage(message)) {
      void delivery.deliverPending();
    }
  };

  chromeApi.commands.onCommand.addListener(commandListener);
  chromeApi.runtime.onMessage.addListener(readyListener);

  return () => {
    chromeApi.commands.onCommand.removeListener(commandListener);
    chromeApi.runtime.onMessage.removeListener(readyListener);
  };
}

export function getWorkspaceCaptureChromeApi():
  WorkspaceCaptureChromeApi | undefined {
  return (
    globalThis as typeof globalThis & {
      chrome?: WorkspaceCaptureChromeApi;
    }
  ).chrome;
}
