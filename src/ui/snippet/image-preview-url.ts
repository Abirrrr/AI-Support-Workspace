export interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export class ImagePreviewUrl {
  private current: string | undefined;

  constructor(private readonly api: ObjectUrlApi) {}

  replace(blob: Blob): string {
    this.clear();
    this.current = this.api.createObjectURL(blob);
    return this.current;
  }

  clear(): void {
    if (this.current === undefined) return;
    this.api.revokeObjectURL(this.current);
    this.current = undefined;
  }
}
