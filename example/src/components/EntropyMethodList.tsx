import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { NativeSheet } from '../features/dice/components/NativeSheet';
import { UPSTREAM_TEXT, UPSTREAM_UI_LABELS } from '../features/upstreamUiCopy';

export type EntropyTool = 'cards' | 'dice' | 'hex' | 'key' | 'seed';

const ENTROPY_TOOLS: readonly EntropyTool[] = ['dice', 'cards', 'hex', 'seed', 'key'];
const ENTROPY_TOOL_LABELS: Record<EntropyTool, string> = {
  cards: UPSTREAM_UI_LABELS.keyMode.cards,
  dice: UPSTREAM_UI_LABELS.keyMode.dice,
  hex: UPSTREAM_UI_LABELS.keyMode.hex,
  key: UPSTREAM_UI_LABELS.keyMode.key,
  seed: UPSTREAM_UI_LABELS.keyMode.seed,
};

type Props = {
  readonly activeTool: EntropyTool;
  readonly colors: DiceColors;
  readonly isActive: boolean;
  readonly onSelect: (tool: EntropyTool) => void;
};

export function EntropyMethodList({
  activeTool,
  colors,
  isActive,
  onSelect,
}: Props) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosPendingTool, setIosPendingTool] = useState<EntropyTool>(activeTool);
  const selectedToolLabel = ENTROPY_TOOL_LABELS[activeTool];

  function openIosPicker() {
    setIosPendingTool(activeTool);
    setIosPickerOpen(true);
  }

  function dismissIosPicker() {
    setIosPickerOpen(false);
    setIosPendingTool(activeTool);
  }

  function confirmIosPicker() {
    setIosPickerOpen(false);
    if (iosPendingTool !== activeTool) {
      onSelect(iosPendingTool);
    }
  }

  return (
    <View
      accessibilityElementsHidden={!isActive}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      style={styles.container}
      testID="key-method-list"
    >
      <Text style={[styles.label, { color: colors.muted }]} testID="key-method-label">
        {UPSTREAM_TEXT.keys.methodLabel}
      </Text>
      {Platform.OS === 'ios' ? (
        <>
          <View
            style={[
              styles.pickerShell,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.keys.methodLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isActive, expanded: iosPickerOpen }}
              accessibilityValue={{ text: selectedToolLabel }}
              disabled={!isActive}
              onPress={openIosPicker}
              style={styles.iosPicker}
              testID="key-method-picker"
            >
              <Text style={[styles.iosPickerLabel, { color: colors.text }]}>{selectedToolLabel}</Text>
              <View style={[styles.pickerIndicator, { borderTopColor: colors.muted }]} />
            </Pressable>
          </View>
          <NativeSheet
            animateSheetSeparately
            colors={colors}
            onDismiss={dismissIosPicker}
            testID="key-method-picker-sheet"
            title={UPSTREAM_TEXT.keys.methodLabel}
            visible={iosPickerOpen}
          >
            <Picker
              accessibilityLabel={UPSTREAM_TEXT.keys.methodLabel}
              onValueChange={value => setIosPendingTool(value as EntropyTool)}
              selectedValue={iosPendingTool}
              style={[styles.iosPickerWheel, { color: colors.text }]}
              testID="key-method-picker-wheel"
            >
              {ENTROPY_TOOLS.map(tool => (
                <Picker.Item key={tool} label={ENTROPY_TOOL_LABELS[tool]} value={tool} />
              ))}
            </Picker>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.common.done}
              accessibilityRole="button"
              onPress={confirmIosPicker}
              style={[styles.iosPickerDone, { backgroundColor: colors.accent }]}
              testID="key-method-picker-done"
            >
              <Text style={[styles.iosPickerDoneText, { color: colors.onAccent }]}>
                {UPSTREAM_TEXT.common.done}
              </Text>
            </Pressable>
          </NativeSheet>
        </>
      ) : (
        <View
          style={[
            styles.pickerShell,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Picker
            accessibilityLabel={UPSTREAM_TEXT.keys.methodLabel}
            dropdownIconColor={colors.muted}
            enabled={isActive}
            mode="dropdown"
            onValueChange={value => onSelect(value as EntropyTool)}
            selectedValue={activeTool}
            style={[styles.picker, { color: colors.text }]}
            testID="key-method-picker"
          >
            {ENTROPY_TOOLS.map(tool => (
              <Picker.Item key={tool} label={ENTROPY_TOOL_LABELS[tool]} value={tool} />
            ))}
          </Picker>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  iosPicker: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  iosPickerDone: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  iosPickerDoneText: {
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerLabel: {
    flexShrink: 1,
    fontSize: 15,
  },
  iosPickerWheel: {
    width: '100%',
  },
  picker: {
    minHeight: 48,
    width: '100%',
  },
  pickerIndicator: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopWidth: 6,
    height: 0,
    marginLeft: 12,
    width: 0,
  },
  pickerShell: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
