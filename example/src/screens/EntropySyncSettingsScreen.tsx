import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { diceColors } from '../features/dice/diceTheme';
import { EntropySyncControl, useEntropySync } from '../features/entropySync';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onReturnToMethod: () => void;
};

export function EntropySyncSettingsScreen({
  isActive,
  isDarkMode,
  onReturnToMethod,
}: Props) {
  const colors = diceColors(isDarkMode);
  const entropySync = useEntropySync();

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onReturnToMethod();
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToMethod]);

  return (
    <SafeAreaView
      edges={['top']}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="entropy-sync-settings-safe-area"
    >
      <View style={styles.content} testID="entropy-sync-settings-screen">
        <WordCountSelector
          colors={colors}
          label={UPSTREAM_TEXT.seedLength.label}
          onSelect={entropySync.selectTargetWords}
          valueLabel={UPSTREAM_TEXT.seedLength.words.replace(
            '{n}',
            String(entropySync.targetWords),
          )}
          wordCount={entropySync.targetWords}
        />
        <EntropySyncControl
          colors={colors}
          enabled={entropySync.enabled}
          onDisable={entropySync.disable}
          onEnable={() => entropySync.enable()}
          snapshot={entropySync.snapshot}
          testID="entropy-sync-settings"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  hidden: {
    display: 'none',
  },
  screen: {
    flex: 1,
  },
});