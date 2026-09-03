import type { HashedCardState } from '../src/native/entropyStudio';

type CardUiMockSetters = {
  readonly setCardKeyAllowed: (
    implementation: (key: string, method: number, activeMax: number) => boolean,
  ) => void;
  readonly setHashedCardState: (
    implementation: (transcript: string, targetWords: number) => HashedCardState,
  ) => void;
  readonly setNormalizeCardToken: (implementation: (token: string) => string) => void;
  readonly setNormalizeDirectCardTranscript: (implementation: (transcript: string) => string) => void;
};

const HASHED_CARD_EMPTY_STATE: HashedCardState = {
  availableCards: ['4H', '5C'],
  canDerive: false,
  cardCount: 0,
  entropyBits: 0,
  firstDuplicateCard: '',
  firstShuffleCards: 52,
  hasInput: false,
  instruction: 0 as HashedCardState['instruction'],
  invalidTokens: [],
  progress: 0,
  requiredCards: 58,
};

const HASHED_CARD_INPUT_STATE: HashedCardState = {
  availableCards: ['4H', '5C'],
  canDerive: true,
  cardCount: 1,
  entropyBits: 5.7,
  firstDuplicateCard: '',
  firstShuffleCards: 52,
  hasInput: true,
  instruction: 1 as HashedCardState['instruction'],
  invalidTokens: [],
  progress: 1 / 58,
  requiredCards: 58,
};

const HASHED_CARD_STATES: Record<string, HashedCardState> = {
  '24:': HASHED_CARD_EMPTY_STATE,
  '24:4h 3h': HASHED_CARD_INPUT_STATE,
  '24:5c': HASHED_CARD_INPUT_STATE,
  '24:As 2c': HASHED_CARD_INPUT_STATE,
  '24:A\u2660 2\u2663': HASHED_CARD_INPUT_STATE,
};

const CARD_KEY_ALLOWED: Record<string, boolean> = {
  '4': true,
  B: false,
};

const CARD_TOKEN_NORMALIZATIONS: Record<string, string> = {
  '2c': '2C',
  '2\u2663': '2C',
  '3H': '3H',
  '4H': '4H',
  '5c': '5C',
  '5C': '5C',
  As: 'AS',
  'A\u2660': 'AS',
};

const DIRECT_CARD_TRANSCRIPT_NORMALIZATIONS: Record<string, string> = {
  '': '',
  A: 'A',
  A2: 'A2',
  A23: 'A23',
  A234: 'A234',
  A2345: 'A2345',
};

export function installCardUiFixtures({
  setCardKeyAllowed,
  setHashedCardState,
  setNormalizeCardToken,
  setNormalizeDirectCardTranscript,
}: CardUiMockSetters) {
  setCardKeyAllowed(key => CARD_KEY_ALLOWED[key] ?? false);
  setHashedCardState(
    (transcript, targetWords) =>
      HASHED_CARD_STATES[`${targetWords}:${transcript}`] ?? HASHED_CARD_EMPTY_STATE,
  );
  setNormalizeCardToken(token => CARD_TOKEN_NORMALIZATIONS[token] ?? '');
  setNormalizeDirectCardTranscript(
    transcript => DIRECT_CARD_TRANSCRIPT_NORMALIZATIONS[transcript] ?? '',
  );
}