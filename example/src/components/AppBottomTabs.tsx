import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DiceColors } from '../features/dice/diceTheme';
import { STUDIO_UI_TEXT } from '../features/studioUiCopy';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

export type AppTab = 'method' | 'settings';

type Props = {
  readonly activeTab: AppTab;
  readonly colors: DiceColors;
  readonly onSelectTab: (tab: AppTab) => void;
};

export function AppBottomTabs({ activeTab, colors, onSelectTab }: Props) {
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      testID="app-bottom-tab-bar"
    >
      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'method' }}
          onPress={() => onSelectTab('method')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'method' && { backgroundColor: colors.segment },
            pressed && styles.pressed,
          ]}
          testID="app-tab-method"
        >
          <Text
            style={[styles.label, { color: activeTab === 'method' ? colors.text : colors.muted }]}
          >
            {UPSTREAM_TEXT.keys.methodLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityHint={UPSTREAM_TEXT.sync.description}
          accessibilityLabel={STUDIO_UI_TEXT.navigation.settings}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'settings' }}
          onPress={() => onSelectTab('settings')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'settings' && { backgroundColor: colors.segment },
            pressed && styles.pressed,
          ]}
          testID="app-tab-settings"
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            numberOfLines={2}
            style={[styles.label, { color: activeTab === 'settings' ? colors.text : colors.muted }]}
          >
            {STUDIO_UI_TEXT.navigation.settings}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  safeArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
  },
});