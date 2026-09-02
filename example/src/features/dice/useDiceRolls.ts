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
  const [rolls, setRolls] = useState('');
  const [method, setMethod] = useState<DiceMethod>('coldcard');
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [selectedFinalWord, setSelectedFinalWord] = useState('');
  const rollCount = countDiceFaces(rolls);
  const requiredRolls = recommendedRolls(wordCount);
  const directState = useMemo(() => {
    if (isHashedDiceMethod(method)) {
      return null;
    }
    return getDirectDiceState(rolls, method, wordCount);
  }, [method, rolls, wordCount]);
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
    setRolls(value);
    setResult(null);
    setSelectedFinalWord('');
  }

  function appendFace(face: DiceInputFace) {
    updateRolls(`${rolls}${face}`);
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
    clearRolls: () => updateRolls(''),
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
    result,
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