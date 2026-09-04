import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntropyMethodList } from '../components/EntropyMethodList';
import type { EntropyTool } from '../components/EntropyMethodList';
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceWordList } from '../features/dice/components/DirectDicePreview';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { diceColors } from '../features/dice/diceTheme';
import { PrivateKeyKeypad } from '../features/privateKey/components/PrivateKeyKeypad';
import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_TEXT } from '../features/upstreamUiCopy';
import { entropyToMnemonic } from '../native/entropyStudio';
import {
  BRAIN_WALLET_OUTPUTS,
  BRAIN_WALLET_WARNING_COPY,
  brainWalletLocaleCopy,
  brainWalletOutputCopy,
  PRIVATE_KEY_FORMATS,
  privateKeyEntropy,
  privateKeyError,
  privateKeyFormatCopy,
  privateKeyInputHasError,
  privateKeyInputState,
  privateKeyKeyAllowed,
  privateKeyProgressText,
} from '../features/privateKey/privateKey';
import type {
  BrainWalletOutput,
  PrivateKeyInputFormat,
} from '../features/privateKey/privateKey';

const CONTENT_HORIZONTAL_PADDING = 24;

type PrivateKeyView = 'entry' | 'setup';
type SheetName = 'result' | null;
type InputSelection = { readonly end: number; readonly start: number };
type PrivateKeyResult =
  | { readonly kind: 'private-key'; readonly entropy: string }
  | { readonly kind: 'brain-wallet-hd'; readonly entropy: string; readonly mnemonic: string }
  | { readonly kind: 'error'; readonly error: string };

type Props = {
  readonly activeTool: EntropyTool;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

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

export function PrivateKeyScreen({ activeTool, isActive, isDarkMode, onSelectTool }: Props) {
  const inputRef = useRef<TextInputInstance>(null);
  const appliedSelectionRequestId = useRef(0);
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<PrivateKeyView>('setup');
  const [brainWalletWarningAcknowledgements, setBrainWalletWarningAcknowledgements] = useState<
    Record<BrainWalletOutput, boolean>
  >({ hd: false, scalar: false });
  const [brainWalletWarningVisible, setBrainWalletWarningVisible] = useState(false);
  const [brainWalletOutput, setBrainWalletOutput] = useState<BrainWalletOutput>('scalar');
  const [format, setFormat] = useState<PrivateKeyInputFormat>('wif');
  const [input, setInput] = useState('');
  const [inputSelection, setInputSelection] = useState<InputSelection | null>(null);
  const [result, setResult] = useState<PrivateKeyResult | null>(null);
  const [selectionRequestId, setSelectionRequestId] = useState(0);
  const colors = diceColors(isDarkMode);
  const brainWalletLocale = brainWalletLocaleCopy();
  const formatCopy = privateKeyFormatCopy(format);
  const brainWalletWarningAcknowledged = brainWalletWarningAcknowledgements[brainWalletOutput];
  const brainWalletWarningLines = [
    ...BRAIN_WALLET_WARNING_COPY.lines,
    ...(brainWalletOutput === 'hd' ? BRAIN_WALLET_WARNING_COPY.hdLines : []),
  ];
  const isPrivateKeyEntryVisible = format !== 'brain' || brainWalletWarningAcknowledged;
  const inputState = privateKeyInputState(input, format);
  const inputHasError = privateKeyInputHasError(inputState);
  const inputProgress = privateKeyProgressText(inputState, format);
  const selectedInput = normalizedInputSelection(input, inputSelection);
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;
  const canInsertInputSpace =
    format === 'brain' && privateKeyKeyAllowed(input, selectedInput, ' ', format);
  let entropy: ArrayBuffer | null = null;
  let inputError: string | null = null;

  if (inputState.canDerive || inputHasError) {
    try {
      entropy = privateKeyEntropy(input, format);
    } catch (error) {
      inputError = privateKeyError(error);
    }
  }

  const canDerive =
    inputState.canDerive &&
    entropy !== null &&
    (format !== 'brain' || brainWalletWarningAcknowledged);

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

  useEffect(() => {
    if (selectionRequestId === appliedSelectionRequestId.current) {
      return;
    }

    appliedSelectionRequestId.current = selectionRequestId;
    inputRef.current?.setSelection?.(selectedInput.start, selectedInput.end);
  }, [selectedInput, selectionRequestId]);

  function selectFormat(value: PrivateKeyInputFormat) {
    setFormat(value);
    setInput('');
    setInputSelection(null);
    setResult(null);
    setBrainWalletWarningVisible(false);
  }

  function selectBrainWalletOutput(value: BrainWalletOutput) {
    setBrainWalletOutput(value);
    setResult(null);
    setBrainWalletWarningVisible(false);
  }

  function openPrivateKeyEntry() {
    setActiveView('entry');
    setBrainWalletWarningVisible(false);
  }

  function showBrainWalletWarning() {
    setBrainWalletWarningVisible(true);
  }

  function toggleBrainWalletWarningAcknowledgement() {
    if (brainWalletWarningAcknowledged) {
      setBrainWalletWarningVisible(false);
    }
    setBrainWalletWarningAcknowledgements(previous => ({
      ...previous,
      [brainWalletOutput]: !previous[brainWalletOutput],
    }));
  }

  function renderBrainWalletWarning(testIDPrefix: string, includeTitle: boolean) {
    return (
      <View style={styles.brainWalletWarningContent}>
        {includeTitle && (
          <Text
            style={[styles.brainWalletWarningTitle, { color: colors.error }]}
            testID={`${testIDPrefix}-title`}
          >
            {BRAIN_WALLET_WARNING_COPY.title}
          </Text>
        )}
        {brainWalletWarningLines.map((line, index) => (
          <Text
            key={line}
            style={[styles.brainWalletWarningLine, { color: colors.error }]}
            testID={`${testIDPrefix}-line-${index}`}
          >
            {`\u2022 ${line}`}
          </Text>
        ))}
        <Pressable
          accessibilityLabel={brainWalletLocale.acknowledgement}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: brainWalletWarningAcknowledged }}
          onPress={toggleBrainWalletWarningAcknowledgement}
          style={({ pressed }) => [
            styles.brainWalletAcknowledgement,
            {
              backgroundColor: colors.surface,
              borderColor: brainWalletWarningAcknowledged ? colors.accent : colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
          testID={`${testIDPrefix}-acknowledge`}
        >
          <View
            style={[
              styles.brainWalletAcknowledgementCheckbox,
              {
                backgroundColor: brainWalletWarningAcknowledged ? colors.accent : 'transparent',
                borderColor: colors.accent,
              },
            ]}
          >
            {brainWalletWarningAcknowledged && (
              <Text style={[styles.brainWalletAcknowledgementCheckmark, { color: colors.onAccent }]}>
                {'\u2713'}
              </Text>
            )}
          </View>
          <View style={styles.brainWalletAcknowledgementCopy}>
            <Text style={[styles.brainWalletAcknowledgementTitle, { color: colors.text }]}>
              {brainWalletLocale.acknowledgement}
            </Text>
            <Text
              style={[styles.brainWalletAcknowledgementDescription, { color: colors.muted }]}
              testID={`${testIDPrefix}-acknowledgement-description`}
            >
              {BRAIN_WALLET_WARNING_COPY.acknowledgementDescription}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  function updateInput(value: string) {
    setInput(value);
    setResult(null);
  }

  function requestInputSelection(selection: InputSelection) {
    setInputSelection(selection);
    setSelectionRequestId(previous => previous + 1);
  }

  function canInsertInputCharacter(character: string): boolean {
    return privateKeyKeyAllowed(input, selectedInput, character, format);
  }

  function insertInputCharacter(character: string) {
    if (!canInsertInputCharacter(character)) {
      return;
    }

    const nextInput = replaceInputSelection(input, selectedInput, character);
    const cursor = selectedInput.start + character.length;
    updateInput(nextInput);
    requestInputSelection({ end: cursor, start: cursor });
  }

  function deleteInputCharacter() {
    if (!canDeleteInput) {
      return;
    }

    const start =
      selectedInput.end > selectedInput.start ? selectedInput.start : selectedInput.start - 1;
    const nextInput = `${input.slice(0, start)}${input.slice(selectedInput.end)}`;
    updateInput(nextInput);
    requestInputSelection({ end: start, start });
  }

  function showResult() {
    if (!entropy) {
      return;
    }

    try {
      if (format === 'brain' && brainWalletOutput === 'hd') {
        setResult({
          entropy: entropyHex(entropy),
          kind: 'brain-wallet-hd',
          mnemonic: entropyToMnemonic(entropy),
        });
      } else {
        setResult({
          entropy: entropyHex(entropy),
          kind: 'private-key',
        });
      }
    } catch {
      setResult({
        error: UPSTREAM_TEXT.error.generic,
        kind: 'error',
      });
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
      testID="private-key-screen-safe-area"
    >
      {activeView === 'setup' ? (
        <ScrollView
          contentContainerStyle={styles.setupContent}
          style={styles.setupScroll}
          testID="private-key-setup-view"
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]} testID="private-key-screen-title">
                {UPSTREAM_TEXT.mode.key}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {UPSTREAM_TEXT.key.inputHelp}
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
            <Text style={[styles.label, { color: colors.muted }]}>
              {UPSTREAM_TEXT.key.formatHeading}
            </Text>
            <View style={styles.formatOptions}>
              {PRIVATE_KEY_FORMATS.map(option => {
                const selected = option === format;
                const copy = privateKeyFormatCopy(option);
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => selectFormat(option)}
                    style={({ pressed }) => [
                      styles.formatOption,
                      {
                        backgroundColor: selected ? colors.surface : 'transparent',
                        borderColor: selected ? colors.accent : colors.border,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                    testID={`private-key-format-${option}`}
                  >
                    <Text style={[styles.formatTitle, { color: selected ? colors.text : colors.muted }]}>
                      {copy.title}
                    </Text>
                    <Text style={[styles.formatDescription, { color: colors.muted }]}>
                      {copy.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.setupActionArea}>
            <Pressable
              accessibilityLabel={formatCopy.title}
              accessibilityRole="button"
              onPress={openPrivateKeyEntry}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
              ]}
              testID="open-private-key-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>{formatCopy.title}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.entryContent} testID="private-key-entry-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-private-key-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.mode.key}
              </Text>
              <Text style={[styles.entrySubtitle, { color: colors.muted }]}>{formatCopy.title}</Text>
            </View>
          </View>
          {format === 'brain' && (
            <View style={styles.brainWalletSection} testID="brain-wallet-output-options">
              <Text style={[styles.label, { color: colors.muted }]}>{brainWalletLocale.label}</Text>
              <View style={styles.brainWalletOptions}>
                {BRAIN_WALLET_OUTPUTS.map(option => {
                  const selected = option === brainWalletOutput;
                  const copy = brainWalletOutputCopy(option);
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={option}
                      onPress={() => selectBrainWalletOutput(option)}
                      style={({ pressed }) => [
                        styles.brainWalletOption,
                        {
                          backgroundColor: selected ? colors.surface : 'transparent',
                          borderColor: selected ? colors.accent : colors.border,
                          opacity: pressed ? 0.82 : 1,
                        },
                      ]}
                      testID={`brain-wallet-output-${option}`}
                    >
                      <Text
                        style={[styles.brainWalletOptionTitle, { color: selected ? colors.text : colors.muted }]}
                        testID={`brain-wallet-output-${option}-title`}
                      >
                        {copy.title}
                      </Text>
                      <Text
                        style={[styles.brainWalletOptionDescription, { color: colors.muted }]}
                        testID={`brain-wallet-output-${option}-description`}
                      >
                        {copy.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {brainWalletWarningAcknowledged ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={showBrainWalletWarning}
                  style={({ pressed }) => [
                    styles.brainWalletWarningTrigger,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.error,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                  testID="brain-wallet-warning-trigger"
                >
                  <Text style={[styles.brainWalletWarningTriggerTitle, { color: colors.error }]}>
                    {BRAIN_WALLET_WARNING_COPY.title}
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={[styles.brainWalletInlineWarning, { borderColor: colors.error }]}
                  testID="brain-wallet-warning-inline"
                >
                  {renderBrainWalletWarning('brain-wallet-warning-inline', true)}
                </View>
              )}
            </View>
          )}
          {isPrivateKeyEntryVisible && (
            <>
              <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.key.inputLabel}
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
                  testID="private-key-undo"
                >
                  <Text style={[styles.undoLabel, { color: colors.accent }]}>
                    {UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
                  </Text>
                </Pressable>
              </View>
              {format !== 'brain' && (
                <Text
                  style={[styles.inputHelp, { color: colors.muted }]}
                  testID="private-key-input-help"
                >
                  {formatCopy.description}
                </Text>
              )}
              <View style={[styles.inputSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  accessibilityLabel={UPSTREAM_TEXT.key.inputLabel}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  importantForAutofill="no"
                  keyboardType="default"
                  multiline
                  onChangeText={updateInput}
                  onSelectionChange={({ nativeEvent }) => setInputSelection(nativeEvent.selection)}
                  placeholder={formatCopy.placeholder}
                  placeholderTextColor={colors.placeholder}
                  ref={inputRef}
                  selectionColor={colors.accent}
                  showSoftInputOnFocus={false}
                  spellCheck={false}
                  style={[styles.input, { color: colors.text }]}
                  testID="private-key-input"
                  textContentType="none"
                  value={input}
                />
              </View>
              <Text
                style={[
                  styles.progress,
                  { color: inputState.canDerive ? colors.accent : inputHasError ? colors.error : colors.muted },
                ]}
                testID="private-key-progress"
              >
                {inputProgress}
              </Text>
              {inputError && (
                <Text style={[styles.status, { color: colors.error }]} testID="private-key-status">
                  {inputError}
                </Text>
              )}

              <PrivateKeyKeypad
                canInsert={canInsertInputCharacter}
                canInsertSpace={canInsertInputSpace}
                colors={colors}
                firstCharacter={input.charAt(0)}
                format={format}
                onInsert={insertInputCharacter}
              />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={!canDerive}
            onPress={showResult}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.accent,
                opacity: !canDerive ? 0.45 : pressed ? 0.82 : 1,
              },
            ]}
            testID="derive-private-key"
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
        testID="private-key-result-sheet"
        title={UPSTREAM_TEXT.action.derive}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        {result?.kind === 'brain-wallet-hd' ? (
          <>
            <DiceWordList
              compact
              colors={colors}
              slotCount={24}
              testID="private-key-brain-seed-words"
              words={result.mnemonic.split(' ')}
              wordSlotsAria={UPSTREAM_TEXT.seed.wordSlotsAria.replace('{n}', '24')}
            />
            <DiceResultPanel
              colors={colors}
              entropyLabel={UPSTREAM_TEXT.result.entropyHex}
              result={{ entropy: result.entropy }}
            />
          </>
        ) : (
          <DiceResultPanel
            colors={colors}
            entropyLabel={UPSTREAM_TEXT.result.privateKey}
            result={
              result?.kind === 'error'
                ? { error: result.error }
                : result
                  ? { entropy: result.entropy }
                  : null
            }
          />
        )}
      </NativeSheet>

      <NativeSheet
        colors={colors}
        onDismiss={() => setBrainWalletWarningVisible(false)}
        testID="brain-wallet-warning-sheet"
        title={BRAIN_WALLET_WARNING_COPY.title}
        visible={brainWalletWarningVisible && brainWalletWarningAcknowledged}
      >
        {renderBrainWalletWarning('brain-wallet-warning', false)}
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
  brainWalletAcknowledgement: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  brainWalletAcknowledgementCheckbox: {
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginRight: 10,
    width: 20,
  },
  brainWalletAcknowledgementCheckmark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  brainWalletAcknowledgementCopy: {
    flex: 1,
    minWidth: 0,
  },
  brainWalletAcknowledgementTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  brainWalletAcknowledgementDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  brainWalletOption: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  brainWalletOptionDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  brainWalletOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  brainWalletOptions: {
    gap: 8,
  },
  brainWalletSection: {
    marginBottom: 10,
  },
  brainWalletInlineWarning: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  brainWalletWarningContent: {
    gap: 10,
  },
  brainWalletWarningLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  brainWalletWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  brainWalletWarningTrigger: {
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  brainWalletWarningTriggerTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
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
    marginTop: 3,
  },
  formatOption: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formatOptions: {
    gap: 8,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
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
    fontFamily: 'monospace',
    fontSize: 15,
    lineHeight: 21,
    minHeight: 82,
    paddingHorizontal: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  inputHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputHelp: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
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
  progress: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  screen: {
    flex: 1,
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
  status: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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