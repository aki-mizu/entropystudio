import { useEffect, useMemo, useState } from 'react';
import {
  cardInstruction,
  cardScreenCopy,
  deriveDirectCardResult,
  deriveHashedCardResult,
  directCardProgress,
  directCardProgressCopy,
  formatCardTranscript,
  getHashedCardState,
  normalizeDirectCardTranscript,
  getDirectCardState,
  hasHashedCardInput,
  hashedCardProgress,
  hashedCardProgressCopy,
  isHashedCardMethod,
} from './cards';
import type { CardMethod, CardResult } from './cards';
import type { WordCount } from '../dice/dice';
import type { EntropySyncSnapshot } from '../../native/entropyStudio';

type CardsInputChange = {
  readonly matchesIanColeman: boolean;
  readonly method: CardMethod;
  readonly transcript: string;
  readonly wordCount: WordCount;
};

type UseCardsOptions = {
  readonly onInputChange?: (change: CardsInputChange) => void;
  readonly passphrase?: string;
  readonly snapshot?: EntropySyncSnapshot | null;
  readonly targetWords?: WordCount;
};

export function useCards(options: UseCardsOptions = {}) {
  const {
    onInputChange,
    passphrase = '',
    snapshot: syncSnapshot,
    targetWords: syncTargetWords,
  } = options;
  const [hashedTranscript, setHashedTranscript] = useState('');
  const [directTranscript, setDirectTranscript] = useState('');
  const [method, setMethod] = useState<CardMethod>('hashed');
  const [matchesIanColeman, setMatchesIanColeman] = useState(false);
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<CardResult | null>(null);
  const transcript = method === 'direct' ? directTranscript : hashedTranscript;
  const directState = useMemo(
    () => (method === 'direct' ? getDirectCardState(directTranscript, wordCount) : null),
    [directTranscript, method, wordCount],
  );
  const hashedState = useMemo(
    () =>
      isHashedCardMethod(method)
        ? getHashedCardState(hashedTranscript, wordCount)
        : null,
    [hashedTranscript, method, wordCount],
  );
  const hashedResult = useMemo(
    () =>
      isHashedCardMethod(method) && hashedState && hasHashedCardInput(hashedState)
        ? deriveHashedCardResult(
            hashedTranscript,
            matchesIanColeman,
            wordCount,
            hashedState,
            passphrase,
          )
        : null,
    [hashedState, hashedTranscript, matchesIanColeman, method, passphrase, wordCount],
  );
  const progress = isHashedCardMethod(method)
    ? hashedState
      ? hashedCardProgress(hashedState)
      : 0
    : directState
      ? directCardProgress(directState)
      : 0;
  const progressText = isHashedCardMethod(method)
    ? hashedState
      ? hashedCardProgressCopy(hashedState)
      : ''
    : directState
      ? directCardProgressCopy(directState, wordCount)
      : '';
  const canDerive = isHashedCardMethod(method)
    ? Boolean(hashedState && hasHashedCardInput(hashedState))
    : Boolean(directState?.complete);
  const copy = cardScreenCopy(method, wordCount, matchesIanColeman, directState);
  const instruction = cardInstruction(method, wordCount, hashedState, directState);

  useEffect(() => {
    if (syncTargetWords === undefined) {
      return;
    }

    if (syncSnapshot) {
      setDirectTranscript(syncSnapshot.directCards);
      setResult(null);
    }
    setWordCount(syncTargetWords);
  }, [syncSnapshot, syncTargetWords]);

  function notifyInputChange(nextTranscript: string, nextMatchesIanColeman = matchesIanColeman) {
    onInputChange?.({
      matchesIanColeman: nextMatchesIanColeman,
      method,
      transcript: nextTranscript,
      wordCount,
    });
  }

  function updateTranscript(value: string) {
    const nextTranscript =
      method === 'direct'
        ? normalizeDirectCardTranscript(value)
        : formatCardTranscript(value, matchesIanColeman);
    if (method === 'direct') {
      setDirectTranscript(nextTranscript);
    } else {
      setHashedTranscript(nextTranscript);
    }
    setResult(null);
    notifyInputChange(nextTranscript);
  }

  function appendCard(card: string) {
    const trimmed = hashedTranscript.trim();
    const formattedCard = isHashedCardMethod(method)
      ? formatCardTranscript(card, matchesIanColeman)
      : card;
    const nextTranscript = `${trimmed}${trimmed ? ' ' : ''}${formattedCard}`;
    setHashedTranscript(nextTranscript);
    setResult(null);
    notifyInputChange(nextTranscript);
  }

  function appendDirectRank(rank: string) {
    const nextTranscript = `${normalizeDirectCardTranscript(directTranscript)}${rank}`;
    setDirectTranscript(nextTranscript);
    setResult(null);
    notifyInputChange(nextTranscript);
  }

  function undoLastEntry() {
    const nextTranscript =
      method === 'direct'
        ? normalizeDirectCardTranscript(directTranscript).slice(0, -1)
        : hashedTranscript
            .trimEnd()
            .replace(/[^\s,.;:_|/-]+$/, '')
            .trimEnd();
    if (method === 'direct') {
      setDirectTranscript(nextTranscript);
    } else {
      setHashedTranscript(nextTranscript);
    }
    setResult(null);
    notifyInputChange(nextTranscript);
  }

  function selectMethod(value: CardMethod) {
    setMethod(value);
    setResult(null);
  }

  function selectIanColemanMatch(value: boolean) {
    const nextTranscript = formatCardTranscript(hashedTranscript, value);
    setMatchesIanColeman(value);
    setHashedTranscript(nextTranscript);
    setResult(null);
    notifyInputChange(nextTranscript, value);
  }

  function derivePhrase() {
    if (!canDerive) {
      return;
    }
    if (isHashedCardMethod(method) && hashedState) {
      setResult(
        deriveHashedCardResult(
          hashedTranscript,
          matchesIanColeman,
          wordCount,
          hashedState,
          passphrase,
        ),
      );
    } else if (directState) {
      setResult(deriveDirectCardResult(directState, passphrase));
    }
  }

  return {
    appendCard,
    appendDirectRank,
    canDerive,
    copy,
    directState,
    derivePhrase,
    hashedState,
    instruction,
    matchesIanColeman,
    method,
    progress,
    progressText,
    result: isHashedCardMethod(method) ? hashedResult : result,
    selectIanColemanMatch,
    selectMethod,
    transcript,
    undoLastEntry,
    updateTranscript,
    wordCount,
  };
}