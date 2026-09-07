import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import type { DiceColors } from '../features/dice/diceTheme';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly colors: DiceColors;
  readonly isActive: boolean;
  readonly onReturnToStation: () => void;
  readonly tab: KeyStationTab | null;
};

export function KeyStationResultScreen({ colors, isActive, onReturnToStation, tab }: Props) {
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onReturnToStation();
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToStation]);

  if (!tab) {
    return null;
  }

  const { derivation } = tab;

  return (
    <View
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[styles.screen, { backgroundColor: colors.background }, !isActive && styles.hidden]}
      testID="key-station-result-screen"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {derivation.kind === 'private-key' ? (
          <Text style={[styles.privateKeyTitle, { color: colors.text }]} testID="key-station-private-key-title">
            {tab.name}
          </Text>
        ) : null}
        {derivation.kind === 'bip39' ? (
          <>
            <View style={styles.summary} testID="key-station-summary">
              <Text style={[styles.fingerprint, { color: colors.text }]} testID="key-station-master-fingerprint-value">
                {tab.masterFingerprint}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]} testID="key-station-method-value">
                {UPSTREAM_UI_LABELS.keyMode[tab.method]}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]} testID="key-station-script-value">
                {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
              </Text>
              <Text style={[styles.meta, styles.path, { color: colors.muted }]} testID="key-station-path-value">
                {tab.derivationPath}
              </Text>
            </View>
            <DiceResultPanel
              colors={colors}
              entropyLabel={UPSTREAM_TEXT.result.entropyHex}
              masterSeedLabel={UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex}
              result={{ entropy: derivation.entropy, masterSeed: derivation.masterSeed }}
            />
          </>
        ) : (
          <DiceResultPanel
            colors={colors}
            entropyLabel={UPSTREAM_TEXT.result.privateKey}
            result={{ entropy: derivation.entropy }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 22,
  },
  fingerprint: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
  },
  hidden: {
    display: 'none',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  path: {
    fontFamily: 'monospace',
  },
  privateKeyTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 18,
  },
  screen: {
    flex: 1,
  },
  summary: {
    marginBottom: 18,
  },
});