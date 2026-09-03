import {
  NumberBaseFormat as NativeNumberBaseFormat,
  analyzeNumberBaseInput as nativeAnalyzeNumberBaseInput,
  numberBaseEntropy as nativeNumberBaseEntropy,
} from '../../native/entropyStudio';
import type { NumberBaseAnalysis as NativeNumberBaseAnalysis } from '../../native/entropyStudio';
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
  readonly label: string;
  readonly shortLabel: string;
  readonly unit: string;
};

export type NumberBaseFormatConfig = NumberBaseDefinition & {
  readonly alphabet: string;
  readonly binaryRemainder: boolean;
  readonly bitsPerDigit: number;
  readonly bits: number;
  readonly bytes: number;
  readonly digits: number;
  readonly finalCharacters: string;
  readonly fullDigits: number;
  readonly remainderBits: number;
};

export type NumberBaseInputAnalysis = {
  readonly config: NumberBaseFormatConfig;
  readonly digitCount: number;
  readonly excessDigitCount: number;
  readonly finalInvalid: boolean;
  readonly invalidCharacterCount: number;
  readonly isReady: boolean;
  readonly previewWords: readonly string[];
};

const FORMAT_DEFINITIONS: Record<NumberBaseFormat, NumberBaseDefinition> = {
  base4: {
    label: 'Base 4',
    shortLabel: 'Base 4',
    unit: 'base-4 digits',
  },
  base8: {
    label: 'Octal (Base 8)',
    shortLabel: 'Octal',
    unit: 'octal digits',
  },
  base32: {
    label: 'Crockford Base32',
    shortLabel: 'Base32',
    unit: 'characters',
  },
  base64: {
    label: 'Base64 (RFC 4648 alphabet)',
    shortLabel: 'Base64',
    unit: 'characters',
  },
  bin: {
    label: 'Binary (Base 2)',
    shortLabel: 'Binary',
    unit: 'binary digits',
  },
  hex: {
    label: 'Hexadecimal (Base 16)',
    shortLabel: 'Hexadecimal',
    unit: 'hexadecimal characters',
  },
};

export function numberBaseFormatConfig(
  format: NumberBaseFormat,
  wordCount: WordCount,
): NumberBaseFormatConfig {
  return formatConfig(
    format,
    nativeAnalyzeNumberBaseInput('', nativeFormat(format), wordCount),
  );
}

export function analyzeNumberBaseInput(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): NumberBaseInputAnalysis {
  const analysis = nativeAnalyzeNumberBaseInput(value, nativeFormat(format), wordCount);

  return {
    config: formatConfig(format, analysis),
    digitCount: analysis.digitCount,
    excessDigitCount: analysis.excessDigitCount,
    finalInvalid: analysis.finalInvalid,
    invalidCharacterCount: analysis.invalidCharacterCount,
    isReady: analysis.isReady,
    previewWords: analysis.previewWords,
  };
}

export function numberBaseEntropy(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): ArrayBuffer | null {
  try {
    return nativeNumberBaseEntropy(value, nativeFormat(format), wordCount);
  } catch {
    return null;
  }
}

export function numberBasePreviewWords(
  value: string,
  format: NumberBaseFormat,
  wordCount: WordCount,
): string[] {
  return [...analyzeNumberBaseInput(value, format, wordCount).previewWords];
}

function nativeFormat(format: NumberBaseFormat): NativeNumberBaseFormat {
  switch (format) {
    case 'bin':
      return NativeNumberBaseFormat.Bin;
    case 'base4':
      return NativeNumberBaseFormat.Base4;
    case 'base8':
      return NativeNumberBaseFormat.Base8;
    case 'hex':
      return NativeNumberBaseFormat.Hex;
    case 'base32':
      return NativeNumberBaseFormat.Base32;
    case 'base64':
      return NativeNumberBaseFormat.Base64;
  }
}

function formatConfig(
  format: NumberBaseFormat,
  analysis: NativeNumberBaseAnalysis,
): NumberBaseFormatConfig {
  return {
    ...FORMAT_DEFINITIONS[format],
    alphabet: analysis.alphabet,
    binaryRemainder: analysis.binaryRemainder,
    bits: analysis.entropyBits,
    bitsPerDigit: analysis.bitsPerDigit,
    bytes: analysis.entropyBytes,
    digits: analysis.digits,
    finalCharacters: analysis.finalCharacters,
    fullDigits: analysis.fullDigits,
    remainderBits: analysis.remainderBits,
  };
}