import {
  DiceFinalStep,
  DiceInputMethod,
  DiceRollMethod,
  DirectDiceMethod,
  DirectDiceStep,
  diceMethodInfo as nativeDiceMethodInfo,
  directDiceInputState as nativeDirectDiceInputState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  formatDiceTranscript as nativeFormatDiceTranscript,
  hashedDiceState as nativeHashedDiceState,
  mnemonicToEntropy,
  mnemonicToSeed,
} from '../../native/entropyStudio';
import type {
  DiceMethodInfo,
  DirectDiceState,
  HashedDiceState,
} from '../../native/entropyStudio';
import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_TEXT } from '../upstreamUiCopy';

export const DICE_FACES = ['1', '2', '3', '4', '5', '6'] as const;
export const D8_D16_FACES = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
] as const;
export const HASHED_DICE_METHODS = ['coldcard', 'coleman'] as const;
export const DIRECT_DICE_METHODS = ['bitbox', 'd8d16'] as const;
export const DICE_METHODS = [...HASHED_DICE_METHODS, ...DIRECT_DICE_METHODS] as const;
export const WORD_COUNTS = [12, 15, 18, 21, 24] as const;

const DICE_METHOD_COPY = {
  bitbox: {
    description: UPSTREAM_TEXT.dice.bitbox.desc,
    title: UPSTREAM_TEXT.dice.bitbox.title,
  },
  coldcard: {
    description: UPSTREAM_TEXT.dice.coldcard.desc,
    title: UPSTREAM_TEXT.dice.coldcard.title,
  },
  coleman: {
    description: UPSTREAM_TEXT.dice.coleman.desc,
    title: UPSTREAM_TEXT.dice.coleman.title,
  },
  d8d16: {
    description: UPSTREAM_TEXT.dice.dplus.desc,
    title: UPSTREAM_TEXT.dice.dplus.title,
  },
} as const;

const HASHED_DICE_COPY = {
  coldcard: {
    help: UPSTREAM_TEXT.dice.help.coldcard,
    title: UPSTREAM_TEXT.dice.method.coldcard,
  },
  coleman: {
    help: UPSTREAM_TEXT.dice.help.coleman,
    title: UPSTREAM_TEXT.dice.coleman.title,
  },
} as const;

export type WordCount = (typeof WORD_COUNTS)[number];
export type DiceFace = (typeof DICE_FACES)[number];
export type DiceInputFace = DiceFace | (typeof D8_D16_FACES)[number];
export type DiceMethod = (typeof DICE_METHODS)[number];
export type HashedDiceMethod = (typeof HASHED_DICE_METHODS)[number];
export type DirectDiceMethodId = (typeof DIRECT_DICE_METHODS)[number];
export type DiceResult =
  | {
      readonly entropy: string;
      readonly masterSeed: string;
      readonly mnemonic: string;
      readonly error?: never;
    }
  | {
      readonly entropy?: never;
      readonly masterSeed?: never;
      readonly mnemonic?: never;
      readonly error: string;
    };

export function isHashedDiceMethod(method: DiceMethod): method is HashedDiceMethod {
  return method === 'coldcard' || method === 'coleman';
}

export function isDirectDiceMethod(method: DiceMethod): method is DirectDiceMethodId {
  return method === 'bitbox' || method === 'd8d16';
}

export function getDiceMethodInfo(wordCount: WordCount): DiceMethodInfo {
  return nativeDiceMethodInfo(wordCount);
}

export function getHashedDiceState(rolls: string, wordCount: WordCount): HashedDiceState {
  return nativeHashedDiceState(rolls, wordCount);
}

export function formatDiceTranscript(
  rolls: string,
  method: DiceMethod,
  wordCount: WordCount,
): string {
  return nativeFormatDiceTranscript(rolls, nativeDiceInputMethod(method), wordCount);
}

export function diceMethodCopy(
  method: DiceMethod,
  wordCount: WordCount,
  info = getDiceMethodInfo(wordCount),
) {
  const copy = DICE_METHOD_COPY[method];
  const description = formatCopy(copy.description, {
    bits: info.entropyBits,
    candidates: info.checksumCandidates,
    final: d8D16FinalDescription(info.finalSteps),
    hashRolls: info.recommendedRolls,
    partialWords: info.partialWords,
    words: wordCount,
  });

  return {
    title: copy.title,
    description,
  };
}

export function diceProgressCopy(
  state: HashedDiceState,
  method: HashedDiceMethod,
): string {
  const { recommendedRolls: requiredRolls, rollCount } = state;
  const estimatedBits = state.estimatedEntropyBits.toFixed(1);

  if (rollCount === 0) {
    return formatCopy(UPSTREAM_TEXT.dice.meta.empty, {
      method: HASHED_DICE_COPY[method].title,
      n: requiredRolls,
    });
  }

  if (rollCount < requiredRolls) {
    return formatCopy(UPSTREAM_TEXT.dice.meta.missing, {
      bits: estimatedBits,
      have: rollCount,
      missing: requiredRolls - rollCount,
      n: requiredRolls,
    });
  }

  const ready = formatCopy(UPSTREAM_TEXT.dice.meta.ready, {
    bits: estimatedBits,
    have: rollCount,
  });
  if (rollCount === requiredRolls) {
    return ready;
  }

  return `${ready}${formatCopy(UPSTREAM_TEXT.dice.meta.extra, {
    n: rollCount - requiredRolls,
  })}`;
}

export function directDiceProgress(state: DirectDiceState): number {
  return state.progress;
}

export function directDiceSelectionCopy(state: DirectDiceState) {
  return {
    finalWordLabel: formatCopy(UPSTREAM_TEXT.seed.lastWordLabel, {
      n: state.candidates.length,
    }),
  };
}

export function directDiceProgressCopy(
  state: DirectDiceState,
  method: DirectDiceMethodId,
  wordCount: WordCount,
): string {
  const extra = state.extraCount
    ? formatCopy(UPSTREAM_TEXT.dice.meta.extraIgnored, { n: state.extraCount })
    : '';

  if (method === 'bitbox') {
    const progress = state.canDerive
      ? formatCopy(UPSTREAM_TEXT.seed.meta.ready, {
          progress: formatCopy(UPSTREAM_TEXT.seed.count, {
            entered: wordCount,
            words: wordCount,
          }),
        })
      : state.step === DirectDiceStep.BitboxFinalWord
        ? formatCopy(UPSTREAM_TEXT.dice.bitbox.lastWord, { n: state.words.length })
        : state.step === DirectDiceStep.BitboxCoin
          ? formatCopy(UPSTREAM_TEXT.dice.bitbox.coin, {
              partial: state.partialWords,
              word: state.activeWord,
            })
          : formatCopy(UPSTREAM_TEXT.dice.bitbox.die, {
              die: state.activeRoll,
              partial: state.partialWords,
              word: state.activeWord,
            });
    const skipped = state.skippedCount
      ? ` ${formatCopy(
          state.skippedCount === 1
            ? UPSTREAM_TEXT.note.bitboxSkippedOne
            : UPSTREAM_TEXT.note.bitboxSkippedMany,
          { n: state.skippedCount },
        )}`
      : '';
    return `${progress}${extra}${skipped}`;
  }

  const groups = UPSTREAM_UI_FALLBACK_COPY.dice.d8d16.groups(
    state.completedGroups,
    state.partialWords,
    state.activeWord,
  );
  const completeGroups = UPSTREAM_UI_FALLBACK_COPY.dice.d8d16.rollsComplete(
    state.partialWords,
  );
  const progress =
    state.step === DirectDiceStep.D8D16WordD8
      ? `${groups} · ${UPSTREAM_TEXT.dice.dplus.roll.d8}${UPSTREAM_TEXT.dice.dplus.range.d8}`
      : state.step === DirectDiceStep.D8D16WordD16First
        ? `${groups} · ${UPSTREAM_TEXT.dice.dplus.roll.d16first}${UPSTREAM_TEXT.dice.dplus.range.d16}`
        : state.step === DirectDiceStep.D8D16WordD16Second
          ? `${groups} · ${UPSTREAM_TEXT.dice.dplus.roll.d16second}${UPSTREAM_TEXT.dice.dplus.range.d16}`
          : state.step === DirectDiceStep.D8D16ChecksumD8
            ? `${completeGroups} · ${UPSTREAM_TEXT.dice.dplus.roll.checksumD8}${UPSTREAM_TEXT.dice.dplus.range.d8}`
            : state.step === DirectDiceStep.D8D16ChecksumD16
              ? `${completeGroups} · ${UPSTREAM_TEXT.dice.dplus.roll.checksumD16}${UPSTREAM_TEXT.dice.dplus.range.d16}`
              : state.step === DirectDiceStep.D8D16ChecksumCoin
                ? `${completeGroups} · ${UPSTREAM_TEXT.dice.dplus.roll.checksumCoin}${UPSTREAM_TEXT.dice.dplus.range.coin}`
                : state.step === DirectDiceStep.D8D16Complete
                  ? formatCopy(UPSTREAM_TEXT.dice.dplus.ready, { words: wordCount })
                  : `${groups}${formatCopy(UPSTREAM_TEXT.dice.meta.invalid, {
                      n: state.invalidCount,
                    })}`;
  return `${progress}${extra}`;
}

export function diceScreenCopy(
  method: DiceMethod,
  wordCount: WordCount,
  info = getDiceMethodInfo(wordCount),
) {
  const inputLabel =
    method === 'bitbox'
      ? UPSTREAM_TEXT.dice.label.bitbox
      : method === 'd8d16'
        ? formatCopy(UPSTREAM_TEXT.dice.label.dplus, {
            final: d8D16FinalDescription(info.finalSteps),
          })
        : UPSTREAM_TEXT.dice.label.hashed;
  const inputHelp =
    method === 'bitbox'
      ? formatCopy(UPSTREAM_TEXT.dice.help.bitbox, {
          partialWords: info.partialWords,
        })
      : method === 'd8d16'
        ? formatCopy(UPSTREAM_TEXT.dice.help.dplus, {
            finalHelp: d8D16FinalHelp(info.finalSteps),
          })
        : formatCopy(HASHED_DICE_COPY[method].help, {
            hashRolls: info.recommendedRolls,
          });
  const inputPlaceholder =
    method === 'bitbox'
      ? UPSTREAM_UI_FALLBACK_COPY.dice.placeholders.bitbox
      : method === 'd8d16'
        ? UPSTREAM_UI_FALLBACK_COPY.dice.placeholders.d8d16
        : UPSTREAM_UI_FALLBACK_COPY.dice.placeholders.hashed;

  return {
    deriveAction: UPSTREAM_TEXT.action.derive,
    how: formatCopy(UPSTREAM_TEXT.dice.how, { words: wordCount }),
    inputLabel,
    inputHelp,
    inputPlaceholder,
    lastWordPlaceholder: UPSTREAM_TEXT.seed.lastWordPlaceholder,
    methodRequirement: UPSTREAM_UI_FALLBACK_COPY.common.seedLengthEntropy(
      wordCount,
      info.entropyBits,
    ),
    mode: UPSTREAM_TEXT.mode.dice,
    resultEntropy: UPSTREAM_TEXT.result.entropyHex,
    resultMasterSeed: UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex,
    seedLengthLabel: UPSTREAM_TEXT.seedLength.label,
    seedLengthValue: formatCopy(UPSTREAM_TEXT.seedLength.words, {
      n: wordCount,
    }),
  };
}

export function getDirectDiceState(
  rolls: string,
  method: DirectDiceMethodId,
  wordCount: WordCount,
  selectedFinalWord: string,
): DirectDiceState {
  return nativeDirectDiceInputState(
    rolls,
    method === 'bitbox' ? DirectDiceMethod.Bitbox : DirectDiceMethod.D8D16,
    wordCount,
    selectedFinalWord,
  );
}

export function directDiceCanDerive(state: DirectDiceState): boolean {
  return state.canDerive;
}

export function deriveDiceResult(
  rolls: string,
  method: HashedDiceMethod,
  wordCount: WordCount,
  state: HashedDiceState,
  passphrase: string,
): DiceResult {
  try {
    const entropy = diceRollsToEntropy(
      rolls,
      method === 'coldcard' ? DiceRollMethod.Coldcard : DiceRollMethod.Coleman,
      wordCount,
    );
    const mnemonic = entropyToMnemonic(entropy);
    return {
      entropy: arrayBufferToHex(entropy),
      masterSeed: arrayBufferToHex(mnemonicToSeed(mnemonic, passphrase)),
      mnemonic,
    };
  } catch (error) {
    return { error: upstreamDiceError(error, state) };
  }
}

export function deriveDirectDiceResult(
  state: DirectDiceState,
  passphrase: string,
): DiceResult {
  if (!state.canDerive || !state.mnemonic) {
    return { error: UPSTREAM_TEXT.error.generic };
  }

  try {
    const entropy = mnemonicToEntropy(state.mnemonic);
    return {
      entropy: arrayBufferToHex(entropy),
      masterSeed: arrayBufferToHex(mnemonicToSeed(state.mnemonic, passphrase)),
      mnemonic: state.mnemonic,
    };
  } catch {
    return { error: UPSTREAM_TEXT.error.generic };
  }
}

function d8D16FinalDescription(steps: readonly DiceFinalStep[]): string {
  const labels = steps.map(d8D16StepLabel);
  if (labels.length === 1) {
    return formatCopy(UPSTREAM_TEXT.dice.dplus.rollOnceMore, { die: labels[0] });
  }
  if (labels[0] === labels[1]) {
    return formatCopy(UPSTREAM_TEXT.dice.dplus.rollTwice, { die: labels[0] });
  }
  return formatCopy(UPSTREAM_TEXT.dice.dplus.rollAnd, {
    a: labels[0],
    b: labels[1],
  });
}

function d8D16FinalHelp(steps: readonly DiceFinalStep[]): string {
  const labels = steps.map(d8D16HelpStepLabel);
  if (labels.length === 1) {
    return formatCopy(UPSTREAM_TEXT.dice.dplus.helpOne, { die: labels[0] });
  }
  if (labels[0] === labels[1]) {
    return formatCopy(UPSTREAM_TEXT.dice.dplus.helpTwoSame, { die: labels[0] });
  }
  return formatCopy(UPSTREAM_TEXT.dice.dplus.helpTwo, {
    a: labels[0],
    b: labels[1],
    coin: labels.includes(UPSTREAM_TEXT.dice.dplus.coinFlip)
      ? UPSTREAM_TEXT.dice.dplus.coinNote
      : '',
  });
}

function d8D16StepLabel(step: DiceFinalStep): string {
  if (step === DiceFinalStep.Coin) {
    return UPSTREAM_TEXT.dice.dplus.aCoinFlip;
  }
  return step === DiceFinalStep.D8 ? 'D8' : 'D16';
}

function d8D16HelpStepLabel(step: DiceFinalStep): string {
  if (step === DiceFinalStep.Coin) {
    return UPSTREAM_TEXT.dice.dplus.coinFlip;
  }
  return step === DiceFinalStep.D8 ? 'D8' : 'D16';
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function formatCopy(template: string, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function upstreamDiceError(error: unknown, state: HashedDiceState): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.InvalidDiceRolls) {
    return UPSTREAM_UI_FALLBACK_COPY.dice.errors.invalidFaces(
      JSON.stringify(state.invalidFaces.slice(0, 24)),
    );
  }

  if (tag === EntropyStudioError_Tags.NoDiceRolls) {
    return UPSTREAM_UI_FALLBACK_COPY.dice.errors.empty;
  }

  return UPSTREAM_TEXT.error.generic;
}

function nativeDiceInputMethod(method: DiceMethod) {
  switch (method) {
    case 'coldcard':
      return DiceInputMethod.Coldcard;
    case 'coleman':
      return DiceInputMethod.Coleman;
    case 'bitbox':
      return DiceInputMethod.Bitbox;
    case 'd8d16':
      return DiceInputMethod.D8D16;
  }
}