import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

const SEED_WORD_COLUMNS = 3;

type Props = {
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly testID: string;
  readonly words: readonly string[];
};

export function SeedWordGrid({ colors, finalWord, testID, words }: Props) {
  if (words.length === 0) {
    return null;
  }

  return (
    <View
      accessibilityLabel={words.join(' ')}
      accessible
      style={styles.grid}
      testID={testID}
    >
      {seedWordColumns(words).map((column, columnIndex) => (
        <View
          key={columnIndex}
          style={styles.column}
          testID={`${testID}-column-${columnIndex + 1}`}
        >
          {column.map(({ index, word }) => (
            <View
              key={index}
              style={[
                styles.slot,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.number, { color: colors.muted }]}>{`${index + 1}.`}</Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                selectable
                style={[
                  styles.word,
                  { color: index === words.length - 1 && finalWord ? colors.accent : colors.text },
                ]}
              >
                {word}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function seedWordColumns(words: readonly string[]) {
  const wordsPerColumn = Math.ceil(words.length / SEED_WORD_COLUMNS);

  return Array.from({ length: SEED_WORD_COLUMNS }, (_, columnIndex) =>
    words
      .slice(columnIndex * wordsPerColumn, (columnIndex + 1) * wordsPerColumn)
      .map((word, wordIndex) => ({
        index: columnIndex * wordsPerColumn + wordIndex,
        word,
      })),
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  number: {
    flexShrink: 0,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  slot: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 34,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  word: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 4,
    minWidth: 0,
  },
});