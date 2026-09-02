import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WORD_COUNTS } from '../dice';
import type { WordCount } from '../dice';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly label: string;
  readonly onSelect: (wordCount: WordCount) => void;
  readonly valueLabel: string;
  readonly wordCount: WordCount;
};

export function WordCountSelector({
  colors,
  label,
  onSelect,
  valueLabel,
  wordCount,
}: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]} testID="seed-length-label">
          {label}
        </Text>
        <Text style={[styles.sectionValue, { color: colors.accent }]} testID="seed-length-value">
          {valueLabel}
        </Text>
      </View>
      <View style={styles.wordCounts}>
        {WORD_COUNTS.map(count => {
          const selected = wordCount === count;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={count}
              onPress={() => onSelect(count)}
              style={[
                styles.wordCount,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              testID={`word-count-${count}`}
            >
              <Text style={[styles.wordCountText, { color: selected ? colors.onAccent : colors.text }]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 18,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  wordCount: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  wordCounts: {
    flexDirection: 'row',
    gap: 8,
  },
});