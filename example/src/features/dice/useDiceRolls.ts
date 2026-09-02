import { useMemo, useState } from 'react';
import {
  countDiceFaces,
  directDiceCanDerive,
  directDiceProgress,
  directDiceProgressCopy,
  directDiceSelectionCopy,
  diceMethodCopy,
  diceProgressCopy,
  diceScreenCopy,
  deriveDirectDiceResult,
  deriveDiceResult,
  getDirectDiceState,
  isHashedDiceMethod,
  recommendedRolls,
} from './dice';
import type { DiceInputFace, DiceMethod, DiceResult, WordCount } from './dice';

export function useDiceRolls() {
  const [hashedRolls, setHashedRolls] = useState('');
  const [bitboxRolls, setBitboxRolls] = useState('');
  const [d8D16Rolls, setD8D16Rolls] = useState('');
  const [method, setMethod] = useState<DiceMethod>('coldcard');
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [selectedFinalWord, setSelectedFinalWord] = useState('');
  const rolls = isHashedDiceMethod(method)
    ? hashedRolls
    : method === 'bitbox'
      ? bitboxRolls
      : d8D16Rolls;
  const rollCount = countDiceFaces(rolls);
  const requiredRolls = recommendedRolls(wordCount);
  const directState = useMemo(() => {
    if (isHashedDiceMethod(method)) {
      return null;
    }
    return getDirectDiceState(rolls, method, wordCount);
  }, [method, rolls, wordCount]);
  const hashedResult = useMemo(() => {
    if (!isHashedDiceMethod(method) || rollCount === 0) {
      return null;
    }
    return deriveDiceResult(rolls, method, wordCount);
  }, [method, rollCount, rolls, wordCount]);
  const directCopy = directState ? directDiceSelectionCopy(directState) : null;
  let progress = 0;
  let progressText = '';
  let canDerive = false;

  if (isHashedDiceMethod(method)) {
    progress = Math.min(rollCount / requiredRolls, 1);
    progressText = diceProgressCopy(rollCount, method, wordCount);
    canDerive = rollCount > 0;
  } else if (directState) {
    progress = directDiceProgress(directState, method, selectedFinalWord);
    progressText = directDiceProgressCopy(
      directState,
      method,
      wordCount,
      selectedFinalWord,
    );
    canDerive = directDiceCanDerive(directState, method, selectedFinalWord);
  }

  const coldcardCopy = diceMethodCopy('coldcard', wordCount);
  const colemanCopy = diceMethodCopy('coleman', wordCount);
  const bitboxCopy = diceMethodCopy('bitbox', wordCount);
  const d8D16Copy = diceMethodCopy('d8d16', wordCount);
  const copy = diceScreenCopy(method, wordCount);

  function updateRolls(value: string) {
    if (isHashedDiceMethod(method)) {
      setHashedRolls(value);
    } else if (method === 'bitbox') {
      setBitboxRolls(value);
    } else {
      setD8D16Rolls(value);
    }
    setResult(null);
    setSelectedFinalWord('');
  }

  function appendFace(
    face: DiceInputFace,
    selectionStart = rolls.length,
    selectionEnd = selectionStart,
  ): number {
    const start = Math.min(Math.max(selectionStart, 0), rolls.length);
    const end = Math.min(Math.max(selectionEnd, start), rolls.length);
    updateRolls(`${rolls.slice(0, start)}${face}${rolls.slice(end)}`);
    return start + face.length;
  }

  function selectMethod(value: DiceMethod) {
    setMethod(value);
    setResult(null);
    setSelectedFinalWord('');
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
    setSelectedFinalWord('');
  }

  function selectFinalWord(value: string) {
    setSelectedFinalWord(value);
    setResult(null);
  }

  function derivePhrase() {
    if (!canDerive) {
      return;
    }

    if (isHashedDiceMethod(method)) {
      setResult(deriveDiceResult(rolls, method, wordCount));
    } else if (directState) {
      setResult(deriveDirectDiceResult(directState, method, selectedFinalWord));
    }
  }

  return {
    appendFace,
    bitboxCopy,
    canDerive,
    coldcardCopy,
    colemanCopy,
    copy,
    directCopy,
    directState,
    derivePhrase,
    d8D16Copy,
    method,
    progress,
    progressText,
    result: isHashedDiceMethod(method) ? hashedResult : result,
    rollCount,
    rolls,
    selectedFinalWord,
    selectFinalWord,
    selectMethod,
    selectWordCount,
    updateRolls,
    wordCount,
  };
}