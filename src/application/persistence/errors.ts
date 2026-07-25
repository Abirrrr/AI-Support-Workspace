export type PersistenceEntityKind = 'knowledgeEntry' | 'snippetEntry';

export class RecordNotFoundError extends Error {
  readonly entityKind: PersistenceEntityKind;
  readonly id: string;

  constructor(entityKind: PersistenceEntityKind, id: string) {
    super(`${entityKind} record "${id}" was not found.`);
    this.name = 'RecordNotFoundError';
    this.entityKind = entityKind;
    this.id = id;
  }
}

export class PersistenceError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = 'PersistenceError';
  }
}
