import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiceGrid } from '../features/dice/components/DiceGrid';
import { DiceMethodSelector } from '../features/dice/components/DiceMethodSelector';
import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import { DiceTranscriptInput } from '../features/dice/components/DiceTranscriptInput';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { diceColors } from '../features/dice/diceTheme';
import { useDiceRolls } from '../features/dice/useDiceRolls';

const CONTENT_HORIZONTAL_PADDING = 24;

export function DiceRollsScreen({ isDarkMode }: { isDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const {
    appendFace,
    clearRolls,
    coldcardCopy,
    colemanCopy,
    copy,
    derivePhrase,
    method,
    progress,
    progressText,
    result,
    rollCount,
    rolls,
    selectMethod,
    selectWordCount,
    updateRolls,
    wordCount,
  } = useDiceRolls();
  const colors = diceColors(isDarkMode);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: safeAreaInsets.bottom + 32,
          paddingTop: safeAreaInsets.top + 28,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} testID="dice-screen-title">
          {copy.mode}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]} testID="dice-screen-how">
          {copy.how}
        </Text>
      </View>

      <DiceMethodSelector
        coldcardCopy={coldcardCopy}
        colemanCopy={colemanCopy}
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

      <DiceTranscriptInput
        colors={colors}
        inputLabel={copy.inputLabel}
        inputPlaceholder={copy.inputPlaceholder}
        onChange={updateRolls}
        onClear={clearRolls}
        progress={progress}
        progressText={progressText}
        rolls={rolls}
      />

      <DiceGrid colors={colors} inputLabel={copy.inputLabel} onSelect={appendFace} />

      <Pressable
        accessibilityRole="button"
        disabled={rollCount === 0}
        onPress={derivePhrase}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accent,
            opacity: rollCount === 0 ? 0.45 : pressed ? 0.82 : 1,
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

      <DiceResultPanel
        colors={colors}
        entropyLabel={copy.resultEntropy}
        phraseLabel={copy.resultPhrase}
        result={result}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  header: {
    marginBottom: 30,
  },
  screen: {
    flex: 1,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 39,
    marginTop: 8,
  },
});