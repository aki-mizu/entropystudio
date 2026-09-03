import {
  CardHashMethod,
  DirectCardStep,
  cardTranscriptToEntropy,
  directCardState as nativeDirectCardState,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  mnemonicToEntropy,
} from '../../native/entropyStudio';
import type { DirectCardState } from '../../native/entropyStudio';
import type { WordCount } from '../dice/dice';
import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';

export const CARD_METHODS = ['hashed', 'direct'] as const;
export const CARD_RANKS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
] as const;
export const CARD_SUITS = [
  { code: 'S', symbol: '\u2660', red: false },
  { code: 'H', symbol: '\u2665', red: true },
  { code: 'C', symbol: '\u2663', red: false },
  { code: 'D', symbol: '\u2666', red: true },
] as const;
export const DIRECT_CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8'] as const;

const HASHED_CARD_COUNTS = {
  12: 25,
  15: 31,
  18: 39,
  21: 50,
  24: 58,
} as const;

const HASHED_FIRST_SHUFFLE_COUNTS = {
  12: 25,
  15: 31,
  18: 39,
  21: 50,
  24: 52,
} as const;

const DIRECT_CARD_FINAL_DRAWS = {
  12: 3,
  15: 2,
  18: 2,
  21: 2,
  24: 1,
} as const;

const CARD_SEPARATOR = /[\s,.;:_|/-]/;
const CARD_SEPARATOR_PATTERN = /[\s,.;:_|/-]+/;
const CARD_TOKEN_PATTERN = /10[CDHS\u2660\u2663\u2665\u2666]|[A2-9TJQK][CDHS\u2660\u2663\u2665\u2666]/gi;
const CARD_TYPED_CHARACTER = /^[A2-9TJQKCDHS10\s,.;:_|/\-\u2660\u2663\u2665\u2666]$/i;
const TEXT_EDITING_KEYS = new Set(['Backspace', 'Delete', 'Enter', 'Tab']);

export type CardMethod = (typeof CARD_METHODS)[number];
export type CardRank = (typeof CARD_RANKS)[number];
export type CardSuit = (typeof CARD_SUITS)[number]['code'];
export type CardSelectionState = {
  readonly availableRanks: readonly CardRank[];
  readonly availableSuits: readonly CardSuit[];
  readonly compatibleRanks: readonly CardRank[];
  readonly compatibleSuits: readonly CardSuit[];
};
export type CardResult =
  | { readonly entropy: string; readonly mnemonic: string; readonly error?: never }
  | { readonly entropy?: never; readonly mnemonic?: never; readonly error: string };

export function isHashedCardMethod(method: CardMethod): method is 'hashed' {
  return method === 'hashed';
}

export function cardMethodCopy(method: CardMethod, wordCount: WordCount) {
  if (method === 'direct') {
    return {
      description: entropyLabEnglish['cards.direct.desc'],
      title: entropyLabEnglish['cards.direct.title'],
    };
  }

  const recommendation =
    wordCount === 24
      ? entropyLabEnglish['cards.hashed.recommended24']
      : formatCopy(entropyLabEnglish['cards.hashed.recommendedN'], {
          n: hashedCardsNeeded(wordCount),
        });
  const hashedDescription = formatCopy(entropyLabEnglish['cards.hashed.desc'], {
    recommended: recommendation,
  });

  return {
    description: hashedDescription,
    title: entropyLabEnglish['cards.hashed.title'],
  };
}

export function cardScreenCopy(
  method: CardMethod,
  wordCount: WordCount,
  matchesIanColeman: boolean,
) {
  const isDirect = method === 'direct';
  const deal =
    wordCount === 24
      ? entropyLabEnglish['cards.help.deal24']
      : formatCopy(entropyLabEnglish['cards.help.dealN'], { n: hashedCardsNeeded(wordCount) });

  return {
    deriveAction: entropyLabEnglish['action.derive'],
    how: formatCopy(entropyLabEnglish['cards.how'], { words: wordCount }),
    inputHelp: isDirect
      ? formatCopy(entropyLabEnglish['cards.help.direct'], { partialWords: wordCount - 1 })
      : formatCopy(entropyLabEnglish['cards.help.hashed'], { deal }),
    inputLabel: isDirect
      ? entropyLabEnglish['cards.transcriptDirect']
      : entropyLabEnglish['cards.transcript'],
    inputPlaceholder: isDirect
      ? 'A284 37A2...'
      : matchesIanColeman
        ? 'A\u2660 2\u2663 T\u2665 T\u2666...'
        : 'As Th Td...',
    mode: entropyLabEnglish['mode.cards'],
    resultEntropy: entropyLabEnglish['result.entropyHex'],
    seedLengthLabel: entropyLabEnglish['seedLength.label'],
    seedLengthValue: formatCopy(entropyLabEnglish['seedLength.words'], { n: wordCount }),
    wordSlotsAria: formatCopy(entropyLabEnglish['seed.wordSlotsAria'], { n: wordCount }),
  };
}

export function hashedCardsNeeded(wordCount: WordCount): number {
  return HASHED_CARD_COUNTS[wordCount];
}

export function directCardTotalDraws(wordCount: WordCount): number {
  return (wordCount - 1) * 4 + DIRECT_CARD_FINAL_DRAWS[wordCount];
}

export function normalizeCardToken(token: string): string | null {
  const normalized = token
    .trim()
    .toUpperCase()
    .replace(/\u2660/g, 'S')
    .replace(/\u2665/g, 'H')
    .replace(/\u2666/g, 'D')
    .replace(/\u2663/g, 'C')
    .replace(/^10/, 'T');

  return /^[A2-9TJQK][CDHS]$/.test(normalized) ? normalized : null;
}

export function formatCardTranscript(
  transcript: string,
  matchesIanColeman: boolean,
): string {
  return transcript.replace(CARD_TOKEN_PATTERN, token => {
    const card = normalizeCardToken(token);
    if (!card) {
      return token;
    }

    const rank = card[0];
    const suit = card[1];
    if (!matchesIanColeman) {
      return `${rank}${suit.toLowerCase()}`;
    }

    return `${rank}${
      suit === 'C' ? '\u2663' : suit === 'D' ? '\u2666' : suit === 'H' ? '\u2665' : '\u2660'
    }`;
  });
}

export function isCardKeyAllowed(
  key: string,
  method: CardMethod,
  activeMax = 0,
): boolean {
  if (TEXT_EDITING_KEYS.has(key) || key.startsWith('Arrow')) {
    return true;
  }
  if (method !== 'direct') {
    return CARD_TYPED_CHARACTER.test(key);
  }
  if (CARD_SEPARATOR.test(key)) {
    return true;
  }

  const rank = key.toUpperCase();
  return rank === 'A'
    ? activeMax > 0
    : /^[2-8]$/.test(rank) && Number(rank) <= activeMax;
}

export function cardIsAvailable(
  transcript: string,
  candidate: string,
  wordCount: WordCount,
): boolean {
  return availableCardCodes(transcript, wordCount).includes(candidate);
}

export function cardSelectionState(
  transcript: string,
  wordCount: WordCount,
  selectedRank: CardRank | null,
  selectedSuit: CardSuit | null,
): CardSelectionState {
  const availableCards = availableCardCodes(transcript, wordCount);
  const availableSuits = CARD_SUITS.map(suit => suit.code).filter(suit =>
    availableCards.some(card => card.endsWith(suit)),
  );
  const availableRanks = CARD_RANKS.filter(rank =>
    availableCards.some(card => card.startsWith(rank)),
  );

  return {
    availableRanks,
    availableSuits,
    compatibleRanks: selectedSuit
      ? availableRanks.filter(rank => availableCards.includes(`${rank}${selectedSuit}`))
      : availableRanks,
    compatibleSuits: selectedRank
      ? availableSuits.filter(suit => availableCards.includes(`${selectedRank}${suit}`))
      : availableSuits,
  };
}

export function getDirectCardState(
  transcript: string,
  wordCount: WordCount,
): DirectCardState {
  return nativeDirectCardState(transcript, wordCount);
}

export function hasHashedCardInput(transcript: string): boolean {
  return Array.from(transcript).some(character => !CARD_SEPARATOR.test(character));
}

export function hashedCardProgress(transcript: string, wordCount: WordCount): number {
  return Math.min(canonicalCardTokens(transcript).length / hashedCardsNeeded(wordCount), 1);
}

export function hashedCardProgressCopy(transcript: string, wordCount: WordCount): string {
  const count = canonicalCardTokens(transcript).length;
  const needed = hashedCardsNeeded(wordCount);
  const bits = cardsWithoutReplacementBits(count, wordCount).toFixed(1);

  if (count === 0) {
    return formatCopy(entropyLabEnglish['cards.meta.hashedEmpty'], { need: needed });
  }
  if (count < needed) {
    return formatCopy(entropyLabEnglish['cards.meta.hashedMissing'], {
      bits,
      have: count,
      missing: needed - count,
      need: needed,
    });
  }

  const ready = formatCopy(
    entropyLabEnglish[
      count === 1 ? 'cards.meta.hashedReadyOne' : 'cards.meta.hashedReady'
    ],
    { bits, n: count },
  );
  if (count === needed) {
    return ready;
  }
  return `${ready} ${formatCopy(
    entropyLabEnglish[
      count - needed === 1 ? 'cards.meta.hashedExtraOne' : 'cards.meta.hashedExtra'
    ],
    { n: count - needed },
  )}`;
}

export function directCardProgress(state: DirectCardState, transcript: string, wordCount: WordCount): number {
  return Math.min(countDirectCardDraws(transcript) / directCardTotalDraws(wordCount), 1);
}

export function directCardProgressCopy(
  state: DirectCardState,
  transcript: string,
  wordCount: WordCount,
): string {
  const entered = countDirectCardDraws(transcript);
  const needed = directCardTotalDraws(wordCount);
  if (state.complete) {
    return formatCopy(entropyLabEnglish['cards.meta.directComplete'], {
      have: entered,
      need: needed,
      words: wordCount,
    });
  }
  if (state.extraCount > 0) {
    return formatCopy(
      entropyLabEnglish[
        state.extraCount === 1 ? 'cards.meta.extraCard' : 'cards.meta.extraCards'
      ],
      { n: state.extraCount },
    );
  }
  if (state.invalidCount > 0) {
    return formatCopy(
      entropyLabEnglish[
        state.invalidCount === 1 ? 'cards.meta.invalidRank' : 'cards.meta.invalidRanks'
      ],
      { n: state.invalidCount },
    );
  }

  const set = directRankSet(state.activeMax);
  const step =
    state.step === DirectCardStep.Word
      ? formatCopy(
          entropyLabEnglish[
            state.activeDraw === 1 ? 'cards.meta.directWord' : 'cards.meta.directWordShuffle'
          ],
          {
            draw: state.activeDraw,
            set,
            word: state.activeWord,
            words: wordCount,
          },
        )
      : state.step === DirectCardStep.Final
        ? formatCopy(entropyLabEnglish['cards.meta.directFinal'], {
            draw: state.activeDraw,
            need: DIRECT_CARD_FINAL_DRAWS[wordCount],
            set,
          })
        : entropyLabEnglish['error.directChecksum'];
  return formatCopy(entropyLabEnglish['cards.meta.directProgress'], {
    have: entered,
    need: needed,
    step,
  });
}

export function cardInstruction(
  method: CardMethod,
  transcript: string,
  wordCount: WordCount,
  directState: DirectCardState | null,
): string {
  if (method === 'direct') {
    if (!directState || directState.complete || directState.step === DirectCardStep.Correction) {
      return '';
    }
    return formatCopy(
      entropyLabEnglish[
        countDirectCardDraws(transcript) === 0
          ? 'cards.instruct.directFirst'
          : 'cards.instruct.directNext'
      ],
      { set: directRankSet(directState.activeMax) },
    );
  }

  const count = canonicalCardTokens(transcript).length;
  const firstShuffleCards = HASHED_FIRST_SHUFFLE_COUNTS[wordCount];
  if (count >= hashedCardsNeeded(wordCount)) {
    return '';
  }
  if (count === 0) {
    return entropyLabEnglish['cards.instruct.hashedFirst'];
  }
  if (wordCount === 24 && count === firstShuffleCards) {
    return entropyLabEnglish['cards.instruct.hashedAgain'];
  }
  if (wordCount === 24 && count > firstShuffleCards) {
    return entropyLabEnglish['cards.instruct.hashedSecond'];
  }
  return entropyLabEnglish['cards.instruct.hashedNext'];
}

export function deriveHashedCardResult(
  transcript: string,
  matchesIanColeman: boolean,
  wordCount: WordCount,
): CardResult {
  try {
    const entropy = cardTranscriptToEntropy(
      transcript,
      matchesIanColeman ? CardHashMethod.Coleman : CardHashMethod.Ascii,
      wordCount,
    );
    return {
      entropy: arrayBufferToHex(entropy),
      mnemonic: entropyToMnemonic(entropy),
    };
  } catch (error) {
    return { error: upstreamCardError(error, transcript, wordCount) };
  }
}

export function deriveDirectCardResult(state: DirectCardState): CardResult {
  if (!state.complete || !state.finalWord) {
    return { error: entropyLabEnglish['error.generic'] };
  }

  const mnemonic = [...state.words, state.finalWord].join(' ');
  try {
    return {
      entropy: arrayBufferToHex(mnemonicToEntropy(mnemonic)),
      mnemonic,
    };
  } catch {
    return { error: entropyLabEnglish['error.directChecksum'] };
  }
}

function canonicalCardTokens(transcript: string): string[] {
  return transcript
    .split(CARD_SEPARATOR_PATTERN)
    .filter(Boolean)
    .flatMap(token => {
      const card = normalizeCardToken(token);
      return card ? [card] : [];
    });
}

function availableCardCodes(transcript: string, wordCount: WordCount): string[] {
  const cards = canonicalCardTokens(transcript);
  const firstShuffleCards = HASHED_FIRST_SHUFFLE_COUNTS[wordCount];
  const currentShuffle =
    cards.length < firstShuffleCards ? cards : cards.slice(firstShuffleCards);

  return CARD_SUITS.flatMap(suit =>
    CARD_RANKS.map(rank => `${rank}${suit.code}`).filter(card => !currentShuffle.includes(card)),
  );
}

function cardsWithoutReplacementBits(count: number, wordCount: WordCount): number {
  const firstShuffleCards = HASHED_FIRST_SHUFFLE_COUNTS[wordCount];
  return Array.from({ length: Math.min(count, 104) }, (_, index) => {
    const cardPosition = index < firstShuffleCards ? index : index - firstShuffleCards;
    return Math.log2(52 - cardPosition);
  }).reduce((bits, cardBits) => bits + cardBits, 0);
}

function countDirectCardDraws(transcript: string): number {
  return Array.from(transcript).filter(character => !CARD_SEPARATOR.test(character)).length;
}

function directRankSet(max: number): string {
  return max > 0 ? `A-${max}` : 'A-8';
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

function formatCopy(template: string, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function upstreamCardError(error: unknown, transcript: string, wordCount: WordCount): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.InvalidCardTranscript) {
    const ignored = transcript
      .split(CARD_SEPARATOR_PATTERN)
      .filter(token => token && !normalizeCardToken(token))
      .slice(0, 8)
      .join(' ');
    return formatCopy(entropyLabEnglish['error.cardsFormat'], { ignored });
  }
  if (tag === EntropyStudioError_Tags.DuplicateCard) {
    return formatCopy(entropyLabEnglish['error.cardsDuplicate'], {
      card: firstDuplicateCard(transcript, wordCount),
    });
  }
  if (tag === EntropyStudioError_Tags.NoCards) {
    return entropyLabEnglish['error.cardsEmpty'];
  }
  return entropyLabEnglish['error.generic'];
}

function firstDuplicateCard(transcript: string, wordCount: WordCount): string {
  const firstShuffleCards = HASHED_FIRST_SHUFFLE_COUNTS[wordCount];
  const seen = new Set<string>();
  for (const [index, card] of canonicalCardTokens(transcript).entries()) {
    if (index === firstShuffleCards) {
      seen.clear();
    }
    if (seen.has(card)) {
      return card;
    }
    seen.add(card);
  }
  return '';
}