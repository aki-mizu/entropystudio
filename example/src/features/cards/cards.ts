import {
  CardHashMethod,
  CardInputMethod,
  DirectCardStep,
  HashedCardInstruction,
  bip39EntropyBits,
  cardKeyAllowed as nativeCardKeyAllowed,
  cardTranscriptToEntropy,
  directCardState as nativeDirectCardState,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  hashedCardState as nativeHashedCardState,
  mnemonicToEntropy,
  mnemonicToSeed,
  normalizeCardToken as nativeNormalizeCardToken,
  normalizeDirectCardTranscript as nativeNormalizeDirectCardTranscript,
} from '../../native/entropyStudio';
import type { DirectCardState, HashedCardState } from '../../native/entropyStudio';
import type { WordCount } from '../dice/dice';
import { formatCopy, UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../upstreamUiCopy';

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
  { code: 'S', label: UPSTREAM_UI_FALLBACK_COPY.cards.suits.spades, symbol: '\u2660', red: false },
  { code: 'H', label: UPSTREAM_UI_FALLBACK_COPY.cards.suits.hearts, symbol: '\u2665', red: true },
  { code: 'C', label: UPSTREAM_UI_FALLBACK_COPY.cards.suits.clubs, symbol: '\u2663', red: false },
  { code: 'D', label: UPSTREAM_UI_FALLBACK_COPY.cards.suits.diamonds, symbol: '\u2666', red: true },
] as const;
export const DIRECT_CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8'] as const;

const CARD_TOKEN_PATTERN = /10[CDHS\u2660\u2663\u2665\u2666]|[A2-9TJQK][CDHS\u2660\u2663\u2665\u2666]/gi;

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

export function isHashedCardMethod(method: CardMethod): method is 'hashed' {
  return method === 'hashed';
}

export function cardMethodCopy(method: CardMethod, wordCount: WordCount) {
  if (method === 'direct') {
    return {
      description: UPSTREAM_TEXT.cards.direct.desc,
      title: UPSTREAM_TEXT.cards.direct.title,
    };
  }

  const recommendation =
    wordCount === 24
      ? UPSTREAM_TEXT.cards.hashed.recommended24
      : formatCopy(UPSTREAM_TEXT.cards.hashed.recommendedN, {
          n: hashedCardsNeeded(wordCount),
        });
  const hashedDescription = formatCopy(UPSTREAM_TEXT.cards.hashed.desc, {
    recommended: recommendation,
  });

  return {
    description: hashedDescription,
    title: UPSTREAM_TEXT.cards.hashed.title,
  };
}

export function cardScreenCopy(
  method: CardMethod,
  wordCount: WordCount,
  matchesIanColeman: boolean,
  directState: DirectCardState | null,
) {
  const isDirect = method === 'direct';
  const deal =
    wordCount === 24
      ? UPSTREAM_UI_FALLBACK_COPY.cards.deal24
      : UPSTREAM_UI_FALLBACK_COPY.cards.dealN(hashedCardsNeeded(wordCount));

  return {
    deriveAction: UPSTREAM_TEXT.action.derive,
    how: formatCopy(UPSTREAM_TEXT.cards.how, { words: wordCount }),
    inputHelp: isDirect
      ? UPSTREAM_UI_FALLBACK_COPY.cards.directHelp(wordCount - 1)
      : UPSTREAM_UI_FALLBACK_COPY.cards.hashedInputHelp(deal),
    inputLabel: isDirect
      ? UPSTREAM_UI_FALLBACK_COPY.cards.directTranscript
      : UPSTREAM_TEXT.cards.transcript,
    inputPlaceholder: isDirect
      ? UPSTREAM_UI_FALLBACK_COPY.cards.placeholders.direct
      : matchesIanColeman
        ? UPSTREAM_UI_FALLBACK_COPY.cards.placeholders.ianColeman
        : UPSTREAM_UI_FALLBACK_COPY.cards.placeholders.standard,
    methodRequirement: cardMethodRequirement(method, wordCount, directState),
    mode: UPSTREAM_TEXT.mode.cards,
    resultEntropy: UPSTREAM_TEXT.result.entropyHex,
    resultMasterSeed: UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex,
    seedLengthLabel: UPSTREAM_TEXT.seedLength.label,
    seedLengthValue: formatCopy(UPSTREAM_TEXT.seedLength.words, { n: wordCount }),
  };
}

function cardMethodRequirement(
  method: CardMethod,
  wordCount: WordCount,
  directState: DirectCardState | null,
): string {
  if (method === 'direct') {
    return directState
      ? formatCopy(UPSTREAM_TEXT.cards.directRequirement, {
          final: directState.finalDraws,
          partial: directState.partialWords,
          words: wordCount,
        })
      : '';
  }

  if (wordCount === 24) {
    return UPSTREAM_TEXT.cards.hashedRequirement24;
  }

  return formatCopy(UPSTREAM_TEXT.cards.hashedRequirement, {
    bits: bip39EntropyBits(wordCount),
    first: getHashedCardState('', wordCount).firstShuffleCards,
    words: wordCount,
  });
}

export function hashedCardsNeeded(wordCount: WordCount): number {
  return getHashedCardState('', wordCount).requiredCards;
}

export function normalizeCardToken(token: string): string | null {
  return nativeNormalizeCardToken(token) || null;
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

export function normalizeDirectCardTranscript(transcript: string): string {
  return nativeNormalizeDirectCardTranscript(transcript);
}

export function formatDirectCardTranscript(transcript: string): string {
  return normalizeDirectCardTranscript(transcript).replace(/(.{4})(?=.)/g, '$1 ');
}

export function isCardKeyAllowed(
  key: string,
  method: CardMethod,
  activeMax = 0,
): boolean {
  return nativeCardKeyAllowed(
    key,
    method === 'direct' ? CardInputMethod.Direct : CardInputMethod.Hashed,
    activeMax,
  );
}

export function cardIsAvailable(
  state: HashedCardState,
  candidate: string,
): boolean {
  return state.availableCards.includes(candidate);
}

export function cardSelectionState(
  state: HashedCardState,
  selectedRank: CardRank | null,
  selectedSuit: CardSuit | null,
): CardSelectionState {
  const { availableCards } = state;
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

export function getHashedCardState(transcript: string, wordCount: WordCount): HashedCardState {
  return nativeHashedCardState(transcript, wordCount);
}

export function getDirectCardState(
  transcript: string,
  wordCount: WordCount,
): DirectCardState {
  return nativeDirectCardState(transcript, wordCount);
}

export function hasHashedCardInput(state: HashedCardState): boolean {
  return state.hasInput;
}

export function hashedCardProgress(state: HashedCardState): number {
  return state.progress;
}

export function hashedCardProgressCopy(state: HashedCardState): string {
  const { cardCount: count, requiredCards: needed } = state;
  const bits = state.entropyBits.toFixed(1);

  if (count === 0) {
    return formatCopy(UPSTREAM_TEXT.cards.meta.hashedEmpty, { need: needed });
  }
  if (count < needed) {
    return formatCopy(UPSTREAM_TEXT.cards.meta.hashedMissing, {
      bits,
      have: count,
      missing: needed - count,
      need: needed,
    });
  }

  const ready = formatCopy(
    count === 1
      ? UPSTREAM_TEXT.cards.meta.hashedReadyOne
      : UPSTREAM_TEXT.cards.meta.hashedReady,
    { bits, n: count },
  );
  if (count === needed) {
    return ready;
  }
  return `${ready} ${formatCopy(
    count - needed === 1
      ? UPSTREAM_TEXT.cards.meta.hashedExtraOne
      : UPSTREAM_TEXT.cards.meta.hashedExtra,
    { n: count - needed },
  )}`;
}

export function directCardProgress(state: DirectCardState): number {
  return state.progress;
}

export function directCardProgressCopy(
  state: DirectCardState,
  wordCount: WordCount,
): string {
  const entered = state.enteredDraws;
  const needed = state.requiredDraws;
  if (state.complete) {
    return UPSTREAM_UI_FALLBACK_COPY.cards.directComplete(entered, needed, wordCount);
  }
  if (state.extraCount > 0) {
    return state.extraCount === 1
      ? UPSTREAM_UI_FALLBACK_COPY.cards.extraCard(state.extraCount)
      : UPSTREAM_UI_FALLBACK_COPY.cards.extraCards(state.extraCount);
  }
  if (state.invalidCount > 0) {
    return state.invalidCount === 1
      ? UPSTREAM_UI_FALLBACK_COPY.cards.invalidRank(state.invalidCount)
      : UPSTREAM_UI_FALLBACK_COPY.cards.invalidRanks(state.invalidCount);
  }

  const set = directRankSet(state.activeMax);
  const step =
    state.step === DirectCardStep.Word
      ? formatCopy(
          state.activeDraw === 1
            ? UPSTREAM_TEXT.cards.meta.directWord
            : UPSTREAM_TEXT.cards.meta.directWordShuffle,
          {
            draw: state.activeDraw,
            set,
            word: state.activeWord,
            words: wordCount,
          },
        )
      : state.step === DirectCardStep.Final
        ? formatCopy(UPSTREAM_TEXT.cards.meta.directFinal, {
            draw: state.activeDraw,
            need: state.finalDraws,
            set,
          })
        : UPSTREAM_UI_FALLBACK_COPY.cards.checksumError;
  return UPSTREAM_UI_FALLBACK_COPY.cards.directProgress(entered, needed, step);
}

export function cardInstruction(
  method: CardMethod,
  wordCount: WordCount,
  hashedState: HashedCardState | null,
  directState: DirectCardState | null,
): string {
  if (method === 'direct') {
    if (!directState || directState.complete || directState.step === DirectCardStep.Correction) {
      return '';
    }
    return formatCopy(
      directState.enteredDraws === 0
        ? UPSTREAM_TEXT.cards.instruct.directFirst
        : UPSTREAM_TEXT.cards.instruct.directNext,
      { set: directRankSet(directState.activeMax) },
    );
  }

  if (!hashedState) {
    return '';
  }
  switch (hashedState.instruction) {
    case HashedCardInstruction.Empty:
      return UPSTREAM_TEXT.cards.instruct.hashedFirst;
    case HashedCardInstruction.FirstShuffle:
      return UPSTREAM_TEXT.cards.instruct.hashedNext;
    case HashedCardInstruction.ShuffleAgain:
      return UPSTREAM_TEXT.cards.instruct.hashedAgain;
    case HashedCardInstruction.SecondShuffle:
      return UPSTREAM_TEXT.cards.instruct.hashedSecond;
    case HashedCardInstruction.Complete:
      return '';
  }
}

export function deriveHashedCardResult(
  transcript: string,
  matchesIanColeman: boolean,
  wordCount: WordCount,
  state: HashedCardState,
  passphrase: string,
): CardResult {
  try {
    const entropy = cardTranscriptToEntropy(
      transcript,
      matchesIanColeman ? CardHashMethod.Coleman : CardHashMethod.Ascii,
      wordCount,
    );
    const mnemonic = entropyToMnemonic(entropy);
    return {
      entropy: arrayBufferToHex(entropy),
      masterSeed: arrayBufferToHex(mnemonicToSeed(mnemonic, passphrase)),
      mnemonic,
    };
  } catch (error) {
    return { error: upstreamCardError(error, state) };
  }
}

export function deriveDirectCardResult(state: DirectCardState, passphrase: string): CardResult {
  if (!state.complete || !state.finalWord) {
    return { error: UPSTREAM_TEXT.error.generic };
  }

  const mnemonic = [...state.words, state.finalWord].join(' ');
  try {
    return {
      entropy: arrayBufferToHex(mnemonicToEntropy(mnemonic)),
      masterSeed: arrayBufferToHex(mnemonicToSeed(mnemonic, passphrase)),
      mnemonic,
    };
  } catch {
    return { error: UPSTREAM_UI_FALLBACK_COPY.cards.checksumError };
  }
}

function directRankSet(max: number): string {
  return max > 0 ? `A-${max}` : 'A-8';
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

function upstreamCardError(error: unknown, state: HashedCardState): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.InvalidCardTranscript) {
    const ignored = state.invalidTokens.slice(0, 8).join(' ');
    return UPSTREAM_UI_FALLBACK_COPY.cards.formatError(ignored);
  }
  if (tag === EntropyStudioError_Tags.DuplicateCard) {
    return UPSTREAM_UI_FALLBACK_COPY.cards.duplicateError(state.firstDuplicateCard);
  }
  if (tag === EntropyStudioError_Tags.NoCards) {
    return UPSTREAM_UI_FALLBACK_COPY.cards.emptyError;
  }
  return UPSTREAM_TEXT.error.generic;
}