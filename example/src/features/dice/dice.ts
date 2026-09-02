import {
  DiceRollMethod,
  DirectDiceMethod,
  DirectDiceStep,
  directDiceState as nativeDirectDiceState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  mnemonicToEntropy,
} from '../../native/entropyStudio';
import type { DirectDiceState } from '../../native/entropyStudio';
import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';

export const DICE_FACES = ['1', '2', '3', '4', '5', '6'] as const;
const BITBOX_D4_FACES = ['1', '2', '3', '4'] as const;
const D8_FACES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
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

const RECOMMENDED_ROLLS = {
  12: 50,
  15: 62,
  18: 75,
  21: 87,
  24: 99,
} as const;

const ENTROPY_BITS = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
} as const;

const CHECKSUM_CANDIDATES = {
  12: 128,
  15: 64,
  18: 32,
  21: 16,
  24: 8,
} as const;

const D8_D16_FINAL_STEPS = {
  12: ['d8', 'd16'],
  15: ['d8', 'd8'],
  18: ['d16', 'coin'],
  21: ['d16'],
  24: ['d8'],
} as const;

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

export function countDiceFaces(rolls: string): number {
  return Array.from(rolls).filter(face => face >= '1' && face <= '6').length;
}

export function recommendedRolls(wordCount: WordCount): number {
  return RECOMMENDED_ROLLS[wordCount];
}

export function isHashedDiceMethod(method: DiceMethod): method is HashedDiceMethod {
  return method === 'coldcard' || method === 'coleman';
}

export function isDirectDiceMethod(method: DiceMethod): method is DirectDiceMethodId {
  return method === 'bitbox' || method === 'd8d16';
}

export function enabledDiceFaces(
  method: DiceMethod,
  directState: DirectDiceState | null,
): readonly DiceInputFace[] {
  if (isHashedDiceMethod(method)) {
    return DICE_FACES;
  }
  if (!directState) {
    return [];
  }
  if (method === 'bitbox') {
    return directState.step === DirectDiceStep.BitboxDie
      ? BITBOX_D4_FACES
      : directState.step === DirectDiceStep.BitboxCoin
        ? DICE_FACES
        : [];
  }

  switch (directState.step) {
    case DirectDiceStep.D8D16WordD8:
    case DirectDiceStep.D8D16ChecksumD8:
    case DirectDiceStep.D8D16ChecksumCoin:
      return D8_FACES;
    case DirectDiceStep.D8D16WordD16First:
    case DirectDiceStep.D8D16WordD16Second:
    case DirectDiceStep.D8D16ChecksumD16:
      return D8_D16_FACES;
    default:
      return [];
  }
}

export function diceMethodCopy(method: DiceMethod, wordCount: WordCount) {
  const keys = DICE_METHOD_COPY_KEYS[method];
  const description = formatCopy(entropyLabEnglish[keys.description], {
    bits: ENTROPY_BITS[wordCount],
    candidates: CHECKSUM_CANDIDATES[wordCount],
    final: d8D16FinalDescription(wordCount),
    hashRolls: RECOMMENDED_ROLLS[wordCount],
    partialWords: wordCount - 1,
    words: wordCount,
  });

  return {
    title: entropyLabEnglish[keys.title],
    description,
  };
}

export function diceProgressCopy(
  rollCount: number,
  method: HashedDiceMethod,
  wordCount: WordCount,
): string {
  const requiredRolls = RECOMMENDED_ROLLS[wordCount];
  const estimatedBits = (rollCount * Math.log2(6)).toFixed(1);

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

export function directDiceProgress(
  state: DirectDiceState,
  method: DirectDiceMethodId,
  selectedFinalWord: string,
): number {
  const complete = directDiceCanDerive(state, method, selectedFinalWord);
  return Math.min(
    (state.completedGroups + Number(complete)) / (state.partialWords + 1),
    1,
  );
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
  selectedFinalWord: string,
): string {
  const extra = state.extraCount
    ? formatCopy(entropyLabEnglish['dice.meta.extraIgnored'], { n: state.extraCount })
    : '';

  if (method === 'bitbox') {
    const selected = normalizedCandidate(state, selectedFinalWord);
    const progress = selected
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

export function diceScreenCopy(method: DiceMethod, wordCount: WordCount) {
  const inputLabel =
    method === 'bitbox'
      ? entropyLabEnglish['dice.label.bitbox']
      : method === 'd8d16'
        ? formatCopy(entropyLabEnglish['dice.label.dplus'], {
        final: d8D16FinalDescription(wordCount),
          })
        : entropyLabEnglish['dice.label.hashed'];
    const inputHelp =
      method === 'bitbox'
        ? formatCopy(entropyLabEnglish['dice.help.bitbox'], {
            partialWords: wordCount - 1,
          })
        : method === 'd8d16'
          ? formatCopy(entropyLabEnglish['dice.help.dplus'], {
              finalHelp: d8D16FinalHelp(wordCount),
            })
          : formatCopy(entropyLabEnglish[`dice.help.${method}`], {
              hashRolls: RECOMMENDED_ROLLS[wordCount],
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
): DirectDiceState {
  return nativeDirectDiceState(
    rolls,
    method === 'bitbox' ? DirectDiceMethod.Bitbox : DirectDiceMethod.D8D16,
    wordCount,
  );
}

export function directDiceCanDerive(
  state: DirectDiceState,
  method: DirectDiceMethodId,
  selectedFinalWord: string,
): boolean {
  if (state.invalidCount > 0 || state.words.length !== state.partialWords) {
    return false;
  }
  return method === 'bitbox'
    ? Boolean(normalizedCandidate(state, selectedFinalWord))
    : state.complete;
}

export function deriveDiceResult(
  rolls: string,
  method: HashedDiceMethod,
  wordCount: WordCount,
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
    return { error: upstreamDiceError(error, rolls) };
  }
}

export function deriveDirectDiceResult(
  state: DirectDiceState,
  method: DirectDiceMethodId,
  selectedFinalWord: string,
): DiceResult {
  if (!directDiceCanDerive(state, method, selectedFinalWord)) {
    return { error: entropyLabEnglish['error.generic'] };
  }

  const finalWord =
    method === 'bitbox' ? normalizedCandidate(state, selectedFinalWord) : state.finalWord;
  const mnemonic = [...state.words, finalWord].join(' ');
  try {
    const entropy = mnemonicToEntropy(mnemonic);
    return {
      entropy: arrayBufferToHex(entropy),
      mnemonic,
    };
  } catch {
    return { error: entropyLabEnglish['error.generic'] };
  }
}

function normalizedCandidate(state: DirectDiceState, selectedFinalWord: string): string {
  const normalized = selectedFinalWord.trim().toLowerCase();
  return state.candidates.includes(normalized) ? normalized : '';
}

function d8D16FinalDescription(wordCount: WordCount): string {
  const steps = D8_D16_FINAL_STEPS[wordCount];
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

function d8D16FinalHelp(wordCount: WordCount): string {
  const labels = D8_D16_FINAL_STEPS[wordCount].map(d8D16HelpStepLabel);
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

function d8D16StepLabel(step: (typeof D8_D16_FINAL_STEPS)[WordCount][number]): string {
  return step === 'coin' ? entropyLabEnglish['dice.dplus.aCoinFlip'] : step.toUpperCase();
}

function d8D16HelpStepLabel(
  step: (typeof D8_D16_FINAL_STEPS)[WordCount][number],
): string {
  return step === 'coin' ? entropyLabEnglish['dice.dplus.coinFlip'] : step.toUpperCase();
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

function upstreamDiceError(error: unknown, rolls: string): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.InvalidDiceRolls) {
    let ignored = '';
    for (const character of rolls) {
      if (!/\s|,|;|\|/.test(character) && (character < '1' || character > '6')) {
        ignored += character;
      }
    }
    return entropyLabEnglish['error.diceFaces'].replace(
      '{chars}',
      JSON.stringify(ignored.slice(0, 24)),
    );
  }

  if (tag === EntropyStudioError_Tags.NoDiceRolls) {
    return entropyLabEnglish['error.diceEmpty'];
  }

  return entropyLabEnglish['error.generic'];
}