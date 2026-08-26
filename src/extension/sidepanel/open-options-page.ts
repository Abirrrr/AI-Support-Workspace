export interface OptionsPageRuntime {
  openOptionsPage(): Promise<void>;
}

export function createOpenOptionsPage(
  runtime: OptionsPageRuntime | undefined,
): () => Promise<void> {
  return async () => {
    if (runtime === undefined)
      throw new Error('Options navigation unavailable.');
    await runtime.openOptionsPage();
  };
}
