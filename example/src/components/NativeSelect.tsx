import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NativeSheet } from '../features/dice/components/NativeSheet';
import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

export type NativeSelectOption<Value extends string | number> = {
  readonly label: string;
  readonly value: Value;
};

type Props<Value extends string | number> = {
  readonly accessibilityLabel: string;
  readonly controlTestID: string;
  readonly colors: DiceColors;
  readonly disabled?: boolean;
  readonly onValueChange: (value: Value) => void;
  readonly options: readonly NativeSelectOption<Value>[];
  readonly selectedValue: Value;
};

/**
 * A platform-native select control. Android opens its native dropdown, while
 * iOS uses a compact field that opens the native wheel in a bottom sheet.
 */
export function NativeSelect<Value extends string | number>({
  accessibilityLabel,
  controlTestID,
  colors,
  disabled = false,
  onValueChange,
  options,
  selectedValue,
}: Props<Value>) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosPendingValue, setIosPendingValue] = useState<Value>(selectedValue);
  const selectedLabel = options.find(option => option.value === selectedValue)?.label ?? String(selectedValue);

  function openIosPicker() {
    setIosPendingValue(selectedValue);
    setIosPickerOpen(true);
  }

  function dismissIosPicker() {
    setIosPickerOpen(false);
    setIosPendingValue(selectedValue);
  }

  function confirmIosPicker() {
    setIosPickerOpen(false);
    if (iosPendingValue !== selectedValue) {
      onValueChange(iosPendingValue);
    }
  }

  if (Platform.OS === 'ios') {
    return (
      <>
        <View
          style={[
            styles.pickerShell,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled, expanded: iosPickerOpen }}
            accessibilityValue={{ text: selectedLabel }}
            disabled={disabled}
            onPress={openIosPicker}
            style={styles.iosPicker}
            testID={controlTestID}
          >
            <Text style={[styles.iosPickerLabel, { color: colors.text }]}>{selectedLabel}</Text>
            <View style={[styles.pickerIndicator, { borderTopColor: colors.muted }]} />
          </Pressable>
        </View>
        <NativeSheet
          animateSheetSeparately
          colors={colors}
          onDismiss={dismissIosPicker}
          testID={`${controlTestID}-sheet`}
          title={accessibilityLabel}
          visible={iosPickerOpen}
        >
          <View style={styles.iosPickerWheelBleed}>
            <Picker
              accessibilityLabel={accessibilityLabel}
              onValueChange={value => setIosPendingValue(value as Value)}
              selectedValue={iosPendingValue}
              style={[styles.iosPickerWheel, { color: colors.text }]}
              testID={`${controlTestID}-wheel`}
            >
              {options.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
          <Pressable
            accessibilityLabel={UPSTREAM_TEXT.common.done}
            accessibilityRole="button"
            onPress={confirmIosPicker}
            style={[styles.iosPickerDone, { backgroundColor: colors.accent }]}
            testID={`${controlTestID}-done`}
          >
            <Text style={[styles.iosPickerDoneText, { color: colors.onAccent }]}>
              {UPSTREAM_TEXT.common.done}
            </Text>
          </Pressable>
        </NativeSheet>
      </>
    );
  }

  return (
    <View
      style={[
        styles.pickerShell,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Picker
        accessibilityLabel={accessibilityLabel}
        dropdownIconColor={colors.muted}
        enabled={!disabled}
        mode="dropdown"
        onValueChange={value => onValueChange(value as Value)}
        selectedValue={selectedValue}
        style={[styles.picker, { color: colors.text }]}
        testID={controlTestID}
      >
        {options.map(option => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
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
  iosPickerWheelBleed: {
    // RNCPicker already reserves 20pt on each side of its label.
    alignSelf: 'stretch',
    marginHorizontal: -20,
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
