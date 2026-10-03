import type { AutomaticPasteDiagnosticsRepository } from '../persistence/automatic-paste-diagnostics-repository';
import {
  validateAutomaticPasteDiagnosticExportV1,
  validateAutomaticPasteDiagnosticRecordV1,
  type AutomaticPasteDiagnosticFailureCodeV1,
  type AutomaticPasteDiagnosticRecordV1,
  type AutomaticPasteDiagnosticsExportV1,
} from '../../domain/automatic-paste-diagnostics';

export const AUTOMATIC_PASTE_DIAGNOSTIC_RETENTION_MS =
  30 * 24 * 60 * 60 * 1_000;
export const AUTOMATIC_PASTE_DIAGNOSTIC_MAX_RECORDS = 2_000;

export type AutomaticPasteDiagnosticTerminalInput = Omit<
  AutomaticPasteDiagnosticRecordV1,
  'schemaVersion' | 'id' | 'occurredAt' | 'requestId'
>;

export function readAutomaticPasteDiagnosticClock(
  now: () => number,
): number | undefined {
  try {
    const value = now();
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function compareRecords(
  left: AutomaticPasteDiagnosticRecordV1,
  right: AutomaticPasteDiagnosticRecordV1,
): number {
  return (
    left.occurredAt.localeCompare(right.occurredAt) ||
    left.id.localeCompare(right.id)
  );
}

function cutoffFor(date: Date): string {
  return new Date(
    date.getTime() - AUTOMATIC_PASTE_DIAGNOSTIC_RETENTION_MS,
  ).toISOString();
}

export function mapSnippetDeliveryFailureCodeToDiagnosticV1(
  value: unknown,
): AutomaticPasteDiagnosticFailureCodeV1 | null {
  switch (value) {
    case 'snippet-unavailable':
    case 'stale-trigger':
    case 'unsupported-content':
    case 'asset-unavailable':
    case 'asset-ownership-invalid':
    case 'asset-invalid':
    case 'permission-required':
    case 'offscreen-create-failed':
    case 'offscreen-message-failed':
    case 'invalid-offscreen-response':
    case 'clipboard-write-failed':
    case 'clipboard-copy-event-unavailable':
    case 'clipboard-copy-command-failed':
    case 'clipboard-copy-data-failed':
    case 'image-invalid':
    case 'image-decode-failed':
    case 'image-too-large':
    case 'animated-webp':
    case 'native-permission-required':
    case 'host-unavailable':
    case 'host-version-mismatch':
    case 'invalid-host-response':
    case 'native-delivery-busy':
    case 'automatic-delivery-busy':
    case 'stale-catalog':
    case 'unexpected-delivery-failure':
      return value;
    default:
      return null;
  }
}

export class AutomaticPasteDiagnosticsService {
  private enabled = false;
  private stateRevision = 0;

  constructor(
    private readonly repository: AutomaticPasteDiagnosticsRepository,
    private readonly clock: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  isRecordingEnabled(): boolean {
    return this.enabled;
  }

  async initialize(): Promise<void> {
    const revision = this.stateRevision;
    try {
      const enabled = await this.repository.isEnabled();
      if (this.stateRevision === revision) this.enabled = enabled;
    } catch {
      if (this.stateRevision === revision) this.enabled = false;
    }
    try {
      await this.repository.pruneAndList(cutoffFor(this.clock()));
    } catch {
      // Initialization pruning is best effort and creates no worker keepalive.
    }
  }

  async loadEnabled(): Promise<boolean> {
    const revision = ++this.stateRevision;
    try {
      const enabled = await this.repository.isEnabled();
      if (this.stateRevision === revision) this.enabled = enabled;
      return enabled;
    } catch (error) {
      if (this.stateRevision === revision) this.enabled = false;
      throw error;
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    const revision = ++this.stateRevision;
    await this.repository.setEnabled(enabled);
    if (this.stateRevision === revision) this.enabled = enabled;
    if (enabled) {
      try {
        await this.repository.pruneAndList(cutoffFor(this.clock()));
      } catch {
        // Enablement succeeds independently of best-effort retention pruning.
      }
    }
  }

  recordEligibleTerminal(input: AutomaticPasteDiagnosticTerminalInput): void {
    // The coordinator freezes eligibility at receipt; Disable gates new receipts.
    try {
      const occurredAt = this.clock();
      const record = validateAutomaticPasteDiagnosticRecordV1({
        schemaVersion: 1,
        id: this.createId(),
        occurredAt: occurredAt.toISOString(),
        requestId: this.createId(),
        ...input,
      });
      void this.repository
        .appendAndPrune(record, cutoffFor(occurredAt))
        .catch(() => undefined);
    } catch {
      // Construction and persistence are observational and fail by undercounting.
    }
  }

  async createExport(): Promise<AutomaticPasteDiagnosticsExportV1> {
    const exportedAt = this.clock();
    const retainFromInclusive = cutoffFor(exportedAt);
    const records = (
      await this.repository.pruneAndList(retainFromInclusive)
    ).map(validateAutomaticPasteDiagnosticRecordV1);
    if (
      records.length > AUTOMATIC_PASTE_DIAGNOSTIC_MAX_RECORDS ||
      records.some((record) => record.occurredAt < retainFromInclusive)
    ) {
      throw new TypeError('Automatic Paste diagnostics snapshot is unbounded.');
    }
    return validateAutomaticPasteDiagnosticExportV1({
      format: 'ai-support-workspace-automatic-paste-diagnostics',
      formatVersion: 1,
      exportedAt: exportedAt.toISOString(),
      records: [...records].sort(compareRecords),
    });
  }

  clearRecords(): Promise<void> {
    return this.repository.clearRecords();
  }
}
