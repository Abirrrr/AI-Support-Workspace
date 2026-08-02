import {
  isSelectionCaptureResult,
  type SelectionCaptureResult,
} from '../../shared/selection-capture';

export const CAPTURE_SELECTION_COMMAND = 'capture-selection-to-workspace';

export interface WorkspaceCaptureReadyMessage {
  readonly type: 'workspace-capture-ready';
}

export interface WorkspaceCaptureDeliveryMessage {
  readonly type: 'workspace-capture-delivery';
  readonly deliveryId: number;
  readonly result: SelectionCaptureResult;
}

export interface WorkspaceCaptureAcknowledgement {
  readonly type: 'workspace-capture-acknowledgement';
  readonly deliveryId: number;
}

export const WORKSPACE_CAPTURE_READY: WorkspaceCaptureReadyMessage = {
  type: 'workspace-capture-ready',
};

export function isWorkspaceCaptureReadyMessage(
  value: unknown,
): value is WorkspaceCaptureReadyMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'workspace-capture-ready'
  );
}

export function isWorkspaceCaptureDeliveryMessage(
  value: unknown,
): value is WorkspaceCaptureDeliveryMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'workspace-capture-delivery' &&
    'deliveryId' in value &&
    typeof value.deliveryId === 'number' &&
    Number.isInteger(value.deliveryId) &&
    value.deliveryId > 0 &&
    'result' in value &&
    isSelectionCaptureResult(value.result)
  );
}

export function isWorkspaceCaptureAcknowledgement(
  value: unknown,
): value is WorkspaceCaptureAcknowledgement {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'workspace-capture-acknowledgement' &&
    'deliveryId' in value &&
    typeof value.deliveryId === 'number' &&
    Number.isInteger(value.deliveryId) &&
    value.deliveryId > 0
  );
}
