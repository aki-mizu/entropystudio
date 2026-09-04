import { useEffect, useMemo, useState } from 'react';
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
import { UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';
import {
  analyzeSeedPhrase,
  seedPhraseAutocomplete,
  seedPhraseKeyAllowed,
  seedPhraseNumbersToWords,
  seedPhraseSpaceAllowed,
  seedPhraseStatusCopy,
  seedPhraseWordsToNumbers,
  translateSeedNumberIndices,
} from '../features/seedPhrase/seedPhrase';
import { mnemonicToEntropy } from '../native/entropyStudio';

const CONTENT_HORIZONTAL_PADDING = 24;

type SeedPhraseView = 'entry' | 'setup';
type SheetName = 'result' | null;
type InputSelection = { readonly end: number; readonly start: number };

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
  const analysis = useMemo(
    () => analyzeSeedPhrase(input, seedMethod, wordCount, zeroIndexed),
    [input, seedMethod, wordCount, zeroIndexed],
  );
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;
  const activePhrase = analysis.phrase;
  const previewWords = analysis.words;
  const canInsertInputSpace = seedPhraseSpaceAllowed(
    input,
    selectedInput,
    seedMethod,
    wordCount,
    zeroIndexed,
  );
  let entropy: ArrayBuffer | null = null;

  if (analysis.canDerive) {
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
    const normalized = analyzeSeedPhrase(
      value,
      seedMethod,
      wordCount,
      zeroIndexed,
    ).normalizedInput;
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

    const autocompleted = seedPhraseAutocomplete(wordInput, selection.end, wordCount, true);
    if (autocompleted.value === wordInput) {
      return;
    }

    const nextInput = updateInput(autocompleted.value);
    const cursor = Math.min(autocompleted.cursor, nextInput.length);
    setInputSelection({ end: cursor, start: cursor });
  }

  function canInsertInputCharacter(character: string): boolean {
    return seedPhraseKeyAllowed(
      input,
      selectedInput,
      character,
      seedMethod,
      wordCount,
      zeroIndexed,
    );
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
        ? seedPhraseAutocomplete(insertedInput, insertedCursor, wordCount, autocompleteEnabled)
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
      const converted = seedPhraseWordsToNumbers(wordInput, zeroIndexed);
      if (converted || !wordInput.trim()) {
        setNumberInput(converted);
      }
    } else {
      const converted = seedPhraseNumbersToWords(numberInput, wordCount, zeroIndexed);
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
              accessibilityLabel={entropyLabEnglish[`seed.method.${seedMethod}`]}
              accessibilityRole="button"
              onPress={() => setActiveView('entry')}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
              ]}
              testID="open-seed-phrase-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>
                {entropyLabEnglish[`seed.method.${seedMethod}`]}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.entryContent} testID="seed-phrase-entry-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-seed-phrase-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>
                {entropyLabEnglish['mode.seed']}
              </Text>
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
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
              accessibilityRole="button"
              disabled={!canDeleteInput}
              onPress={deleteInputCharacter}
              style={({ pressed }) => [
                styles.undoButton,
                { opacity: canDeleteInput ? (pressed ? 0.72 : 1) : 0.38 },
              ]}
              testID="seed-phrase-undo"
            >
              <Text style={[styles.undoLabel, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
              </Text>
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
                    entropy || analysis.canDerive ? colors.accent : colors.muted,
                },
              ]}
              testID={seedMethod === 'words' ? 'seed-phrase-status' : 'seed-number-status'}
            >
              {seedMethod === 'words'
                ? seedPhraseStatusCopy(analysis, seedMethod, wordCount)
                : seedPhraseStatusCopy(analysis, seedMethod, wordCount)}
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