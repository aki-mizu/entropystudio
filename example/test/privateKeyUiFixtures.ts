import type { PrivateKeyInputState } from '../src/native/entropyStudio';

type PrivateKeyUiMockSetters = {
  readonly setPrivateKeyEntropy: (
    implementation: (value: string, format: number) => ArrayBuffer,
  ) => void;
  readonly setPrivateKeyKeyAllowed: (
    implementation: (
      value: string,
      selectionStart: number,
      selectionEnd: number,
      character: string,
      format: number,
    ) => boolean,
  ) => void;
  readonly setPrivateKeyInputState: (
    implementation: (value: string, format: number) => PrivateKeyInputState,
  ) => void;
};

const WIF = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';
const ENTROPY = new Uint8Array(32).buffer;

const PRIVATE_KEY_FIXTURES: Record<string, { readonly entropy?: ArrayBuffer; readonly tag?: string }> = {
  [`0:${WIF}`]: { entropy: ENTROPY },
  '0:5': { tag: 'InvalidWifPrivateKey' },
  '0:not-a-wif': { tag: 'InvalidWifPrivateKey' },
  '1:0': { tag: 'InvalidHexPrivateKey' },
  '1:A': { tag: 'InvalidHexPrivateKey' },
  '2:S': { tag: 'InvalidMiniPrivateKeyFormat' },
  '3:brain wallet text': { entropy: ENTROPY },
};

const PRIVATE_KEY_KEY_ALLOWED_FIXTURES: Record<string, boolean> = {
  '0::0:0:5': true,
  '0::0:0:K': true,
  '0::0:0:L': true,
  '0:5:1:1:1': true,
  '1::0:0:A': true,
  '1:A:0:1:0': true,
  '2::0:0:S': true,
  '2:S:1:1:A': true,
  '3::0:0: ': true,
};

const PRIVATE_KEY_INPUT_STATE_FIXTURES: Record<string, PrivateKeyInputState> = {
  '0:': {
    canDerive: false,
    enteredCount: 0,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 52,
    minimumCount: 51,
    remainingCount: 0,
    requiredCount: 0,
    status: 1,
  },
  '0:5': {
    canDerive: false,
    enteredCount: 1,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 52,
    minimumCount: 51,
    remainingCount: 50,
    requiredCount: 51,
    status: 2,
  },
  [`0:${WIF}`]: {
    canDerive: true,
    enteredCount: 52,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 52,
    minimumCount: 51,
    remainingCount: 0,
    requiredCount: 52,
    status: 5,
  },
  '0:not-a-wif': {
    canDerive: false,
    enteredCount: 9,
    excessCount: 0,
    invalidCharacterCount: 3,
    maximumCount: 52,
    minimumCount: 51,
    remainingCount: 0,
    requiredCount: 0,
    status: 3,
  },
  '1:': {
    canDerive: false,
    enteredCount: 0,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 64,
    minimumCount: 64,
    remainingCount: 64,
    requiredCount: 64,
    status: 2,
  },
  '1:0': {
    canDerive: false,
    enteredCount: 1,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 64,
    minimumCount: 64,
    remainingCount: 63,
    requiredCount: 64,
    status: 2,
  },
  '1:A': {
    canDerive: false,
    enteredCount: 1,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 64,
    minimumCount: 64,
    remainingCount: 63,
    requiredCount: 64,
    status: 2,
  },
  '2:': {
    canDerive: false,
    enteredCount: 0,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 30,
    minimumCount: 22,
    remainingCount: 22,
    requiredCount: 22,
    status: 1,
  },
  '2:S': {
    canDerive: false,
    enteredCount: 1,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 30,
    minimumCount: 22,
    remainingCount: 21,
    requiredCount: 22,
    status: 2,
  },
  '3:': {
    canDerive: false,
    enteredCount: 0,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 0,
    minimumCount: 0,
    remainingCount: 0,
    requiredCount: 0,
    status: 0,
  },
  '3:brain wallet text': {
    canDerive: true,
    enteredCount: 17,
    excessCount: 0,
    invalidCharacterCount: 0,
    maximumCount: 0,
    minimumCount: 0,
    remainingCount: 0,
    requiredCount: 0,
    status: 5,
  },
};

export function installPrivateKeyUiFixtures({
  setPrivateKeyEntropy,
  setPrivateKeyInputState,
  setPrivateKeyKeyAllowed,
}: PrivateKeyUiMockSetters) {
  setPrivateKeyEntropy((value, format) => {
    const fixture = PRIVATE_KEY_FIXTURES[`${format}:${value}`];
    if (!fixture) {
      throw new Error('Missing static private-key fixture');
    }
    if (fixture.tag) {
      throw { tag: fixture.tag };
    }
    return fixture.entropy!;
  });
  setPrivateKeyInputState((value, format) => {
    const fixture = PRIVATE_KEY_INPUT_STATE_FIXTURES[`${format}:${value}`];
    if (!fixture) {
      throw new Error('Missing static private-key input-state fixture');
    }
    return fixture;
  });
  setPrivateKeyKeyAllowed((value, selectionStart, selectionEnd, character, format) => {
    return PRIVATE_KEY_KEY_ALLOWED_FIXTURES[
      `${format}:${value}:${selectionStart}:${selectionEnd}:${character}`
    ] ?? false;
  });
}