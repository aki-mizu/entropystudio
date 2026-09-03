import {
  numberBaseEntropy,
  type NumberBaseFormat,
} from '../src/features/numberBases/numberBases';

export function expectZeroEntropy(format: NumberBaseFormat, input: string) {
  const entropy = numberBaseEntropy(input, format, 12);
  if (!entropy) {
    throw new Error('Expected valid entropy.');
  }

  expect(Array.from(new Uint8Array(entropy))).toEqual(Array(16).fill(0));
}