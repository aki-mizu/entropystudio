import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntropyMethodList } from '../components/EntropyMethodList';
import type { EntropyTool } from '../components/EntropyMethodList';
import { entropyToMnemonic } from '../native/entropyStudio';
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceWordList } from '../features/dice/components/DirectDicePreview';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import type { DiceResult, WordCount } from '../features/dice/dice';
import { diceColors } from '../features/dice/diceTheme';
import { NumberBaseKeypad } from '../features/numberBases/components/NumberBaseKeypad';
import {
  NUMBER_BASE_FORMATS,
  analyzeNumberBaseInput,
  numberBaseEntropy,
  numberBaseFormatConfig,
} from '../features/numberBases/numberBases';
import type { NumberBaseFormat } from '../features/numberBases/numberBases';
import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_TEXT, UPSTREAM_UI_LABELS } from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type NumberBasesView = 'entry' | 'setup';
type SheetName = 'result' | null;
type InputValues = Record<NumberBaseFormat, string>;
type InputSelection = { readonly end: number; readonly start: number };

type Props = {
  readonly activeTool: EntropyTool;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

const EMPTY_INPUT_VALUES: InputValues = {
  base4: '',
  base8: '',
  base32: '',
  base64: '',
  bin: '',
  hex: '',
};

function entropyHex(entropy: ArrayBuffer): string {
  return Array.from(new Uint8Array(entropy), byte => byte.toString(16).padStart(2, '0')).join('');
}

function formatCopy(template: string, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function numberBaseInputHelp(
  format: NumberBaseFormat,
  config: ReturnType<typeof numberBaseFormatConfig>,
): string {
  const remainder = config.remainderBits
    ? config.binaryRemainder
      ? UPSTREAM_UI_FALLBACK_COPY.numberBases.remainderBinary(
          config.fullDigits,
          config.shortLabel,
          config.remainderBits,
        )
      : UPSTREAM_UI_FALLBACK_COPY.numberBases.mixedRemainder(
          config.remainderBits,
          [...config.finalCharacters].join(', '),
        )
    : '';

  return UPSTREAM_UI_FALLBACK_COPY.numberBases.help(
    config.shortLabel,
    config.bitsPerDigit,
    config.binaryRemainder ? '' : UPSTREAM_UI_FALLBACK_COPY.numberBases.exceptMixed,
    config.digits,
    format === 'bin' ? UPSTREAM_UI_FALLBACK_COPY.numberBases.spacesBin : '',
    remainder,
  );
}

function inputStatus(
  analysis: ReturnType<typeof analyzeNumberBaseInput>,
  previewWordCount: number,
  wordCount: WordCount,
): string {
  const { config } = analysis;
  const coinPhase = Boolean(
    config.binaryRemainder &&
      config.remainderBits &&
      analysis.digitCount >= config.fullDigits,
  );
  const coinFlipsEntered = coinPhase
    ? Math.min(
        config.remainderBits,
        Math.max(0, analysis.digitCount - config.fullDigits),
      )
    : 0;
  let status = coinPhase
    ? analysis.isReady
      ? UPSTREAM_UI_FALLBACK_COPY.numberBases.coinReady(
          config.fullDigits,
          config.shortLabel,
          coinFlipsEntered,
          config.remainderBits,
        )
      : UPSTREAM_UI_FALLBACK_COPY.numberBases.coinNext(
          config.fullDigits,
          config.shortLabel,
          Math.min(config.remainderBits, coinFlipsEntered + 1),
          config.remainderBits,
        )
    : UPSTREAM_UI_FALLBACK_COPY.numberBases.progress(
        analysis.digitCount,
        config.digits,
        config.unit,
        previewWordCount,
        wordCount,
      );

  if (analysis.invalidCharacterCount) {
    status += UPSTREAM_UI_FALLBACK_COPY.numberBases.invalid(analysis.invalidCharacterCount);
  }
  if (analysis.finalInvalid) {
    status += config.binaryRemainder
      ? UPSTREAM_UI_FALLBACK_COPY.numberBases.finalBits(config.remainderBits)
      : UPSTREAM_UI_FALLBACK_COPY.numberBases.finalCharacter(
          config.remainderBits,
          [...config.finalCharacters].join(', '),
        );
  }
  if (analysis.excessDigitCount) {
    status += UPSTREAM_UI_FALLBACK_COPY.numberBases.excess(analysis.excessDigitCount);
  }
  if (analysis.isReady) {
    status += UPSTREAM_UI_FALLBACK_COPY.numberBases.ready;
  }
  return status;
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

export function NumberBasesScreen({ activeTool, isActive, isDarkMode, onSelectTool }: Props) {
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<NumberBasesView>('setup');
  const [format, setFormat] = useState<NumberBaseFormat>('bin');
  const [inputValues, setInputValues] = useState<InputValues>(EMPTY_INPUT_VALUES);
  const [inputSelection, setInputSelection] = useState<InputSelection | null>(null);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const colors = diceColors(isDarkMode);
  const input = inputValues[format];
  const analysis = analyzeNumberBaseInput(input, format, wordCount);
  const entropy = numberBaseEntropy(input, format, wordCount);
  const selectedInput = normalizedInputSelection(input, inputSelection);
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;
  const canInsertInputSpace =
    input.length > 0 &&
    !/\s$/u.test(input) &&
    analysis.digitCount < analysis.config.digits;
  const inputHelp = numberBaseInputHelp(format, analysis.config);
  const inputLabel = UPSTREAM_UI_FALLBACK_COPY.numberBases.entropyLabel(
    analysis.config.label,
    wordCount,
  );
  let words = [...analysis.previewWords];

  if (entropy) {
    try {
      words = entropyToMnemonic(entropy).split(' ');
    } catch {
      words = [];
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

  function updateInput(value: string) {
    setInputValues(previous => ({ ...previous, [format]: value }));
    setResult(null);
  }

  function canInsertInputCharacter(character: string): boolean {
    const candidate = replaceInputSelection(input, selectedInput, character);
    const candidateAnalysis = analyzeNumberBaseInput(candidate, format, wordCount);
    return (
      candidateAnalysis.invalidCharacterCount === 0 &&
      candidateAnalysis.excessDigitCount === 0 &&
      !candidateAnalysis.finalInvalid
    );
  }

  function insertInputCharacter(character: string) {
    if (!canInsertInputCharacter(character)) {
      return;
    }

    const nextInput = replaceInputSelection(input, selectedInput, character);
    const cursor = selectedInput.start + character.length;
    updateInput(nextInput);
    setInputSelection({ end: cursor, start: cursor });
  }

  function deleteInputCharacter() {
    if (!canDeleteInput) {
      return;
    }

    const start =
      selectedInput.end > selectedInput.start ? selectedInput.start : selectedInput.start - 1;
    const nextInput = `${input.slice(0, start)}${input.slice(selectedInput.end)}`;
    updateInput(nextInput);
    setInputSelection({ end: start, start });
  }

  function selectFormat(value: NumberBaseFormat) {
    setFormat(value);
    setInputSelection(null);
    setResult(null);
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  function showResult() {
    if (!entropy) {
      return;
    }

    try {
      setResult({
        entropy: entropyHex(entropy),
        mnemonic: entropyToMnemonic(entropy),
      });
    } catch {
      setResult({ error: UPSTREAM_TEXT.error.generic });
    }
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
      testID="number-bases-screen-safe-area"
    >
      {activeView === 'setup' ? (
        <ScrollView
          contentContainerStyle={styles.setupContent}
          style={styles.setupScroll}
          testID="number-bases-setup-view"
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]} testID="number-bases-screen-title">
                {UPSTREAM_UI_LABELS.keyMode.hex}
              </Text>
            </View>
          </View>

          <EntropyMethodList
            activeTool={activeTool}
            colors={colors}
            isActive={isActive}
            onSelect={onSelectTool}
          />

          <View style={styles.setupSettings} testID="number-bases-setup-settings">
            <Text style={[styles.label, { color: colors.muted }]}>{UPSTREAM_TEXT.hex.heading}</Text>
            <View style={styles.formatRows}>
              {NUMBER_BASE_FORMATS.map(option => {
                const selected = option === format;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => selectFormat(option)}
                    style={[
                      styles.formatOption,
                      { borderColor: colors.border },
                      selected && {
                        backgroundColor: colors.surface,
                        borderColor: colors.accent,
                      },
                    ]}
                    testID={`number-base-format-${option}`}
                  >
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={[styles.formatLabel, { color: selected ? colors.text : colors.muted }]}
                    >
                      {numberBaseFormatConfig(option, wordCount).label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.formatDescription, { color: colors.muted }]}>
              {UPSTREAM_UI_LABELS.hexFormat[format].desc}
            </Text>
            <WordCountSelector
              colors={colors}
              label={UPSTREAM_TEXT.seedLength.label}
              onSelect={selectWordCount}
              valueLabel={UPSTREAM_UI_FALLBACK_COPY.common.seedLengthWords(wordCount)}
              wordCount={wordCount}
            />
          </View>

          <View style={styles.setupActionArea}>
            <Pressable
              accessibilityLabel={analysis.config.label}
              accessibilityRole="button"
              onPress={() => setActiveView('entry')}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
              ]}
              testID="open-number-bases-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>
                {analysis.config.label}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.entryContent} testID="number-bases-entry-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-number-bases-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>
                {UPSTREAM_UI_LABELS.keyMode.seed}
              </Text>
              <Text style={[styles.entrySubtitle, { color: colors.muted }]}>
                {analysis.config.label}
              </Text>
            </View>
          </View>

          <View style={styles.seedPreviewArea}>
            <DiceWordList
              compact
              colors={colors}
              slotCount={wordCount}
              testID="number-base-words"
              words={words}
              wordSlotsAria={UPSTREAM_TEXT.seed.wordSlotsAria.replace('{n}', String(wordCount))}
            />
          </View>

          <View style={styles.inputHeader}>
            <Text
              style={[styles.inputLabel, { color: colors.muted }]}
              testID="number-base-input-label"
            >
              {inputLabel}
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
              testID="number-base-undo"
            >
              <Text style={[styles.undoLabel, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
              </Text>
            </Pressable>
          </View>
          {format === 'base64' ? (
            <ScrollView
              contentContainerStyle={styles.inputHelpContent}
              nestedScrollEnabled
              overScrollMode="never"
              showsVerticalScrollIndicator
              style={styles.inputHelpScroll}
              testID="number-base-help-scroll"
            >
              <Text style={[styles.inputHelp, { color: colors.muted }]} testID="number-base-help">
                {inputHelp}
              </Text>
            </ScrollView>
          ) : (
            <Text
              style={[styles.inputHelp, styles.staticInputHelp, { color: colors.muted }]}
              testID="number-base-help"
            >
              {inputHelp}
            </Text>
          )}
          <View style={[styles.inputSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              accessibilityLabel={inputLabel}
              autoCapitalize={format === 'base64' ? 'none' : 'characters'}
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              keyboardType={format === 'bin' || format === 'base4' || format === 'base8' ? 'number-pad' : 'default'}
              multiline
              numberOfLines={2}
              onChangeText={updateInput}
              onSelectionChange={({ nativeEvent }) => setInputSelection(nativeEvent.selection)}
              placeholder={formatCopy(UPSTREAM_TEXT.hex.placeholder, {
                digits: analysis.config.digits,
                unit: analysis.config.unit,
              })}
              placeholderTextColor={colors.placeholder}
              selection={inputSelection ?? undefined}
              selectionColor={colors.accent}
              showSoftInputOnFocus={false}
              spellCheck={false}
              style={[styles.input, { color: colors.text }]}
              testID="number-base-input"
              textContentType="none"
              value={input}
            />
            <View style={[styles.progressTrack, { backgroundColor: colors.segment }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor:
                      analysis.invalidCharacterCount || analysis.finalInvalid || analysis.excessDigitCount
                        ? colors.error
                        : colors.accent,
                    width: `${Math.min(analysis.digitCount / analysis.config.digits, 1) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                {
                  color:
                    analysis.invalidCharacterCount || analysis.finalInvalid || analysis.excessDigitCount
                      ? colors.error
                      : colors.muted,
                },
              ]}
              testID="number-base-progress"
            >
              {inputStatus(analysis, words.length, wordCount)}
            </Text>
          </View>

          <NumberBaseKeypad
            key={format}
            canInsert={canInsertInputCharacter}
            canInsertSpace={canInsertInputSpace}
            characters={analysis.config.alphabet}
            colors={colors}
            format={format}
            label={analysis.config.label}
            onInsert={insertInputCharacter}
            shortLabel={analysis.config.shortLabel}
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
            testID="derive-number-base-phrase"
          >
            <Text style={[styles.buttonText, { color: colors.onAccent }]}>
              {UPSTREAM_TEXT.action.derive}
            </Text>
          </Pressable>
        </View>
      )}

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="number-base-result-sheet"
        title={UPSTREAM_TEXT.action.derive}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        <DiceResultPanel
          colors={colors}
          entropyLabel={UPSTREAM_TEXT.result.entropyHex}
          result={result}
        />
      </NativeSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  formatDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  formatLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  formatOption: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
  },
  formatRows: {
    gap: 8,
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
  inputHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputHelp: {
    fontSize: 12,
    lineHeight: 17,
  },
  inputHelpContent: {
    paddingRight: 4,
  },
  inputHelpScroll: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 10,
    maxHeight: 68,
    minHeight: 0,
  },
  input: {
    fontFamily: 'monospace',
    fontSize: 15,
    lineHeight: 21,
    minHeight: 62,
    paddingHorizontal: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
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
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  progressTrack: {
    height: 4,
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
    flexGrow: 1,
    paddingBottom: 12,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  setupScroll: {
    flex: 1,
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
  staticInputHelp: {
    marginBottom: 10,
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
});