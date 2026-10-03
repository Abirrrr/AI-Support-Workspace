import {
  validateAutomaticPasteDiagnosticsResponse,
  type AutomaticPasteDiagnosticsRequest,
} from '../../shared/automatic-paste-diagnostics-messages';

export interface AutomaticPasteDiagnosticsDownloadPort {
  download(serialized: string, filename: string): Promise<void>;
}

export interface AutomaticPasteDiagnosticsRuntime {
  sendMessage(message: AutomaticPasteDiagnosticsRequest): Promise<unknown>;
}

export interface AutomaticPasteDiagnosticsApplication {
  loadEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<boolean>;
  exportDiagnostics(): Promise<void>;
  clearDiagnostics(): Promise<void>;
}

export function createAutomaticPasteDiagnosticsFilename(
  exportedAt: string,
): string {
  const withoutMilliseconds = exportedAt.replace(/\.\d{3}Z$/, 'Z');
  return `ai-support-workspace-automatic-paste-diagnostics-${withoutMilliseconds.replaceAll(':', '-')}.json`;
}

export class RuntimeAutomaticPasteDiagnosticsApplication implements AutomaticPasteDiagnosticsApplication {
  constructor(
    private readonly runtime: AutomaticPasteDiagnosticsRuntime,
    private readonly downloadPort: AutomaticPasteDiagnosticsDownloadPort,
  ) {}

  async loadEnabled(): Promise<boolean> {
    const response = validateAutomaticPasteDiagnosticsResponse(
      await this.runtime.sendMessage({
        type: 'automatic-paste-diagnostics-get-state',
      }),
    );
    if (response.type !== 'automatic-paste-diagnostics-state') {
      throw new TypeError('Unexpected Automatic Paste diagnostics response.');
    }
    return response.enabled;
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    const response = validateAutomaticPasteDiagnosticsResponse(
      await this.runtime.sendMessage({
        type: 'automatic-paste-diagnostics-set-enabled',
        enabled,
      }),
    );
    if (response.type !== 'automatic-paste-diagnostics-state') {
      throw new TypeError('Unexpected Automatic Paste diagnostics response.');
    }
    return response.enabled;
  }

  async exportDiagnostics(): Promise<void> {
    const response = validateAutomaticPasteDiagnosticsResponse(
      await this.runtime.sendMessage({
        type: 'automatic-paste-diagnostics-export',
      }),
    );
    if (response.type !== 'automatic-paste-diagnostics-export-result') {
      throw new TypeError('Unexpected Automatic Paste diagnostics response.');
    }
    await this.downloadPort.download(
      JSON.stringify(response.export, null, 2),
      createAutomaticPasteDiagnosticsFilename(response.export.exportedAt),
    );
  }

  async clearDiagnostics(): Promise<void> {
    const response = validateAutomaticPasteDiagnosticsResponse(
      await this.runtime.sendMessage({
        type: 'automatic-paste-diagnostics-clear',
      }),
    );
    if (response.type !== 'automatic-paste-diagnostics-cleared') {
      throw new TypeError('Unexpected Automatic Paste diagnostics response.');
    }
  }
}
