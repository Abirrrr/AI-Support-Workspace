import { useEffect, useRef, useState } from 'react';

import {
  GenerationCancelledError,
  ModelUnavailableError,
  ProviderRequestError,
  ProviderResponseError,
  ProviderUnavailableError,
} from '../../application/generation/errors';
import { MissingPromptInputError } from '../../application/prompt/prompt-builder';
import {
  MissingGenerationModelError,
  MissingOutputInputError,
  type OutputWorkflow,
} from '../../application/output/output-workflow';

const COPY_FAILURE_MESSAGE =
  'Could not copy. Select the text and copy it manually.';

export type OutputWorkspaceStatus = 'idle' | 'generating' | 'success' | 'error';

interface OutputWorkspaceViewProps {
  outputWorkflow: Pick<OutputWorkflow, 'generate'>;
}

function hasNonWhitespaceText(value: string): boolean {
  return value.trim().length > 0;
}

function getGenerationErrorMessage(error: unknown): string {
  if (
    error instanceof MissingOutputInputError ||
    error instanceof MissingPromptInputError
  ) {
    return 'Add Merchant Context or Guidance before generating.';
  }

  if (error instanceof MissingGenerationModelError) {
    return 'Enter an Ollama model name.';
  }

  if (error instanceof ProviderUnavailableError) {
    return "Couldn't connect to Ollama. Make sure Ollama is running and configured for this extension.";
  }

  if (error instanceof ModelUnavailableError) {
    return 'That model is not available in your local Ollama installation.';
  }

  if (error instanceof ProviderRequestError) {
    return "Ollama couldn't complete the request. Try again.";
  }

  if (error instanceof ProviderResponseError) {
    return 'Ollama returned an invalid response. Try again.';
  }

  if (error instanceof GenerationCancelledError) {
    return 'Generation was cancelled.';
  }

  return "Couldn't read the local Library. Try again.";
}

export function OutputWorkspaceView({
  outputWorkflow,
}: OutputWorkspaceViewProps) {
  const [merchantContext, setMerchantContext] = useState('');
  const [guidance, setGuidance] = useState('');
  const [model, setModel] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<OutputWorkspaceStatus>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const generationActive = useRef(false);
  const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hasPrimaryInput =
    hasNonWhitespaceText(merchantContext) || hasNonWhitespaceText(guidance);
  const isGenerating = status === 'generating';
  const generateDisabled =
    !hasPrimaryInput || !hasNonWhitespaceText(model) || isGenerating;

  useEffect(
    () => () => {
      if (copyFeedbackTimeout.current !== null) {
        clearTimeout(copyFeedbackTimeout.current);
      }
    },
    [],
  );

  function clearCopyFeedback() {
    if (copyFeedbackTimeout.current !== null) {
      clearTimeout(copyFeedbackTimeout.current);
      copyFeedbackTimeout.current = null;
    }
    setCopyFeedback(null);
  }

  async function generateOutput() {
    if (generationActive.current) return;

    if (!hasPrimaryInput) {
      setStatus('error');
      setGenerationError('Add Merchant Context or Guidance before generating.');
      return;
    }

    if (!hasNonWhitespaceText(model)) {
      setStatus('error');
      setGenerationError('Enter an Ollama model name.');
      return;
    }

    generationActive.current = true;
    setStatus('generating');
    setGenerationError(null);
    clearCopyFeedback();

    try {
      const result = await outputWorkflow.generate({
        merchantContext,
        guidance,
        model: model.trim(),
      });

      setOutput(result.text);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setGenerationError(getGenerationErrorMessage(error));
    } finally {
      generationActive.current = false;
    }
  }

  async function copyOutput() {
    clearCopyFeedback();

    try {
      await navigator.clipboard.writeText(output);
      setCopyFeedback('Copied');
    } catch {
      setCopyFeedback(COPY_FAILURE_MESSAGE);
    }

    copyFeedbackTimeout.current = setTimeout(() => {
      setCopyFeedback(null);
      copyFeedbackTimeout.current = null;
    }, 2000);
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-100 px-3 py-5 text-slate-950">
      <div className="w-full rounded-xl bg-white p-4 shadow-sm">
        <header>
          <p className="text-sm font-semibold text-blue-700">
            Local support drafting
          </p>
          <h1 className="mt-1 text-2xl font-semibold">AI Support Workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the current support context or guidance, then generate an
            editable draft with your local Ollama model.
          </p>
        </header>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void generateOutput();
          }}
        >
          <div>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="merchant-context"
            >
              Merchant Context
            </label>
            <textarea
              className="mt-2 min-h-40 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              id="merchant-context"
              onChange={(event) => setMerchantContext(event.target.value)}
              value={merchantContext}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="guidance"
            >
              Guidance
            </label>
            <textarea
              className="mt-2 min-h-28 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              id="guidance"
              onChange={(event) => setGuidance(event.target.value)}
              value={guidance}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="ollama-model"
            >
              Ollama model
            </label>
            <input
              className="mt-2 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              id="ollama-model"
              onChange={(event) => setModel(event.target.value)}
              placeholder="qwen2.5:7b"
              type="text"
              value={model}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Ollama must be installed, running locally, contain this model, and
              allow access from this Chrome extension.
            </p>
          </div>

          <button
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={generateDisabled}
            type="submit"
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </form>

        <div
          aria-live={status === 'error' ? 'assertive' : 'polite'}
          className="mt-4 min-h-6 text-sm"
          role={status === 'error' ? 'alert' : 'status'}
        >
          {isGenerating ? (
            <p className="text-slate-600">Generating draft…</p>
          ) : null}
          {status === 'success' ? (
            <p className="text-emerald-700">Draft generated.</p>
          ) : null}
          {status === 'error' && generationError !== null ? (
            <p className="text-red-700">{generationError}</p>
          ) : null}
        </div>

        <section className="mt-6">
          <label
            className="block text-sm font-semibold text-slate-800"
            htmlFor="generated-output"
          >
            Generated Output
          </label>
          <textarea
            className="mt-2 min-h-56 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 shadow-sm read-only:bg-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            id="generated-output"
            onChange={(event) => {
              setOutput(event.target.value);
              clearCopyFeedback();
            }}
            readOnly={isGenerating}
            value={output}
          />
          <div className="mt-3 flex flex-col gap-2">
            <button
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={output.length === 0}
              onClick={() => void copyOutput()}
              type="button"
            >
              Copy
            </button>
            <div aria-live="polite" className="text-sm text-slate-600">
              {copyFeedback}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
