import { useEffect, useMemo, useState } from 'react';
import {
  directDiceCanDerive,
  directDiceProgress,
  directDiceProgressCopy,
  directDiceSelectionCopy,
  diceMethodCopy,
  diceProgressCopy,
  diceScreenCopy,
  deriveDirectDiceResult,
  deriveDiceResult,
  getDiceMethodInfo,
  getDirectDiceState,
  getHashedDiceState,
  isDirectDiceMethod,
  isHashedDiceMethod,
} from './dice';
import type { DiceInputFace, DiceMethod, DiceResult, WordCount } from './dice';
import type { EntropySyncSnapshot } from '../../native/entropyStudio';

type DiceInputChange = {
  readonly method: DiceMethod;
  readonly rolls: string;
  readonly selectedFinalWord: string;
  readonly wordCount: WordCount;
};

type UseDiceRollsOptions = {
  readonly onInputChange?: (change: DiceInputChange) => void;
  readonly passphrase?: string;
  readonly snapshot?: EntropySyncSnapshot | null;
  readonly targetWords?: WordCount;
};

export function useDiceRolls(options: UseDiceRollsOptions = {}) {
  const {
    onInputChange,
    passphrase = '',
    snapshot: syncSnapshot,
    targetWords: syncTargetWords,
  } = options;
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
  const methodInfo = useMemo(() => getDiceMethodInfo(wordCount), [wordCount]);
  const hashedState = useMemo(() => {
    if (!isHashedDiceMethod(method)) {
      return null;
    }
    return getHashedDiceState(rolls, wordCount);
  }, [method, rolls, wordCount]);
  const directState = useMemo(() => {
    if (isHashedDiceMethod(method)) {
      return null;
    }
    return getDirectDiceState(rolls, method, wordCount, selectedFinalWord);
  }, [method, rolls, selectedFinalWord, wordCount]);
  const hashedResult = useMemo(() => {
    if (!isHashedDiceMethod(method) || !hashedState?.canDerive) {
      return null;
    }
    return deriveDiceResult(rolls, method, wordCount, hashedState, passphrase);
  }, [hashedState, method, passphrase, rolls, wordCount]);
  const directCopy = directState ? directDiceSelectionCopy(directState) : null;
  let progress = 0;
  let progressText = '';
  let canDerive = false;

  if (isHashedDiceMethod(method) && hashedState) {
    progress = hashedState.progress;
    progressText = diceProgressCopy(hashedState, method);
    canDerive = hashedState.canDerive;
  } else if (directState && isDirectDiceMethod(method)) {
    progress = directDiceProgress(directState);
    progressText = directDiceProgressCopy(directState, method, wordCount);
    canDerive = directDiceCanDerive(directState);
  }

  const coldcardCopy = diceMethodCopy('coldcard', wordCount, methodInfo);
  const colemanCopy = diceMethodCopy('coleman', wordCount, methodInfo);
  const bitboxCopy = diceMethodCopy('bitbox', wordCount, methodInfo);
  const d8D16Copy = diceMethodCopy('d8d16', wordCount, methodInfo);
  const copy = diceScreenCopy(method, wordCount, methodInfo);

  useEffect(() => {
    if (syncTargetWords === undefined) {
      return;
    }

    if (syncSnapshot) {
      const syncedWords = syncSnapshot.seedWords.split(' ');
      setBitboxRolls(syncSnapshot.bitboxDice);
      setD8D16Rolls(syncSnapshot.d8D16Dice);
      setResult(null);
      setSelectedFinalWord(
        syncedWords.length === syncTargetWords ? syncedWords[syncedWords.length - 1] ?? '' : '',
      );
    }
    setWordCount(syncTargetWords);
  }, [syncSnapshot, syncTargetWords]);

  function notifyInputChange(nextRolls: string, nextSelectedFinalWord: string) {
    onInputChange?.({
      method,
      rolls: nextRolls,
      selectedFinalWord: nextSelectedFinalWord,
      wordCount,
    });
  }

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
    notifyInputChange(value, '');
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

  function selectFinalWord(value: string) {
    setSelectedFinalWord(value);
    setResult(null);
    notifyInputChange(rolls, value);
  }

  function derivePhrase() {
    if (!canDerive) {
      return;
    }

    if (isHashedDiceMethod(method) && hashedState) {
      setResult(deriveDiceResult(rolls, method, wordCount, hashedState, passphrase));
    } else if (directState) {
      setResult(deriveDirectDiceResult(directState, passphrase));
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
    enabledFaces: isHashedDiceMethod(method)
      ? (hashedState?.allowedFaces ?? []) as readonly DiceInputFace[]
      : (directState?.allowedFaces ?? []) as readonly DiceInputFace[],
    method,
    progress,
    progressText,
    result: isHashedDiceMethod(method) ? hashedResult : result,
    rollCount: hashedState?.rollCount ?? 0,
    rolls,
    selectedFinalWord,
    selectFinalWord,
    selectMethod,
    updateRolls,
    wordCount,
  };
}