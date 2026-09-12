import { describe, expect, it } from 'vitest';

import {
  decodeCanonicalBase64,
  encodeBase64,
  InvalidBase64Error,
} from '../../src/application/backup/base64';

function expectExactBytes(actual: Uint8Array, expected: Uint8Array): void {
  expect(actual.byteLength).toBe(expected.byteLength);
  for (let index = 0; index < expected.byteLength; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new Error(`Byte mismatch at index ${index}.`);
    }
  }
}

describe('canonical RFC 4648 base64', () => {
  it.each([
    ['', []],
    ['AA==', [0]],
    ['AQI=', [1, 2]],
    ['AQID', [1, 2, 3]],
    ['////', [255, 255, 255]],
  ] as const)('accepts canonical value %j', (value, expected) => {
    expect(decodeCanonicalBase64(value)).toEqual(Uint8Array.from(expected));
  });

  it.each([
    ['invalid length', 'A'],
    ['truncated quartet', 'AQI'],
    ['invalid alphabet', 'AQI!'],
    ['URL-safe alphabet', 'AA-_'],
    ['leading padding', '=AAA'],
    ['middle padding', 'AA=A'],
    ['excess padding', 'A==='],
    ['padding after a full quartet', 'AAAA===='],
    ['leading whitespace', ' AQI='],
    ['embedded whitespace', 'AQ I'],
    ['trailing newline', 'AQI=\n'],
    ['line-wrapped input', 'AQI=\r\n'],
    ['noncanonical one-byte pad bits', 'AB=='],
    ['noncanonical two-byte pad bits', 'AAB='],
  ])('rejects %s', (_name, value) => {
    expect(() => decodeCanonicalBase64(value)).toThrow(InvalidBase64Error);
  });

  it('round-trips the M14-Q representative decoded size without stack overflow', () => {
    const source = new Uint8Array(4_459_989);
    for (let index = 0; index < source.byteLength; index += 1) {
      source[index] = (index * 31 + (index >>> 8)) & 0xff;
    }
    source.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const encoded = encodeBase64(source);
    expect(encoded).toHaveLength(5_946_652);
    expectExactBytes(decodeCanonicalBase64(encoded), source);
  });
});
