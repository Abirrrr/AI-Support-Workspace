import type { PromptAssembly } from '../prompt/prompt-builder';

export type ProviderId = 'ollama';

export interface GenerationRequest {
  readonly prompt: PromptAssembly;
  readonly model: string;
}

export interface GenerationResult {
  readonly text: string;
  readonly providerId: ProviderId;
  readonly model: string;
}

export interface GenerationProvider {
  readonly id: ProviderId;

  generate(
    request: GenerationRequest,
    signal?: AbortSignal,
  ): Promise<GenerationResult>;
}
