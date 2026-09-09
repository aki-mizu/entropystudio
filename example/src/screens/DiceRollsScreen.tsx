import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntropyMethodList } from '../components/EntropyMethodList';
import type { EntropyTool } from '../components/EntropyMethodList';
import { DirectDiceFinalWordPicker } from '../features/dice/components/DirectDiceFinalWordPicker';
import { DiceGrid } from '../features/dice/components/DiceGrid';
import { DiceWordList, DirectDicePreview } from '../features/dice/components/DirectDicePreview';
import { DiceMethodSelector } from '../features/dice/components/DiceMethodSelector';
import { DiceTranscriptInput } from '../features/dice/components/DiceTranscriptInput';
import type { DiceTranscriptSelection } from '../features/dice/components/DiceTranscriptInput';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { DirectDiceCalculationsScreen } from './CalculationsScreen';
import {
  Bip39PassphraseButton,
  Bip39PassphraseView,
  MasterFingerprintHeader,
  useBip39PassphraseOptions,
} from '../features/seedPhrase/bip39Passphrase';
import { D8_D16_FACES } from '../features/dice/dice';
import type { DiceInputFace } from '../features/dice/dice';
import { diceColors } from '../features/dice/diceTheme';
import {
  getDirectDiceCalculations,
  isDirectDiceMethod,
} from '../features/dice/dice';
import {
  diceEntropySyncSource,
  useEntropySync,
  useRegisterCurrentEntropySyncRequest,
} from '../features/entropySync';
import { KeyDerivationSettingsButton } from '../features/keyStation/components/KeyDerivationSettingsButton';
import { KeyDerivationSettingsView } from '../features/keyStation/components/KeyDerivationSettingsView';
import { DirectDiceStep } from '../native/entropyStudio';
import type { KeyDerivationAdvancedInput } from '../native/entropyStudio';
import { STUDIO_UI_TEXT } from '../features/studioUiCopy';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
} from '../features/upstreamUiCopy';
import { useDiceRolls } from '../features/dice/useDiceRolls';
import type {
  KeyStationDerivation,
  KeyStationAdvancedDerivationUpdater,
  KeyStationAdvancedHardening,
  KeyStationInput,
  KeyStationScriptType,
  KeyStationTab,
} from '../features/keyStation/keyStation';

const CONTENT_HORIZONTAL_PADDING = 24;
type DiceView = 'calculations' | 'entry' | 'key-settings' | 'passphrase' | 'setup';
type SheetName = 'final-word' | null;

type Props = {
  readonly activeTool: EntropyTool;
  readonly autocompleteEnabled: boolean;
  readonly advancedDerivationHardening: KeyStationAdvancedHardening;
  readonly advancedDerivationInput: KeyDerivationAdvancedInput;
  readonly derivationPath: string;
  readonly derivationPathValid: boolean;
  readonly editInputRequest: KeyStationTab | null;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onDeriveKey: (derivation: KeyStationDerivation, input: KeyStationInput) => void;
  readonly onSetAdvancedDerivation: (update: KeyStationAdvancedDerivationUpdater) => void;
  readonly onSetDerivationPath: (path: string) => void;
  readonly onSetScriptType: (scriptType: KeyStationScriptType) => void;
  readonly onSelectTool: (tool: EntropyTool) => void;
  readonly scriptType: KeyStationScriptType;
};

export function DiceRollsScreen({
  activeTool,
  autocompleteEnabled,
  advancedDerivationHardening,
  advancedDerivationInput,
  derivationPath,
  derivationPathValid,
  editInputRequest,
  isActive,
  isDarkMode,
  onDeriveKey,
  onSetAdvancedDerivation,
  onSetDerivationPath,
  onSetScriptType,
  onSelectTool,
  scriptType,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<DiceView>('setup');
  const [deriveError, setDeriveError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const passphraseOptions = useBip39PassphraseOptions(passphrase, autocompleteEnabled);
  const [transcriptSelection, setTranscriptSelection] =
    useState<DiceTranscriptSelection | null>(null);
  const [selectionRequestId, setSelectionRequestId] = useState(0);
  const entropySync = useEntropySync();
  const {
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
    enabledFaces,
    method,
    progress,
    progressText,
    result,
    restoreInput,
    rolls,
    selectedFinalWord,
    selectFinalWord,
    selectMethod,
    updateRolls,
    wordCount,
  } = useDiceRolls({
    passphrase,
    onInputChange: change => {
      setDeriveError(null);
      entropySync.publish({
        selectedFinalWord: change.selectedFinalWord,
        source: diceEntropySyncSource(change.method),
        targetWords: change.wordCount,
        value: change.rolls,
        zeroIndexed: false,
      });
    },
    snapshot: entropySync.snapshot,
    targetWords: entropySync.targetWords,
  });
  const colors = diceColors(isDarkMode);
  const isCompactHeight = windowHeight < 700;
  const maxTileSize =
    method === 'd8d16' ? (isCompactHeight ? 48 : 56) : isCompactHeight ? 68 : 84;
  const liveHashedWords =
    !directState && result && typeof result.mnemonic === 'string'
      ? result.mnemonic.split(' ')
      : [];
  const canChooseFinalWord =
    method === 'bitbox' && Boolean(directState && directCopy && directState.candidates.length > 0);
  const canDeriveWithPassphrase =
    canDerive && passphraseOptions.canDerive && derivationPathValid;
  const isBitboxCoinTurn =
    method === 'bitbox' && directState?.step === DirectDiceStep.BitboxCoin;
  const directCalculations = useMemo(
    () => (isDirectDiceMethod(method) ? getDirectDiceCalculations(rolls, method, wordCount) : []),
    [method, rolls, wordCount],
  );
  const handledEditInputRequest = useRef<number | null>(null);

  useRegisterCurrentEntropySyncRequest(isActive, {
    selectedFinalWord,
    source: diceEntropySyncSource(method),
    targetWords: wordCount,
    value: rolls,
    zeroIndexed: false,
  });

  useEffect(() => {
    if (!isActive || activeView === 'setup') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveView(view =>
        view === 'passphrase' || view === 'calculations' || view === 'key-settings'
          ? 'entry'
          : 'setup',
      );
      return true;
    });
    return () => subscription.remove();
  }, [activeView, isActive]);

  useEffect(() => {
    if (
      !isActive ||
      !editInputRequest ||
      editInputRequest.method !== 'dice' ||
      handledEditInputRequest.current === editInputRequest.id ||
      editInputRequest.input.kind !== 'dice'
    ) {
      return;
    }

    handledEditInputRequest.current = editInputRequest.id;
    restoreInput(editInputRequest.input);
    setPassphrase(editInputRequest.input.passphrase);
    setActiveView('entry');
  }, [editInputRequest, isActive, restoreInput]);

  function showResult() {
    if (!canDeriveWithPassphrase) {
      return;
    }
    const derivedResult = derivePhrase();
    if (!derivedResult) {
      return;
    }
    if (typeof derivedResult.error === 'string') {
      setDeriveError(derivedResult.error);
      return;
    }
    setDeriveError(null);
    onDeriveKey({
      entropy: derivedResult.entropy,
      kind: 'bip39',
      masterSeed: derivedResult.masterSeed,
      mnemonic: derivedResult.mnemonic,
      passphrase,
    }, {
      kind: 'dice',
      method,
      passphrase,
      rolls,
      selectedFinalWord,
      wordCount,
    });
  }

  function openPassphrase() {
    setActiveView('passphrase');
  }

  function openKeySettings() {
    setActiveView('key-settings');
  }

  function chooseFinalWord(word: string) {
    selectFinalWord(word);
    setActiveSheet(null);
  }

  function changeMethod(value: typeof method) {
    setDeriveError(null);
    setTranscriptSelection(null);
    selectMethod(value);
  }

  function setProgrammaticTranscriptSelection(selection: DiceTranscriptSelection) {
    setTranscriptSelection(selection);
    setSelectionRequestId(requestId => requestId + 1);
  }

  function insertDiceFace(face: DiceInputFace) {
    const cursor = appendFace(
      face,
      transcriptSelection?.start,
      transcriptSelection?.end,
    );
    setProgrammaticTranscriptSelection({ end: cursor, start: cursor });
  }

  function renderDeriveButton() {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={!canDeriveWithPassphrase}
        onPress={showResult}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accent,
            opacity: !canDeriveWithPassphrase ? 0.45 : pressed ? 0.82 : 1,
          },
        ]}
        testID="derive-dice-phrase"
      >
        <Text
          style={[styles.buttonText, { color: colors.onAccent }]}
          testID="derive-dice-phrase-label"
        >
          {copy.deriveAction}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="dice-screen-safe-area"
    >
      {activeView === 'setup' ? (
        <View style={styles.setupContent} testID="dice-setup-view">
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]} testID="dice-screen-title">
                {copy.mode}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.subtitle, { color: colors.muted }]}
                testID="dice-screen-how"
              >
                {copy.how}
              </Text>
            </View>
          </View>

          <EntropyMethodList
            activeTool={activeTool}
            colors={colors}
            isActive={isActive}
            onSelect={onSelectTool}
          />

          <View style={styles.setupSettings} testID="dice-setup-settings">
            <DiceMethodSelector
              copies={{
                bitbox: bitboxCopy,
                coldcard: coldcardCopy,
                coleman: colemanCopy,
                d8d16: d8D16Copy,
              }}
              colors={colors}
              method={method}
              onSelect={changeMethod}
            />
            <Text style={[styles.methodHelp, { color: colors.muted }]} testID="dice-method-requirement">
              {copy.methodRequirement}
            </Text>
          </View>

          <View style={styles.setupActionArea}>
            <Pressable
              accessibilityLabel={STUDIO_UI_TEXT.actions.start}
              accessibilityRole="button"
              onPress={() => setActiveView('entry')}
              style={({ pressed }) => [
                styles.startButton,
                {
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
              testID="open-dice-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>
                {STUDIO_UI_TEXT.actions.start}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : activeView === 'entry' ? (
        <View style={styles.entryContent} testID="dice-rolls-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-dice-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <View style={styles.entryHeaderCopy} testID="dice-entry-header-copy">
              <MasterFingerprintHeader
                colors={colors}
                mnemonic={directState?.mnemonic || result?.mnemonic || ''}
                passphrase={passphrase}
                testID="dice-master-fingerprint"
              />
            </View>
            <View style={styles.entryHeaderActions} testID="dice-entry-header-actions">
              <Bip39PassphraseButton
                compact
                colors={colors}
                onPress={openPassphrase}
                stacked
                testID="open-dice-passphrase"
              />
              <KeyDerivationSettingsButton
                compact
                colors={colors}
                onPress={openKeySettings}
                scriptType={scriptType}
                stacked
                testID="open-dice-key-settings"
              />
            </View>
          </View>

          <View style={styles.seedPreviewArea}>
            {directState ? (
              <DirectDicePreview
                compact
                colors={colors}
                slotCount={wordCount}
                state={directState}
              />
            ) : (
              <DiceWordList
                compact
                colors={colors}
                slotCount={wordCount}
                testID="live-dice-words"
                words={liveHashedWords}
              />
            )}
            {canChooseFinalWord && directCopy ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveSheet('final-word')}
                style={styles.finalWordButton}
                testID="open-direct-final-word"
              >
                <Text style={[styles.finalWordText, { color: colors.accent }]}>
                  {directCopy.finalWordLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <DiceTranscriptInput
            colors={colors}
            inputLabel={copy.inputLabel}
            inputPlaceholder={copy.inputPlaceholder}
            method={method}
            onChange={updateRolls}
            onProgrammaticSelectionChange={setProgrammaticTranscriptSelection}
            onSelectionChange={setTranscriptSelection}
            progress={progress}
            progressText={progressText}
            rolls={rolls}
            selection={transcriptSelection}
            selectionRequestId={selectionRequestId}
            wordCount={wordCount}
          />

          <Text
            style={[styles.methodHelp, { color: colors.muted }]}
            testID="dice-method-help"
          >
            {copy.inputHelp}
          </Text>

          <View style={styles.rollArea}>
            <DiceGrid
              coinFlipLabels={
                isBitboxCoinTurn
                  ? {
                      heads: UPSTREAM_TEXT.dice.bitbox.heads,
                      headsRange: UPSTREAM_TEXT.dice.bitbox.headsRange,
                      tails: UPSTREAM_TEXT.dice.bitbox.tails,
                      tailsRange: UPSTREAM_TEXT.dice.bitbox.tailsRange,
                    }
                  : undefined
              }
              columns={method === 'd8d16' ? 8 : 6}
              colors={colors}
              enabledFaces={enabledFaces}
              faces={method === 'd8d16' ? D8_D16_FACES : undefined}
              maxTileSize={maxTileSize}
              onSelect={insertDiceFace}
            />
          </View>

          <View style={styles.actionBar}>
            {directState ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveView('calculations')}
                style={({ pressed }) => [
                  styles.calculationButton,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
                testID="open-direct-dice-calculations"
              >
                <View style={styles.calculationButtonContent}>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.calculationButtonText, { color: colors.accent }]}
                    testID="direct-dice-calculations-label"
                  >
                    {UPSTREAM_TEXT.calculations.show}
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={2}
                    style={[styles.calculationButtonNote, { color: colors.muted }]}
                    testID="direct-dice-calculations-note"
                  >
                    {UPSTREAM_TEXT.calculations.directDiceNote}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {renderDeriveButton()}
          </View>
          {deriveError ? (
            <Text style={[styles.deriveError, { color: colors.error }]} testID="dice-error">
              {deriveError}
            </Text>
          ) : null}
        </View>
      ) : activeView === 'calculations' ? (
        <DirectDiceCalculationsScreen
          colors={colors}
          method={method === 'bitbox' ? 'bitbox' : 'd8d16'}
          onBack={() => setActiveView('entry')}
          rows={directCalculations}
        />
      ) : activeView === 'key-settings' ? (
        <KeyDerivationSettingsView
          advancedDerivationHardening={advancedDerivationHardening}
          advancedDerivationInput={advancedDerivationInput}
          colors={colors}
          derivationPath={derivationPath}
          onBack={() => setActiveView('entry')}
          onSetAdvancedDerivation={onSetAdvancedDerivation}
          onSetDerivationPath={onSetDerivationPath}
          onSetScriptType={onSetScriptType}
          scriptType={scriptType}
          testIDPrefix="dice"
        />
      ) : (
        <Bip39PassphraseView
          backTestID="close-dice-passphrase"
          colors={colors}
          inputTestID="dice-passphrase-input"
          mnemonic={directState?.mnemonic || result?.mnemonic || ''}
          onBack={() => setActiveView('entry')}
          onChangePassphrase={setPassphrase}
          options={passphraseOptions}
          screenTestID="dice-passphrase-view"
          value={passphrase}
        />
      )}

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="direct-final-word-sheet"
        title={directCopy?.finalWordLabel ?? copy.seedLengthValue}
        visible={activeSheet === 'final-word' && Boolean(directState && directCopy)}
      >
        {directState && directCopy ? (
          <DirectDiceFinalWordPicker
            colors={colors}
            finalWordLabel={directCopy.finalWordLabel}
            finalWordPlaceholder={copy.lastWordPlaceholder}
            onChangeFinalWord={selectFinalWord}
            onSelectFinalWord={chooseFinalWord}
            selectedFinalWord={selectedFinalWord}
            state={directState}
          />
        ) : null}
      </NativeSheet>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  calculationButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  calculationButtonContent: {
    alignItems: 'center',
    width: '100%',
  },
  calculationButtonNote: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  calculationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  deriveError: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
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
  entryHeaderActions: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 4,
  },
  entryHeaderCopy: {
    flex: 1,
    gap: 2,
    minWidth: 72,
    paddingHorizontal: 12,
  },
  finalWordButton: {
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 32,
  },
  finalWordText: {
    fontSize: 14,
    fontWeight: '700',
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
  methodHelp: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  rollArea: {
    marginTop: 12,
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
    marginTop: 16,
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
});
