import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import entropyLabEnglish from '../../../entropylab/src/locales/en.json';
import { EntropyMethodList } from '../components/EntropyMethodList';
import type { EntropyTool } from '../components/EntropyMethodList';
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceWordList } from '../features/dice/components/DirectDicePreview';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import type { DiceResult, WordCount } from '../features/dice/dice';
import { diceColors } from '../features/dice/diceTheme';
import { SeedPhraseKeypad } from '../features/seedPhrase/components/SeedPhraseKeypad';
import type { SeedPhraseEntryMethod } from '../features/seedPhrase/components/SeedPhraseKeypad';
import { entropyToMnemonic, mnemonicToEntropy } from '../native/entropyStudio';
import { wordlist as bip39English } from '../../../entropylab/src/js/bip39-english';

const CONTENT_HORIZONTAL_PADDING = 24;
const BIP39_WORD_SET = new Set(bip39English);
const SEED_FINAL_WORD_CANDIDATE_CACHE = new Map<string, readonly string[]>();

type SeedPhraseView = 'entry' | 'setup';
type SheetName = 'result' | null;
type InputSelection = { readonly end: number; readonly start: number };
type SeedAutocompleteResult = { readonly cursor: number; readonly value: string };

type SeedWordToken = {
  readonly end: number;
  readonly start: number;
  readonly word: string;
};

type SeedNumberEntry = {
  readonly index: number;
  readonly position: number;
  readonly token: string;
  readonly valid: boolean;
};

type SeedNumberAnalysis = {
  readonly entries: readonly SeedNumberEntry[];
  readonly extraEntries: readonly SeedNumberEntry[];
  readonly invalidEntries: readonly SeedNumberEntry[];
  readonly phrase: string;
  readonly words: readonly string[];
};

type Props = {
  readonly activeTool: EntropyTool;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

function formatCopy(template: string, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function entropyHex(entropy: ArrayBuffer): string {
  return Array.from(new Uint8Array(entropy), byte => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeSeedInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z\s]/gu, '').replace(/\s+/gu, ' ');
}

function seedWords(value: string): string[] {
  const phrase = value.trim();
  return phrase ? phrase.split(/\s+/u) : [];
}

function seedWordTokens(value: string): readonly SeedWordToken[] {
  return Array.from(value.matchAll(/[a-z]+/gu)).map(match => {
    const word = match[0];
    const start = match.index ?? 0;
    return { end: start + word.length, start, word };
  });
}

function seedFinalPrefixWords(value: string, wordCount: WordCount): readonly string[] | null {
  const prefixWords = seedWordTokens(value)
    .slice(0, wordCount - 1)
    .map(token => token.word);
  return prefixWords.length === wordCount - 1 && prefixWords.every(word => BIP39_WORD_SET.has(word))
    ? prefixWords
    : null;
}

function entropyFromSeedWordPrefix(
  prefixWords: readonly string[],
  wordCount: WordCount,
  suffix: number,
): ArrayBuffer {
  const entropyBitLength = (wordCount / 3) * 32;
  const prefixBits = prefixWords
    .map(word => bip39English.indexOf(word).toString(2).padStart(11, '0'))
    .join('');
  const suffixBitLength = entropyBitLength - prefixBits.length;
  const bits = `${prefixBits}${suffix.toString(2).padStart(suffixBitLength, '0')}`;
  const entropy = new ArrayBuffer(entropyBitLength / 8);
  const bytes = new Uint8Array(entropy);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  }
  return entropy;
}

function seedFinalWordCandidates(value: string, wordCount: WordCount): readonly string[] {
  const prefixWords = seedFinalPrefixWords(value, wordCount);
  if (!prefixWords) {
    return [];
  }

  const cacheKey = `${wordCount}:${prefixWords.join(' ')}`;
  const cached = SEED_FINAL_WORD_CANDIDATE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const entropyBitLength = (wordCount / 3) * 32;
  const suffixBitLength = entropyBitLength - prefixWords.length * 11;
  const candidates = new Set<string>();
  for (let suffix = 0; suffix < 2 ** suffixBitLength; suffix += 1) {
    try {
      const mnemonic = entropyToMnemonic(entropyFromSeedWordPrefix(prefixWords, wordCount, suffix));
      const mnemonicWords = typeof mnemonic === 'string' ? seedWords(mnemonic) : [];
      const candidate = mnemonicWords[mnemonicWords.length - 1];
      if (candidate) {
        candidates.add(candidate);
      }
    } catch {
      // The normal derive path remains the authority if the preview bridge is unavailable.
    }
  }

  const result = [...candidates];
  if (result.length) {
    if (SEED_FINAL_WORD_CANDIDATE_CACHE.size >= 32) {
      const firstKey = SEED_FINAL_WORD_CANDIDATE_CACHE.keys().next().value;
      if (firstKey) {
        SEED_FINAL_WORD_CANDIDATE_CACHE.delete(firstKey);
      }
    }
    SEED_FINAL_WORD_CANDIDATE_CACHE.set(cacheKey, result);
  }
  return result;
}

function seedKeyboardCanEnterCharacter(
  value: string,
  selection: InputSelection,
  character: string,
  wordCount: WordCount,
): boolean {
  if (!/^[a-z]$/u.test(character)) {
    return false;
  }

  const candidateValue = replaceInputSelection(value, selection, character);
  const caret = selection.start + character.length;
  const tokens = seedWordTokens(candidateValue);
  if (tokens.length > wordCount) {
    return false;
  }

  const tokenIndex = tokens.findIndex(token => token.start < caret && caret <= token.end);
  if (
    tokenIndex < 0 ||
    tokenIndex >= wordCount ||
    tokens.slice(0, tokenIndex).some(token => !BIP39_WORD_SET.has(token.word))
  ) {
    return false;
  }

  const options =
    tokenIndex === wordCount - 1
      ? seedFinalWordCandidates(candidateValue, wordCount)
      : bip39English;
  return options.some(word => word.startsWith(tokens[tokenIndex].word));
}

function seedKeyboardCanEnterSpace(
  value: string,
  selection: InputSelection,
  wordCount: WordCount,
): boolean {
  if (
    selection.start !== selection.end ||
    selection.end !== value.length ||
    !selection.end ||
    /\s$/u.test(value)
  ) {
    return false;
  }

  const words = seedWords(value);
  return words.length < wordCount && words.every(word => BIP39_WORD_SET.has(word));
}

function autocompleteSeedInput(
  value: string,
  cursor: number,
  wordCount: WordCount,
  enabled: boolean,
): SeedAutocompleteResult {
  if (!enabled) {
    return { cursor, value };
  }

  const suffix = value.slice(cursor);
  if (suffix && !/^\s/u.test(suffix)) {
    return { cursor, value };
  }

  const match = value.slice(0, cursor).match(/([a-z]+)$/u);
  if (!match) {
    return { cursor, value };
  }

  const prefix = match[1];
  const start = cursor - prefix.length;
  const tokens = seedWordTokens(value);
  const tokenIndex = tokens.findIndex(token => token.start < cursor && cursor <= token.end);
  if (
    tokenIndex < 0 ||
    tokenIndex >= wordCount ||
    tokens.slice(0, tokenIndex).some(token => !BIP39_WORD_SET.has(token.word))
  ) {
    return { cursor, value };
  }

  const finalWord = tokenIndex === wordCount - 1;
  if (prefix.length < (finalWord ? 1 : 2)) {
    return { cursor, value };
  }

  const options = finalWord ? seedFinalWordCandidates(value, wordCount) : bip39English;
  const matches = options.filter(word => word.startsWith(prefix));
  if (matches.length !== 1) {
    return { cursor, value };
  }

  const replacement = `${matches[0]}${suffix ? '' : ' '}`;
  return {
    cursor: start + replacement.length,
    value: `${value.slice(0, start)}${replacement}${suffix}`,
  };
}

function normalizeSeedNumberInput(value: string): string {
  return value.replace(/[^0-9\s]/gu, '').replace(/\s+/gu, ' ');
}

function normalizedInputSelection(
  value: string,
  selection: InputSelection | null,
): InputSelection {
  const start = Math.min(Math.max(selection?.start ?? value.length, 0), value.length);
  const end = Math.min(Math.max(selection?.end ?? start, start), value.length);
  return { end, start };
}

function replaceInputSelection(value: string, selection: InputSelection, inserted: string): string {
  return `${value.slice(0, selection.start)}${inserted}${value.slice(selection.end)}`;
}

function analyzeSeedNumbers(
  value: string,
  wordCount: WordCount,
  zeroIndexed: boolean,
): SeedNumberAnalysis {
  const entries = Array.from(value.matchAll(/\d+/gu)).map((match, position) => {
    const token = match[0];
    const number = Number(token);
    const index = zeroIndexed ? number : number - 1;
    return {
      index,
      position,
      token,
      valid:
        !/^0\d+/u.test(token) &&
        Number.isSafeInteger(number) &&
        index >= 0 &&
        index < bip39English.length,
    };
  });
  const extraEntries = entries.slice(wordCount);
  const invalidEntries = entries.filter(entry => !entry.valid);
  const words = entries
    .slice(0, wordCount)
    .map(entry => (entry.valid ? bip39English[entry.index] ?? '' : ''));
  const phrase = words.length === wordCount && words.every(Boolean) ? words.join(' ') : '';

  return { entries, extraEntries, invalidEntries, phrase, words };
}

function seedWordsToNumbers(value: string, zeroIndexed: boolean): string {
  const words = seedWords(value);
  const indices = words.map(word => bip39English.indexOf(word));
  return words.length && indices.every(index => index >= 0)
    ? indices.map(index => String(index + (zeroIndexed ? 0 : 1))).join(' ')
    : '';
}

function seedNumbersToWords(value: string, wordCount: WordCount, zeroIndexed: boolean): string {
  const analysis = analyzeSeedNumbers(value, wordCount, zeroIndexed);
  return analysis.entries.length && !analysis.invalidEntries.length && !analysis.extraEntries.length
    ? analysis.words.join(' ')
    : '';
}

function translateSeedNumberIndices(
  value: string,
  fromZeroIndexed: boolean,
  toZeroIndexed: boolean,
): string {
  return value.replace(/\d+/gu, token => {
    const number = Number(token);
    const index = fromZeroIndexed ? number : number - 1;
    return Number.isSafeInteger(number) && index >= 0 && index < bip39English.length
      ? String(index + (toZeroIndexed ? 0 : 1))
      : token;
  });
}

function seedStatus(
  value: string,
  wordCount: WordCount,
  finalCandidates: readonly string[],
  valid: boolean,
): string {
  const words = seedWords(value);
  const progress = formatCopy(entropyLabEnglish['seed.count'], {
    entered: words.length,
    words: wordCount,
  });

  if (words.length > wordCount) {
    return formatCopy(entropyLabEnglish['seed.meta.extraWords'], {
      entered: words.length,
      n: words.length - wordCount,
      words: wordCount,
    });
  }

  const finalPrefixWords = seedFinalPrefixWords(value, wordCount);
  if (finalPrefixWords) {
    const finalWord = words[wordCount - 1] ?? '';
    if (!finalWord && /\s$/u.test(value)) {
      return formatCopy(entropyLabEnglish['seed.meta.chooseFinal'], {
        n: finalCandidates.length,
        progress,
      });
    }
    if (finalWord) {
      if (valid) {
        return formatCopy(entropyLabEnglish['seed.meta.ready'], { progress });
      }
      const matchingCandidates = finalCandidates.filter(candidate =>
        candidate.startsWith(finalWord),
      );
      return matchingCandidates.length
        ? formatCopy(entropyLabEnglish['seed.meta.prefixMatch'], {
            n: matchingCandidates.length,
            prefix: finalWord,
            progress,
          })
        : formatCopy(entropyLabEnglish['seed.meta.noPrefix'], { prefix: finalWord, progress });
    }
  }

  const activeWordIndex = /\s$/u.test(value) ? -1 : words.length - 1;
  const invalidWordIndex = words.findIndex(word => !bip39English.includes(word));
  if (invalidWordIndex !== -1) {
    const viablePrefix =
      invalidWordIndex === activeWordIndex &&
      bip39English.some(candidate => candidate.startsWith(words[invalidWordIndex]));
    if (viablePrefix) {
      return formatCopy(entropyLabEnglish['seed.meta.remaining'], {
        progress,
        remaining: Math.max(0, wordCount - words.length),
      });
    }
    return formatCopy(entropyLabEnglish['seed.meta.invalidWord'], {
      n: invalidWordIndex + 1,
      progress,
      word: words[invalidWordIndex],
    });
  }

  return valid
    ? formatCopy(entropyLabEnglish['seed.meta.ready'], { progress })
    : formatCopy(entropyLabEnglish['seed.meta.remaining'], {
        progress,
        remaining: Math.max(0, wordCount - words.length),
      });
}

function seedNumberStatus(
  analysis: SeedNumberAnalysis,
  wordCount: WordCount,
  zeroIndexed: boolean,
  valid: boolean,
): string {
  const progress = formatCopy(entropyLabEnglish['seed.meta.numberProgress'], {
    entered: analysis.entries.length,
    words: wordCount,
  });
  const minimum = zeroIndexed ? 0 : 1;
  const maximum = zeroIndexed ? 2047 : 2048;

  if (analysis.extraEntries.length) {
    return formatCopy(entropyLabEnglish['seed.meta.extra'], {
      entered: analysis.entries.length,
      n: analysis.extraEntries.length,
      words: wordCount,
    });
  }
  if (analysis.invalidEntries.length) {
    const invalid = analysis.invalidEntries[0];
    return formatCopy(entropyLabEnglish['seed.meta.invalidNumber'], {
      max: maximum,
      min: minimum,
      n: invalid.position + 1,
      progress,
      token: invalid.token,
    });
  }
  if (analysis.phrase && !valid) {
    return formatCopy(entropyLabEnglish['seed.meta.checksumInvalid'], { progress });
  }
  if (valid) {
    return formatCopy(entropyLabEnglish['seed.meta.ready'], { progress });
  }
  return formatCopy(entropyLabEnglish['seed.meta.remainingRange'], {
    max: maximum,
    min: minimum,
    progress,
    remaining: Math.max(0, wordCount - analysis.entries.length),
  });
}

export function SeedPhraseScreen({ activeTool, isActive, isDarkMode, onSelectTool }: Props) {
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<SeedPhraseView>('setup');
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [inputSelection, setInputSelection] = useState<InputSelection | null>(null);
  const [numberInput, setNumberInput] = useState('');
  const [result, setResult] = useState<DiceResult | null>(null);
  const [seedMethod, setSeedMethod] = useState<SeedPhraseEntryMethod>('words');
  const [wordInput, setWordInput] = useState('');
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [zeroIndexed, setZeroIndexed] = useState(false);
  const colors = diceColors(isDarkMode);
  const input = seedMethod === 'words' ? wordInput : numberInput;
  const selectedInput = normalizedInputSelection(input, inputSelection);
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;
  const wordInputWords = seedWords(wordInput);
  const finalCandidates =
    seedMethod === 'words' ? seedFinalWordCandidates(wordInput, wordCount) : [];
  const numberAnalysis = analyzeSeedNumbers(numberInput, wordCount, zeroIndexed);
  const hasKnownWords =
    wordInputWords.length === wordCount && wordInputWords.every(word => BIP39_WORD_SET.has(word));
  const directPhrase = wordInputWords.join(' ');
  const numberPhrase = numberAnalysis.phrase;
  const activePhrase = seedMethod === 'words' ? directPhrase : numberPhrase;
  const previewWords =
    seedMethod === 'words' ? wordInputWords.slice(0, wordCount) : numberAnalysis.words;
  const canInsertInputSpace =
    seedMethod === 'words'
      ? seedKeyboardCanEnterSpace(input, selectedInput, wordCount)
      : input.length > 0 &&
        !/\s$/u.test(input) &&
        numberAnalysis.entries.length < wordCount &&
        !numberAnalysis.invalidEntries.length;
  let entropy: ArrayBuffer | null = null;

  if (
    (seedMethod === 'words' && hasKnownWords) ||
    (seedMethod === 'numbers' &&
      numberPhrase &&
      !numberAnalysis.extraEntries.length &&
      !numberAnalysis.invalidEntries.length)
  ) {
    try {
      entropy = mnemonicToEntropy(activePhrase);
    } catch {
      entropy = null;
    }
  }

  useEffect(() => {
    if (!isActive || activeView === 'setup') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveView('setup');
      return true;
    });
    return () => subscription.remove();
  }, [activeView, isActive]);

  function updateInput(value: string): string {
    const normalized =
      seedMethod === 'words' ? normalizeSeedInput(value) : normalizeSeedNumberInput(value);
    if (seedMethod === 'words') {
      setWordInput(normalized);
    } else {
      setNumberInput(normalized);
    }
    setResult(null);
    return normalized;
  }

  function setSeedAutocompleteEnabled(enabled: boolean) {
    setAutocompleteEnabled(enabled);
    if (!enabled || seedMethod !== 'words') {
      return;
    }

    const selection = normalizedInputSelection(wordInput, inputSelection);
    if (selection.start !== selection.end) {
      return;
    }

    const autocompleted = autocompleteSeedInput(wordInput, selection.end, wordCount, true);
    if (autocompleted.value === wordInput) {
      return;
    }

    const nextInput = updateInput(autocompleted.value);
    const cursor = Math.min(autocompleted.cursor, nextInput.length);
    setInputSelection({ end: cursor, start: cursor });
  }

  function canInsertInputCharacter(character: string): boolean {
    if (seedMethod === 'words') {
      return seedKeyboardCanEnterCharacter(input, selectedInput, character, wordCount);
    }

    if (!/^[0-9]$/u.test(character)) {
      return false;
    }
    const candidate = replaceInputSelection(input, selectedInput, character);
    const candidateAnalysis = analyzeSeedNumbers(candidate, wordCount, zeroIndexed);
    return !candidateAnalysis.invalidEntries.length && !candidateAnalysis.extraEntries.length;
  }

  function insertInputCharacter(character: string) {
    const cannotInsert =
      character === ' ' ? !canInsertInputSpace : !canInsertInputCharacter(character);
    if (cannotInsert) {
      return;
    }

    const insertedInput = replaceInputSelection(input, selectedInput, character);
    const insertedCursor = selectedInput.start + character.length;
    const autocompleted =
      seedMethod === 'words'
        ? autocompleteSeedInput(insertedInput, insertedCursor, wordCount, autocompleteEnabled)
        : { cursor: insertedCursor, value: insertedInput };
    const nextInput = updateInput(autocompleted.value);
    const cursor = Math.min(autocompleted.cursor, nextInput.length);
    setInputSelection({ end: cursor, start: cursor });
  }

  function deleteInputCharacter() {
    if (!canDeleteInput) {
      return;
    }

    const start =
      selectedInput.end > selectedInput.start ? selectedInput.start : selectedInput.start - 1;
    const nextInput = updateInput(`${input.slice(0, start)}${input.slice(selectedInput.end)}`);
    const cursor = Math.min(start, nextInput.length);
    setInputSelection({ end: cursor, start: cursor });
  }

  function selectSeedMethod(method: SeedPhraseEntryMethod) {
    if (method === seedMethod) {
      return;
    }

    if (method === 'numbers') {
      const converted = seedWordsToNumbers(wordInput, zeroIndexed);
      if (converted || !wordInput.trim()) {
        setNumberInput(converted);
      }
    } else {
      const converted = seedNumbersToWords(numberInput, wordCount, zeroIndexed);
      if (converted || !numberInput.trim()) {
        setWordInput(converted);
      }
    }
    setInputSelection(null);
    setResult(null);
    setSeedMethod(method);
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  function setZeroIndexMode(nextZeroIndexed: boolean) {
    if (nextZeroIndexed === zeroIndexed) {
      return;
    }

    setNumberInput(translateSeedNumberIndices(numberInput, zeroIndexed, nextZeroIndexed));
    setInputSelection(null);
    setResult(null);
    setZeroIndexed(nextZeroIndexed);
  }

  function showResult() {
    if (!entropy) {
      return;
    }

    setResult({
      entropy: entropyHex(entropy),
      mnemonic: activePhrase,
    });
    setActiveSheet('result');
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="seed-phrase-screen-safe-area"
    >
      {activeView === 'setup' ? (
        <View style={styles.setupContent} testID="seed-phrase-setup-view">
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]} testID="seed-phrase-screen-title">
                {entropyLabEnglish['mode.seed']}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {entropyLabEnglish[`seed.method.${seedMethod}Desc`]}
              </Text>
            </View>
          </View>

          <EntropyMethodList
            activeTool={activeTool}
            colors={colors}
            isActive={isActive}
            onSelect={onSelectTool}
          />

          <View style={styles.setupSettings}>
            <Text style={[styles.label, { color: colors.muted }]}>{entropyLabEnglish['seed.how']}</Text>
            <View style={styles.methodOptions}>
              {(['words', 'numbers'] as const).map(method => {
                const selected = method === seedMethod;
                const title = entropyLabEnglish[`seed.method.${method}`];
                const description = entropyLabEnglish[`seed.method.${method}Desc`];
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={method}
                    onPress={() => selectSeedMethod(method)}
                    style={({ pressed }) => [
                      styles.methodOption,
                      {
                        backgroundColor: selected ? colors.surface : 'transparent',
                        borderColor: selected ? colors.accent : colors.border,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                    testID={`seed-method-${method}`}
                  >
                    <Text style={[styles.methodTitle, { color: selected ? colors.text : colors.muted }]}>
                      {title}
                    </Text>
                    <Text style={[styles.methodDescription, { color: colors.muted }]}>
                      {description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <WordCountSelector
              colors={colors}
              label={entropyLabEnglish['seedLength.label']}
              onSelect={selectWordCount}
              valueLabel={entropyLabEnglish['seedLength.words'].replace('{n}', String(wordCount))}
              wordCount={wordCount}
            />
          </View>

          <View style={styles.setupActionArea}>
            <Pressable
              accessibilityLabel="Enter seed phrase"
              accessibilityRole="button"
              onPress={() => setActiveView('entry')}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
              ]}
              testID="open-seed-phrase-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>Enter seed phrase</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.entryContent} testID="seed-phrase-entry-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel="Back to seed phrase settings"
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-seed-phrase-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>Back</Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>Seed</Text>
              <Text style={[styles.entrySubtitle, { color: colors.muted }]}>
                {entropyLabEnglish[`seed.method.${seedMethod}`]}
              </Text>
            </View>
          </View>

          <View style={styles.seedPreviewArea}>
            <DiceWordList
              compact
              colors={colors}
              dense={wordCount === 24}
              slotCount={wordCount}
              testID="seed-phrase-words"
              words={previewWords}
              wordSlotsAria={entropyLabEnglish['seed.wordSlotsAria'].replace('{n}', String(wordCount))}
            />
          </View>

          <View style={styles.inputHeader}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>
              {seedMethod === 'words'
                ? formatCopy(entropyLabEnglish['seed.wordsLabel'], { words: wordCount })
                : formatCopy(entropyLabEnglish['seed.numbersLabel'], { words: wordCount })}
            </Text>
            <Pressable
              accessibilityLabel={
                selectedInput.end > selectedInput.start
                  ? 'Remove selected seed input'
                  : 'Remove seed input character before cursor'
              }
              accessibilityRole="button"
              disabled={!canDeleteInput}
              onPress={deleteInputCharacter}
              style={({ pressed }) => [
                styles.undoButton,
                { opacity: canDeleteInput ? (pressed ? 0.72 : 1) : 0.38 },
              ]}
              testID="seed-phrase-undo"
            >
              <Text style={[styles.undoLabel, { color: colors.accent }]}>Undo</Text>
            </Pressable>
          </View>
          <Text style={[styles.inputHelp, { color: colors.muted }]}>
            {seedMethod === 'words'
              ? formatCopy(entropyLabEnglish['seed.wordsHelp'], {
                  partialWords: wordCount - 1,
                  words: wordCount,
                })
              : formatCopy(entropyLabEnglish['seed.numbersHelp'], {
                  range: entropyLabEnglish[zeroIndexed ? 'seed.range0' : 'seed.range1'],
                })}
          </Text>
          {seedMethod === 'words' && (
            <View style={styles.autocompleteToggle}>
              <View style={styles.autocompleteCopy}>
                <Text style={[styles.autocompleteLabel, { color: colors.text }]}>
                  {entropyLabEnglish['seed.autocomplete']}
                </Text>
              </View>
              <Switch
                accessibilityLabel={entropyLabEnglish['seed.autocomplete']}
                onValueChange={setSeedAutocompleteEnabled}
                testID="seed-phrase-autocomplete"
                thumbColor={autocompleteEnabled ? colors.surface : colors.muted}
                trackColor={{ false: colors.segment, true: colors.accent }}
                value={autocompleteEnabled}
              />
            </View>
          )}
          {seedMethod === 'numbers' && (
            <View style={styles.zeroIndexToggle}>
              <View style={styles.zeroIndexCopy}>
                <Text style={[styles.zeroIndexLabel, { color: colors.text }]}>
                  {entropyLabEnglish['seed.zeroIndex']}
                </Text>
                <Text style={[styles.zeroIndexNote, { color: colors.muted }]}>
                  {entropyLabEnglish['seed.zeroIndexNote']}
                </Text>
              </View>
              <Switch
                accessibilityLabel={entropyLabEnglish['seed.zeroIndex']}
                onValueChange={setZeroIndexMode}
                testID="seed-number-zero-index"
                thumbColor={zeroIndexed ? colors.surface : colors.muted}
                trackColor={{ false: colors.segment, true: colors.accent }}
                value={zeroIndexed}
              />
            </View>
          )}
          <View style={[styles.inputSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              accessibilityLabel={
                seedMethod === 'words'
                  ? formatCopy(entropyLabEnglish['seed.wordsLabel'], { words: wordCount })
                  : formatCopy(entropyLabEnglish['seed.numbersLabel'], { words: wordCount })
              }
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              keyboardType={seedMethod === 'numbers' ? 'number-pad' : 'default'}
              multiline
              onChangeText={updateInput}
              onSelectionChange={({ nativeEvent }) => setInputSelection(nativeEvent.selection)}
              placeholder={
                seedMethod === 'words'
                  ? formatCopy(entropyLabEnglish['seed.placeholder'], { words: wordCount })
                  : entropyLabEnglish[zeroIndexed ? 'seed.numbersPlaceholder0' : 'seed.numbersPlaceholder1']
              }
              placeholderTextColor={colors.placeholder}
              selection={inputSelection ?? undefined}
              selectionColor={colors.accent}
              showSoftInputOnFocus={false}
              spellCheck={false}
              style={[styles.input, { color: colors.text }]}
              testID={seedMethod === 'words' ? 'seed-phrase-input' : 'seed-number-input'}
              textContentType="none"
              value={input}
            />
            <Text
              style={[
                styles.status,
                {
                  color:
                    entropy ||
                    (seedMethod === 'numbers' && numberAnalysis.phrase && !numberAnalysis.extraEntries.length)
                      ? colors.accent
                      : colors.muted,
                },
              ]}
              testID={seedMethod === 'words' ? 'seed-phrase-status' : 'seed-number-status'}
            >
              {seedMethod === 'words'
                ? seedStatus(wordInput, wordCount, finalCandidates, Boolean(entropy))
                : seedNumberStatus(numberAnalysis, wordCount, zeroIndexed, Boolean(entropy))}
            </Text>
          </View>

          <SeedPhraseKeypad
            canInsert={canInsertInputCharacter}
            canInsertSpace={canInsertInputSpace}
            colors={colors}
            method={seedMethod}
            onInsert={insertInputCharacter}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!entropy}
            onPress={showResult}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.accent,
                opacity: !entropy ? 0.45 : pressed ? 0.82 : 1,
              },
            ]}
            testID="derive-seed-phrase"
          >
            <Text style={[styles.buttonText, { color: colors.onAccent }]}>
              {entropyLabEnglish['action.derive']}
            </Text>
          </Pressable>
        </View>
      )}

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="seed-phrase-result-sheet"
        title={entropyLabEnglish['action.derive']}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        <DiceResultPanel
          colors={colors}
          entropyLabel={entropyLabEnglish['result.entropyHex']}
          result={result}
        />
      </NativeSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  autocompleteCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  autocompleteLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  autocompleteToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  backButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingRight: 14,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  entryContent: {
    flex: 1,
    paddingBottom: 12,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  entryHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 58,
  },
  entryHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  entrySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  hidden: {
    display: 'none',
  },
  input: {
    fontSize: 15,
    lineHeight: 21,
    minHeight: 82,
    paddingHorizontal: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  inputHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 0,
    paddingRight: 12,
  },
  inputSurface: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  methodDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  methodOption: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodOptions: {
    gap: 8,
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  screen: {
    flex: 1,
  },
  seedPreviewArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: 12,
  },
  setupActionArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  setupContent: {
    flex: 1,
    paddingBottom: 12,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  setupSettings: {
    marginTop: 16,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 52,
  },
  status: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  undoButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  undoLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  zeroIndexCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  zeroIndexLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  zeroIndexNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  zeroIndexToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
});