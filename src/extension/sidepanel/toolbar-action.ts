export interface SidePanelActionApi {
  setPanelBehavior(options: {
    readonly openPanelOnActionClick: true;
  }): Promise<void>;
}

export async function enableToolbarSidePanelAction(
  sidePanel: SidePanelActionApi | undefined,
): Promise<void> {
  if (sidePanel === undefined) return;
  await sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}
