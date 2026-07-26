import { describe, expect, it, vi } from 'vitest';

import type { GenerationProvider } from '../../src/application/generation/generation-provider';
import type {
  PromptAssembly,
  PromptBuilder,
} from '../../src/application/prompt/prompt-builder';
import {
  MissingGenerationModelError,
  MissingOutputInputError,
  OutputWorkflow,
  type OutputWorkflowInput,
} from '../../src/application/output/output-workflow';
import type {
  RetrievalEngine,
  RetrievalResults,
} from '../../src/application/retrieval/retrieval-engine';

const emptyRetrievalResults: RetrievalResults = {
  knowledge: [],
  snippets: [],
};

const prompt: PromptAssembly = {
  sections: [{ kind: 'instructions', content: 'Draft a support response.' }],
};

const generationResult = {
  text: 'Generated response',
  providerId: 'ollama',
  model: 'qwen2.5:7b',
} as const;

function createWorkflow(
  retrievalResults: RetrievalResults = emptyRetrievalResults,
) {
  const retrieve = vi.fn<RetrievalEngine['retrieve']>(
    async () => retrievalResults,
  );
  const build = vi.fn<PromptBuilder['build']>(() => prompt);
  const generate = vi.fn<GenerationProvider['generate']>(
    async () => generationResult,
  );
  const provider: GenerationProvider = {
    id: 'ollama',
    generate,
  };

  return {
    retrieve,
    build,
    generate,
    workflow: new OutputWorkflow({ retrieve }, { build }, provider),
  };
}

describe('OutputWorkflow', () => {
  it('uses exact Merchant Context as the Context-only retrieval query', async () => {
    const boundaries = createWorkflow();
    const merchantContext = '  Merchant needs a refund.\nOrder 123  ';

    await boundaries.workflow.generate({
      merchantContext,
      model: 'qwen2.5:7b',
    });

    expect(boundaries.retrieve).toHaveBeenCalledOnce();
    expect(boundaries.retrieve).toHaveBeenCalledWith(merchantContext);
    expect(boundaries.build).toHaveBeenCalledWith({
      merchantContext,
      retrievalResults: emptyRetrievalResults,
    });
  });

  it('uses exact Guidance as the Guidance-only retrieval query', async () => {
    const boundaries = createWorkflow();
    const guidance = '  follow up\npolitely  ';

    await boundaries.workflow.generate({ guidance, model: 'qwen2.5:7b' });

    expect(boundaries.retrieve).toHaveBeenCalledOnce();
    expect(boundaries.retrieve).toHaveBeenCalledWith(guidance);
    expect(boundaries.build).toHaveBeenCalledWith({
      guidance,
      retrievalResults: emptyRetrievalResults,
    });
  });

  it('joins Context then Guidance using exactly two newline characters', async () => {
    const boundaries = createWorkflow();
    const merchantContext = 'Context line one\nContext line two';
    const guidance = 'Guidance line one\nGuidance line two';

    await boundaries.workflow.generate({
      merchantContext,
      guidance,
      model: 'qwen2.5:7b',
    });

    expect(boundaries.retrieve).toHaveBeenCalledWith(
      `${merchantContext}\n\n${guidance}`,
    );
  });

  it('omits whitespace-only optional input from the retrieval query but passes the original inputs to Prompt Builder', async () => {
    const boundaries = createWorkflow();
    const merchantContext = ' \t\n ';
    const guidance = 'follow up';

    await boundaries.workflow.generate({
      merchantContext,
      guidance,
      model: 'qwen2.5:7b',
    });

    expect(boundaries.retrieve).toHaveBeenCalledWith(guidance);
    expect(boundaries.build).toHaveBeenCalledWith({
      merchantContext,
      guidance,
      retrievalResults: emptyRetrievalResults,
    });
  });

  it('accepts empty retrieval results and invokes every boundary exactly once', async () => {
    const boundaries = createWorkflow();

    const result = await boundaries.workflow.generate({
      merchantContext: 'Current conversation',
      guidance: 'Draft a concise reply',
      model: ' qwen2.5:7b ',
    });

    expect(boundaries.retrieve).toHaveBeenCalledOnce();
    expect(boundaries.build).toHaveBeenCalledOnce();
    expect(boundaries.generate).toHaveBeenCalledOnce();
    expect(boundaries.generate).toHaveBeenCalledWith({
      prompt,
      model: 'qwen2.5:7b',
    });
    expect(result).toBe(generationResult);
  });

  it('passes prepared RetrievalResults and original primary inputs to Prompt Builder', async () => {
    const retrievalResults: RetrievalResults = {
      knowledge: [
        {
          kind: 'knowledge',
          id: 'knowledge-1',
          score: 9,
          record: {
            id: 'knowledge-1',
            title: 'Refund policy',
            body: 'Refunds take five business days.',
            tags: ['refund'],
            createdAt: '2026-07-26T12:00:00.000Z',
            updatedAt: '2026-07-26T12:00:00.000Z',
            source: 'Policy',
          },
        },
      ],
      snippets: [],
    };
    const boundaries = createWorkflow(retrievalResults);
    const merchantContext = 'Merchant asked about a refund.';
    const guidance = 'Keep the answer brief.';

    await boundaries.workflow.generate({
      merchantContext,
      guidance,
      model: 'qwen2.5:7b',
    });

    expect(boundaries.build).toHaveBeenCalledWith({
      merchantContext,
      guidance,
      retrievalResults,
    });
    expect(boundaries.generate).toHaveBeenCalledWith({
      prompt,
      model: 'qwen2.5:7b',
    });
  });

  it('does not mutate the supplied workflow input', async () => {
    const boundaries = createWorkflow();
    const input: OutputWorkflowInput = {
      merchantContext: '  Exact context  ',
      guidance: '  Exact guidance  ',
      model: '  qwen2.5:7b  ',
    };
    const before = structuredClone(input);

    await boundaries.workflow.generate(input);

    expect(input).toEqual(before);
  });

  it('rejects missing primary input before invoking dependencies', async () => {
    const boundaries = createWorkflow();

    await expect(
      boundaries.workflow.generate({
        merchantContext: ' \t ',
        guidance: '\n',
        model: 'qwen2.5:7b',
      }),
    ).rejects.toBeInstanceOf(MissingOutputInputError);
    expect(boundaries.retrieve).not.toHaveBeenCalled();
    expect(boundaries.build).not.toHaveBeenCalled();
    expect(boundaries.generate).not.toHaveBeenCalled();
  });

  it('rejects a blank model before invoking dependencies', async () => {
    const boundaries = createWorkflow();

    await expect(
      boundaries.workflow.generate({
        merchantContext: 'Current conversation',
        model: ' \t\n ',
      }),
    ).rejects.toBeInstanceOf(MissingGenerationModelError);
    expect(boundaries.retrieve).not.toHaveBeenCalled();
    expect(boundaries.build).not.toHaveBeenCalled();
    expect(boundaries.generate).not.toHaveBeenCalled();
  });
});
