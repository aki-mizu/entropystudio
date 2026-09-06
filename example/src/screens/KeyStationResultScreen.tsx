import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiceResultPanel } from '../features/dice/components/DiceResultPanel';
import type { DiceColors } from '../features/dice/diceTheme';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';

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
          <DiceResultPanel
            colors={colors}
            entropyLabel={UPSTREAM_TEXT.result.entropyHex}
            masterSeedLabel={UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex}
            result={{ entropy: derivation.entropy, masterSeed: derivation.masterSeed }}
          />
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
  hidden: {
    display: 'none',
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
});