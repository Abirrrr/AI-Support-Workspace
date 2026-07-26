import type {
  GenerationProvider,
  GenerationResult,
} from '../generation/generation-provider';
import type { PromptBuildInput, PromptBuilder } from '../prompt/prompt-builder';
import type { RetrievalEngine } from '../retrieval/retrieval-engine';

export interface OutputWorkflowInput {
  readonly merchantContext?: string;
  readonly guidance?: string;
  readonly model: string;
}

export class MissingOutputInputError extends Error {
  constructor() {
    super('Output generation requires Merchant Context or Guidance.');
    this.name = 'MissingOutputInputError';
  }
}

export class MissingGenerationModelError extends Error {
  constructor() {
    super('Output generation requires an Ollama model.');
    this.name = 'MissingGenerationModelError';
  }
}

type RetrievalBoundary = Pick<RetrievalEngine, 'retrieve'>;
type PromptBuilderBoundary = Pick<PromptBuilder, 'build'>;

function hasNonWhitespaceText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function createRetrievalQuery(input: OutputWorkflowInput): string {
  const parts: string[] = [];

  if (hasNonWhitespaceText(input.merchantContext)) {
    parts.push(input.merchantContext);
  }

  if (hasNonWhitespaceText(input.guidance)) {
    parts.push(input.guidance);
  }

  if (parts.length === 0) {
    throw new MissingOutputInputError();
  }

  return parts.join('\n\n');
}

function createPromptInput(
  input: OutputWorkflowInput,
  retrievalResults: Awaited<ReturnType<RetrievalBoundary['retrieve']>>,
): PromptBuildInput {
  return {
    ...(input.merchantContext === undefined
      ? {}
      : { merchantContext: input.merchantContext }),
    ...(input.guidance === undefined ? {} : { guidance: input.guidance }),
    retrievalResults,
  };
}

export class OutputWorkflow {
  constructor(
    private readonly retrievalEngine: RetrievalBoundary,
    private readonly promptBuilder: PromptBuilderBoundary,
    private readonly generationProvider: GenerationProvider,
  ) {}

  async generate(input: OutputWorkflowInput): Promise<GenerationResult> {
    const retrievalQuery = createRetrievalQuery(input);
    const model = input.model.trim();

    if (model.length === 0) {
      throw new MissingGenerationModelError();
    }

    const retrievalResults =
      await this.retrievalEngine.retrieve(retrievalQuery);
    const prompt = this.promptBuilder.build(
      createPromptInput(input, retrievalResults),
    );

    return this.generationProvider.generate({ prompt, model });
  }
}
