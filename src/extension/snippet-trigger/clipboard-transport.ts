import {
  NativeImageClipboardError,
  type ImageClipboardTransport,
  type ImagePngPreparer,
  type NativeImageClipboardErrorCode,
} from '../../application/snippet/image-clipboard-transport';
import type {
  SnippetDeliveryPlan,
  TextClipboardPlan,
} from '../../application/snippet/snippet-delivery-planner';
import {
  isOffscreenClipboardWriteResponse,
  OFFSCREEN_CLIPBOARD_DOCUMENT_PATH,
  type OffscreenClipboardFailureCode,
  type OffscreenClipboardWriteMessage,
} from '../../shared/snippet-delivery-messages';
import type { AuthoritativeSnippetClipboardWriter } from '../../application/snippet/copy-snippet-to-clipboard';

export class ClipboardPermissionRequiredError extends Error {
  constructor() {
    super('Enable clipboard delivery in extension Settings.');
    this.name = 'ClipboardPermissionRequiredError';
  }
}

export type ClipboardTransportErrorCode =
  | 'offscreen-create-failed'
  | 'offscreen-message-failed'
  | 'invalid-offscreen-response'
  | NativeImageClipboardErrorCode
  | OffscreenClipboardFailureCode;

export class ClipboardTransportError extends Error {
  constructor(readonly code: ClipboardTransportErrorCode) {
    super('Could not prepare the clipboard. Try again.');
    this.name = 'ClipboardTransportError';
  }
}

export interface ClipboardExtensionApi {
  readonly permissions: {
    contains(permissions: {
      readonly permissions: readonly string[];
    }): Promise<boolean>;
  };
  readonly offscreen: {
    createDocument(options: {
      readonly url: string;
      readonly reasons: readonly ['CLIPBOARD'];
      readonly justification: string;
    }): Promise<void>;
    closeDocument(): Promise<void>;
  };
  readonly runtime: {
    getURL(path: string): string;
    getContexts?(filter: {
      readonly contextTypes: readonly ['OFFSCREEN_DOCUMENT'];
      readonly documentUrls: readonly string[];
    }): Promise<readonly unknown[]>;
    sendMessage(message: unknown): Promise<unknown>;
  };
}

export type ClipboardTransport = AuthoritativeSnippetClipboardWriter;

export interface TextClipboardTransport {
  write(plan: TextClipboardPlan, requestId: string): Promise<void>;
}

export class RoutedClipboardTransport implements ClipboardTransport {
  constructor(
    private readonly textTransport: TextClipboardTransport,
    private readonly imagePngPreparer: ImagePngPreparer,
    private readonly imageTransport: ImageClipboardTransport,
  ) {}

  async write(plan: SnippetDeliveryPlan, requestId: string): Promise<void> {
    if (plan.kind === 'text') {
      await this.textTransport.write(plan, requestId);
      return;
    }

    try {
      const pngBytes = await this.imagePngPreparer.prepare(plan);
      await this.imageTransport.writePng(pngBytes);
    } catch (error) {
      if (error instanceof NativeImageClipboardError) {
        throw new ClipboardTransportError(error.code);
      }
      throw new ClipboardTransportError('image-decode-failed');
    }
  }
}

export interface ServiceWorkerClientsApi {
  matchAll(): Promise<readonly { readonly url: string }[]>;
}

export class OffscreenClipboardTransport implements TextClipboardTransport {
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly chromeApi: ClipboardExtensionApi,
    private readonly clientsApi: ServiceWorkerClientsApi | undefined = (
      globalThis as typeof globalThis & {
        clients?: ServiceWorkerClientsApi;
      }
    ).clients,
  ) {}

  write(plan: TextClipboardPlan, requestId: string): Promise<void> {
    const operation = this.chain.then(
      () => this.writeOne(plan, requestId),
      () => this.writeOne(plan, requestId),
    );
    this.chain = operation.catch(() => undefined);
    return operation;
  }

  private async writeOne(plan: TextClipboardPlan, requestId: string) {
    const granted = await this.chromeApi.permissions.contains({
      permissions: ['clipboardWrite', 'offscreen'],
    });
    if (!granted) throw new ClipboardPermissionRequiredError();

    const message: OffscreenClipboardWriteMessage = {
      type: 'offscreen-clipboard-write',
      requestId,
      kind: 'text',
      plainText: plan.plainText,
      html: plan.html,
    };

    try {
      try {
        await this.ensureDocument();
      } catch {
        throw new ClipboardTransportError('offscreen-create-failed');
      }
      let response: unknown;
      try {
        response = await this.chromeApi.runtime.sendMessage(message);
      } catch {
        throw new ClipboardTransportError('offscreen-message-failed');
      }
      if (
        !isOffscreenClipboardWriteResponse(response) ||
        response.requestId !== requestId
      ) {
        throw new ClipboardTransportError('invalid-offscreen-response');
      }
      if (!response.succeeded) {
        throw new ClipboardTransportError(response.error);
      }
    } finally {
      try {
        await this.chromeApi.offscreen.closeDocument();
      } catch {
        // A failed or restarted lifecycle is already reported by the write path.
      }
    }
  }

  private async ensureDocument(): Promise<void> {
    const path = OFFSCREEN_CLIPBOARD_DOCUMENT_PATH;
    const url = this.chromeApi.runtime.getURL(path);
    const contexts = await this.chromeApi.runtime.getContexts?.({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [url],
    });
    if (contexts !== undefined && contexts.length > 0) return;
    if (contexts === undefined && this.clientsApi !== undefined) {
      const clients = await this.clientsApi.matchAll();
      if (clients.some((client) => client.url === url)) return;
    }
    await this.chromeApi.offscreen.createDocument({
      url: path,
      reasons: ['CLIPBOARD'],
      justification: 'Prepare a user-requested Snippet for native paste.',
    });
  }
}
