import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';
import { UPSTREAM_UI_FALLBACK_COPY } from '../upstreamUiCopy';
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
export const BRAIN_WALLET_OUTPUTS = ['scalar', 'hd'] as const;
export const BRAIN_WALLET_WARNING_COPY = UPSTREAM_UI_FALLBACK_COPY.brainWallet.warning;

export type PrivateKeyInputFormat = (typeof PRIVATE_KEY_FORMATS)[number];
export type PrivateKeyInputState = NativePrivateKeyInputState;
export type BrainWalletOutput = (typeof BRAIN_WALLET_OUTPUTS)[number];

type InputSelection = { readonly end: number; readonly start: number };

const BRAIN_WALLET_EN_JSON_KEYS = {
  acknowledgement: 'beta.understand',
  format: {
    description: 'key.brainDesc',
    placeholder: 'key.placeholderBrain',
    title: 'key.brain',
  },
} as const;

const PRIVATE_KEY_EN_JSON_KEYS = {
  brain: BRAIN_WALLET_EN_JSON_KEYS.format,
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
  const keys = PRIVATE_KEY_EN_JSON_KEYS[format];
  return {
    description: entropyLabEnglish[keys.description],
    placeholder: entropyLabEnglish[keys.placeholder],
    title: entropyLabEnglish[keys.title],
  };
}

export function brainWalletLocaleCopy() {
  const keys = BRAIN_WALLET_EN_JSON_KEYS;
  return {
    acknowledgement: entropyLabEnglish[keys.acknowledgement],
    label: entropyLabEnglish[keys.format.title],
  };
}

export function brainWalletOutputCopy(output: BrainWalletOutput) {
  return UPSTREAM_UI_FALLBACK_COPY.brainWallet.outputs[output];
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
  const { progress } = UPSTREAM_UI_FALLBACK_COPY.privateKey;

  switch (format) {
    case 'wif':
      if (state.canDerive) {
        return progress.wif.ready(state.enteredCount, state.requiredCount);
      }
      if (state.requiredCount === 0) {
        return progress.wif.prefix(state.enteredCount, state.minimumCount, state.maximumCount);
      }
      if (state.excessCount > 0) {
        return progress.wif.excess(state.enteredCount, state.requiredCount);
      }
      return progress.wif.remaining(state.enteredCount, state.requiredCount, state.remainingCount);
    case 'hex':
      if (state.canDerive) {
        return progress.hex.ready(state.enteredCount, state.requiredCount);
      }
      if (state.excessCount > 0) {
        return progress.hex.excess(state.enteredCount, state.requiredCount);
      }
      return progress.hex.remaining(state.enteredCount, state.requiredCount, state.remainingCount);
    case 'mini':
      if (state.canDerive) {
        return progress.mini.ready(state.enteredCount, state.requiredCount);
      }
      if (state.status === PrivateKeyInputStatus.Prefix) {
        return progress.mini.prefix(state.minimumCount, state.maximumCount);
      }
      if (state.excessCount > 0) {
        return progress.mini.excess(state.enteredCount, state.maximumCount);
      }
      return progress.mini.remaining(state.enteredCount, state.requiredCount, state.remainingCount);
    case 'brain':
      return state.status === PrivateKeyInputStatus.Empty
        ? progress.brain.empty()
        : progress.brain.entered();
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