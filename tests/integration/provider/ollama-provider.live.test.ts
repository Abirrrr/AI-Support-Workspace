import { describe, expect, it } from 'vitest';

import { PromptBuilder } from '../../../src/application/prompt/prompt-builder';
import { OllamaProvider } from '../../../src/infrastructure/generation/ollama-provider';

const liveModel = process.env.OLLAMA_LIVE_MODEL;
const liveValidationEnabled =
  liveModel !== undefined && liveModel.trim().length > 0;

describe.skipIf(!liveValidationEnabled)(
  'OllamaProvider live smoke validation',
  () => {
    it('generates non-empty text with an explicitly supplied installed model', async () => {
      if (liveModel === undefined) {
        throw new Error(
          'OLLAMA_LIVE_MODEL must name an installed local model.',
        );
      }

      const prompt = new PromptBuilder().build({
        guidance: 'Reply with a short confirmation that generation works.',
      });
      const result = await new OllamaProvider().generate({
        prompt,
        model: liveModel,
      });

      expect(result.providerId).toBe('ollama');
      expect(result.model).toBe(liveModel);
      expect(result.text.trim().length).toBeGreaterThan(0);
    }, 120_000);
  },
);
