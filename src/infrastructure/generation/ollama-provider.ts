import {
  GenerationCancelledError,
  ModelUnavailableError,
  ProviderRequestError,
  ProviderResponseError,
  ProviderUnavailableError,
} from '../../application/generation/errors';
import type {
  GenerationProvider,
  GenerationRequest,
  GenerationResult,
  ProviderId,
} from '../../application/generation/generation-provider';
import type {
  KnowledgePromptSection,
  PromptAssembly,
  SnippetsPromptSection,
} from '../../application/prompt/prompt-builder';

const OLLAMA_CHAT_URL = 'http://localhost:11434/api/chat';

interface OllamaMessage {
  readonly role: 'system' | 'user';
  readonly content: string;
}

interface OllamaChatRequest {
  readonly model: string;
  readonly messages: readonly [OllamaMessage, OllamaMessage];
  readonly stream: false;
}

interface OllamaUserMessageContent {
  guidance?: string;
  merchantContext?: string;
  knowledge?: Array<{
    title: string;
    body: string;
  }>;
  snippets?: Array<{
    title: string;
    content: string;
  }>;
}

interface ProviderErrorDetails {
  readonly message?: string;
  readonly cause?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireModel(model: unknown): asserts model is string {
  if (typeof model !== 'string' || model.trim().length === 0) {
    throw new TypeError('Generation model must contain non-whitespace text.');
  }
}

function findInstructions(prompt: PromptAssembly): string {
  const instructions = prompt.sections.find(
    (section) => section.kind === 'instructions',
  );

  if (instructions?.kind !== 'instructions') {
    throw new TypeError('PromptAssembly must contain an Instructions section.');
  }

  return instructions.content;
}

function serializeKnowledge(section: KnowledgePromptSection) {
  return section.items.map(({ content }) => ({
    title: content.title,
    body: content.body,
  }));
}

function serializeSnippets(section: SnippetsPromptSection) {
  return section.items.map(({ content }) => ({
    title: content.title,
    content: content.content,
  }));
}

function createUserMessageContent(
  prompt: PromptAssembly,
): OllamaUserMessageContent {
  const content: OllamaUserMessageContent = {};

  const guidance = prompt.sections.find(
    (section) => section.kind === 'guidance',
  );
  if (guidance?.kind === 'guidance') {
    content.guidance = guidance.content;
  }

  const merchantContext = prompt.sections.find(
    (section) => section.kind === 'merchantContext',
  );
  if (merchantContext?.kind === 'merchantContext') {
    content.merchantContext = merchantContext.content;
  }

  const knowledge = prompt.sections.find(
    (section) => section.kind === 'knowledge',
  );
  if (knowledge?.kind === 'knowledge') {
    content.knowledge = serializeKnowledge(knowledge);
  }

  const snippets = prompt.sections.find(
    (section) => section.kind === 'snippets',
  );
  if (snippets?.kind === 'snippets') {
    content.snippets = serializeSnippets(snippets);
  }

  return content;
}

function createChatRequest(request: GenerationRequest): OllamaChatRequest {
  return {
    model: request.model,
    messages: [
      {
        role: 'system',
        content: findInstructions(request.prompt),
      },
      {
        role: 'user',
        content: JSON.stringify(createUserMessageContent(request.prompt)),
      },
    ],
    stream: false,
  };
}

async function readProviderError(
  response: Response,
  signal?: AbortSignal,
): Promise<ProviderErrorDetails> {
  try {
    const body: unknown = await response.json();

    if (
      isRecord(body) &&
      typeof body.error === 'string' &&
      body.error.trim().length > 0
    ) {
      return { message: body.error };
    }

    return {};
  } catch (cause) {
    if (signal?.aborted === true) {
      throw new GenerationCancelledError(cause);
    }

    return { cause };
  }
}

async function readGeneratedText(
  response: Response,
  signal?: AbortSignal,
): Promise<string> {
  let body: unknown;

  try {
    body = await response.json();
  } catch (cause) {
    if (signal?.aborted === true) {
      throw new GenerationCancelledError(cause);
    }

    throw new ProviderResponseError('Ollama returned malformed JSON.', cause);
  }

  if (!isRecord(body) || !isRecord(body.message)) {
    throw new ProviderResponseError(
      'Ollama returned an invalid generation response.',
    );
  }

  const content = body.message.content;

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new ProviderResponseError(
      'Ollama returned invalid or empty assistant content.',
    );
  }

  return content;
}

export class OllamaProvider implements GenerationProvider {
  readonly id: ProviderId = 'ollama';

  constructor(
    private readonly fetchTransport: typeof globalThis.fetch = globalThis.fetch.bind(
      globalThis,
    ),
  ) {}

  async generate(
    request: GenerationRequest,
    signal?: AbortSignal,
  ): Promise<GenerationResult> {
    requireModel(request.model);

    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createChatRequest(request)),
      ...(signal === undefined ? {} : { signal }),
    };
    let response: Response;

    try {
      response = await this.fetchTransport(OLLAMA_CHAT_URL, requestInit);
    } catch (cause) {
      if (signal?.aborted === true) {
        throw new GenerationCancelledError(cause);
      }

      throw new ProviderUnavailableError(cause);
    }

    if (!response.ok) {
      const details = await readProviderError(response, signal);

      if (response.status === 404) {
        throw new ModelUnavailableError(details.message, details.cause);
      }

      throw new ProviderRequestError(
        response.status,
        details.message,
        details.cause,
      );
    }

    return {
      text: await readGeneratedText(response, signal),
      providerId: this.id,
      model: request.model,
    };
  }
}
