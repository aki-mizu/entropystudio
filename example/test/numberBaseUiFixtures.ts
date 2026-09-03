import type { NumberBaseAnalysis } from '../src/native/entropyStudio';

type NumberBaseUiMockSetters = {
  readonly setAnalyzeNumberBaseInput: (
    implementation: (value: string, format: number, targetWords: number) => NumberBaseAnalysis,
  ) => void;
  readonly setNumberBaseEntropy: (
    implementation: (value: string, format: number, targetWords: number) => ArrayBuffer,
  ) => void;
};

const NUMBER_BASE_EMPTY_ANALYSES: Record<string, NumberBaseAnalysis> = {
  '0:24': {
    alphabet: '01',
    binaryRemainder: false,
    bitsPerDigit: 1,
    digitCount: 0,
    digits: 256,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '01',
    finalInvalid: false,
    fullDigits: 256,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 0,
  },
  '1:24': {
    alphabet: '0123',
    binaryRemainder: false,
    bitsPerDigit: 2,
    digitCount: 0,
    digits: 128,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '0123',
    finalInvalid: false,
    fullDigits: 128,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 0,
  },
  '2:24': {
    alphabet: '01234567',
    binaryRemainder: false,
    bitsPerDigit: 3,
    digitCount: 0,
    digits: 86,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '01',
    finalInvalid: false,
    fullDigits: 85,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 1,
  },
  '3:24': {
    alphabet: '0123456789ABCDEF',
    binaryRemainder: false,
    bitsPerDigit: 4,
    digitCount: 0,
    digits: 64,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '0123456789ABCDEF',
    finalInvalid: false,
    fullDigits: 64,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 0,
  },
  '4:24': {
    alphabet: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
    binaryRemainder: true,
    bitsPerDigit: 5,
    digitCount: 0,
    digits: 52,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '01',
    finalInvalid: false,
    fullDigits: 51,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 1,
  },
  '5:21': {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    binaryRemainder: true,
    bitsPerDigit: 6,
    digitCount: 0,
    digits: 39,
    entropyBits: 224,
    entropyBytes: 28,
    excessDigitCount: 0,
    finalCharacters: '01',
    finalInvalid: false,
    fullDigits: 37,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 2,
  },
  '5:24': {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    binaryRemainder: true,
    bitsPerDigit: 6,
    digitCount: 0,
    digits: 46,
    entropyBits: 256,
    entropyBytes: 32,
    excessDigitCount: 0,
    finalCharacters: '01',
    finalInvalid: false,
    fullDigits: 42,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 4,
  },
  '3:12': {
    alphabet: '0123456789ABCDEF',
    binaryRemainder: false,
    bitsPerDigit: 4,
    digitCount: 0,
    digits: 32,
    entropyBits: 128,
    entropyBytes: 16,
    excessDigitCount: 0,
    finalCharacters: '0123456789ABCDEF',
    finalInvalid: false,
    fullDigits: 32,
    invalidCharacterCount: 0,
    isReady: false,
    previewWords: [],
    remainderBits: 0,
  },
};

const HEX_ZERO_ENTROPY = '0'.repeat(32);
const BASE64_COIN_START = 'A'.repeat(37);
const BASE64_COIN_COMPLETE = `${BASE64_COIN_START}01`;

const NUMBER_BASE_ANALYSES: Record<string, NumberBaseAnalysis> = {
  [`3:12:${HEX_ZERO_ENTROPY}`]: {
    ...NUMBER_BASE_EMPTY_ANALYSES['3:12'],
    digitCount: 32,
    isReady: true,
  },
  [`5:21:${BASE64_COIN_START}`]: {
    ...NUMBER_BASE_EMPTY_ANALYSES['5:21'],
    digitCount: 37,
  },
  [`5:21:${BASE64_COIN_COMPLETE}`]: {
    ...NUMBER_BASE_EMPTY_ANALYSES['5:21'],
    digitCount: 39,
    isReady: true,
  },
};

const ZERO_ENTROPY = new Uint8Array(16).buffer;
const NUMBER_BASE_ENTROPIES: Record<string, ArrayBuffer> = {
  [`3:12:${HEX_ZERO_ENTROPY}`]: ZERO_ENTROPY,
  [`5:21:${BASE64_COIN_COMPLETE}`]: ZERO_ENTROPY,
};

export function installNumberBaseUiFixtures({
  setAnalyzeNumberBaseInput,
  setNumberBaseEntropy,
}: NumberBaseUiMockSetters) {
  setAnalyzeNumberBaseInput(
    (value, format, targetWords) =>
      NUMBER_BASE_ANALYSES[`${format}:${targetWords}:${value}`] ??
      NUMBER_BASE_EMPTY_ANALYSES[`${format}:${targetWords}`] ??
      NUMBER_BASE_EMPTY_ANALYSES['0:24'],
  );
  setNumberBaseEntropy((value, format, targetWords) => {
    const entropy = NUMBER_BASE_ENTROPIES[`${format}:${targetWords}:${value}`];
    if (!entropy) {
      throw new Error('InvalidNumberBaseInput');
    }
    return entropy;
  });
}