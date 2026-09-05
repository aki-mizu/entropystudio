import { StyleSheet, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DiceColors } from '../diceTheme';
import { SeedWordGrid } from './SeedWordGrid';

type DiceWordListProps = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly slotCount?: number;
  readonly testID: string;
  readonly words: readonly string[];
};

type Props = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly slotCount?: number;
  readonly state: DirectDiceState;
};

export function DiceWordList({
  compact = false,
  colors,
  finalWord,
  slotCount,
  testID,
  words,
}: DiceWordListProps) {
  if (words.length === 0 && !slotCount) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { borderColor: colors.border },
      ]}
    >
      <SeedWordGrid
        compact={compact}
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
  compact,
  colors,
  slotCount,
  state,
}: Props) {
  const finalWord = state.finalWord;
  const words = finalWord ? [...state.words, finalWord] : state.words;

  return (
    <DiceWordList
      compact={compact}
      colors={colors}
      finalWord={finalWord}
      slotCount={slotCount}
      testID="direct-dice-words"
      words={words}
    />
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    marginBottom: 4,
    paddingBottom: 2,
    paddingTop: 4,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    paddingBottom: 4,
    paddingTop: 8,
  },
});