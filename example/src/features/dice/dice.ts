import {
  DiceRollMethod,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
} from '../../native/entropyStudio';
import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';

export const DICE_FACES = ['1', '2', '3', '4', '5', '6'] as const;
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

const UPSTREAM_HASHED_DICE_PLACEHOLDER = '415263415263…';

export type WordCount = (typeof WORD_COUNTS)[number];
export type DiceFace = (typeof DICE_FACES)[number];
export type DiceMethod = 'coldcard' | 'coleman';
export type DiceResult =
  | { readonly entropy: string; readonly mnemonic: string; readonly error?: never }
  | { readonly entropy?: never; readonly mnemonic?: never; readonly error: string };

export function countDiceFaces(rolls: string): number {
  return Array.from(rolls).filter(face => face >= '1' && face <= '6').length;
}

export function recommendedRolls(wordCount: WordCount): number {
  return RECOMMENDED_ROLLS[wordCount];
}

export function diceMethodCopy(method: DiceMethod, wordCount: WordCount) {
  const prefix = method === 'coldcard' ? 'dice.coldcard' : 'dice.coleman';
  const description = formatCopy(entropyLabEnglish[`${prefix}.desc`], {
    bits: ENTROPY_BITS[wordCount],
    hashRolls: RECOMMENDED_ROLLS[wordCount],
    words: wordCount,
  });

  return {
    title: entropyLabEnglish[`${prefix}.title`],
    description,
  };
}

export function diceProgressCopy(
  rollCount: number,
  method: DiceMethod,
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

export function diceScreenCopy(wordCount: WordCount) {
  return {
    deriveAction: entropyLabEnglish['action.derive'],
    how: formatCopy(entropyLabEnglish['dice.how'], { words: wordCount }),
    inputLabel: entropyLabEnglish['dice.label.hashed'],
    inputPlaceholder: UPSTREAM_HASHED_DICE_PLACEHOLDER,
    mode: entropyLabEnglish['mode.dice'],
    resultEntropy: entropyLabEnglish['result.entropyHex'],
    resultPhrase: formatCopy(entropyLabEnglish['result.seedPhraseN'], {
      n: wordCount,
    }),
    seedLengthLabel: entropyLabEnglish['seedLength.label'],
    seedLengthValue: formatCopy(entropyLabEnglish['seedLength.words'], {
      n: wordCount,
    }),
  };
}

export function deriveDiceResult(
  rolls: string,
  method: DiceMethod,
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