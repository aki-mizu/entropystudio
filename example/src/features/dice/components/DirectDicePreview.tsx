import { StyleSheet, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DiceColors } from '../diceTheme';
import { SeedWordGrid } from './SeedWordGrid';

type DiceWordListProps = {
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly slotCount?: number;
  readonly testID: string;
  readonly words: readonly string[];
  readonly wordSlotsAria: string;
};

type Props = {
  readonly colors: DiceColors;
  readonly selectedFinalWord: string;
  readonly slotCount?: number;
  readonly state: DirectDiceState;
  readonly wordSlotsAria: string;
};

export function DiceWordList({
  colors,
  finalWord,
  slotCount,
  testID,
  words,
  wordSlotsAria,
}: DiceWordListProps) {
  if (words.length === 0 && !slotCount) {
    return null;
  }

  return (
    <View
      accessibilityLabel={wordSlotsAria}
      accessible={words.length === 0}
      style={[styles.container, { borderColor: colors.border }]}
    >
      <SeedWordGrid
        colors={colors}
        finalWord={finalWord}
        slotCount={slotCount}
        testID={testID}
        words={words}
      />
    </View>
  );
}

export function DirectDicePreview({
  colors,
  selectedFinalWord,
  slotCount,
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
      slotCount={slotCount}
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
});