function createErrorOptions(cause: unknown): ErrorOptions | undefined {
  return cause === undefined ? undefined : { cause };
}

function withProviderMessage(
  message: string,
  providerMessage?: string,
): string {
  return providerMessage === undefined
    ? message
    : `${message}: ${providerMessage}`;
}

export class ProviderUnavailableError extends Error {
  constructor(cause: unknown) {
    super('The generation provider is unavailable.', { cause });
    this.name = 'ProviderUnavailableError';
  }
}

export class ModelUnavailableError extends Error {
  readonly status = 404;

  constructor(providerMessage?: string, cause?: unknown) {
    super(
      withProviderMessage(
        'The requested generation model is unavailable',
        providerMessage,
      ),
      createErrorOptions(cause),
    );
    this.name = 'ModelUnavailableError';
  }
}

export class ProviderRequestError extends Error {
  readonly status: number;

  constructor(status: number, providerMessage?: string, cause?: unknown) {
    super(
      withProviderMessage(
        `The generation provider rejected the request with HTTP ${status}`,
        providerMessage,
      ),
      createErrorOptions(cause),
    );
    this.name = 'ProviderRequestError';
    this.status = status;
  }
}

export class ProviderResponseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, createErrorOptions(cause));
    this.name = 'ProviderResponseError';
  }
}

export class GenerationCancelledError extends Error {
  constructor(cause: unknown) {
    super('Generation was cancelled.', { cause });
    this.name = 'GenerationCancelledError';
  }
}
