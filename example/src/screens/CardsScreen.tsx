import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntropyMethodList } from '../components/EntropyMethodList';
import type { EntropyTool } from '../components/EntropyMethodList';
import {
  CARD_METHODS,
  CARD_RANKS,
  CARD_SUITS,
  DIRECT_CARD_RANKS,
  cardIsAvailable,
  cardMethodCopy,
  cardSelectionState,
  formatCardTranscript,
  formatDirectCardTranscript,
  isCardKeyAllowed,
  isHashedCardMethod,
} from '../features/cards/cards';
import type {
  CardMethod,
  CardRank,
  CardResult,
  CardSelectionState,
  CardSuit,
} from '../features/cards/cards';
import { useCards } from '../features/cards/useCards';
import { DiceWordList } from '../features/dice/components/DirectDicePreview';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { diceColors } from '../features/dice/diceTheme';
import {
  cardEntropySyncSource,
  useEntropySync,
  useRegisterCurrentEntropySyncRequest,
} from '../features/entropySync';
import { Bip39PassphraseButton, Bip39PassphraseView } from '../features/seedPhrase/bip39Passphrase';
import { STUDIO_UI_TEXT } from '../features/studioUiCopy';
import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_TEXT } from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;
type CardView = 'entry' | 'passphrase' | 'setup';
type SheetName = 'result' | null;

const EMPTY_CARD_SELECTION: CardSelectionState = {
  availableRanks: [],
  availableSuits: [],
  compatibleRanks: [],
  compatibleSuits: [],
};

type Props = {
  readonly activeTool: EntropyTool;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

export function CardsScreen({
  activeTool,
  isActive,
  isDarkMode,
  onSelectTool,
}: Props) {
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<CardView>('setup');
  const [passphrase, setPassphrase] = useState('');
  const [selectedRank, setSelectedRank] = useState<CardRank | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<CardSuit | null>(null);
  const entropySync = useEntropySync();
  const {
    appendCard,
    appendDirectRank,
    canDerive,
    copy,
    directState,
    derivePhrase,
    hashedState,
    instruction,
    matchesIanColeman,
    method,
    progress,
    progressText,
    result,
    selectIanColemanMatch,
    selectMethod,
    transcript,
    undoLastEntry,
    updateTranscript,
    wordCount,
  } = useCards({
    passphrase,
    onInputChange: change => {
      entropySync.publish({
        selectedFinalWord: '',
        source: cardEntropySyncSource(change.method, change.matchesIanColeman),
        targetWords: change.wordCount,
        value: change.transcript,
        zeroIndexed: false,
      });
    },
    snapshot: entropySync.snapshot,
    targetWords: entropySync.targetWords,
  });
  const colors = diceColors(isDarkMode);
  const isDirect = method === 'direct';
  const displayedTranscript = isHashedCardMethod(method)
    ? formatCardTranscript(transcript, matchesIanColeman)
    : formatDirectCardTranscript(transcript);
  const selection = hashedState
    ? cardSelectionState(hashedState, selectedRank, selectedSuit)
    : EMPTY_CARD_SELECTION;
  const words = directState
    ? directState.finalWord
      ? [...directState.words, directState.finalWord]
      : directState.words
    : result?.mnemonic
      ? result.mnemonic.split(' ')
      : [];

  useRegisterCurrentEntropySyncRequest(isActive, {
    selectedFinalWord: '',
    source: cardEntropySyncSource(method, matchesIanColeman),
    targetWords: wordCount,
    value: transcript,
    zeroIndexed: false,
  });

  useEffect(() => {
    if (!isActive || activeView === 'setup') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveView(view => (view === 'passphrase' ? 'entry' : 'setup'));
      return true;
    });
    return () => subscription.remove();
  }, [activeView, isActive]);

  function showResult() {
    derivePhrase();
    setActiveSheet('result');
  }

  function openPassphrase() {
    setActiveView('passphrase');
  }

  function changeMethod(value: CardMethod) {
    setSelectedRank(null);
    setSelectedSuit(null);
    selectMethod(value);
  }

  function commitCard(card: string) {
    if (!hashedState || !cardIsAvailable(hashedState, card)) {
      return;
    }
    appendCard(card);
    setSelectedRank(null);
    setSelectedSuit(null);
  }

  function selectCardRank(rank: CardRank) {
    if (rank === selectedRank) {
      setSelectedRank(null);
      return;
    }
    if (selectedSuit) {
      commitCard(`${rank}${selectedSuit}`);
      return;
    }
    setSelectedRank(rank);
  }

  function selectCardSuit(suit: CardSuit) {
    if (suit === selectedSuit) {
      setSelectedSuit(null);
      return;
    }
    if (selectedRank) {
      commitCard(`${selectedRank}${suit}`);
      return;
    }
    setSelectedSuit(suit);
  }

  function renderCardMethodSelector() {
    return (
      <View style={styles.methodList}>
        {CARD_METHODS.map(methodOption => {
          const selected = methodOption === method;
          const methodCopy = cardMethodCopy(methodOption, wordCount);
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={methodOption}
              onPress={() => changeMethod(methodOption)}
              style={[
                styles.methodOption,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.surface, borderColor: colors.accent },
              ]}
              testID={`card-method-${methodOption}`}
            >
              <Text style={[styles.methodTitle, { color: colors.text }]}>
                {methodCopy.title}
              </Text>
              <Text style={[styles.methodDescription, { color: colors.muted }]}>
                {methodCopy.description}
              </Text>
            </Pressable>
          );
        })}
        {!isDirect ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: matchesIanColeman }}
            onPress={() => selectIanColemanMatch(!matchesIanColeman)}
            style={({ pressed }) => [
              styles.colemanToggle,
              pressed && styles.pressed,
            ]}
            testID="card-ian-coleman-toggle"
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: matchesIanColeman ? colors.accent : colors.muted },
                matchesIanColeman && { backgroundColor: colors.accent },
              ]}
            >
              {matchesIanColeman ? (
                <Text style={[styles.checkboxMark, { color: colors.onAccent }]}>{'\u2713'}</Text>
              ) : null}
            </View>
            <View style={styles.colemanCopy}>
              <Text style={[styles.colemanLabel, { color: colors.text }]}>
                {UPSTREAM_TEXT.cards.coleman}
              </Text>
              <Text style={[styles.colemanNote, { color: colors.muted }]}>
                {UPSTREAM_UI_FALLBACK_COPY.cards.colemanNote}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="cards-screen-safe-area"
    >
      {activeView === 'setup' ? (
        <View style={styles.setupContent} testID="cards-setup-view">
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]} testID="cards-screen-title">
              {copy.mode}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]} testID="cards-screen-how">
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

          <View style={styles.setupSettings} testID="cards-setup-settings">
            {renderCardMethodSelector()}
            {copy.methodRequirement ? (
              <Text
                style={[styles.methodHelp, { color: colors.muted }]}
                testID="cards-method-requirement"
              >
                {copy.methodRequirement}
              </Text>
            ) : null}
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
              testID="open-cards-entry"
            >
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>
                {STUDIO_UI_TEXT.actions.start}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : activeView === 'entry' ? (
        <View style={styles.entryContent} testID="cards-entry-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-cards-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.mode.seed}
              </Text>
              <Text style={[styles.entrySubtitle, { color: colors.muted }]}>
                {copy.seedLengthValue}
              </Text>
            </View>
            <Bip39PassphraseButton
              compact
              colors={colors}
              onPress={openPassphrase}
              testID="open-cards-passphrase"
            />
          </View>

          <View style={styles.seedPreviewArea}>
            <DiceWordList
              compact
              colors={colors}
              dense={wordCount === 24}
              finalWord={directState?.finalWord}
              slotCount={wordCount}
              testID="live-card-words"
              words={words}
              wordSlotsAria={copy.wordSlotsAria}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.label, { color: colors.muted }]} testID="card-input-label">
              {copy.inputLabel}
            </Text>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.cards.undo}
              accessibilityRole="button"
              disabled={!transcript}
              onPress={undoLastEntry}
              style={({ pressed }) => [
                styles.undoButton,
                { opacity: transcript ? (pressed ? 0.72 : 1) : 0.38 },
              ]}
              testID="undo-card-entry"
            >
              <Text style={[styles.undoLabel, { color: colors.accent }]}>
                {UPSTREAM_TEXT.cards.undo}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.inputSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              accessibilityLabel={copy.inputLabel}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              multiline
              numberOfLines={3}
              onChangeText={updateTranscript}
              onKeyPress={event => {
                if (!isCardKeyAllowed(event.nativeEvent.key, method, directState?.activeMax)) {
                  event.preventDefault();
                }
              }}
              placeholder={copy.inputPlaceholder}
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.accent}
              showSoftInputOnFocus={false}
              spellCheck={false}
              style={[styles.transcriptInput, { color: colors.text }]}
              testID="card-transcript-input"
              textContentType="none"
              value={displayedTranscript}
            />
            <View style={[styles.progressTrack, { backgroundColor: colors.segment }]}>
              <View
                style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.muted }]} testID="card-progress">
              {progressText}
            </Text>
          </View>

          <Text style={[styles.methodHelp, { color: colors.muted }]} testID="cards-method-help">
            {copy.inputHelp}
          </Text>

          <View style={styles.cardArea}>
            {instruction ? (
              <Text style={[styles.instruction, { color: colors.accent }]} testID="card-instruction">
                {instruction}
              </Text>
            ) : null}

            {isDirect ? (
              <DirectCardPicker
                activeMax={directState?.activeMax ?? 0}
                colors={colors}
                disabled={directState?.step === undefined || directState.activeMax === 0}
                onSelect={appendDirectRank}
              />
            ) : (
              <HashedCardPicker
                availableRanks={selection.availableRanks}
                availableSuits={selection.availableSuits}
                compatibleRanks={selection.compatibleRanks}
                compatibleSuits={selection.compatibleSuits}
                colors={colors}
                onSelectRank={selectCardRank}
                onSelectSuit={selectCardSuit}
                selectedRank={selectedRank}
                selectedSuit={selectedSuit}
              />
            )}
          </View>

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
            testID="derive-card-phrase"
          >
            <Text style={[styles.buttonText, { color: colors.onAccent }]} testID="derive-card-phrase-label">
              {copy.deriveAction}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Bip39PassphraseView
          backTestID="close-cards-passphrase"
          colors={colors}
          inputTestID="cards-passphrase-input"
          onBack={() => setActiveView('entry')}
          onChangePassphrase={setPassphrase}
          screenTestID="cards-passphrase-view"
          value={passphrase}
        />
      )}

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="card-result-sheet"
        title={copy.deriveAction}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        <CardResultPanel
          colors={colors}
          entropyLabel={copy.resultEntropy}
          masterSeedLabel={copy.resultMasterSeed}
          result={result}
        />
      </NativeSheet>
    </SafeAreaView>
  );
}

type HashedCardPickerProps = {
  readonly availableRanks: readonly CardRank[];
  readonly availableSuits: readonly CardSuit[];
  readonly compatibleRanks: readonly CardRank[];
  readonly compatibleSuits: readonly CardSuit[];
  readonly colors: ReturnType<typeof diceColors>;
  readonly onSelectRank: (rank: CardRank) => void;
  readonly onSelectSuit: (suit: CardSuit) => void;
  readonly selectedRank: CardRank | null;
  readonly selectedSuit: CardSuit | null;
};

function HashedCardPicker({
  availableRanks,
  availableSuits,
  compatibleRanks,
  compatibleSuits,
  colors,
  onSelectRank,
  onSelectSuit,
  selectedRank,
  selectedSuit,
}: HashedCardPickerProps) {
  return (
    <View style={[styles.picker, { borderColor: colors.border }]}>
      <View style={styles.suitRow}>
        {CARD_SUITS.map(suit => {
          const selected = suit.code === selectedSuit;
          const disabled =
            !availableSuits.includes(suit.code) ||
            (Boolean(selectedRank) && !compatibleSuits.includes(suit.code)) ||
            (Boolean(selectedSuit) && !selected);
          return (
            <Pressable
              accessibilityLabel={suit.label}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={suit.code}
              onPress={() => onSelectSuit(suit.code)}
              style={[
                styles.suitButton,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.segment, borderColor: colors.accent },
                disabled && styles.disabledChoice,
              ]}
              testID={`card-suit-${suit.code}`}
            >
              <Text style={[styles.suitSymbol, { color: suit.red ? colors.error : colors.text }]}>
                {suit.symbol}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.rankRow}>
        {CARD_RANKS.map(rank => {
          const selected = rank === selectedRank;
          const disabled =
            !availableRanks.includes(rank) ||
            (Boolean(selectedSuit) && !compatibleRanks.includes(rank)) ||
            (Boolean(selectedRank) && !selected);
          return (
            <Pressable
              accessibilityLabel={rank === 'T' ? '10' : rank}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={rank}
              onPress={() => onSelectRank(rank)}
              style={[
                styles.rankButton,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.segment, borderColor: colors.accent },
                disabled && styles.disabledChoice,
              ]}
              testID={`card-rank-${rank}`}
            >
              <Text style={[styles.rankText, { color: colors.text }]}>{rank}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type DirectCardPickerProps = {
  readonly activeMax: number;
  readonly colors: ReturnType<typeof diceColors>;
  readonly disabled: boolean;
  readonly onSelect: (rank: string) => void;
};

function DirectCardPicker({ activeMax, colors, disabled, onSelect }: DirectCardPickerProps) {
  return (
    <View style={[styles.picker, { borderColor: colors.border }]}>
      <View style={styles.directRankRow}>
        {DIRECT_CARD_RANKS.map((rank, index) => {
          const rankEnabled = !disabled && index < activeMax;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={!rankEnabled}
              key={rank}
              onPress={() => onSelect(rank)}
              style={[
                styles.directRankButton,
                { borderColor: colors.border },
                rankEnabled && { backgroundColor: colors.surface },
                !rankEnabled && styles.disabledChoice,
              ]}
              testID={`direct-card-rank-${rank}`}
            >
              <Text style={[styles.rankText, { color: colors.text }]}>{rank}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type CardResultPanelProps = {
  readonly colors: ReturnType<typeof diceColors>;
  readonly entropyLabel: string;
  readonly masterSeedLabel: string;
  readonly result: CardResult | null;
};

function CardResultPanel({
  colors,
  entropyLabel,
  masterSeedLabel,
  result,
}: CardResultPanelProps) {
  if (!result) {
    return null;
  }

  return (
    <View style={styles.result}>
      {result.error ? (
        <Text style={[styles.error, { color: colors.error }]} testID="card-error">
          {result.error}
        </Text>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.muted }]} testID="card-result-entropy-label">
            {entropyLabel}
          </Text>
          <Text selectable style={[styles.entropy, { color: colors.text }]} testID="card-entropy-output">
            {result.entropy}
          </Text>
          <Text
            style={[styles.label, styles.masterSeedLabel, { color: colors.muted }]}
            testID="card-master-seed-label"
          >
            {masterSeedLabel}
          </Text>
          <Text
            selectable
            style={[styles.entropy, { color: colors.text }]}
            testID="card-master-seed-output"
          >
            {result.masterSeed}
          </Text>
        </>
      )}
    </View>
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
    marginTop: 16,
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardArea: {
    marginTop: 12,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxMark: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  colemanCopy: {
    flex: 1,
    minWidth: 0,
  },
  colemanLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  colemanNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  colemanToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 2,
    paddingVertical: 4,
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
  disabledChoice: {
    opacity: 0.38,
  },
  directRankButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 42,
    width: '23%',
  },
  directRankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  entropy: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
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
  inputSurface: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  masterSeedLabel: {
    marginTop: 16,
  },
  methodDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  methodHelp: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  methodList: {
    gap: 8,
  },
  methodOption: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  optionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingLeft: 16,
  },
  optionsText: {
    fontSize: 15,
    fontWeight: '700',
  },
  picker: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 9,
  },
  progressTrack: {
    borderRadius: 2,
    height: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.72,
  },
  rankButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 38,
  },
  rankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  rankText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
  },
  result: {
    paddingBottom: 4,
  },
  screen: {
    flex: 1,
  },
  seedPreviewArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  suitButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  suitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suitSymbol: {
    fontSize: 20,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  transcriptInput: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 112,
    minHeight: 66,
    padding: 0,
    textAlignVertical: 'top',
  },
  undoButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  undoLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  setupActionArea: {
    flex: 0,
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
});