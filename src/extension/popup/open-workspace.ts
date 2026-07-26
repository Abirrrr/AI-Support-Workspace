interface ChromeSidePanelApi {
  readonly sidePanel: {
    open(options: { windowId: number }): Promise<void>;
  };
  readonly windows: {
    readonly WINDOW_ID_CURRENT: number;
  };
}

function getChromeSidePanelApi(): ChromeSidePanelApi | undefined {
  return (
    globalThis as typeof globalThis & {
      chrome?: ChromeSidePanelApi;
    }
  ).chrome;
}

export function openWorkspaceSidePanel(): Promise<void> {
  const chromeApi = getChromeSidePanelApi();

  if (chromeApi === undefined) {
    return Promise.reject(new Error('Chrome Side Panel API is unavailable.'));
  }

  return chromeApi.sidePanel.open({
    windowId: chromeApi.windows.WINDOW_ID_CURRENT,
  });
}
