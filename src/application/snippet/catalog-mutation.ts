export type CatalogMutationOutcome = 'succeeded' | 'failed';

export interface CatalogMutationPort {
  invalidateBeforeMutation(): Promise<string>;
  publishAfterMutation(
    mutationId: string,
    outcome: CatalogMutationOutcome,
  ): Promise<boolean>;
}

export class CatalogUnavailableAfterMutationError<Result> extends Error {
  readonly persistedResult: Result;

  constructor(persistedResult: Result) {
    super('Trigger expansion is temporarily unavailable.');
    this.name = 'CatalogUnavailableAfterMutationError';
    this.persistedResult = persistedResult;
  }
}

export async function runCatalogCoordinatedMutation<Result>(
  port: CatalogMutationPort | undefined,
  mutation: () => Promise<Result>,
): Promise<Result> {
  if (port === undefined) return mutation();

  const mutationId = await port.invalidateBeforeMutation();
  let result: Result;
  try {
    result = await mutation();
  } catch (error) {
    await port.publishAfterMutation(mutationId, 'failed').catch(() => false);
    throw error;
  }

  const published = await port
    .publishAfterMutation(mutationId, 'succeeded')
    .catch(() => false);
  if (!published) throw new CatalogUnavailableAfterMutationError(result);
  return result;
}
