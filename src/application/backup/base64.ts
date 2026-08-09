export class InvalidBase64Error extends Error {
  constructor() {
    super('Expected canonical RFC 4648 base64 data.');
    this.name = 'InvalidBase64Error';
  }
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

export function decodeCanonicalBase64(value: string): Uint8Array {
  if (
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    throw new InvalidBase64Error();
  }
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new InvalidBase64Error();
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (encodeBase64(bytes) !== value) {
    throw new InvalidBase64Error();
  }
  return bytes;
}

export async function encodeBlobBase64(blob: Blob): Promise<string> {
  return encodeBase64(new Uint8Array(await blob.arrayBuffer()));
}
