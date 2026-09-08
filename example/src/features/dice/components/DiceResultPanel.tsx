import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

export type EntropyResult =
  | {
      readonly entropy: string;
      readonly masterSeed?: string;
      readonly mnemonic?: string;
      readonly rootXprv?: string;
      readonly error?: never;
    }
  | {
      readonly entropy?: never;
      readonly masterSeed?: never;
      readonly mnemonic?: never;
      readonly rootXprv?: never;
      readonly error: string;
    };

type Props = {
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly masterSeedLabel?: string;
  readonly mnemonicLabel?: string;
  readonly rootXprvLabel?: string;
  readonly result: EntropyResult | null;
};

export function DiceResultPanel({
  colors,
  entropyLabel,
  masterSeedLabel,
  mnemonicLabel,
  rootXprvLabel,
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
          {mnemonicLabel && result.mnemonic ? (
            <>
              <Text
                style={[styles.label, { color: colors.muted }]}
                testID="result-seed-phrase-label"
              >
                {mnemonicLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: colors.text }]}
                testID="result-seed-phrase-output"
              >
                {result.mnemonic}
              </Text>
            </>
          ) : null}
          <Text
            style={[
              styles.label,
              mnemonicLabel && result.mnemonic && styles.entropyLabelAfterSeedPhrase,
              { color: colors.muted },
            ]}
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
          {rootXprvLabel && result.rootXprv ? (
            <>
              <Text
                style={[styles.label, styles.rootXprvLabel, { color: colors.muted }]}
                testID="root-xprv-label"
              >
                {rootXprvLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: colors.text }]}
                testID="root-xprv-output"
              >
                {result.rootXprv}
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
  entropyLabelAfterSeedPhrase: { marginTop: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  masterSeedLabel: { marginTop: 16 },
  rootXprvLabel: { marginTop: 16 },
  result: { paddingBottom: 4 },
});
