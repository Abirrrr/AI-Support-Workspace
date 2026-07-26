import { describe, expect, it, vi } from 'vitest';

import {
  GenerationCancelledError,
  ModelUnavailableError,
  ProviderRequestError,
  ProviderResponseError,
  ProviderUnavailableError,
} from '../../src/application/generation/errors';
import type { GenerationRequest } from '../../src/application/generation/generation-provider';
import type { PromptAssembly } from '../../src/application/prompt/prompt-builder';
import { OllamaProvider } from '../../src/infrastructure/generation/ollama-provider';

const endpoint = 'http://localhost:11434/api/chat';

function createPrompt(): PromptAssembly {
  return {
    sections: [
      {
        kind: 'instructions',
        content: 'Use only the supplied support context.',
      },
      {
        kind: 'guidance',
        content: 'Draft a concise "follow-up".\nKeep the tone warm.',
      },
      {
        kind: 'merchantContext',
        content: 'The merchant said: "Still waiting."',
      },
      {
        kind: 'knowledge',
        items: [
          {
            content: {
              title: 'Shipping timeline',
              body: 'Standard delivery takes five business days.',
            },
            metadata: {
              kind: 'knowledge',
              id: 'knowledge-secret-id',
              score: 17,
            },
          },
        ],
      },
      {
        kind: 'snippets',
        items: [
          {
            content: {
              title: 'Warm close',
              content: 'Please let us know if we can help with anything else.',
            },
            metadata: {
              kind: 'snippet',
              id: 'snippet-secret-id',
              score: 9,
            },
          },
        ],
      },
    ],
  };
}

function createRequest(
  overrides: Partial<GenerationRequest> = {},
): GenerationRequest {
  return {
    prompt: createPrompt(),
    model: 'llama3.2:latest',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createSuccessfulFetch(content = 'Generated reply') {
  return vi.fn<typeof globalThis.fetch>(async () =>
    jsonResponse({
      model: 'provider-reported-model',
      message: { role: 'assistant', content },
      done: true,
      total_duration: 123,
      prompt_eval_count: 42,
    }),
  );
}

function getFetchCall(
  fetchTransport: ReturnType<typeof createSuccessfulFetch>,
) {
  expect(fetchTransport).toHaveBeenCalledOnce();
  const call = fetchTransport.mock.calls[0];

  if (call === undefined) {
    throw new Error('Expected one fetch call.');
  }

  return call;
}

function parseRequestBody(
  init: RequestInit | undefined,
): Record<string, unknown> {
  if (typeof init?.body !== 'string') {
    throw new Error('Expected a serialized request body.');
  }

  return JSON.parse(init.body) as Record<string, unknown>;
}

describe('OllamaProvider', () => {
  it('implements the project-owned ollama provider identity', () => {
    expect(new OllamaProvider(createSuccessfulFetch()).id).toBe('ollama');
  });

  it('binds the default global fetch transport to the browser global', async () => {
    const browserFetch: typeof globalThis.fetch = function (
      this: typeof globalThis,
      input,
      init,
    ) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }

      expect(input).toBe(endpoint);
      expect(init?.method).toBe('POST');

      return Promise.resolve(
        jsonResponse({
          message: { role: 'assistant', content: 'Generated reply' },
        }),
      );
    };

    vi.stubGlobal('fetch', browserFetch);

    try {
      const result = await new OllamaProvider().generate(createRequest());

      expect(result.text).toBe('Generated reply');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('accepts and preserves a caller-supplied non-whitespace model identifier', async () => {
    const fetchTransport = createSuccessfulFetch('  Original reply text  ');
    const provider = new OllamaProvider(fetchTransport);
    const model = '  custom-model:Q4_K_M  ';

    const result = await provider.generate(createRequest({ model }));
    const [, init] = getFetchCall(fetchTransport);

    expect(parseRequestBody(init).model).toBe(model);
    expect(result).toEqual({
      text: '  Original reply text  ',
      providerId: 'ollama',
      model,
    });
  });

  it.each([
    { name: 'empty', model: '' },
    { name: 'spaces', model: '   ' },
    { name: 'tabs and newlines', model: '\t\n' },
    { name: 'non-string', model: 42 },
  ])('rejects a $name model before transport execution', async ({ model }) => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const request = createRequest() as unknown as {
      prompt: PromptAssembly;
      model: unknown;
    };
    request.model = model;

    await expect(
      provider.generate(request as GenerationRequest),
    ).rejects.toThrow(TypeError);
    await expect(
      provider.generate(request as GenerationRequest),
    ).rejects.toThrow('Generation model must contain non-whitespace text.');
    expect(fetchTransport).not.toHaveBeenCalled();
  });

  it('sends the exact approved URL, method, JSON header, messages, and body fields', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);

    await provider.generate(createRequest());
    const [url, init] = getFetchCall(fetchTransport);
    const body = parseRequestBody(init);

    expect(url).toBe(endpoint);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(Object.keys(body)).toEqual(['model', 'messages', 'stream']);
    expect(body.model).toBe('llama3.2:latest');
    expect(body.stream).toBe(false);
    expect(body.messages).toHaveLength(2);
    expect(JSON.stringify(body)).not.toMatch(
      /"(options|temperature|top_p|top_k|seed|num_ctx|num_predict|stop|tools|format|think|keep_alive|logprobs)"/,
    );
  });

  it('translates Instructions and dynamic content into exactly two messages', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);

    await provider.generate(createRequest());
    const [, init] = getFetchCall(fetchTransport);
    const body = parseRequestBody(init);
    const messages = body.messages as Array<Record<string, unknown>>;

    expect(messages).toEqual([
      {
        role: 'system',
        content: 'Use only the supplied support context.',
      },
      {
        role: 'user',
        content: expect.any(String),
      },
    ]);

    const userContent = JSON.parse(messages[1]?.content as string) as Record<
      string,
      unknown
    >;
    expect(Object.keys(userContent)).toEqual([
      'guidance',
      'merchantContext',
      'knowledge',
      'snippets',
    ]);
    expect(userContent).toEqual({
      guidance: 'Draft a concise "follow-up".\nKeep the tone warm.',
      merchantContext: 'The merchant said: "Still waiting."',
      knowledge: [
        {
          title: 'Shipping timeline',
          body: 'Standard delivery takes five business days.',
        },
      ],
      snippets: [
        {
          title: 'Warm close',
          content: 'Please let us know if we can help with anything else.',
        },
      ],
    });
    expect(messages[1]?.content).not.toContain('knowledge-secret-id');
    expect(messages[1]?.content).not.toContain('snippet-secret-id');
    expect(messages[1]?.content).not.toContain('score');
    expect(messages[1]?.content).not.toContain('metadata');
  });

  it('omits absent dynamic sections from the user message', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const prompt: PromptAssembly = {
      sections: [
        { kind: 'instructions', content: 'Instructions only.' },
        { kind: 'guidance', content: 'Follow up.' },
      ],
    };

    await provider.generate(createRequest({ prompt }));
    const [, init] = getFetchCall(fetchTransport);
    const messages = parseRequestBody(init).messages as Array<
      Record<string, unknown>
    >;

    expect(messages[1]?.content).toBe('{"guidance":"Follow up."}');
  });

  it('enforces canonical JSON key order independent of section order', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const prompt = createPrompt();
    const scrambledPrompt: PromptAssembly = {
      sections: [...prompt.sections].reverse(),
    };

    await provider.generate(createRequest({ prompt: scrambledPrompt }));
    const [, init] = getFetchCall(fetchTransport);
    const messages = parseRequestBody(init).messages as Array<
      Record<string, unknown>
    >;
    const userContent = JSON.parse(messages[1]?.content as string) as object;

    expect(Object.keys(userContent)).toEqual([
      'guidance',
      'merchantContext',
      'knowledge',
      'snippets',
    ]);
  });

  it('creates deterministic requests without mutating GenerationRequest or PromptAssembly', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const request = createRequest();
    const before = structuredClone(request);

    await provider.generate(request);
    await provider.generate(request);

    expect(request).toEqual(before);
    expect(fetchTransport.mock.calls[0]).toEqual(fetchTransport.mock.calls[1]);
  });

  it('forwards the optional caller AbortSignal to fetch', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const controller = new AbortController();

    await provider.generate(createRequest(), controller.signal);
    const [, init] = getFetchCall(fetchTransport);

    expect(init?.signal).toBe(controller.signal);
  });

  it('returns only project-owned result fields and ignores Ollama telemetry', async () => {
    const provider = new OllamaProvider(createSuccessfulFetch('Reply'));

    const result = await provider.generate(createRequest());

    expect(Object.keys(result)).toEqual(['text', 'providerId', 'model']);
    expect(result).toEqual({
      text: 'Reply',
      providerId: 'ollama',
      model: 'llama3.2:latest',
    });
    expect(JSON.stringify(result)).not.toContain('total_duration');
    expect(JSON.stringify(result)).not.toContain('prompt_eval_count');
  });

  it('maps a connection failure to ProviderUnavailableError and preserves its cause', async () => {
    const cause = new TypeError('fetch failed');
    const fetchTransport = vi.fn<typeof globalThis.fetch>();
    fetchTransport.mockRejectedValue(cause);
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest())
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ProviderUnavailableError);
    expect((error as Error).cause).toBe(cause);
    expect(fetchTransport).toHaveBeenCalledOnce();
  });

  it('does not map prompt translation failures to ProviderUnavailableError', async () => {
    const fetchTransport = createSuccessfulFetch();
    const provider = new OllamaProvider(fetchTransport);
    const request = createRequest({
      prompt: {
        sections: [{ kind: 'guidance', content: 'Follow up.' }],
      },
    });

    const error = await provider.generate(request).catch((value) => value);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ProviderUnavailableError);
    expect(fetchTransport).not.toHaveBeenCalled();
  });

  it('maps HTTP 404 to ModelUnavailableError without pulling or retrying', async () => {
    const fetchTransport = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({ error: 'model "missing" not found' }, 404),
    );
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest())
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ModelUnavailableError);
    expect(error).toMatchObject({ status: 404 });
    expect((error as Error).message).toContain('model "missing" not found');
    expect(fetchTransport).toHaveBeenCalledOnce();
    expect(fetchTransport.mock.calls[0]?.[0]).toBe(endpoint);
  });

  it('maps other non-success statuses to ProviderRequestError with safe provider text', async () => {
    const fetchTransport = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse({ error: 'request rejected' }, 500),
    );
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest())
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ProviderRequestError);
    expect(error).toMatchObject({ status: 500 });
    expect((error as Error).message).toContain('request rejected');
    expect(fetchTransport).toHaveBeenCalledOnce();
  });

  it('maps a malformed non-success body to ProviderRequestError', async () => {
    const fetchTransport = vi.fn<typeof globalThis.fetch>(
      async () => new Response('{not-json', { status: 429 }),
    );
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest())
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ProviderRequestError);
    expect(error).toMatchObject({ status: 429 });
    expect((error as Error).cause).toBeInstanceOf(SyntaxError);
    expect(fetchTransport).toHaveBeenCalledOnce();
  });

  it('maps malformed success JSON to ProviderResponseError', async () => {
    const fetchTransport = vi.fn<typeof globalThis.fetch>(
      async () => new Response('{not-json', { status: 200 }),
    );
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest())
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ProviderResponseError);
    expect((error as Error).cause).toBeInstanceOf(SyntaxError);
  });

  it.each([
    { name: 'null root', body: null },
    { name: 'array root', body: [] },
    { name: 'missing message', body: {} },
    { name: 'non-object message', body: { message: 'invalid' } },
  ])('rejects $name as ProviderResponseError', async ({ body }) => {
    const provider = new OllamaProvider(
      vi.fn<typeof globalThis.fetch>(async () => jsonResponse(body)),
    );

    await expect(provider.generate(createRequest())).rejects.toBeInstanceOf(
      ProviderResponseError,
    );
  });

  it.each([
    { name: 'missing', body: { message: {} } },
    { name: 'non-string', body: { message: { content: 123 } } },
    { name: 'empty', body: { message: { content: '' } } },
    { name: 'whitespace-only', body: { message: { content: ' \t\n ' } } },
  ])(
    'rejects $name assistant content as ProviderResponseError',
    async ({ body }) => {
      const provider = new OllamaProvider(
        vi.fn<typeof globalThis.fetch>(async () => jsonResponse(body)),
      );

      await expect(provider.generate(createRequest())).rejects.toBeInstanceOf(
        ProviderResponseError,
      );
    },
  );

  it('maps caller AbortSignal cancellation to GenerationCancelledError', async () => {
    const controller = new AbortController();
    const cause = new DOMException('The operation was aborted.', 'AbortError');
    const fetchTransport = vi.fn<typeof globalThis.fetch>();
    fetchTransport.mockImplementation(async (_input, init) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      throw cause;
    });
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest(), controller.signal)
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(GenerationCancelledError);
    expect((error as Error).cause).toBe(cause);
    expect(error).not.toBeInstanceOf(ProviderUnavailableError);
  });

  it('maps cancellation while reading a successful response body to GenerationCancelledError', async () => {
    const controller = new AbortController();
    const cause = new DOMException('The operation was aborted.', 'AbortError');
    const response = {
      ok: true,
      status: 200,
      json: vi.fn(async () => {
        controller.abort();
        throw cause;
      }),
    } as unknown as Response;
    const fetchTransport = vi.fn<typeof globalThis.fetch>(async () => response);
    const provider = new OllamaProvider(fetchTransport);

    const error = await provider
      .generate(createRequest(), controller.signal)
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(GenerationCancelledError);
    expect((error as Error).cause).toBe(cause);
    expect(error).not.toBeInstanceOf(ProviderResponseError);
  });

  it('does not treat an unrelated transport failure as cancellation', async () => {
    const controller = new AbortController();
    const fetchTransport = vi.fn<typeof globalThis.fetch>();
    fetchTransport.mockRejectedValue(new TypeError('connection refused'));
    const provider = new OllamaProvider(fetchTransport);

    await expect(
      provider.generate(createRequest(), controller.signal),
    ).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('does not log prompt or provider data', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const provider = new OllamaProvider(createSuccessfulFetch());

    await provider.generate(createRequest());

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
