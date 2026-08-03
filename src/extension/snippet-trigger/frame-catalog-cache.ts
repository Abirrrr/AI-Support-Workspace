import {
  isTriggerCatalogInvalidateMessage,
  isTriggerCatalogSnapshotMessage,
  type TriggerCatalogEntry,
} from '../../shared/trigger-catalog-messages';

export class FrameTriggerCatalogCache {
  private connected = false;
  private enabled = false;
  private epoch: string | undefined;
  private revision = -1;
  private entries = new Map<string, TriggerCatalogEntry>();

  get isEnabled(): boolean {
    return this.connected && this.enabled;
  }

  markConnected(): void {
    this.clear(true);
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
    this.clear(true);
  }

  receive(message: unknown): void {
    if (!this.connected) return;

    if (isTriggerCatalogInvalidateMessage(message)) {
      if (
        (this.epoch !== undefined && message.epoch !== this.epoch) ||
        message.revision <= this.revision
      ) {
        this.clear(false);
        return;
      }
      this.epoch = message.epoch;
      this.revision = message.revision;
      this.enabled = false;
      this.entries.clear();
      return;
    }

    if (isTriggerCatalogSnapshotMessage(message)) {
      if (
        (this.epoch !== undefined && message.epoch !== this.epoch) ||
        message.revision < this.revision
      ) {
        this.clear(false);
        return;
      }
      this.epoch = message.epoch;
      this.revision = message.revision;
      this.entries = new Map(
        message.entries.map((entry) => [entry.trigger, { ...entry }]),
      );
      this.enabled = true;
      return;
    }

    this.clear(false);
  }

  find(trigger: string): TriggerCatalogEntry | undefined {
    return this.isEnabled ? this.entries.get(trigger) : undefined;
  }

  private clear(resetVersion: boolean): void {
    this.enabled = false;
    if (resetVersion) {
      this.epoch = undefined;
      this.revision = -1;
    }
    this.entries.clear();
  }
}
