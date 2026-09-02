import { StyleSheet, Text, View } from 'react-native';
import type { DiceResult } from '../dice';
import type { DiceColors } from '../diceTheme';
import { SeedWordGrid } from './SeedWordGrid';

type Props = {
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly phraseLabel: string;
  readonly result: DiceResult | null;
};

export function DiceResultPanel({
  colors,
  entropyLabel,
  phraseLabel,
  result,
}: Props) {
  if (!result) {
    return null;
  }

  const mnemonic = result.mnemonic ?? '';
  const mnemonicWords = mnemonic.split(/\s+/).filter(Boolean);

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
            testID="result-phrase-label"
          >
            {phraseLabel}
          </Text>
          <SeedWordGrid
            colors={colors}
            testID="mnemonic-output"
            words={mnemonicWords}
          />
          <Text
            style={[styles.label, styles.entropyLabel, { color: colors.muted }]}
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
  entropyLabel: {
    marginTop: 18,
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
  result: {
    paddingBottom: 4,
  },
});
