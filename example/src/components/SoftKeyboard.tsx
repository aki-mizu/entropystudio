import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;
const KEYBOARD_COLUMNS = 10;
const KEY_GAP = 4;
const MAX_KEY_SIZE = 60;
const MAX_KEYBOARD_WIDTH = 640;
const MIN_KEY_HEIGHT = 42;

const KEYBOARD_LAYOUTS = {
  lower: ['abcdefghij', 'klmnopqrs', 'tuvwxyz'],
  number: ['1234567890', '!@#$%^&*()', '-_+=/?\\'],
  upper: ['ABCDEFGHIJ', 'KLMNOPQRS', 'TUVWXYZ'],
} as const;

export type SoftKeyboardMode = keyof typeof KEYBOARD_LAYOUTS;

type KeyboardMode = SoftKeyboardMode;
type ModeControl = 'disabled' | 'enabled' | 'hidden';

type Props = {
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly colors: DiceColors;
  readonly initialMode?: SoftKeyboardMode;
  readonly keyboardLabel: (mode: KeyboardMode) => string;
  readonly keyboardTestID: string;
  readonly keyTestIDPrefix: string;
  readonly modeControl: ModeControl;
  readonly modeTestID?: string;
  readonly modeToggleLabel?: string;
  readonly onInsert: (character: string) => void;
  readonly rowTestIDPrefix?: string;
  readonly spaceTestID: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function SoftKeyboard({
  canInsert,
  canInsertSpace,
  colors,
  initialMode = 'lower',
  keyboardLabel,
  keyboardTestID,
  keyTestIDPrefix,
  modeControl,
  modeTestID,
  modeToggleLabel,
  onInsert,
  rowTestIDPrefix,
  spaceTestID,
  style,
}: Props) {
  const [mode, setMode] = useState<KeyboardMode>(initialMode);
  const { width: windowWidth } = useWindowDimensions();
  const activeMode = modeControl === 'enabled' ? mode : 'lower';
  const rows = KEYBOARD_LAYOUTS[activeMode];
  const availableKeyboardWidth = Math.min(
    MAX_KEYBOARD_WIDTH,
    Math.max(0, windowWidth - CONTENT_HORIZONTAL_PADDING * 2),
  );
  const keySize = Math.min(
    MAX_KEY_SIZE,
    Math.max(
      1,
      Math.floor(
        (availableKeyboardWidth - KEY_GAP * (KEYBOARD_COLUMNS - 1)) / KEYBOARD_COLUMNS,
      ),
    ),
  );

  function cycleMode() {
    const modes: readonly KeyboardMode[] = ['lower', 'upper', 'number'];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex]);
  }

  return (
    <View
      accessibilityLabel={keyboardLabel(activeMode)}
      style={[styles.keyboard, style]}
      testID={keyboardTestID}
    >
      {rows.map((row, rowIndex) => (
        <View
          key={`${activeMode}-${rowIndex}`}
          style={styles.keyRow}
          testID={rowTestIDPrefix ? `${rowTestIDPrefix}${rowIndex + 1}` : undefined}
        >
          {[...row].map(character => {
            const enabled = canInsert(character);
            return (
              <Pressable
                accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.enterCharacter(character)}
                accessibilityRole="button"
                disabled={!enabled}
                key={character}
                onPress={() => onInsert(character)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: colors.diceSurface,
                    borderColor: colors.diceBorder,
                    height: Math.max(MIN_KEY_HEIGHT, keySize),
                    opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                    width: keySize,
                  },
                ]}
                testID={`${keyTestIDPrefix}${character}`}
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
      ))}
      <View style={styles.actionRow}>
        {modeControl !== 'hidden' && (
          <Pressable
            accessibilityLabel={modeToggleLabel}
            accessibilityRole="button"
            disabled={modeControl === 'disabled'}
            onPress={modeControl === 'enabled' ? cycleMode : undefined}
            style={({ pressed }) => [
              styles.modeKey,
              {
                backgroundColor: colors.segment,
                borderColor: colors.border,
                opacity: modeControl === 'enabled' ? (pressed ? 0.78 : 1) : 0.38,
              },
            ]}
            testID={modeTestID}
          >
            <Text style={[styles.modeLabel, { color: colors.text }]}>
              {UPSTREAM_UI_FALLBACK_COPY.keyboard.modeButton}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.enterSpace}
          accessibilityRole="button"
          disabled={!canInsertSpace}
          onPress={() => onInsert(' ')}
          style={({ pressed }) => [
            modeControl === 'hidden' ? styles.fullSpaceKey : styles.spaceKey,
            {
              backgroundColor: colors.segment,
              borderColor: colors.border,
              opacity: canInsertSpace ? (pressed ? 0.78 : 1) : 0.38,
            },
          ]}
          testID={spaceTestID}
        >
          <Text style={[styles.modeLabel, { color: colors.text }]}>
            {UPSTREAM_UI_FALLBACK_COPY.keyboard.spaceButton}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: KEY_GAP,
  },
  fullSpaceKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_KEY_HEIGHT,
  },
  key: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  keyboard: {
    alignSelf: 'flex-start',
    gap: KEY_GAP,
    maxWidth: MAX_KEYBOARD_WIDTH,
    width: '100%',
  },
  keyLabel: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  keyRow: {
    flexDirection: 'row',
    gap: KEY_GAP,
    justifyContent: 'center',
  },
  modeKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_KEY_HEIGHT,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  spaceKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 4,
    justifyContent: 'center',
    minHeight: MIN_KEY_HEIGHT,
  },
});