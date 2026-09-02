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
    derivePhrase,
    estimatedBits,
    method,
    progress,
    requiredRolls,
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
        <Text style={[styles.eyebrow, { color: colors.accent }]}>ENTROPYSTUDIO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Dice rolls</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Build a BIP39 phrase from a physical dice transcript.
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
        onSelect={selectWordCount}
        wordCount={wordCount}
      />

      <DiceTranscriptInput
        colors={colors}
        estimatedBits={estimatedBits}
        onChange={updateRolls}
        onClear={clearRolls}
        progress={progress}
        requiredRolls={requiredRolls}
        rollCount={rollCount}
        rolls={rolls}
      />

      <DiceGrid colors={colors} onSelect={appendFace} />

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
        <Text style={[styles.buttonText, { color: colors.onAccent }]}>Derive phrase</Text>
      </Pressable>

      <DiceResultPanel colors={colors} result={result} />
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
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  screen: {
    flex: 1,
  },
  segment: {
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedControl: {
    borderRadius: 7,
    borderWidth: 1,
    gap: 3,
    padding: 3,
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