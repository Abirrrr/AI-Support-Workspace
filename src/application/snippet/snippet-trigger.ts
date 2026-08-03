export const SNIPPET_TRIGGER_PATTERN = /^;[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SNIPPET_TRIGGER_MIN_LENGTH = 2;
export const SNIPPET_TRIGGER_MAX_LENGTH = 32;

export class InvalidSnippetTriggerError extends Error {
  constructor() {
    super(
      'Use 2–32 characters starting with ;. Use only letters, numbers, and single hyphens.',
    );
    this.name = 'InvalidSnippetTriggerError';
  }
}

export class DuplicateSnippetTriggerError extends Error {
  readonly trigger: string;

  constructor(trigger: string) {
    super('That trigger is already used by another Snippet.');
    this.name = 'DuplicateSnippetTriggerError';
    this.trigger = trigger;
  }
}

export function normalizeSnippetTrigger(value: string | null): string | null {
  if (value === null || value === '') return null;

  const canonical = value.toLowerCase();
  if (
    canonical.length < SNIPPET_TRIGGER_MIN_LENGTH ||
    canonical.length > SNIPPET_TRIGGER_MAX_LENGTH ||
    !SNIPPET_TRIGGER_PATTERN.test(canonical)
  ) {
    throw new InvalidSnippetTriggerError();
  }

  return canonical;
}

export function isCanonicalSnippetTrigger(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= SNIPPET_TRIGGER_MIN_LENGTH &&
    value.length <= SNIPPET_TRIGGER_MAX_LENGTH &&
    SNIPPET_TRIGGER_PATTERN.test(value)
  );
}
