import type { SnippetAssetRepository } from '../../application/persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../../application/persistence/snippet-entry-repository';
import { diagnoseSnippetListSerialization } from '../../application/snippet/snippet-list-serialization-diagnostic';

export const SNIPPET_LIST_DIAGNOSTIC_GLOBAL =
  'aiSupportWorkspaceDiagnostics' as const;

export interface SnippetListDiagnosticApi {
  diagnoseSnippetListSerialization(trigger?: string): Promise<unknown>;
}

interface DiagnosticGlobal {
  prompt(message: string): string | null;
  [SNIPPET_LIST_DIAGNOSTIC_GLOBAL]?: SnippetListDiagnosticApi;
}

export function registerSnippetListSerializationDiagnostic(
  globalScope: DiagnosticGlobal,
  snippetRepository: SnippetEntryRepository,
  assetRepository: SnippetAssetRepository,
): void {
  const api: SnippetListDiagnosticApi = Object.freeze({
    async diagnoseSnippetListSerialization(trigger?: string) {
      const requestedTrigger =
        trigger ??
        globalScope.prompt(
          'Enter the exact trigger for the failing saved Text Snippet:',
        );
      return diagnoseSnippetListSerialization(
        snippetRepository,
        assetRepository,
        requestedTrigger ?? '',
      );
    },
  });

  Object.defineProperty(globalScope, SNIPPET_LIST_DIAGNOSTIC_GLOBAL, {
    configurable: true,
    enumerable: false,
    value: api,
    writable: false,
  });
}
