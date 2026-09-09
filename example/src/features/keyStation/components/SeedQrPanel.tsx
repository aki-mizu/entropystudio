import { encode } from 'uqr';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
} from '../../upstreamUiCopy';
import type { SeedQrData } from '../../../native/entropyStudio';

type Props = {
  readonly colors: DiceColors;
  readonly data: SeedQrData;
  readonly passphraseUsed: boolean;
};

export function QrCode({
  accessibilityLabel,
  border = 4,
  data,
  ecc = 'L',
  size,
  testID,
}: {
  readonly accessibilityLabel: string;
  readonly border?: number;
  readonly data: string | readonly number[];
  readonly ecc?: 'L' | 'M' | 'Q' | 'H';
  readonly size: number;
  readonly testID: string;
}) {
  const qr = encode(data, { border, ecc });

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.qr, { width: size }]}
      testID={testID}
    >
      {qr.data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.qrRow}>
          {row.map((dark, columnIndex) => (
            <View
              key={columnIndex}
              style={[
                styles.qrModule,
                {
                  backgroundColor: dark ? '#111111' : '#ffffff',
                  width: `${100 / qr.size}%`,
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function SeedQrPanel({ colors, data, passphraseUsed }: Props) {
  const { width } = useWindowDimensions();
  const modalWidth = Math.max(0, width - 48);
  const qrWidth = Math.max(0, modalWidth - 24);
  const [showingSeedQr, setShowingSeedQr] = useState(false);
  const [qrPopup, setQrPopup] = useState<'compact' | 'numeric' | null>(null);

  useEffect(() => {
    setShowingSeedQr(false);
    setQrPopup(null);
  }, [data.numeric]);

  const seedQrButton = (
    <Pressable
      accessibilityLabel={UPSTREAM_TEXT.result.seedQr}
      accessibilityRole="button"
      accessibilityState={{ expanded: showingSeedQr }}
      onPress={() => setShowingSeedQr(value => !value)}
      style={({ pressed }) => [styles.header, { opacity: pressed ? 0.72 : 1 }]}
      testID="toggle-seed-qr"
    >
      <View style={styles.headerContent}>
        <Text
          accessibilityElementsHidden
          style={[
            styles.disclosure,
            { color: showingSeedQr ? colors.text : colors.muted },
          ]}
          testID="seed-qr-indicator"
        >
          {showingSeedQr ? '▼' : '▶'}
        </Text>
        <Text
          style={[
            styles.title,
            { color: showingSeedQr ? colors.text : colors.muted },
          ]}
        >
          {UPSTREAM_TEXT.result.seedQr}
        </Text>
      </View>
    </Pressable>
  );

  if (!data.numeric) {
    return (
      <View
        style={[styles.panel, { borderColor: colors.border }]}
        testID="seed-qr-panel"
      >
        {seedQrButton}
        {showingSeedQr ? (
          <Text
            style={[styles.note, { color: colors.muted }]}
            testID="seed-qr-unavailable"
          >
            {formatCopy(UPSTREAM_TEXT.result.seedQrUnsupported, {
              n: data.wordCount,
            })}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[styles.panel, { borderColor: colors.border }]}
      testID="seed-qr-panel"
    >
      {seedQrButton}
      {showingSeedQr ? (
        <>
          <Text
            style={[styles.note, { color: colors.muted }]}
            testID="seed-qr-intro"
          >
            {UPSTREAM_TEXT.result.seedQrScan}
            {passphraseUsed ? UPSTREAM_TEXT.result.seedQrPassphrase : ''}
          </Text>
          <Pressable
            accessibilityLabel={UPSTREAM_TEXT.result.seedQrNumeric}
            accessibilityRole="button"
            onPress={() => setQrPopup('numeric')}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
            testID="open-seed-qr-popup"
          >
            <Text style={[styles.optionText, { color: colors.text }]}>
              {UPSTREAM_TEXT.result.seedQrNumeric}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={UPSTREAM_TEXT.result.compactSeedQr}
            accessibilityRole="button"
            onPress={() => setQrPopup('compact')}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
            testID="open-compact-seed-qr-popup"
          >
            <Text style={[styles.optionText, { color: colors.text }]}>
              {UPSTREAM_TEXT.result.compactSeedQr}
            </Text>
          </Pressable>
        </>
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={() => setQrPopup(null)}
        transparent
        visible={qrPopup !== null}
      >
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
          onPress={() => setQrPopup(null)}
          style={styles.modalBackdrop}
          testID="close-seed-qr-popup"
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.background, width: modalWidth },
            ]}
          >
            {qrPopup === 'numeric' ? (
              <>
                <QrCode
                  accessibilityLabel={UPSTREAM_TEXT.result.seedQrNumeric}
                  border={4}
                  data={data.numeric}
                  ecc="L"
                  size={qrWidth}
                  testID="seed-qr-numeric-code"
                />
                <Text style={[styles.note, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.seedQrCompatible}
                </Text>
                <Text
                  selectable
                  style={[styles.digits, { color: colors.muted }]}
                  testID="seed-qr-numeric-digits"
                >
                  {data.numeric}
                </Text>
              </>
            ) : (
              <>
                <QrCode
                  accessibilityLabel={UPSTREAM_TEXT.result.compactSeedQr}
                  border={4}
                  data={Array.from(new Uint8Array(data.compact))}
                  ecc="L"
                  size={qrWidth}
                  testID="compact-seed-qr-code"
                />
                <Text style={[styles.note, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.compactSeedQrCompatible}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  digits: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  disclosure: { fontSize: 16, lineHeight: 20 },
  header: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 36 },
  headerContent: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: '#00000099',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    alignItems: 'center',
    borderRadius: 8,
    maxWidth: '100%',
    padding: 12,
  },
  note: { fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  option: { borderRadius: 6, borderWidth: 1, marginTop: 12, padding: 12 },
  optionText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  panel: { borderTopWidth: 1, marginTop: 20, paddingTop: 18 },
  qr: { alignItems: 'center', backgroundColor: '#ffffff' },
  qrModule: { aspectRatio: 1 },
  qrRow: { flexDirection: 'row', width: '100%' },
  title: { fontSize: 14, fontWeight: '700' },
});
