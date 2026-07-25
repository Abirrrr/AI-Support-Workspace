import {
  PersistenceError,
  RecordNotFoundError,
} from '../../application/persistence/errors';

interface PersistedRecordOrder {
  id: string;
  createdAt: string;
}

export function createTimestamp(): string {
  return new Date(Date.now()).toISOString();
}

export function createUpdatedTimestamp(previousTimestamp: string): string {
  const previousTime = Date.parse(previousTimestamp);
  const currentTime = Date.now();

  return new Date(Math.max(currentTime, previousTime + 1)).toISOString();
}

export function compareByCreatedAtAndId(
  left: PersistedRecordOrder,
  right: PersistedRecordOrder,
): number {
  if (left.createdAt < right.createdAt) return -1;
  if (left.createdAt > right.createdAt) return 1;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export async function runPersistenceOperation<Result>(
  description: string,
  operation: () => Promise<Result>,
): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof RecordNotFoundError ||
      error instanceof PersistenceError
    ) {
      throw error;
    }

    throw new PersistenceError(`Failed to ${description}.`, error);
  }
}
