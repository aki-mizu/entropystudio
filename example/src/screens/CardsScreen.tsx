import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MethodPicker } from '../components/MethodPicker';
import type { EntropyTool } from '../components/MethodPicker';
import {
  CARD_METHODS,
  CARD_RANKS,
  CARD_SUITS,
  DIRECT_CARD_RANKS,
  cardIsAvailable,
  cardMethodCopy,
  cardSelectionState,
  formatCardTranscript,
  isCardKeyAllowed,
  isHashedCardMethod,
} from '../features/cards/cards';
import type { CardMethod, CardRank, CardResult, CardSuit } from '../features/cards/cards';
import { useCards } from '../features/cards/useCards';
import { DiceWordList } from '../features/dice/components/DirectDicePreview';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { diceColors } from '../features/dice/diceTheme';

const CONTENT_HORIZONTAL_PADDING = 24;
type SheetName = 'result' | 'settings' | null;

type Props = {
  readonly activeTool: EntropyTool;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

export function CardsScreen({ activeTool, isDarkMode, onSelectTool }: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [selectedRank, setSelectedRank] = useState<CardRank | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<CardSuit | null>(null);
  const {
    appendCard,
    appendDirectRank,
    canDerive,
    copy,
    directState,
    derivePhrase,
    instruction,
    method,
    progress,
    progressText,
    result,
    selectMethod,
    selectWordCount,
    transcript,
    undoLastEntry,
    updateTranscript,
    wordCount,
  } = useCards();
  const colors = diceColors(isDarkMode);
  const isDirect = method === 'direct';
  const displayedTranscript = isHashedCardMethod(method)
    ? formatCardTranscript(transcript, method)
    : transcript;
  const selection = cardSelectionState(transcript, wordCount, selectedRank, selectedSuit);
  const words = directState
    ? directState.finalWord
      ? [...directState.words, directState.finalWord]
      : directState.words
    : result?.mnemonic
      ? result.mnemonic.split(' ')
      : [];

  function showResult() {
    derivePhrase();
    setActiveSheet('result');
  }

  function changeMethod(value: CardMethod) {
    setSelectedRank(null);
    setSelectedSuit(null);
    selectMethod(value);
  }

  function changeWordCount(value: typeof wordCount) {
    setSelectedRank(null);
    setSelectedSuit(null);
    selectWordCount(value);
  }

  function commitCard(card: string) {
    if (!cardIsAvailable(transcript, card, wordCount)) {
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(20, safeAreaInsets.bottom + 12),
            paddingTop: Math.max(12, safeAreaInsets.top + 8),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]} testID="cards-screen-title">
              {copy.mode}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]} testID="cards-screen-how">
              {copy.how}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('settings')}
            style={styles.optionsButton}
            testID="open-card-settings"
          >
            <Text style={[styles.optionsText, { color: colors.accent }]}>Options</Text>
          </Pressable>
        </View>

        <MethodPicker activeTool={activeTool} colors={colors} onSelect={onSelectTool} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.seedLengthLabel}
          onPress={() => setActiveSheet('settings')}
          style={[styles.workflowSummary, { borderColor: colors.border }]}
          testID="cards-workflow-summary"
        >
          <Text numberOfLines={1} style={[styles.workflowTitle, { color: colors.text }]}>
            {cardMethodCopy(method, wordCount).title}
          </Text>
          <Text style={[styles.workflowValue, { color: colors.accent }]} testID="card-seed-length-value">
            {copy.seedLengthValue}
          </Text>
        </Pressable>

        <Text style={[styles.methodHelp, { color: colors.muted }]} testID="cards-method-help">
          {copy.inputHelp}
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: colors.muted }]} testID="card-input-label">
            {copy.inputLabel}
          </Text>
          <Pressable
            accessibilityLabel={isDirect ? 'Undo last rank draw' : 'Undo last card'}
            accessibilityRole="button"
            disabled={!transcript}
            onPress={undoLastEntry}
            style={({ pressed }) => [
              styles.undoButton,
              { opacity: transcript ? (pressed ? 0.72 : 1) : 0.38 },
            ]}
            testID="undo-card-entry"
          >
            <Text style={[styles.undoLabel, { color: colors.accent }]}>Undo</Text>
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

        <View style={styles.cardArea}>
          <DiceWordList
            compact={windowHeight < 700}
            colors={colors}
            finalWord={directState?.finalWord}
            slotCount={wordCount}
            testID="live-card-words"
            words={words}
            wordSlotsAria={copy.wordSlotsAria}
          />

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
      </ScrollView>

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="card-settings-sheet"
        title={copy.mode}
        visible={activeSheet === 'settings'}
      >
        <View style={styles.methodList}>
          {CARD_METHODS.map(methodOption => {
            const selected = methodOption === method;
            const methodCopy = cardMethodCopy(methodOption, wordCount);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={methodOption}
                onPress={() => changeMethod(methodOption)}
                style={[
                  styles.methodOption,
                  { borderColor: colors.border },
                  selected && { backgroundColor: colors.segment, borderColor: colors.accent },
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
        </View>
        <WordCountSelector
          colors={colors}
          label={copy.seedLengthLabel}
          onSelect={changeWordCount}
          valueLabel={copy.seedLengthValue}
          wordCount={wordCount}
        />
      </NativeSheet>

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="card-result-sheet"
        title={copy.deriveAction}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        <CardResultPanel colors={colors} entropyLabel={copy.resultEntropy} result={result} />
      </NativeSheet>
    </View>
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
              accessibilityLabel={`Select ${suit.code} suit`}
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
              accessibilityLabel={`Select ${rank} rank`}
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
  readonly result: CardResult | null;
};

function CardResultPanel({ colors, entropyLabel, result }: CardResultPanelProps) {
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  content: {
    flexGrow: 1,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
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
  workflowSummary: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 52,
  },
  workflowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    paddingRight: 12,
  },
  workflowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});