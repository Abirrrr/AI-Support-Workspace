import type { AutomaticPasteDiagnosticsService } from './automatic-paste-diagnostics';
import {
  isAutomaticPasteDiagnosticsRequest,
  type AutomaticPasteDiagnosticsResponse,
} from '../../shared/automatic-paste-diagnostics-messages';

type MessageListener = (message: unknown) => unknown;

export interface AutomaticPasteDiagnosticsManagementRuntime {
  readonly onMessage: {
    addListener(listener: MessageListener): void;
    removeListener(listener: MessageListener): void;
  };
}

export function registerAutomaticPasteDiagnosticsManagement(
  runtime: AutomaticPasteDiagnosticsManagementRuntime,
  service: AutomaticPasteDiagnosticsService,
): () => void {
  const listener: MessageListener = (message) => {
    if (!isAutomaticPasteDiagnosticsRequest(message)) return undefined;
    switch (message.type) {
      case 'automatic-paste-diagnostics-get-state':
        return service.loadEnabled().then(
          (enabled) =>
            ({
              type: 'automatic-paste-diagnostics-state',
              enabled,
            }) satisfies AutomaticPasteDiagnosticsResponse,
        );
      case 'automatic-paste-diagnostics-set-enabled':
        return service.setEnabled(message.enabled).then(
          () =>
            ({
              type: 'automatic-paste-diagnostics-state',
              enabled: message.enabled,
            }) satisfies AutomaticPasteDiagnosticsResponse,
        );
      case 'automatic-paste-diagnostics-export':
        return service.createExport().then(
          (diagnosticsExport) =>
            ({
              type: 'automatic-paste-diagnostics-export-result',
              export: diagnosticsExport,
            }) satisfies AutomaticPasteDiagnosticsResponse,
        );
      case 'automatic-paste-diagnostics-clear':
        return service.clearRecords().then(
          () =>
            ({
              type: 'automatic-paste-diagnostics-cleared',
            }) satisfies AutomaticPasteDiagnosticsResponse,
        );
    }
  };
  runtime.onMessage.addListener(listener);
  return () => runtime.onMessage.removeListener(listener);
}
