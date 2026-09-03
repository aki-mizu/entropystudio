import {
  analyzeNumberBaseInput,
  numberBaseEntropy,
  numberBaseFormatConfig,
} from '../src/features/numberBases/numberBases';

function entropyBytes(entropy: ArrayBuffer | null): number[] {
  if (!entropy) {
    throw new Error('Expected valid entropy.');
  }
  return Array.from(new Uint8Array(entropy));
}

test('uses the same Number Bases digit counts as EntropyLab', () => {
  expect(numberBaseFormatConfig('hex', 12)).toMatchObject({
    digits: 32,
    finalCharacters: '0123456789ABCDEF',
  });
  expect(numberBaseFormatConfig('base8', 12)).toMatchObject({
    digits: 43,
    finalCharacters: '0123',
    remainderBits: 2,
  });
  expect(numberBaseFormatConfig('base32', 12)).toMatchObject({
    digits: 28,
    fullDigits: 25,
    finalCharacters: '01',
    remainderBits: 3,
  });
  expect(numberBaseFormatConfig('base64', 12)).toMatchObject({
    digits: 23,
    fullDigits: 21,
    finalCharacters: '01',
    remainderBits: 2,
  });
});

test.each([
  ['bin', '0'.repeat(128)],
  ['base4', '0'.repeat(64)],
  ['base8', '0'.repeat(43)],
  ['hex', '0'.repeat(32)],
  ['base32', '0'.repeat(28)],
  ['base64', `${'A'.repeat(21)}00`],
] as const)('converts zero entropy from %s', (format, input) => {
  expect(entropyBytes(numberBaseEntropy(input, format, 12))).toEqual(Array(16).fill(0));
});

test('normalizes Crockford aliases and rejects an invalid final octal digit', () => {
  const aliases = analyzeNumberBaseInput(`${'O'.repeat(25)}000`, 'base32', 12);
  expect(aliases.isReady).toBe(true);
  expect(entropyBytes(numberBaseEntropy(`${'O'.repeat(25)}000`, 'base32', 12))).toEqual(
    Array(16).fill(0),
  );

  const invalidFinal = analyzeNumberBaseInput(`${'0'.repeat(42)}4`, 'base8', 12);
  expect(invalidFinal.finalInvalid).toBe(true);
  expect(invalidFinal.isReady).toBe(false);
  expect(numberBaseEntropy(`${'0'.repeat(42)}4`, 'base8', 12)).toBeNull();
});