import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

const SEED_WORD_COLUMNS = 3;

type Props = {
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly slotCount?: number;
  readonly testID: string;
  readonly words: readonly string[];
};

export function SeedWordGrid({
  colors,
  finalWord,
  slotCount,
  testID,
  words,
}: Props) {
  const displayedSlotCount = Math.max(words.length, slotCount ?? 0);
  if (displayedSlotCount === 0) {
    return null;
  }

  const slots = Array.from(
    { length: displayedSlotCount },
    (_, index) => words[index] ?? '',
  );

  return (
    <View
      accessibilityLabel={words.length > 0 ? words.join(' ') : undefined}
      accessible={words.length > 0}
      style={styles.grid}
      testID={testID}
    >
      {seedWordColumns(slots).map((column, columnIndex) => (
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
              testID={`${testID}-slot-${index + 1}`}
            >
              <Text style={[styles.number, { color: colors.muted }]}>{`${index + 1}.`}</Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                selectable
                style={[
                  styles.word,
                  {
                    color:
                      index === words.length - 1 && finalWord
                        ? colors.accent
                        : word
                          ? colors.text
                          : colors.placeholder,
                  },
                ]}
                testID={`${testID}-word-${index + 1}`}
              >
                {word || '\u2014'}
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