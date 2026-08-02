import type { SelectionCaptureResult } from '../../shared/selection-capture';

export type WorkspaceCaptureHandler = (
  result: SelectionCaptureResult,
) => void | Promise<void>;

export interface WorkspaceCaptureSource {
  subscribe(handler: WorkspaceCaptureHandler): () => void;
}
