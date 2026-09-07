import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { KeyStationLifeHash } from '../features/keyStation/components/KeyStationLifeHash';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

type Props = {
  readonly activeTabId: number | null;
  readonly colors: DiceColors;
  readonly onDeleteActiveTab: () => void;
  readonly onOpenKeyStation: () => void;
  readonly onSelectTab: (id: number) => void;
  readonly tabs: readonly KeyStationTab[];
};

export function KeyStationTabs({
  activeTabId,
  colors,
  onDeleteActiveTab,
  onOpenKeyStation,
  onSelectTab,
  tabs,
}: Props) {
  const isStationActive = activeTabId === null;

  return (
    <View
      style={[styles.strip, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      testID="key-station-tab-strip"
    >
      <ScrollView
        contentContainerStyle={styles.tabList}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        <Pressable
          accessibilityLabel={UPSTREAM_TEXT.keys.station}
          accessibilityRole="tab"
          accessibilityState={{ selected: isStationActive }}
          onPress={onOpenKeyStation}
          style={({ pressed }) => [
            styles.tab,
            styles.stationTab,
            { borderBottomColor: isStationActive ? colors.accent : 'transparent' },
            pressed && styles.pressed,
          ]}
          testID="key-station-tab-lab"
        >
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.stationLabel, { color: isStationActive ? colors.text : colors.muted }]}
          >
            {UPSTREAM_TEXT.keys.station}
          </Text>
        </Pressable>
        {tabs.map(tab => {
          const selected = tab.id === activeTabId;
          return (
            <Pressable
              accessibilityLabel={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                { borderBottomColor: selected ? colors.accent : 'transparent' },
                pressed && styles.pressed,
              ]}
              testID={`key-station-tab-${tab.id}`}
            >
              <KeyStationLifeHash
                compact
                fingerprint={tab.masterFingerprint}
                imageTestID={`key-station-tab-${tab.id}-lifehash`}
              />
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={[styles.tabLabel, { color: selected ? colors.text : colors.muted }]}
                testID={`key-station-tab-${tab.id}-label`}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.controls, { borderLeftColor: colors.border }]}>
        <Pressable
          accessibilityLabel={UPSTREAM_TEXT.keys.add}
          accessibilityRole="button"
          onPress={onOpenKeyStation}
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}
          testID="key-station-add"
        >
          <Text style={[styles.controlIcon, { color: colors.accent }]}>+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={UPSTREAM_TEXT.keys.delete}
          accessibilityRole="button"
          accessibilityState={{ disabled: isStationActive }}
          disabled={isStationActive}
          onPress={onDeleteActiveTab}
          style={({ pressed }) => [
            styles.control,
            isStationActive && styles.disabled,
            pressed && styles.pressed,
          ]}
          testID="key-station-delete"
        >
          <Text style={[styles.controlIcon, { color: isStationActive ? colors.muted : colors.error }]}>-</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 42,
  },
  controlIcon: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 28,
  },
  controls: {
    flexDirection: 'row',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
  stationLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  stationTab: {
    minWidth: 112,
  },
  strip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 48,
  },
  tab: {
    alignItems: 'center',
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 148,
    minHeight: 48,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  tabList: {
    alignItems: 'stretch',
  },
  tabScroll: {
    flex: 1,
    minWidth: 0,
  },
});