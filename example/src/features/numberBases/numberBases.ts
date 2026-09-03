import { wordlist as bip39English } from '../../../../entropylab/src/js/bip39-english';
import type { WordCount } from '../dice/dice';

export const NUMBER_BASE_FORMATS = [
  'bin',
  'base4',
  'base8',
  'hex',
  'base32',
  'base64',
] as const;

export type NumberBaseFormat = (typeof NUMBER_BASE_FORMATS)[number];

type NumberBaseDefinition = {
  readonly alphabet: string;
  readonly binaryRemainder?: boolean;
  readonly bitsPerDigit: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly unit: string;
};

export type NumberBaseFormatConfig = NumberBaseDefinition & {
  readonly bits: number;
  readonly bytes: number;
  readonly digits: number;
  readonly finalCharacters: string;
  readonly fullDigits: number;
  readonly remainderBits: number;
};

export type NumberBaseInputAnalysis = {
  readonly bits: string;
  readonly config: NumberBaseFormatConfig;
  readonly digitCount: number;
  readonly excessDigitCount: number;
  readonly finalInvalid: boolean;
  readonly invalidCharacterCount: number;
  readonly isReady: boolean;
};

const ENTROPY_BITS: Record<WordCount, number> = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
};

const FORMAT_DEFINITIONS: Record<NumberBaseFormat, NumberBaseDefinition> = {
  base4: {
    alphabet: '0123',
    bitsPerDigit: 2,
    label: 'Base 4',
    shortLabel: 'Base 4',
    unit: 'base-4 digits',
  },
  base8: {
    alphabet: '01234567',
    bitsPerDigit: 3,
    label: 'Octal (Base 8)',
    shortLabel: 'Octal',
    unit: 'octal digits',
  },
  base32: {
    alphabet: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
    binaryRemainder: true,
    bitsPerDigit: 5,
    label: 'Crockford Base32',
    shortLabel: 'Base32',
    unit: 'characters',
  },
  base64: {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    binaryRemainder: true,
    bitsPerDigit: 6,
    label: 'Base64 (RFC 4648 alphabet)',
    shortLabel: 'Base64',
    unit: 'characters',
  },
  bin: {
    alphabet: '01',
    bitsPerDigit: 1,
    label: 'Binary (Base 2)',
    shortLabel: 'Binary',
    unit: 'binary digits',
  },
  hex: {
    alphabet: '0123456789ABCDEF',
    bitsPerDigit: 4,
    label: 'Hexadecimal (Base 16)',
    shortLabel: 'Hexadecimal',
    unit: 'hexadecimal characters',
  },
};

export function numberBaseFormatConfig(
  format: NumberBaseFormat,
  wordCount: WordCount,
): NumberBaseFormatConfig {
  const definition = FORMAT_DEFINITIONS[format];
  const bits = ENTROPY_BITS[wordCount];
  const fullDigits = Math.floor(bits / definition.bitsPerDigit);
  const remainderBits = bits % definition.bitsPerDigit;
  const digits = fullDigits + (remainderBits ? definition.binaryRemainder ? remainderBits : 1 : 0);
  const finalCharacters = remainderBits
    ? definition.binaryRemainder
      ? '01'
      : definition.alphabet.slice(0, 2 ** remainderBits)
    : definition.alphabet;

  return {
    ...definition,
    bits,
    bytes: bits / 8,
    digits,
    finalCharacters,
    fullDigits,
    remainderBits,
  };
}

function normalizeCharacter(character: string, format: NumberBaseFormat): string {
  if (format === 'base64') {
    return character;
  }

  const normalized = character.toUpperCase();
  if (format === 'base32') {
    if (normalized === 'O') {
      return '0';
    }
    if (normalized === 'I' || normalized === 'L') {
      return '1';
    }
  }
  return normalized;
}

function digitsToBits(digits: readonly string[], config: NumberBaseFormatConfig): string {
  return digits
    .slice(0, config.digits)
    .map((digit, index) => {
      if (config.binaryRemainder && index >= config.fullDigits) {
        return digit;
      }

      const width =
        config.remainderBits && index === config.digits - 1
          ? config.remainderBits
          : config.bitsPerDigit;
      return config.alphabet.indexOf(digit).toString(2).padStart(width, '0');
    })
    .join('')
    .slice(0, config.bits);
}

export function analyzeNumberBaseInput(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): NumberBaseInputAnalysis {
  const config = numberBaseFormatConfig(format, wordCount);
  const digits: string[] = [];
  let invalidCharacterCount = 0;

  for (const character of value) {
    if (/\s/u.test(character)) {
      continue;
    }

    const normalized = normalizeCharacter(character, format);
    if (config.alphabet.includes(normalized)) {
      digits.push(normalized);
    } else {
      invalidCharacterCount += 1;
    }
  }

  const finalDigits = config.binaryRemainder
    ? digits.slice(config.fullDigits, config.digits)
    : digits.slice(config.digits - 1, config.digits);
  const finalInvalid =
    config.remainderBits > 0 &&
    finalDigits.some(digit => !config.finalCharacters.includes(digit));
  const excessDigitCount = Math.max(0, digits.length - config.digits);

  return {
    bits: digitsToBits(digits, config),
    config,
    digitCount: digits.length,
    excessDigitCount,
    finalInvalid,
    invalidCharacterCount,
    isReady:
      digits.length === config.digits &&
      invalidCharacterCount === 0 &&
      excessDigitCount === 0 &&
      !finalInvalid,
  };
}

export function numberBaseEntropy(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): ArrayBuffer | null {
  const analysis = analyzeNumberBaseInput(value, format, wordCount);
  if (!analysis.isReady) {
    return null;
  }

  const bytes = new Uint8Array(analysis.config.bytes);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(analysis.bits.slice(index * 8, index * 8 + 8), 2);
  }
  return bytes.buffer;
}

export function numberBasePreviewWords(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): string[] {
  const analysis = analyzeNumberBaseInput(value, format, wordCount);
  if (
    analysis.digitCount === 0 ||
    analysis.invalidCharacterCount > 0 ||
    analysis.finalInvalid
  ) {
    return [];
  }

  const completeWordCount = Math.min(wordCount - 1, Math.floor(analysis.bits.length / 11));
  return Array.from({ length: completeWordCount }, (_, index) => {
    const wordIndex = Number.parseInt(analysis.bits.slice(index * 11, index * 11 + 11), 2);
    return bip39English[wordIndex];
  });
}