import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

export type EntropyResult =
  | { readonly entropy: string; readonly error?: never }
  | { readonly entropy?: never; readonly error: string };

type Props = {
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly result: EntropyResult | null;
};

export function DiceResultPanel({
  colors,
  entropyLabel,
  result,
}: Props) {
  if (!result) {
    return null;
  }

  return (
    <View style={styles.result}>
      {result.error ? (
        <Text
          style={[styles.error, { color: colors.error }]}
          testID="dice-error"
        >
          {result.error}
        </Text>
      ) : (
        <>
          <Text
            style={[styles.label, { color: colors.muted }]}
            testID="result-entropy-label"
          >
            {entropyLabel}
          </Text>
          <Text
            selectable
            style={[styles.entropy, { color: colors.text }]}
            testID="entropy-output"
          >
            {result.entropy}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entropy: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  result: { paddingBottom: 4 },
});
