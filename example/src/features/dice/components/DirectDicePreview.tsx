import { StyleSheet, Text, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DiceColors } from '../diceTheme';

type DiceWordListProps = {
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly testID: string;
  readonly words: readonly string[];
  readonly wordSlotsAria: string;
};

type Props = {
  readonly colors: DiceColors;
  readonly selectedFinalWord: string;
  readonly state: DirectDiceState;
  readonly wordSlotsAria: string;
};

export function DiceWordList({
  colors,
  finalWord,
  testID,
  words,
  wordSlotsAria,
}: DiceWordListProps) {
  if (words.length === 0) {
    return null;
  }

  return (
    <View
      accessibilityLabel={wordSlotsAria}
      style={[styles.container, { borderColor: colors.border }]}
    >
      <Text
        accessibilityLabel={words.join(' ')}
        selectable
        style={styles.wordText}
        testID={testID}
      >
        {words.map((word, index) => (
          <Text
            key={`${word}-${index}`}
            style={{ color: index === words.length - 1 && finalWord ? colors.accent : colors.text }}
          >
            {`${index === 0 ? '' : ' '}${word}`}
          </Text>
        ))}
      </Text>
    </View>
  );
}

export function DirectDicePreview({
  colors,
  selectedFinalWord,
  state,
  wordSlotsAria,
}: Props) {
  const selectedWord = selectedFinalWord.trim().toLowerCase();
  const finalWord =
    state.finalWord || (state.candidates.includes(selectedWord) ? selectedWord : '');
  const words = finalWord ? [...state.words, finalWord] : state.words;

  return (
    <DiceWordList
      colors={colors}
      finalWord={finalWord}
      testID="direct-dice-words"
      words={words}
      wordSlotsAria={wordSlotsAria}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    paddingBottom: 4,
    paddingTop: 8,
  },
  wordText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});