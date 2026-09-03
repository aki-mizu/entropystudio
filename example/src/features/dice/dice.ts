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
} from '../../native/entropyStudio';
import type {
  DiceMethodInfo,
  DirectDiceState,
  HashedDiceState,
} from '../../native/entropyStudio';
import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';

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

const UPSTREAM_DICE_PLACEHOLDERS = {
  bitbox: '111111 222224…',
  d8d16: '100 2AF…',
  hashed: '415263415263…',
} as const;

const DICE_METHOD_COPY_KEYS = {
  bitbox: {
    description: 'dice.bitbox.desc',
    title: 'dice.bitbox.title',
  },
  coldcard: {
    description: 'dice.coldcard.desc',
    title: 'dice.coldcard.title',
  },
  coleman: {
    description: 'dice.coleman.desc',
    title: 'dice.coleman.title',
  },
  d8d16: {
    description: 'dice.dplus.desc',
    title: 'dice.dplus.title',
  },
} as const;

export type WordCount = (typeof WORD_COUNTS)[number];
export type DiceFace = (typeof DICE_FACES)[number];
export type DiceInputFace = DiceFace | (typeof D8_D16_FACES)[number];
export type DiceMethod = (typeof DICE_METHODS)[number];
export type HashedDiceMethod = (typeof HASHED_DICE_METHODS)[number];
export type DirectDiceMethodId = (typeof DIRECT_DICE_METHODS)[number];
export type DiceResult =
  | { readonly entropy: string; readonly mnemonic: string; readonly error?: never }
  | { readonly entropy?: never; readonly mnemonic?: never; readonly error: string };

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
  const keys = DICE_METHOD_COPY_KEYS[method];
  const description = formatCopy(entropyLabEnglish[keys.description], {
    bits: info.entropyBits,
    candidates: info.checksumCandidates,
    final: d8D16FinalDescription(info.finalSteps),
    hashRolls: info.recommendedRolls,
    partialWords: info.partialWords,
    words: wordCount,
  });

  return {
    title: entropyLabEnglish[keys.title],
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
    return formatCopy(entropyLabEnglish['dice.meta.empty'], {
      method: entropyLabEnglish[`dice.method.${method}`],
      n: requiredRolls,
    });
  }

  if (rollCount < requiredRolls) {
    return formatCopy(entropyLabEnglish['dice.meta.missing'], {
      bits: estimatedBits,
      have: rollCount,
      missing: requiredRolls - rollCount,
      n: requiredRolls,
    });
  }

  const ready = formatCopy(entropyLabEnglish['dice.meta.ready'], {
    bits: estimatedBits,
    have: rollCount,
  });
  if (rollCount === requiredRolls) {
    return ready;
  }

  return `${ready}${formatCopy(entropyLabEnglish['dice.meta.extra'], {
    n: rollCount - requiredRolls,
  })}`;
}

export function directDiceProgress(state: DirectDiceState): number {
  return state.progress;
}

export function directDiceSelectionCopy(state: DirectDiceState) {
  return {
    finalWordLabel: formatCopy(entropyLabEnglish['seed.lastWordLabel'], {
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
    ? formatCopy(entropyLabEnglish['dice.meta.extraIgnored'], { n: state.extraCount })
    : '';

  if (method === 'bitbox') {
    const progress = state.canDerive
      ? formatCopy(entropyLabEnglish['seed.meta.ready'], {
          progress: formatCopy(entropyLabEnglish['seed.count'], {
            entered: wordCount,
            words: wordCount,
          }),
        })
      : state.step === DirectDiceStep.BitboxFinalWord
        ? formatCopy(entropyLabEnglish['dice.bitbox.lastWord'], { n: state.words.length })
        : state.step === DirectDiceStep.BitboxCoin
          ? formatCopy(entropyLabEnglish['dice.bitbox.coin'], {
              partial: state.partialWords,
              word: state.activeWord,
            })
          : formatCopy(entropyLabEnglish['dice.bitbox.die'], {
              die: state.activeRoll,
              partial: state.partialWords,
              word: state.activeWord,
            });
    const skipped = state.skippedCount
      ? ` ${formatCopy(
          entropyLabEnglish[
            state.skippedCount === 1 ? 'note.bitboxSkippedOne' : 'note.bitboxSkippedMany'
          ],
          { n: state.skippedCount },
        )}`
      : '';
    return `${progress}${extra}${skipped}`;
  }

  const groups = formatCopy(entropyLabEnglish['dice.dplus.groups'], {
    completed: state.completedGroups,
    partial: state.partialWords,
    word: state.activeWord,
  });
  const completeGroups = formatCopy(entropyLabEnglish['dice.dplus.rollsComplete'], {
    partial: state.partialWords,
  });
  const progress =
    state.step === DirectDiceStep.D8D16WordD8
      ? `${groups} · ${entropyLabEnglish['dice.dplus.roll.d8']}${entropyLabEnglish['dice.dplus.range.d8']}`
      : state.step === DirectDiceStep.D8D16WordD16First
        ? `${groups} · ${entropyLabEnglish['dice.dplus.roll.d16first']}${entropyLabEnglish['dice.dplus.range.d16']}`
        : state.step === DirectDiceStep.D8D16WordD16Second
          ? `${groups} · ${entropyLabEnglish['dice.dplus.roll.d16second']}${entropyLabEnglish['dice.dplus.range.d16']}`
          : state.step === DirectDiceStep.D8D16ChecksumD8
            ? `${completeGroups} · ${entropyLabEnglish['dice.dplus.roll.checksumD8']}${entropyLabEnglish['dice.dplus.range.d8']}`
            : state.step === DirectDiceStep.D8D16ChecksumD16
              ? `${completeGroups} · ${entropyLabEnglish['dice.dplus.roll.checksumD16']}${entropyLabEnglish['dice.dplus.range.d16']}`
              : state.step === DirectDiceStep.D8D16ChecksumCoin
                ? `${completeGroups} · ${entropyLabEnglish['dice.dplus.roll.checksumCoin']}${entropyLabEnglish['dice.dplus.range.coin']}`
                : state.step === DirectDiceStep.D8D16Complete
                  ? formatCopy(entropyLabEnglish['dice.dplus.ready'], { words: wordCount })
                  : `${groups}${formatCopy(entropyLabEnglish['dice.meta.invalid'], {
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
      ? entropyLabEnglish['dice.label.bitbox']
      : method === 'd8d16'
        ? formatCopy(entropyLabEnglish['dice.label.dplus'], {
            final: d8D16FinalDescription(info.finalSteps),
          })
        : entropyLabEnglish['dice.label.hashed'];
  const inputHelp =
    method === 'bitbox'
      ? formatCopy(entropyLabEnglish['dice.help.bitbox'], {
          partialWords: info.partialWords,
        })
      : method === 'd8d16'
        ? formatCopy(entropyLabEnglish['dice.help.dplus'], {
            finalHelp: d8D16FinalHelp(info.finalSteps),
          })
        : formatCopy(entropyLabEnglish[`dice.help.${method}`], {
            hashRolls: info.recommendedRolls,
          });
  const inputPlaceholder =
    method === 'bitbox'
      ? UPSTREAM_DICE_PLACEHOLDERS.bitbox
      : method === 'd8d16'
        ? UPSTREAM_DICE_PLACEHOLDERS.d8d16
        : UPSTREAM_DICE_PLACEHOLDERS.hashed;

  return {
    deriveAction: entropyLabEnglish['action.derive'],
    how: formatCopy(entropyLabEnglish['dice.how'], { words: wordCount }),
    inputLabel,
    inputHelp,
    inputPlaceholder,
    lastWordAria: formatCopy(entropyLabEnglish['seed.lastWordAria'], { n: wordCount }),
    lastWordPlaceholder: entropyLabEnglish['seed.lastWordPlaceholder'],
    mode: entropyLabEnglish['mode.dice'],
    resultEntropy: entropyLabEnglish['result.entropyHex'],
    seedLengthLabel: entropyLabEnglish['seedLength.label'],
    seedLengthValue: formatCopy(entropyLabEnglish['seedLength.words'], {
      n: wordCount,
    }),
    wordSlotsAria: formatCopy(entropyLabEnglish['seed.wordSlotsAria'], { n: wordCount }),
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
): DiceResult {
  try {
    const entropy = diceRollsToEntropy(
      rolls,
      method === 'coldcard' ? DiceRollMethod.Coldcard : DiceRollMethod.Coleman,
      wordCount,
    );
    return {
      entropy: arrayBufferToHex(entropy),
      mnemonic: entropyToMnemonic(entropy),
    };
  } catch (error) {
    return { error: upstreamDiceError(error, state) };
  }
}

export function deriveDirectDiceResult(
  state: DirectDiceState,
): DiceResult {
  if (!state.canDerive || !state.mnemonic) {
    return { error: entropyLabEnglish['error.generic'] };
  }

  try {
    const entropy = mnemonicToEntropy(state.mnemonic);
    return {
      entropy: arrayBufferToHex(entropy),
      mnemonic: state.mnemonic,
    };
  } catch {
    return { error: entropyLabEnglish['error.generic'] };
  }
}

function d8D16FinalDescription(steps: readonly DiceFinalStep[]): string {
  const labels = steps.map(d8D16StepLabel);
  if (labels.length === 1) {
    return formatCopy(entropyLabEnglish['dice.dplus.rollOnceMore'], { die: labels[0] });
  }
  if (labels[0] === labels[1]) {
    return formatCopy(entropyLabEnglish['dice.dplus.rollTwice'], { die: labels[0] });
  }
  return formatCopy(entropyLabEnglish['dice.dplus.rollAnd'], {
    a: labels[0],
    b: labels[1],
  });
}

function d8D16FinalHelp(steps: readonly DiceFinalStep[]): string {
  const labels = steps.map(d8D16HelpStepLabel);
  if (labels.length === 1) {
    return formatCopy(entropyLabEnglish['dice.dplus.helpOne'], { die: labels[0] });
  }
  if (labels[0] === labels[1]) {
    return formatCopy(entropyLabEnglish['dice.dplus.helpTwoSame'], { die: labels[0] });
  }
  return formatCopy(entropyLabEnglish['dice.dplus.helpTwo'], {
    a: labels[0],
    b: labels[1],
    coin: labels.includes(entropyLabEnglish['dice.dplus.coinFlip'])
      ? entropyLabEnglish['dice.dplus.coinNote']
      : '',
  });
}

function d8D16StepLabel(step: DiceFinalStep): string {
  if (step === DiceFinalStep.Coin) {
    return entropyLabEnglish['dice.dplus.aCoinFlip'];
  }
  return step === DiceFinalStep.D8 ? 'D8' : 'D16';
}

function d8D16HelpStepLabel(step: DiceFinalStep): string {
  if (step === DiceFinalStep.Coin) {
    return entropyLabEnglish['dice.dplus.coinFlip'];
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
    return entropyLabEnglish['error.diceFaces'].replace(
      '{chars}',
      JSON.stringify(state.invalidFaces.slice(0, 24)),
    );
  }

  if (tag === EntropyStudioError_Tags.NoDiceRolls) {
    return entropyLabEnglish['error.diceEmpty'];
  }

  return entropyLabEnglish['error.generic'];
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