import type {
  CatalogMutationOutcome,
  CatalogMutationPort,
} from '../../application/snippet/catalog-mutation';
import {
  isTriggerCatalogMutationBeginResponse,
  isTriggerCatalogMutationFinishResponse,
} from '../../shared/trigger-catalog-messages';

export interface CatalogMutationRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

export class RuntimeCatalogMutationPort implements CatalogMutationPort {
  constructor(private readonly runtime: CatalogMutationRuntime) {}

  async invalidateBeforeMutation(): Promise<string> {
    const response = await this.runtime.sendMessage({
      type: 'trigger-catalog-mutation-begin',
    });
    if (!isTriggerCatalogMutationBeginResponse(response)) {
      throw new Error('Trigger catalog invalidation was unavailable.');
    }
    return response.mutationId;
  }

  async publishAfterMutation(
    mutationId: string,
    outcome: CatalogMutationOutcome,
  ): Promise<boolean> {
    const response = await this.runtime.sendMessage({
      type: 'trigger-catalog-mutation-finish',
      mutationId,
      outcome,
    });
    return (
      isTriggerCatalogMutationFinishResponse(response) && response.published
    );
  }
}
