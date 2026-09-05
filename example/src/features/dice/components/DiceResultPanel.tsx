import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

export type EntropyResult =
  | { readonly entropy: string; readonly masterSeed?: string; readonly error?: never }
  | { readonly entropy?: never; readonly masterSeed?: never; readonly error: string };

type Props = {
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly masterSeedLabel?: string;
  readonly result: EntropyResult | null;
};

export function DiceResultPanel({
  colors,
  entropyLabel,
  masterSeedLabel,
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
          {masterSeedLabel && result.masterSeed ? (
            <>
              <Text
                style={[styles.label, styles.masterSeedLabel, { color: colors.muted }]}
                testID="master-seed-label"
              >
                {masterSeedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: colors.text }]}
                testID="master-seed-output"
              >
                {result.masterSeed}
              </Text>
            </>
          ) : null}
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
  masterSeedLabel: { marginTop: 16 },
  result: { paddingBottom: 4 },
});
