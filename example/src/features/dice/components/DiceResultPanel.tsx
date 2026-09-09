import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

export type EntropyResult =
  | {
      readonly entropy: string;
      readonly masterSeed?: string;
      readonly mnemonic?: string;
      readonly rootXprv?: string;
      readonly wifCompressed?: string;
      readonly wifUncompressed?: string;
      readonly error?: never;
    }
  | {
      readonly entropy?: never;
      readonly masterSeed?: never;
      readonly mnemonic?: never;
      readonly rootXprv?: never;
      readonly wifCompressed?: never;
      readonly wifUncompressed?: never;
      readonly error: string;
    };

type Props = {
  readonly afterMnemonic?: ReactNode;
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly masterSeedLabel?: string;
  readonly mnemonicLabel?: string;
  readonly rootXprvLabel?: string;
  readonly wifCompressedLabel?: string;
  readonly wifUncompressedLabel?: string;
  readonly result: EntropyResult | null;
};

export function DiceResultPanel({
  afterMnemonic,
  colors,
  entropyLabel,
  masterSeedLabel,
  mnemonicLabel,
  rootXprvLabel,
  wifCompressedLabel,
  wifUncompressedLabel,
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
          {wifCompressedLabel && result.wifCompressed ? (
            <>
              <Text
                style={[styles.label, { color: colors.muted }]}
                testID="wif-compressed-label"
              >
                {wifCompressedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: colors.text }]}
                testID="wif-compressed-output"
              >
                {result.wifCompressed}
              </Text>
            </>
          ) : null}
          {wifUncompressedLabel && result.wifUncompressed ? (
            <>
              <Text
                style={[styles.label, styles.wifUncompressedLabel, { color: colors.muted }]}
                testID="wif-uncompressed-label"
              >
                {wifUncompressedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: colors.text }]}
                testID="wif-uncompressed-output"
              >
                {result.wifUncompressed}
              </Text>
            </>
          ) : null}
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
          {mnemonicLabel && result.mnemonic ? afterMnemonic : null}
          <Text
            style={[
              styles.label,
              ((mnemonicLabel && result.mnemonic) ||
                (wifCompressedLabel && result.wifCompressed) ||
                (wifUncompressedLabel && result.wifUncompressed)) &&
                styles.entropyLabelAfterValue,
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
  entropyLabelAfterValue: { marginTop: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  masterSeedLabel: { marginTop: 16 },
  rootXprvLabel: { marginTop: 16 },
  result: { paddingBottom: 4 },
  wifUncompressedLabel: { marginTop: 16 },
});
