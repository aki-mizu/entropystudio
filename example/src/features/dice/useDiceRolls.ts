import { useState } from 'react';
import {
  countDiceFaces,
  diceMethodCopy,
  diceProgressCopy,
  diceScreenCopy,
  deriveDiceResult,
  recommendedRolls,
} from './dice';
import type {
  DiceFace,
  DiceMethod,
  DiceResult,
  WordCount,
} from './dice';

export function useDiceRolls() {
  const [rolls, setRolls] = useState('');
  const [method, setMethod] = useState<DiceMethod>('coldcard');
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<DiceResult | null>(null);
  const rollCount = countDiceFaces(rolls);
  const requiredRolls = recommendedRolls(wordCount);
  const progress = Math.min(rollCount / requiredRolls, 1);
  const coldcardCopy = diceMethodCopy('coldcard', wordCount);
  const colemanCopy = diceMethodCopy('coleman', wordCount);
  const copy = diceScreenCopy(wordCount);
  const progressText = diceProgressCopy(rollCount, method, wordCount);

  function updateRolls(value: string) {
    setRolls(value);
    setResult(null);
  }

  function appendFace(face: DiceFace) {
    updateRolls(`${rolls}${face}`);
  }

  function selectMethod(value: DiceMethod) {
    setMethod(value);
    setResult(null);
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  function derivePhrase() {
    setResult(deriveDiceResult(rolls, method, wordCount));
  }

  return {
    appendFace,
    clearRolls: () => updateRolls(''),
    coldcardCopy,
    colemanCopy,
    copy,
    derivePhrase,
    method,
    progress,
    progressText,
    result,
    rollCount,
    rolls,
    selectMethod,
    selectWordCount,
    updateRolls,
    wordCount,
  };
}