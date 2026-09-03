import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { DiceColors } from '../../dice/diceTheme';
import type { NumberBaseFormat } from '../numberBases';

const CONTENT_HORIZONTAL_PADDING = 24;
const KEY_GAP = 6;

const BASE64_SOFT_KEYBOARD_LAYOUTS = {
  lower: ['abcdefghij', 'klmnopqrs', 'tuvwxyz'],
  number: ['1234567890', '!@#$%^&*()', '-_+=/?\\'],
  upper: ['ABCDEFGHIJ', 'KLMNOPQRS', 'TUVWXYZ'],
} as const;

type Base64KeyboardMode = keyof typeof BASE64_SOFT_KEYBOARD_LAYOUTS;

type Props = {
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly characters: string;
  readonly colors: DiceColors;
  readonly format: NumberBaseFormat;
  readonly onInsert: (character: string) => void;
};

export function NumberBaseKeypad({
  canInsert,
  canInsertSpace,
  characters,
  colors,
  format,
  onInsert,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();

  if (format === 'base64') {
    return (
      <Base64SoftKeyboard
        canInsert={canInsert}
        canInsertSpace={canInsertSpace}
        colors={colors}
        onInsert={onInsert}
      />
    );
  }

  const columns = keypadColumns(format);
  const maxKeySize = keypadMaxKeySize(columns);
  const availableWidth = windowWidth - CONTENT_HORIZONTAL_PADDING * 2;
  const keySize = Math.min(
    maxKeySize,
    Math.floor((availableWidth - KEY_GAP * (columns - 1)) / columns),
  );
  const gridWidth = keySize * columns + KEY_GAP * (columns - 1);

  return (
    <View style={styles.keypad} testID="number-base-keypad">
      <View
        accessibilityLabel={`${format} entropy keypad`}
        style={[styles.keyGrid, { width: gridWidth }]}
      >
        {[...characters].map(character => {
          const enabled = canInsert(character);
          return (
            <Pressable
              accessibilityLabel={`Enter ${character}`}
              accessibilityRole="button"
              disabled={!enabled}
              key={character}
              onPress={() => onInsert(character)}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: colors.diceSurface,
                  borderColor: colors.diceBorder,
                  height: keySize,
                  opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                  width: keySize,
                },
              ]}
              testID={`number-base-key-${character}`}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={[styles.keyLabel, { color: colors.diceText }]}
              >
                {character}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type Base64SoftKeyboardProps = Pick<
  Props,
  'canInsert' | 'canInsertSpace' | 'colors' | 'onInsert'
>;

function Base64SoftKeyboard({
  canInsert,
  canInsertSpace,
  colors,
  onInsert,
}: Base64SoftKeyboardProps) {
  const [mode, setMode] = useState<Base64KeyboardMode>('lower');
  const rows = BASE64_SOFT_KEYBOARD_LAYOUTS[mode];

  function cycleMode() {
    const modes: readonly Base64KeyboardMode[] = ['lower', 'upper', 'number'];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex]);
  }

  return (
    <View
      accessibilityLabel={`On-screen ${mode} Base64 entropy keyboard`}
      style={[styles.keypad, styles.base64Keyboard]}
      testID="number-base-keypad"
    >
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.softKeyboardRow,
            rowIndex === 1 && styles.softKeyboardSecondRow,
            rowIndex === 2 && styles.softKeyboardThirdRow,
          ]}
        >
          {[...row].map(character => {
            const enabled = canInsert(character);
            return (
              <Pressable
                accessibilityLabel={`Enter ${character}`}
                accessibilityRole="button"
                disabled={!enabled}
                key={character}
                onPress={() => onInsert(character)}
                style={({ pressed }) => [
                  styles.softKeyboardKey,
                  {
                    backgroundColor: colors.diceSurface,
                    borderColor: colors.diceBorder,
                    opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                  },
                ]}
                testID={`number-base-key-${character}`}
              >
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  numberOfLines={1}
                  style={[styles.softKeyboardKeyLabel, { color: colors.diceText }]}
                >
                  {character}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.softKeyboardActionRow}>
        <Pressable
          accessibilityLabel="Change Base64 keyboard character mode"
          accessibilityRole="button"
          onPress={cycleMode}
          style={({ pressed }) => [
            styles.softKeyboardMode,
            {
              backgroundColor: colors.segment,
              borderColor: colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
          testID="number-base-keypad-mode"
        >
          <Text style={[styles.softKeyboardModeLabel, { color: colors.text }]}>aA1</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Enter space"
          accessibilityRole="button"
          disabled={!canInsertSpace}
          onPress={() => onInsert(' ')}
          style={({ pressed }) => [
            styles.softKeyboardSpace,
            {
              backgroundColor: colors.segment,
              borderColor: colors.border,
              opacity: canInsertSpace ? (pressed ? 0.78 : 1) : 0.38,
            },
          ]}
          testID="number-base-key-space"
        >
          <Text style={[styles.softKeyboardModeLabel, { color: colors.text }]}>space</Text>
        </Pressable>
      </View>
    </View>
  );
}

function keypadColumns(format: NumberBaseFormat): number {
  if (format === 'bin') {
    return 2;
  }
  if (format === 'base4') {
    return 4;
  }
  return 8;
}

function keypadMaxKeySize(columns: number): number {
  if (columns === 2) {
    return 90;
  }
  if (columns === 4) {
    return 64;
  }
  return 40;
}

const styles = StyleSheet.create({
  key: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  keyGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KEY_GAP,
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  keyLabel: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  keypad: {
    marginTop: 2,
  },
  base64Keyboard: {
    marginHorizontal: -4,
  },
  softKeyboardActionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  softKeyboardKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  softKeyboardKeyLabel: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  softKeyboardMode: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  softKeyboardModeLabel: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  softKeyboardRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  softKeyboardSecondRow: {
    marginHorizontal: 14,
  },
  softKeyboardSpace: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 4,
    justifyContent: 'center',
    minHeight: 42,
  },
  softKeyboardThirdRow: {
    marginHorizontal: 28,
  },
});