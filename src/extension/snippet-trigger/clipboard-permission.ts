export const CLIPBOARD_DELIVERY_PERMISSIONS = [
  'clipboardWrite',
  'offscreen',
] as const;

export interface ClipboardPermissionApi {
  contains(options: {
    readonly permissions: readonly string[];
  }): Promise<boolean>;
  request(options: {
    readonly permissions: readonly string[];
  }): Promise<boolean>;
}

export interface ClipboardDeliveryPermission {
  isEnabled(): Promise<boolean>;
  requestEnable(): Promise<boolean>;
}

export class ChromeClipboardDeliveryPermission implements ClipboardDeliveryPermission {
  constructor(private readonly permissions: ClipboardPermissionApi) {}

  isEnabled(): Promise<boolean> {
    return this.permissions.contains({
      permissions: CLIPBOARD_DELIVERY_PERMISSIONS,
    });
  }

  requestEnable(): Promise<boolean> {
    return this.permissions.request({
      permissions: CLIPBOARD_DELIVERY_PERMISSIONS,
    });
  }
}
