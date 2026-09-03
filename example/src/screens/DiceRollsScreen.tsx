import { useEffect, useState } from 'react';
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
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceTranscriptInput } from '../features/dice/components/DiceTranscriptInput';
import type { DiceTranscriptSelection } from '../features/dice/components/DiceTranscriptInput';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { D8_D16_FACES, enabledDiceFaces } from '../features/dice/dice';
import type { DiceInputFace } from '../features/dice/dice';
import { diceColors } from '../features/dice/diceTheme';
import { useDiceRolls } from '../features/dice/useDiceRolls';

const CONTENT_HORIZONTAL_PADDING = 24;
type DiceView = 'entry' | 'setup';
type SheetName = 'final-word' | 'result' | null;

type Props = {
  readonly activeTool: EntropyTool;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSelectTool: (tool: EntropyTool) => void;
};

export function DiceRollsScreen({ activeTool, isActive, isDarkMode, onSelectTool }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [activeView, setActiveView] = useState<DiceView>('setup');
  const [transcriptSelection, setTranscriptSelection] =
    useState<DiceTranscriptSelection | null>(null);
  const [selectionRequestId, setSelectionRequestId] = useState(0);
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

  function showResult() {
    derivePhrase();
    setActiveSheet('result');
  }

  function chooseFinalWord(word: string) {
    selectFinalWord(word);
    setActiveSheet(null);
  }

  function changeMethod(value: typeof method) {
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
    );
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
            <WordCountSelector
              colors={colors}
              label={copy.seedLengthLabel}
              onSelect={selectWordCount}
              valueLabel={copy.seedLengthValue}
              wordCount={wordCount}
            />
          </View>

          <View style={styles.setupActionArea}>
            <Pressable
              accessibilityLabel="Enter dice rolls"
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
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>Enter rolls</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.entryContent} testID="dice-rolls-view">
          <View style={[styles.entryHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityLabel="Back to dice settings"
              accessibilityRole="button"
              onPress={() => setActiveView('setup')}
              style={styles.backButton}
              testID="close-dice-entry"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>Back</Text>
            </Pressable>
            <View style={styles.entryHeaderCopy}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>Seed</Text>
              <Text style={[styles.entrySubtitle, { color: colors.muted }]}>
                {copy.seedLengthValue}
              </Text>
            </View>
          </View>

          <View style={styles.seedPreviewArea}>
            {directState ? (
              <DirectDicePreview
                compact
                colors={colors}
                selectedFinalWord={selectedFinalWord}
                slotCount={wordCount}
                state={directState}
                wordSlotsAria={copy.wordSlotsAria}
              />
            ) : (
              <DiceWordList
                compact
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
              columns={method === 'd8d16' ? 8 : 6}
              colors={colors}
              enabledFaces={enabledFaces}
              faces={method === 'd8d16' ? D8_D16_FACES : undefined}
              inputLabel={copy.inputLabel}
              maxTileSize={maxTileSize}
              onSelect={insertDiceFace}
            />
          </View>

          <View style={styles.actionBar}>{renderDeriveButton()}</View>
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
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