import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';
import {
  EntropyStudioError_Tags,
  PrivateKeyFormat,
  PrivateKeyInputStatus,
  privateKeyEntropy as nativePrivateKeyEntropy,
  privateKeyInputState as nativePrivateKeyInputState,
  privateKeyKeyAllowed as nativePrivateKeyKeyAllowed,
} from '../../native/entropyStudio';
import type { PrivateKeyInputState as NativePrivateKeyInputState } from '../../native/entropyStudio';

export const PRIVATE_KEY_FORMATS = ['wif', 'hex', 'mini', 'brain'] as const;

export type PrivateKeyInputFormat = (typeof PRIVATE_KEY_FORMATS)[number];
export type PrivateKeyInputState = NativePrivateKeyInputState;

type InputSelection = { readonly end: number; readonly start: number };

const PRIVATE_KEY_COPY_KEYS = {
  brain: {
    description: 'key.brainDesc',
    placeholder: 'key.placeholderBrain',
    title: 'key.brain',
  },
  hex: {
    description: 'key.hexDesc',
    placeholder: 'key.placeholderHex',
    title: 'key.hex',
  },
  mini: {
    description: 'key.miniDesc',
    placeholder: 'key.placeholderMini',
    title: 'key.mini',
  },
  wif: {
    description: 'key.wifDesc',
    placeholder: 'key.placeholderWif',
    title: 'key.wif',
  },
} as const;

export function privateKeyFormatCopy(format: PrivateKeyInputFormat) {
  const keys = PRIVATE_KEY_COPY_KEYS[format];
  return {
    description: entropyLabEnglish[keys.description],
    placeholder: entropyLabEnglish[keys.placeholder],
    title: entropyLabEnglish[keys.title],
  };
}

export function privateKeyEntropy(value: string, format: PrivateKeyInputFormat): ArrayBuffer {
  return nativePrivateKeyEntropy(value, nativePrivateKeyFormat(format));
}

export function privateKeyInputState(
  value: string,
  format: PrivateKeyInputFormat,
): PrivateKeyInputState {
  return nativePrivateKeyInputState(value, nativePrivateKeyFormat(format));
}

export function privateKeyKeyAllowed(
  value: string,
  selection: InputSelection,
  character: string,
  format: PrivateKeyInputFormat,
): boolean {
  return nativePrivateKeyKeyAllowed(
    value,
    selection.start,
    selection.end,
    character,
    nativePrivateKeyFormat(format),
  );
}

export function privateKeyInputHasError(state: PrivateKeyInputState): boolean {
  return (
    state.status === PrivateKeyInputStatus.Invalid || state.status === PrivateKeyInputStatus.Excess
  );
}

export function privateKeyProgressText(
  state: PrivateKeyInputState,
  format: PrivateKeyInputFormat,
): string {
  switch (format) {
    case 'wif':
      if (state.canDerive) {
        return `${state.enteredCount} of ${state.requiredCount} WIF characters entered · Bitcoin mainnet checksum valid · ready to derive`;
      }
      if (state.requiredCount === 0) {
        return `${state.enteredCount} of ${state.minimumCount} or ${state.maximumCount} WIF characters entered · starts with 5, K, or L`;
      }
      if (state.excessCount > 0) {
        return `${state.enteredCount} WIF characters entered · ${state.requiredCount} required`;
      }
      return `${state.enteredCount} of ${state.requiredCount} WIF characters entered · ${state.remainingCount} remaining`;
    case 'hex':
      if (state.canDerive) {
        return `${state.enteredCount} of ${state.requiredCount} hexadecimal characters entered · valid secp256k1 private key · ready to derive`;
      }
      if (state.excessCount > 0) {
        return `${state.enteredCount} hexadecimal characters entered · ${state.requiredCount} required`;
      }
      return `${state.enteredCount} of ${state.requiredCount} hexadecimal characters entered · ${state.remainingCount} remaining`;
    case 'mini':
      if (state.canDerive) {
        return `${state.enteredCount} of ${state.requiredCount} Mini-key characters entered · checksum valid · ready to derive`;
      }
      if (state.status === PrivateKeyInputStatus.Prefix) {
        return `0 of ${state.minimumCount} or ${state.maximumCount} Mini-key characters entered · must start with S`;
      }
      if (state.excessCount > 0) {
        return `${state.enteredCount} Mini-key characters entered · ${state.maximumCount} maximum`;
      }
      return `${state.enteredCount} of ${state.requiredCount} Mini-key characters entered · ${state.remainingCount} remaining`;
    case 'brain':
      return state.status === PrivateKeyInputStatus.Empty
        ? 'No text entered · brain wallets are unsafe'
        : 'Text entered · exact text will be used · brain wallets are unsafe';
  }
}

export function privateKeyError(error: unknown): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.EmptyPrivateKey) {
    return entropyLabEnglish['error.priv.enter'];
  }
  if (tag === EntropyStudioError_Tags.InvalidWifPrivateKey) {
    return entropyLabEnglish['error.priv.wif']
      .replace('{network}', 'Bitcoin mainnet')
      .replace('{hint}', '5/K/L');
  }
  if (tag === EntropyStudioError_Tags.InvalidHexPrivateKey) {
    return entropyLabEnglish['error.priv.hex'];
  }
  if (tag === EntropyStudioError_Tags.InvalidMiniPrivateKeyFormat) {
    return entropyLabEnglish['error.priv.miniFormat'];
  }
  if (tag === EntropyStudioError_Tags.InvalidMiniPrivateKey) {
    return entropyLabEnglish['error.priv.miniInvalid'];
  }
  if (tag === EntropyStudioError_Tags.InvalidPrivateKeyRange) {
    return entropyLabEnglish['error.priv.range'];
  }
  if (tag === EntropyStudioError_Tags.EmptyBrainWallet) {
    return entropyLabEnglish['error.priv.brainEmpty'];
  }
  return entropyLabEnglish['error.generic'];
}

function nativePrivateKeyFormat(format: PrivateKeyInputFormat) {
  switch (format) {
    case 'wif':
      return PrivateKeyFormat.Wif;
    case 'hex':
      return PrivateKeyFormat.Hex;
    case 'mini':
      return PrivateKeyFormat.MiniKey;
    case 'brain':
      return PrivateKeyFormat.BrainWallet;
  }
}