import entropyLabEnglish from '../../../../entropylab/src/locales/en.json';
import {
  SeedPhraseInputMethod,
  SeedPhraseStatus,
  seedPhraseAutocomplete as nativeSeedPhraseAutocomplete,
  seedPhraseKeyAllowed as nativeSeedPhraseKeyAllowed,
  seedPhraseNumbersToWords as nativeSeedPhraseNumbersToWords,
  seedPhraseSpaceAllowed as nativeSeedPhraseSpaceAllowed,
  seedPhraseState as nativeSeedPhraseState,
  seedPhraseWordsToNumbers as nativeSeedPhraseWordsToNumbers,
  translateSeedNumberIndices as nativeTranslateSeedNumberIndices,
} from '../../native/entropyStudio';
import type {
  SeedPhraseAutocompleteResult,
  SeedPhraseState,
} from '../../native/entropyStudio';
import type { WordCount } from '../dice/dice';
import type { SeedPhraseEntryMethod } from './components/SeedPhraseKeypad';

type InputSelection = { readonly end: number; readonly start: number };

export function analyzeSeedPhrase(
  value: string,
  method: SeedPhraseEntryMethod,
  wordCount: WordCount,
  zeroIndexed: boolean,
): SeedPhraseState {
  return nativeSeedPhraseState(value, nativeInputMethod(method), wordCount, zeroIndexed);
}

export function seedPhraseKeyAllowed(
  value: string,
  selection: InputSelection,
  character: string,
  method: SeedPhraseEntryMethod,
  wordCount: WordCount,
  zeroIndexed: boolean,
): boolean {
  return nativeSeedPhraseKeyAllowed(
    value,
    selection.start,
    selection.end,
    character,
    nativeInputMethod(method),
    wordCount,
    zeroIndexed,
  );
}

export function seedPhraseSpaceAllowed(
  value: string,
  selection: InputSelection,
  method: SeedPhraseEntryMethod,
  wordCount: WordCount,
  zeroIndexed: boolean,
): boolean {
  return nativeSeedPhraseSpaceAllowed(
    value,
    selection.start,
    selection.end,
    nativeInputMethod(method),
    wordCount,
    zeroIndexed,
  );
}

export function seedPhraseAutocomplete(
  value: string,
  cursor: number,
  wordCount: WordCount,
  enabled: boolean,
): SeedPhraseAutocompleteResult {
  return nativeSeedPhraseAutocomplete(value, cursor, wordCount, enabled);
}

export function seedPhraseWordsToNumbers(value: string, zeroIndexed: boolean): string {
  return nativeSeedPhraseWordsToNumbers(value, zeroIndexed);
}

export function seedPhraseNumbersToWords(
  value: string,
  wordCount: WordCount,
  zeroIndexed: boolean,
): string {
  return nativeSeedPhraseNumbersToWords(value, wordCount, zeroIndexed);
}

export function translateSeedNumberIndices(
  value: string,
  fromZeroIndexed: boolean,
  toZeroIndexed: boolean,
): string {
  return nativeTranslateSeedNumberIndices(value, fromZeroIndexed, toZeroIndexed);
}

export function seedPhraseStatusCopy(
  state: SeedPhraseState,
  method: SeedPhraseEntryMethod,
  wordCount: WordCount,
): string {
  const progress = formatCopy(
    entropyLabEnglish[method === 'words' ? 'seed.count' : 'seed.meta.numberProgress'],
    { entered: state.enteredCount, words: wordCount },
  );
  const finalWord = state.words[wordCount - 1] ?? '';

  switch (state.status) {
    case SeedPhraseStatus.Extra:
      return formatCopy(
        entropyLabEnglish[method === 'words' ? 'seed.meta.extraWords' : 'seed.meta.extra'],
        { entered: state.enteredCount, n: state.extraCount, words: wordCount },
      );
    case SeedPhraseStatus.ChooseFinal:
      return formatCopy(entropyLabEnglish['seed.meta.chooseFinal'], {
        n: state.finalCandidates.length,
        progress,
      });
    case SeedPhraseStatus.Ready:
      return formatCopy(entropyLabEnglish['seed.meta.ready'], { progress });
    case SeedPhraseStatus.FinalPrefix:
      return formatCopy(entropyLabEnglish['seed.meta.prefixMatch'], {
        n: state.matchingFinalCandidates,
        prefix: finalWord,
        progress,
      });
    case SeedPhraseStatus.NoFinalPrefix:
      return formatCopy(entropyLabEnglish['seed.meta.noPrefix'], { prefix: finalWord, progress });
    case SeedPhraseStatus.InvalidWord:
      return formatCopy(entropyLabEnglish['seed.meta.invalidWord'], {
        n: state.invalidPosition,
        progress,
        word: state.invalidToken,
      });
    case SeedPhraseStatus.InvalidNumber:
      return formatCopy(entropyLabEnglish['seed.meta.invalidNumber'], {
        max: state.maximumNumber,
        min: state.minimumNumber,
        n: state.invalidPosition,
        progress,
        token: state.invalidToken,
      });
    case SeedPhraseStatus.ChecksumInvalid:
      return formatCopy(entropyLabEnglish['seed.meta.checksumInvalid'], { progress });
    case SeedPhraseStatus.Remaining:
      return method === 'words'
        ? formatCopy(entropyLabEnglish['seed.meta.remaining'], {
            progress,
            remaining: state.remainingCount,
          })
        : formatCopy(entropyLabEnglish['seed.meta.remainingRange'], {
            max: state.maximumNumber,
            min: state.minimumNumber,
            progress,
            remaining: state.remainingCount,
          });
  }
}

function nativeInputMethod(method: SeedPhraseEntryMethod) {
  return method === 'words' ? SeedPhraseInputMethod.Words : SeedPhraseInputMethod.Numbers;
}

function formatCopy(template: string, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    template,
  );
}