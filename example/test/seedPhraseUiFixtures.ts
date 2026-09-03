type SeedPhraseUiMockSetters = {
  readonly setSeedPhraseAutocomplete: (
    implementation: (value: string, cursor: number, targetWords: number) => unknown,
  ) => void;
  readonly setSeedPhraseKeyAllowed: (
    implementation: (
      value: string,
      selectionStart: number,
      selectionEnd: number,
      character: string,
      method: number,
      targetWords: number,
      zeroIndexed: boolean,
    ) => boolean,
  ) => void;
  readonly setSeedPhraseNumbersToWords: (
    implementation: (value: string, targetWords: number, zeroIndexed: boolean) => string,
  ) => void;
  readonly setSeedPhraseSpaceAllowed: (
    implementation: (
      value: string,
      selectionStart: number,
      selectionEnd: number,
      method: number,
      targetWords: number,
      zeroIndexed: boolean,
    ) => boolean,
  ) => void;
  readonly setSeedPhraseState: (
    implementation: (
      value: string,
      method: number,
      targetWords: number,
      zeroIndexed: boolean,
    ) => unknown,
  ) => void;
  readonly setSeedPhraseWordsToNumbers: (
    implementation: (value: string, zeroIndexed: boolean) => string,
  ) => void;
  readonly setTranslateSeedNumberIndices: (
    implementation: (value: string, fromZeroIndexed: boolean, toZeroIndexed: boolean) => string,
  ) => void;
};

const SEED_PHRASE_PREFIX = Array.from({ length: 11 }, () => 'abandon').join(' ');
const SEED_PHRASE_VALID = `${SEED_PHRASE_PREFIX} about`;
const SEED_PHRASE_FINAL_INPUT = `${SEED_PHRASE_PREFIX} `;
const SEED_PHRASE_NUMBERS = `${Array.from({ length: 11 }, () => '1').join(' ')} 4`;
const SEED_PHRASE_ZERO_NUMBERS = `${Array.from({ length: 11 }, () => '0').join(' ')} 3`;
const SEED_PHRASE_VALID_WORDS = [...Array.from({ length: 11 }, () => 'abandon'), 'about'];

const SEED_PHRASE_STATE_FIXTURES: Record<string, ReturnType<typeof seedPhraseFixture>> = {
  [`0:12:false:${SEED_PHRASE_VALID}`]: seedPhraseFixture(SEED_PHRASE_VALID, 12, false, {
    canDerive: true,
    enteredCount: 12,
    phrase: SEED_PHRASE_VALID,
    remainingCount: 0,
    status: 3,
    words: SEED_PHRASE_VALID_WORDS,
  }),
  [`0:12:false:${SEED_PHRASE_VALID} `]: seedPhraseFixture(`${SEED_PHRASE_VALID} `, 12, false, {
    canDerive: true,
    enteredCount: 12,
    phrase: SEED_PHRASE_VALID,
    remainingCount: 0,
    status: 3,
    words: SEED_PHRASE_VALID_WORDS,
  }),
  '0:12:false:aba': seedPhraseFixture('aba', 12, false, {
    enteredCount: 1,
    remainingCount: 11,
    words: ['aba'],
  }),
  '0:12:false:abandon ': seedPhraseFixture('abandon ', 12, false, {
    enteredCount: 1,
    remainingCount: 11,
    words: ['abandon'],
  }),
  [`0:12:false:${SEED_PHRASE_FINAL_INPUT}`]: seedPhraseFixture(
    SEED_PHRASE_FINAL_INPUT,
    12,
    false,
    {
      enteredCount: 11,
      finalCandidates: ['about'],
      remainingCount: 1,
      status: 2,
      words: Array.from({ length: 11 }, () => 'abandon'),
    },
  ),
  [`1:12:false:${SEED_PHRASE_NUMBERS}`]: seedPhraseFixture(
    SEED_PHRASE_NUMBERS,
    12,
    false,
    {
      canDerive: true,
      enteredCount: 12,
      phrase: SEED_PHRASE_VALID,
      remainingCount: 0,
      status: 3,
      words: SEED_PHRASE_VALID_WORDS,
    },
  ),
  [`1:12:true:${SEED_PHRASE_ZERO_NUMBERS}`]: seedPhraseFixture(
    SEED_PHRASE_ZERO_NUMBERS,
    12,
    true,
    {
      canDerive: true,
      enteredCount: 12,
      phrase: SEED_PHRASE_VALID,
      remainingCount: 0,
      status: 3,
      words: SEED_PHRASE_VALID_WORDS,
    },
  ),
};

const SEED_PHRASE_AUTOCOMPLETE_FIXTURES: Record<string, { readonly cursor: number; readonly value: string }> = {
  '12:aban:4': { cursor: 8, value: 'abandon ' },
  [`12:${SEED_PHRASE_FINAL_INPUT}a:${SEED_PHRASE_FINAL_INPUT.length + 1}`]: {
    cursor: SEED_PHRASE_VALID.length + 1,
    value: `${SEED_PHRASE_VALID} `,
  },
};

const SEED_PHRASE_KEY_ALLOWED_FIXTURES: Record<string, boolean> = {
  '0:12:false:aba:3:3:n': true,
  [`0:12:false:${SEED_PHRASE_FINAL_INPUT}:${SEED_PHRASE_FINAL_INPUT.length}:${SEED_PHRASE_FINAL_INPUT.length}:a`]: true,
  '1:12:false::0:0:1': true,
};

const SEED_PHRASE_NUMBERS_TO_WORDS_FIXTURES: Record<string, string> = {
  '24:false:1 4': 'abandon about',
};

const SEED_PHRASE_SPACE_ALLOWED_FIXTURES: Record<string, boolean> = {
  '1:12:false:1': true,
};

const SEED_PHRASE_WORDS_TO_NUMBERS_FIXTURES: Record<string, string> = {
  'false:abandon about': '1 4',
};

const SEED_NUMBER_TRANSLATION_FIXTURES: Record<string, string> = {
  [`false:true:${SEED_PHRASE_NUMBERS}`]: SEED_PHRASE_ZERO_NUMBERS,
};

function seedPhraseFixture(
  normalizedInput: string,
  targetWords: number,
  zeroIndexed: boolean,
  overrides: Partial<{
    readonly canDerive: boolean;
    readonly enteredCount: number;
    readonly extraCount: number;
    readonly finalCandidates: readonly string[];
    readonly invalidPosition: number;
    readonly invalidToken: string;
    readonly matchingFinalCandidates: number;
    readonly phrase: string;
    readonly remainingCount: number;
    readonly status: number;
    readonly words: readonly string[];
  }> = {},
) {
  return {
    canDerive: false,
    enteredCount: 0,
    extraCount: 0,
    finalCandidates: [],
    invalidPosition: 0,
    invalidToken: '',
    matchingFinalCandidates: 0,
    maximumNumber: zeroIndexed ? 2047 : 2048,
    minimumNumber: zeroIndexed ? 0 : 1,
    normalizedInput,
    phrase: '',
    remainingCount: targetWords,
    status: 0,
    words: [],
    ...overrides,
  };
}

export function installSeedPhraseUiFixtures({
  setSeedPhraseAutocomplete,
  setSeedPhraseKeyAllowed,
  setSeedPhraseNumbersToWords,
  setSeedPhraseSpaceAllowed,
  setSeedPhraseState,
  setSeedPhraseWordsToNumbers,
  setTranslateSeedNumberIndices,
}: SeedPhraseUiMockSetters) {
  setSeedPhraseAutocomplete(
    (value, cursor, targetWords) =>
      SEED_PHRASE_AUTOCOMPLETE_FIXTURES[`${targetWords}:${value}:${cursor}`] ?? { cursor, value },
  );
  setSeedPhraseKeyAllowed(
    (value, selectionStart, selectionEnd, character, method, targetWords, zeroIndexed) =>
      SEED_PHRASE_KEY_ALLOWED_FIXTURES[
        `${method}:${targetWords}:${zeroIndexed}:${value}:${selectionStart}:${selectionEnd}:${character}`
      ] ?? false,
  );
  setSeedPhraseNumbersToWords(
    (value, targetWords, zeroIndexed) =>
      SEED_PHRASE_NUMBERS_TO_WORDS_FIXTURES[`${targetWords}:${zeroIndexed}:${value}`] ?? '',
  );
  setSeedPhraseSpaceAllowed(
    (value, _selectionStart, _selectionEnd, method, targetWords, zeroIndexed) =>
      SEED_PHRASE_SPACE_ALLOWED_FIXTURES[`${method}:${targetWords}:${zeroIndexed}:${value}`] ?? false,
  );
  setSeedPhraseState(
    (value, method, targetWords, zeroIndexed) =>
      SEED_PHRASE_STATE_FIXTURES[`${method}:${targetWords}:${zeroIndexed}:${value}`] ??
      seedPhraseFixture(value, targetWords, zeroIndexed),
  );
  setSeedPhraseWordsToNumbers(
    (value, zeroIndexed) => SEED_PHRASE_WORDS_TO_NUMBERS_FIXTURES[`${zeroIndexed}:${value}`] ?? '',
  );
  setTranslateSeedNumberIndices(
    (value, fromZeroIndexed, toZeroIndexed) =>
      SEED_NUMBER_TRANSLATION_FIXTURES[`${fromZeroIndexed}:${toZeroIndexed}:${value}`] ?? value,
  );
}