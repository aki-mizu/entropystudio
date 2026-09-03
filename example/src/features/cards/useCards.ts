import { useMemo, useState } from 'react';
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

export function useCards() {
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
        ? deriveHashedCardResult(hashedTranscript, matchesIanColeman, wordCount, hashedState)
        : null,
    [hashedState, hashedTranscript, matchesIanColeman, method, wordCount],
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
  const copy = cardScreenCopy(method, wordCount, matchesIanColeman);
  const instruction = cardInstruction(method, wordCount, hashedState, directState);

  function updateTranscript(value: string) {
    if (method === 'direct') {
      setDirectTranscript(normalizeDirectCardTranscript(value));
    } else {
      setHashedTranscript(formatCardTranscript(value, matchesIanColeman));
    }
    setResult(null);
  }

  function appendCard(card: string) {
    const trimmed = hashedTranscript.trim();
    const formattedCard = isHashedCardMethod(method)
      ? formatCardTranscript(card, matchesIanColeman)
      : card;
    setHashedTranscript(`${trimmed}${trimmed ? ' ' : ''}${formattedCard}`);
    setResult(null);
  }

  function appendDirectRank(rank: string) {
    setDirectTranscript(`${normalizeDirectCardTranscript(directTranscript)}${rank}`);
    setResult(null);
  }

  function undoLastEntry() {
    if (method === 'direct') {
      setDirectTranscript(normalizeDirectCardTranscript(directTranscript).slice(0, -1));
    } else {
      setHashedTranscript(
        hashedTranscript
          .trimEnd()
          .replace(/[^\s,.;:_|/-]+$/, '')
          .trimEnd(),
      );
    }
    setResult(null);
  }

  function selectMethod(value: CardMethod) {
    setMethod(value);
    setResult(null);
  }

  function selectIanColemanMatch(value: boolean) {
    setMatchesIanColeman(value);
    setHashedTranscript(current => formatCardTranscript(current, value));
    setResult(null);
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  function derivePhrase() {
    if (!canDerive) {
      return;
    }
    if (isHashedCardMethod(method) && hashedState) {
      setResult(deriveHashedCardResult(hashedTranscript, matchesIanColeman, wordCount, hashedState));
    } else if (directState) {
      setResult(deriveDirectCardResult(directState));
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
    selectWordCount,
    transcript,
    undoLastEntry,
    updateTranscript,
    wordCount,
  };
}