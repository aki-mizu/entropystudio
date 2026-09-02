import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DirectDiceFinalWordPicker } from '../features/dice/components/DirectDiceFinalWordPicker';
import { DiceGrid } from '../features/dice/components/DiceGrid';
import { DiceWordList, DirectDicePreview } from '../features/dice/components/DirectDicePreview';
import { DiceMethodSelector } from '../features/dice/components/DiceMethodSelector';
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceTranscriptInput } from '../features/dice/components/DiceTranscriptInput';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { D8_D16_FACES, enabledDiceFaces } from '../features/dice/dice';
import { diceColors } from '../features/dice/diceTheme';
import { useDiceRolls } from '../features/dice/useDiceRolls';

const CONTENT_HORIZONTAL_PADDING = 24;
type SheetName = 'final-word' | 'result' | 'settings' | null;

export function DiceRollsScreen({ isDarkMode }: { isDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const {
    appendFace,
    bitboxCopy,
    canDerive,
    clearRolls,
    coldcardCopy,
    colemanCopy,
    copy,
    directCopy,
    directState,
    derivePhrase,
    d8D16Copy,
    method,
    progress,
    progressText,
    result,
    rolls,
    selectedFinalWord,
    selectFinalWord,
    selectMethod,
    selectWordCount,
    updateRolls,
    wordCount,
  } = useDiceRolls();
  const colors = diceColors(isDarkMode);
  const selectedMethodCopy =
    method === 'bitbox'
      ? bitboxCopy
      : method === 'coleman'
        ? colemanCopy
        : method === 'd8d16'
          ? d8D16Copy
          : coldcardCopy;
  const isCompactHeight = windowHeight < 700;
  const maxTileSize =
    method === 'd8d16' ? (isCompactHeight ? 48 : 56) : isCompactHeight ? 68 : 84;
  const enabledFaces = enabledDiceFaces(method, directState);
  const liveHashedWords =
    !directState && result && typeof result.mnemonic === 'string'
      ? result.mnemonic.split(' ')
      : [];
  const canChooseFinalWord =
    method === 'bitbox' && Boolean(directState && directCopy && directState.candidates.length > 0);

  function showResult() {
    derivePhrase();
    setActiveSheet('result');
  }

  function chooseFinalWord(word: string) {
    selectFinalWord(word);
    setActiveSheet(null);
  }

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(12, safeAreaInsets.bottom + 8),
            paddingTop: Math.max(12, safeAreaInsets.top + 8),
          },
        ]}
      >
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
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('settings')}
            style={styles.optionsButton}
            testID="open-dice-settings"
          >
            <Text style={[styles.optionsText, { color: colors.accent }]}>Options</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.seedLengthLabel}
          onPress={() => setActiveSheet('settings')}
          style={[styles.workflowSummary, { borderColor: colors.border }]}
          testID="dice-workflow-summary"
        >
          <Text
            numberOfLines={1}
            style={[styles.workflowTitle, { color: colors.text }]}
            testID="dice-method-summary"
          >
            {selectedMethodCopy.title}
          </Text>
          <Text style={[styles.workflowValue, { color: colors.accent }]} testID="seed-length-value">
            {copy.seedLengthValue}
          </Text>
        </Pressable>

        <DiceTranscriptInput
          colors={colors}
          inputLabel={copy.inputLabel}
          inputPlaceholder={copy.inputPlaceholder}
          method={method}
          onChange={updateRolls}
          onClear={clearRolls}
          progress={progress}
          progressText={progressText}
          rolls={rolls}
          wordCount={wordCount}
        />

        <View style={styles.rollArea}>
          {directState ? (
            <DirectDicePreview
              colors={colors}
              selectedFinalWord={selectedFinalWord}
              slotCount={wordCount}
              state={directState}
              wordSlotsAria={copy.wordSlotsAria}
            />
          ) : (
            <DiceWordList
              colors={colors}
              slotCount={wordCount}
              testID="live-dice-words"
              words={liveHashedWords}
              wordSlotsAria={copy.wordSlotsAria}
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

          <DiceGrid
            columns={method === 'd8d16' ? 8 : 6}
            colors={colors}
            enabledFaces={enabledFaces}
            faces={method === 'd8d16' ? D8_D16_FACES : undefined}
            inputLabel={copy.inputLabel}
            maxTileSize={maxTileSize}
            onSelect={appendFace}
          />
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
          testID="derive-dice-phrase"
        >
          <Text
            style={[styles.buttonText, { color: colors.onAccent }]}
            testID="derive-dice-phrase-label"
          >
            {copy.deriveAction}
          </Text>
        </Pressable>
      </View>

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="dice-settings-sheet"
        title={copy.mode}
        visible={activeSheet === 'settings'}
      >
        <DiceMethodSelector
          copies={{
            bitbox: bitboxCopy,
            coldcard: coldcardCopy,
            coleman: colemanCopy,
            d8d16: d8D16Copy,
          }}
          colors={colors}
          method={method}
          onSelect={selectMethod}
        />
        <WordCountSelector
          colors={colors}
          label={copy.seedLengthLabel}
          onSelect={selectWordCount}
          valueLabel={copy.seedLengthValue}
          wordCount={wordCount}
        />
      </NativeSheet>

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
            finalWordAria={copy.lastWordAria}
            finalWordLabel={directCopy.finalWordLabel}
            finalWordPlaceholder={copy.lastWordPlaceholder}
            onChangeFinalWord={selectFinalWord}
            onSelectFinalWord={chooseFinalWord}
            selectedFinalWord={selectedFinalWord}
            state={directState}
          />
        ) : null}
      </NativeSheet>

      <NativeSheet
        colors={colors}
        onDismiss={() => setActiveSheet(null)}
        testID="dice-result-sheet"
        title={copy.deriveAction}
        visible={activeSheet === 'result' && Boolean(result)}
      >
        <DiceResultPanel
          colors={colors}
          entropyLabel={copy.resultEntropy}
          result={result}
        />
      </NativeSheet>
    </View>
  );
}

const styles = StyleSheet.create({
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
  content: {
    flex: 1,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
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
  rollArea: {
    marginTop: 12,
  },
  screen: {
    flex: 1,
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