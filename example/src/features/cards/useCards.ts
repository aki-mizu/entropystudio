import { useMemo, useState } from 'react';
import {
  cardInstruction,
  cardScreenCopy,
  deriveDirectCardResult,
  deriveHashedCardResult,
  directCardProgress,
  directCardProgressCopy,
  formatCardTranscript,
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
  const [method, setMethod] = useState<CardMethod>('ascii');
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<CardResult | null>(null);
  const transcript = method === 'direct' ? directTranscript : hashedTranscript;
  const directState = useMemo(
    () => (method === 'direct' ? getDirectCardState(directTranscript, wordCount) : null),
    [directTranscript, method, wordCount],
  );
  const hashedResult = useMemo(
    () =>
      isHashedCardMethod(method) && hasHashedCardInput(hashedTranscript)
        ? deriveHashedCardResult(hashedTranscript, method, wordCount)
        : null,
    [hashedTranscript, method, wordCount],
  );
  const progress = isHashedCardMethod(method)
    ? hashedCardProgress(hashedTranscript, wordCount)
    : directState
      ? directCardProgress(directState, directTranscript, wordCount)
      : 0;
  const progressText = isHashedCardMethod(method)
    ? hashedCardProgressCopy(hashedTranscript, wordCount)
    : directState
      ? directCardProgressCopy(directState, directTranscript, wordCount)
      : '';
  const canDerive = isHashedCardMethod(method)
    ? hasHashedCardInput(hashedTranscript)
    : Boolean(directState?.complete);
  const copy = cardScreenCopy(method, wordCount);
  const instruction = cardInstruction(method, transcript, wordCount, directState);

  function updateTranscript(value: string) {
    if (method === 'direct') {
      setDirectTranscript(value);
    } else {
      setHashedTranscript(formatCardTranscript(value, method));
    }
    setResult(null);
  }

  function appendCard(card: string) {
    const trimmed = hashedTranscript.trim();
    const formattedCard = isHashedCardMethod(method)
      ? formatCardTranscript(card, method)
      : card;
    setHashedTranscript(`${trimmed}${trimmed ? ' ' : ''}${formattedCard}`);
    setResult(null);
  }

  function appendDirectRank(rank: string) {
    setDirectTranscript(`${directTranscript}${rank}`);
    setResult(null);
  }

  function undoLastEntry() {
    if (method === 'direct') {
      setDirectTranscript(directTranscript.trimEnd().slice(0, -1));
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

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  function derivePhrase() {
    if (!canDerive) {
      return;
    }
    if (isHashedCardMethod(method)) {
      setResult(deriveHashedCardResult(hashedTranscript, method, wordCount));
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
    instruction,
    method,
    progress,
    progressText,
    result: isHashedCardMethod(method) ? hashedResult : result,
    selectMethod,
    selectWordCount,
    transcript,
    undoLastEntry,
    updateTranscript,
    wordCount,
  };
}