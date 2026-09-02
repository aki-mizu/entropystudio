import { StyleSheet, Text, View } from 'react-native';
import type { DiceResult } from '../dice';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly result: DiceResult | null;
};

export function DiceResultPanel({ colors, result }: Props) {
  if (!result) {
    return null;
  }

  return (
    <View style={[styles.result, { borderColor: colors.border }]}>
      {result.error ? (
        <Text style={[styles.error, { color: colors.error }]} testID="dice-error">
          {result.error}
        </Text>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.muted }]}>BIP39 PHRASE</Text>
          <Text selectable style={[styles.mnemonic, { color: colors.text }]} testID="mnemonic-output">
            {result.mnemonic}
          </Text>
          <Text style={[styles.label, styles.entropyLabel, { color: colors.muted }]}>ENTROPY</Text>
          <Text selectable style={[styles.entropy, { color: colors.text }]} testID="entropy-output">
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
  entropyLabel: {
    marginTop: 22,
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
  mnemonic: {
    fontSize: 16,
    lineHeight: 25,
  },
  result: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 28,
    paddingTop: 22,
  },
});