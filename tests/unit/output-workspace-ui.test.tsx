// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GenerationCancelledError,
  ModelUnavailableError,
  ProviderRequestError,
  ProviderResponseError,
  ProviderUnavailableError,
} from '../../src/application/generation/errors';
import type { GenerationResult } from '../../src/application/generation/generation-provider';
import {
  MissingGenerationModelError,
  MissingOutputInputError,
  type OutputWorkflow,
} from '../../src/application/output/output-workflow';
import type { SelectionCaptureResult } from '../../src/shared/selection-capture';
import { OutputWorkspaceView } from '../../src/ui/workspace/OutputWorkspaceView';
import type {
  WorkspaceCaptureHandler,
  WorkspaceCaptureSource,
} from '../../src/ui/workspace/workspace-capture-source';

function createResult(text: string): GenerationResult {
  return {
    text,
    providerId: 'ollama',
    model: 'qwen2.5:7b',
  };
}

function createWorkflow() {
  return {
    generate: vi.fn<OutputWorkflow['generate']>(async () =>
      createResult('Generated reply'),
    ),
  } satisfies Pick<OutputWorkflow, 'generate'>;
}

function createCaptureSource() {
  let handler: WorkspaceCaptureHandler | undefined;
  const source: WorkspaceCaptureSource = {
    subscribe(nextHandler) {
      handler = nextHandler;

      return () => {
        if (handler === nextHandler) handler = undefined;
      };
    },
  };

  return {
    source,
    async emit(result: SelectionCaptureResult) {
      if (handler === undefined) {
        throw new Error('Workspace capture handler is not subscribed.');
      }

      const captureHandler = handler;
      await act(async () => captureHandler(result));
    },
  };
}

function enterValidInput(
  options: {
    merchantContext?: string;
    guidance?: string;
    model?: string;
  } = {},
) {
  if (options.merchantContext !== undefined) {
    fireEvent.change(screen.getByLabelText('Merchant Context'), {
      target: { value: options.merchantContext },
    });
  }

  if (options.guidance !== undefined) {
    fireEvent.change(screen.getByLabelText('Guidance'), {
      target: { value: options.guidance },
    });
  }

  fireEvent.change(screen.getByLabelText('Ollama model'), {
    target: { value: options.model ?? 'qwen2.5:7b' },
  });
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

let writeText: ReturnType<typeof vi.fn<(value: string) => Promise<void>>>;

beforeEach(() => {
  writeText = vi.fn(async () => undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('OutputWorkspaceView', () => {
  it('uses a narrow, overflow-safe Side Panel layout', () => {
    const { container } = render(
      <OutputWorkspaceView outputWorkflow={createWorkflow()} />,
    );

    const main = container.querySelector('main');

    expect(main?.className).toContain('w-full');
    expect(main?.className).toContain('overflow-x-hidden');
    expect(container.innerHTML).not.toContain('max-w-4xl');
    expect(
      screen.getByRole('button', { name: 'Generate' }).className,
    ).toContain('w-full');
    expect(screen.getByRole('button', { name: 'Copy' }).className).toContain(
      'w-full',
    );
  });

  it('renders blank transient inputs and disabled initial actions', () => {
    render(<OutputWorkspaceView outputWorkflow={createWorkflow()} />);

    expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
      'value',
      '',
    );
    expect(screen.getByLabelText('Guidance')).toHaveProperty('value', '');
    expect(screen.getByLabelText('Ollama model')).toHaveProperty('value', '');
    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'placeholder',
      'qwen2.5:7b',
    );
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'value',
      '',
    );
    expect(screen.getByRole('button', { name: 'Generate' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('initializes a new session with the saved default model', () => {
    render(
      <OutputWorkspaceView
        initialModel="llama3.2:latest"
        outputWorkflow={createWorkflow()}
      />,
    );

    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'llama3.2:latest',
    );
  });

  it('keeps a settings load failure non-blocking and allows a manual model', async () => {
    const workflow = createWorkflow();
    render(
      <OutputWorkspaceView
        initialModel=""
        outputWorkflow={workflow}
        settingsLoadFailureMessage="Couldn't load the saved model. Enter a model manually."
      />,
    );

    expect(screen.getByLabelText('Ollama model')).toHaveProperty('value', '');
    expect(
      screen.getByText(
        "Couldn't load the saved model. Enter a model manually.",
      ),
    ).toBeTruthy();

    enterValidInput({ merchantContext: 'Current conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByDisplayValue('Generated reply')).toBeTruthy();
  });

  it('does not live-sync a changed default into an already mounted session', async () => {
    const workflow = createWorkflow();
    const { rerender } = render(
      <OutputWorkspaceView
        initialModel="saved-model:one"
        outputWorkflow={workflow}
      />,
    );
    enterValidInput({
      merchantContext: 'Current conversation',
      guidance: 'Keep this concise.',
      model: 'temporary-model:override',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const output = await screen.findByDisplayValue('Generated reply');
    fireEvent.change(output, { target: { value: 'Edited retained output' } });

    rerender(
      <OutputWorkspaceView
        initialModel="saved-model:two"
        outputWorkflow={workflow}
      />,
    );

    expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
      'value',
      'Current conversation',
    );
    expect(screen.getByLabelText('Guidance')).toHaveProperty(
      'value',
      'Keep this concise.',
    );
    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'temporary-model:override',
    );
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'value',
      'Edited retained output',
    );
  });

  it('reloads the saved default when a Workspace session is recreated', () => {
    const firstSession = render(
      <OutputWorkspaceView
        initialModel="saved-model:latest"
        outputWorkflow={createWorkflow()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Ollama model'), {
      target: { value: 'temporary-model:override' },
    });
    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'temporary-model:override',
    );

    firstSession.unmount();
    render(
      <OutputWorkspaceView
        initialModel="saved-model:latest"
        outputWorkflow={createWorkflow()}
      />,
    );

    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'saved-model:latest',
    );
  });

  it('keeps Generate disabled without primary input or without a model', () => {
    render(<OutputWorkspaceView outputWorkflow={createWorkflow()} />);
    const generate = screen.getByRole('button', { name: 'Generate' });

    fireEvent.change(screen.getByLabelText('Ollama model'), {
      target: { value: 'qwen2.5:7b' },
    });
    expect(generate).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText('Merchant Context'), {
      target: { value: 'Current conversation' },
    });
    fireEvent.change(screen.getByLabelText('Ollama model'), {
      target: { value: ' \t ' },
    });
    expect(generate).toHaveProperty('disabled', true);
  });

  it.each([
    {
      name: 'Context only',
      merchantContext: 'Current conversation',
      guidance: undefined,
    },
    {
      name: 'Guidance only',
      merchantContext: undefined,
      guidance: 'follow up',
    },
    {
      name: 'Context and Guidance',
      merchantContext: 'Current conversation',
      guidance: 'follow up',
    },
  ])(
    'enables Generate for $name with a model',
    ({ merchantContext, guidance }) => {
      render(<OutputWorkspaceView outputWorkflow={createWorkflow()} />);

      enterValidInput({
        ...(merchantContext === undefined ? {} : { merchantContext }),
        ...(guidance === undefined ? {} : { guidance }),
      });

      expect(screen.getByRole('button', { name: 'Generate' })).toHaveProperty(
        'disabled',
        false,
      );
    },
  );

  it('passes exact Context and Guidance with a trimmed model to OutputWorkflow', async () => {
    const workflow = createWorkflow();
    render(<OutputWorkspaceView outputWorkflow={workflow} />);

    enterValidInput({
      merchantContext: '  Context\nline two  ',
      guidance: '  follow up  ',
      model: '  qwen2.5:7b  ',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() =>
      expect(workflow.generate).toHaveBeenCalledWith({
        merchantContext: '  Context\nline two  ',
        guidance: '  follow up  ',
        model: 'qwen2.5:7b',
      }),
    );
  });

  it('shows generating state, prevents duplicates, and makes prior output read-only', async () => {
    const deferred = createDeferred<GenerationResult>();
    const workflow = createWorkflow();
    workflow.generate
      .mockResolvedValueOnce(createResult('First draft'))
      .mockImplementationOnce(async () => deferred.promise);
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ merchantContext: 'Current conversation' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await screen.findByDisplayValue('First draft')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Generated Output'), {
      target: { value: 'Edited first draft' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const generatingButton = screen.getByRole('button', {
      name: 'Generating…',
    });
    expect(generatingButton).toHaveProperty('disabled', true);
    expect(screen.getByText('Generating draft…')).toBeTruthy();
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'readOnly',
      true,
    );
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'value',
      'Edited first draft',
    );

    fireEvent.click(generatingButton);
    expect(workflow.generate).toHaveBeenCalledTimes(2);

    deferred.resolve(createResult('Second draft'));
    expect(await screen.findByDisplayValue('Second draft')).toBeTruthy();
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'readOnly',
      false,
    );
  });

  it('displays exact provider output, allows editing, and replaces it on repeated Generate', async () => {
    const workflow = createWorkflow();
    workflow.generate
      .mockResolvedValueOnce(createResult('  First line\nSecond line 🌍  '))
      .mockResolvedValueOnce(createResult('Replacement draft'));
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ guidance: 'follow up' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const output = await screen.findByLabelText('Generated Output');
    expect(output).toHaveProperty('value', '  First line\nSecond line 🌍  ');
    expect(screen.getByText('Draft generated.')).toBeTruthy();

    fireEvent.change(output, { target: { value: 'Edited draft' } });
    expect(output).toHaveProperty('value', 'Edited draft');

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Generated Output')).toHaveProperty(
        'value',
        'Replacement draft',
      ),
    );
    expect(workflow.generate).toHaveBeenCalledTimes(2);
  });

  it('preserves edited output when a later generation fails', async () => {
    const workflow = createWorkflow();
    workflow.generate
      .mockResolvedValueOnce(createResult('First draft'))
      .mockRejectedValueOnce(new ProviderUnavailableError(new Error('raw')));
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ merchantContext: 'Current conversation' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const output = await screen.findByDisplayValue('First draft');
    fireEvent.change(output, { target: { value: 'Edited retained draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(
      await screen.findByText(
        "Couldn't connect to Ollama. Make sure Ollama is running and configured for this extension.",
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'value',
      'Edited retained draft',
    );
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'readOnly',
      false,
    );
  });

  it.each([
    {
      name: 'missing primary input validation',
      error: new MissingOutputInputError(),
      message: 'Add Merchant Context or Guidance before generating.',
    },
    {
      name: 'missing model validation',
      error: new MissingGenerationModelError(),
      message: 'Enter an Ollama model name.',
    },
    {
      name: 'missing model',
      error: new ModelUnavailableError('raw missing model'),
      message: 'That model is not available in your local Ollama installation.',
    },
    {
      name: 'request failure',
      error: new ProviderRequestError(500, 'raw request body'),
      message: "Ollama couldn't complete the request. Try again.",
    },
    {
      name: 'response failure',
      error: new ProviderResponseError('raw invalid response'),
      message: 'Ollama returned an invalid response. Try again.',
    },
    {
      name: 'cancellation',
      error: new GenerationCancelledError(new Error('raw abort')),
      message: 'Generation was cancelled.',
    },
    {
      name: 'Library failure',
      error: new Error('raw local persistence failure'),
      message: "Couldn't read the local Library. Try again.",
    },
  ])('maps $name to safe feedback', async ({ error, message }) => {
    const workflow = createWorkflow();
    workflow.generate.mockRejectedValueOnce(error);
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ merchantContext: 'Current conversation' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText(message)).toBeTruthy();
    if (error.message !== message) {
      expect(screen.queryByText(error.message)).toBeNull();
    }
  });

  it('copies the current edited output with line breaks and shows success feedback', async () => {
    const workflow = createWorkflow();
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ merchantContext: 'Current conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const output = await screen.findByDisplayValue('Generated reply');
    fireEvent.change(output, {
      target: { value: 'Edited first line\nEdited second line' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        'Edited first line\nEdited second line',
      ),
    );
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  it('shows safe feedback when copying fails', async () => {
    writeText.mockRejectedValueOnce(new Error('raw clipboard failure'));
    const workflow = createWorkflow();
    render(<OutputWorkspaceView outputWorkflow={workflow} />);
    enterValidInput({ guidance: 'follow up' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    await screen.findByDisplayValue('Generated reply');

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(
      await screen.findByText(
        'Could not copy. Select the text and copy it manually.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('raw clipboard failure')).toBeNull();
  });

  it('replaces only Merchant Context, preserves state, and focuses the end of existing Guidance without generating', async () => {
    const workflow = createWorkflow();
    const capture = createCaptureSource();
    render(
      <OutputWorkspaceView
        captureSource={capture.source}
        outputWorkflow={workflow}
      />,
    );
    enterValidInput({
      merchantContext: 'Old Context',
      guidance: 'Make this shorter.',
      model: 'qwen2.5:7b',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const output = await screen.findByDisplayValue('Generated reply');
    fireEvent.change(output, { target: { value: 'Edited retained output' } });

    const selectedText = '  Selected line one\nSelected line two 🌍  ';
    await capture.emit({ kind: 'success', text: selectedText });

    const context =
      screen.getByLabelText<HTMLTextAreaElement>('Merchant Context');
    const guidance = screen.getByLabelText<HTMLTextAreaElement>('Guidance');
    expect(context.value).toBe(selectedText);
    expect(guidance.value).toBe('Make this shorter.');
    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'qwen2.5:7b',
    );
    expect(screen.getByLabelText('Generated Output')).toHaveProperty(
      'value',
      'Edited retained output',
    );
    expect(document.activeElement).toBe(guidance);
    expect(document.activeElement).not.toBe(context);
    expect(guidance.selectionStart).toBe('Make this shorter.'.length);
    expect(guidance.selectionEnd).toBe('Make this shorter.'.length);
    expect(
      screen.getByText('Selected text added to Merchant Context.'),
    ).toBeTruthy();
    expect(workflow.generate).toHaveBeenCalledTimes(1);
  });

  it('preserves the saved initial model when capture supplies Context without generating', async () => {
    const workflow = createWorkflow();
    const capture = createCaptureSource();
    render(
      <OutputWorkspaceView
        captureSource={capture.source}
        initialModel="saved-model:latest"
        outputWorkflow={workflow}
      />,
    );

    await capture.emit({ kind: 'success', text: 'Captured Context' });

    expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
      'value',
      'Captured Context',
    );
    expect(screen.getByLabelText('Ollama model')).toHaveProperty(
      'value',
      'saved-model:latest',
    );
    expect(workflow.generate).not.toHaveBeenCalled();
  });

  it('focuses empty Guidance ready for typing after successful capture', async () => {
    const workflow = createWorkflow();
    const capture = createCaptureSource();
    render(
      <OutputWorkspaceView
        captureSource={capture.source}
        outputWorkflow={workflow}
      />,
    );
    const context =
      screen.getByLabelText<HTMLTextAreaElement>('Merchant Context');
    const guidance = screen.getByLabelText<HTMLTextAreaElement>('Guidance');
    context.focus();

    await capture.emit({ kind: 'success', text: 'Selected Context' });

    expect(context.value).toBe('Selected Context');
    expect(guidance.value).toBe('');
    expect(document.activeElement).toBe(guidance);
    expect(document.activeElement).not.toBe(context);
    expect(guidance.selectionStart).toBe(0);
    expect(guidance.selectionEnd).toBe(0);
    expect(workflow.generate).not.toHaveBeenCalled();
  });

  it.each([
    {
      result: { kind: 'empty' } as const,
      feedback: 'Select text on the page, then use the shortcut again.',
    },
    {
      result: { kind: 'failure' } as const,
      feedback:
        "Couldn't capture selected text from this page. Copy and paste it into Merchant Context.",
    },
  ])(
    'preserves Context, existing focus, and output for $result.kind capture',
    async ({ result, feedback }) => {
      const workflow = createWorkflow();
      const capture = createCaptureSource();
      render(
        <OutputWorkspaceView
          captureSource={capture.source}
          outputWorkflow={workflow}
        />,
      );
      enterValidInput({
        merchantContext: 'Existing Context',
        guidance: 'Existing Guidance',
      });
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
      await screen.findByDisplayValue('Generated reply');
      const guidance = screen.getByLabelText<HTMLTextAreaElement>('Guidance');
      const model = screen.getByLabelText<HTMLInputElement>('Ollama model');
      model.focus();

      await capture.emit(result);

      expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
        'value',
        'Existing Context',
      );
      expect(screen.getByLabelText('Generated Output')).toHaveProperty(
        'value',
        'Generated reply',
      );
      expect(guidance.value).toBe('Existing Guidance');
      expect(document.activeElement).toBe(model);
      expect(document.activeElement).not.toBe(guidance);
      expect(screen.getByText(feedback)).toBeTruthy();
    },
  );

  it('updates visible Context for the next request without cancelling active generation', async () => {
    const deferred = createDeferred<GenerationResult>();
    const workflow = createWorkflow();
    workflow.generate.mockImplementationOnce(async () => deferred.promise);
    const capture = createCaptureSource();
    render(
      <OutputWorkspaceView
        captureSource={capture.source}
        outputWorkflow={workflow}
      />,
    );
    enterValidInput({ merchantContext: 'In-flight Context' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    await waitFor(() => expect(workflow.generate).toHaveBeenCalledOnce());

    await capture.emit({ kind: 'success', text: 'Next Context' });

    expect(workflow.generate).toHaveBeenCalledWith({
      merchantContext: 'In-flight Context',
      guidance: '',
      model: 'qwen2.5:7b',
    });
    expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
      'value',
      'Next Context',
    );
    expect(screen.getByRole('button', { name: 'Generating…' })).toHaveProperty(
      'disabled',
      true,
    );

    deferred.resolve(createResult('Completed in-flight output'));
    expect(
      await screen.findByDisplayValue('Completed in-flight output'),
    ).toBeTruthy();
  });
});
