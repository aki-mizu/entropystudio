import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_TEXT } from '../upstreamUiCopy';
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

const PRIVATE_KEY_COPY = {
  brain: {
    description: UPSTREAM_TEXT.key.brainDesc,
    placeholder: UPSTREAM_TEXT.key.placeholderBrain,
    title: UPSTREAM_TEXT.key.brain,
  },
  hex: {
    description: UPSTREAM_TEXT.key.hexDesc,
    placeholder: UPSTREAM_TEXT.key.placeholderHex,
    title: UPSTREAM_TEXT.key.hex,
  },
  mini: {
    description: UPSTREAM_TEXT.key.miniDesc,
    placeholder: UPSTREAM_TEXT.key.placeholderMini,
    title: UPSTREAM_TEXT.key.mini,
  },
  wif: {
    description: UPSTREAM_TEXT.key.wifDesc,
    placeholder: UPSTREAM_TEXT.key.placeholderWif,
    title: UPSTREAM_TEXT.key.wif,
  },
} as const;

export function privateKeyFormatCopy(format: PrivateKeyInputFormat) {
  return PRIVATE_KEY_COPY[format];
}

export function brainWalletLocaleCopy() {
  return {
    acknowledgement: UPSTREAM_TEXT.beta.understand,
    label: PRIVATE_KEY_COPY.brain.title,
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
    return UPSTREAM_TEXT.error.priv.enter;
  }
  if (tag === EntropyStudioError_Tags.InvalidWifPrivateKey) {
    return UPSTREAM_TEXT.error.priv.wif
      .replace('{network}', 'Bitcoin mainnet')
      .replace('{hint}', '5/K/L');
  }
  if (tag === EntropyStudioError_Tags.InvalidHexPrivateKey) {
    return UPSTREAM_TEXT.error.priv.hex;
  }
  if (tag === EntropyStudioError_Tags.InvalidMiniPrivateKeyFormat) {
    return UPSTREAM_TEXT.error.priv.miniFormat;
  }
  if (tag === EntropyStudioError_Tags.InvalidMiniPrivateKey) {
    return UPSTREAM_TEXT.error.priv.miniInvalid;
  }
  if (tag === EntropyStudioError_Tags.InvalidPrivateKeyRange) {
    return UPSTREAM_TEXT.error.priv.range;
  }
  if (tag === EntropyStudioError_Tags.EmptyBrainWallet) {
    return UPSTREAM_TEXT.error.priv.brainEmpty;
  }
  return UPSTREAM_TEXT.error.generic;
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