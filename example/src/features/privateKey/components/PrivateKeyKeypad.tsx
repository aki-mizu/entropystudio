import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { SoftKeyboardMode } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import type { PrivateKeyInputFormat } from '../privateKey';

const CONTENT_HORIZONTAL_PADDING = 24;
const HEX_CHARACTERS = '0123456789ABCDEF';
const HEX_COLUMNS = 8;
const KEY_GAP = 6;
const MAX_HEX_KEY_SIZE = 40;
const MAX_PREFIX_KEY_SIZE = 72;
const MINI_KEY_PREFIXES = ['S'];
const WIF_PREFIXES = ['5', 'K', 'L'];

type Props = {
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly colors: DiceColors;
  readonly firstCharacter: string;
  readonly format: PrivateKeyInputFormat;
  readonly label: string;
  readonly onInsert: (character: string) => void;
};

export function PrivateKeyKeypad({
  canInsert,
  canInsertSpace,
  colors,
  firstCharacter,
  format,
  label,
  onInsert,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth = windowWidth - CONTENT_HORIZONTAL_PADDING * 2;
  const prefixes = initialPrefixes(format, firstCharacter);

  if (prefixes) {
    const prefixKeySize = Math.min(
      MAX_PREFIX_KEY_SIZE,
      Math.max(
        1,
        Math.floor((availableWidth - KEY_GAP * (prefixes.length - 1)) / prefixes.length),
      ),
    );
    const prefixLabel =
      format === 'wif' ? 'Choose the first WIF character' : 'Choose the first Mini key character';

    return (
      <View accessibilityLabel={prefixLabel} style={styles.keypad} testID="private-key-prefix-keypad">
        <View style={styles.prefixRow}>
          {prefixes.map(character => {
            const enabled = canInsert(character);
            return (
              <Pressable
                accessibilityLabel={`Enter ${character}`}
                accessibilityRole="button"
                disabled={!enabled}
                key={character}
                onPress={() => onInsert(character)}
                style={({ pressed }) => [
                  styles.prefixKey,
                  {
                    backgroundColor: colors.diceSurface,
                    borderColor: colors.diceBorder,
                    height: Math.max(42, prefixKeySize),
                    opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                    width: prefixKeySize,
                  },
                ]}
                testID={`private-key-key-${character}`}
              >
                <Text style={[styles.prefixKeyLabel, { color: colors.diceText }]}>{character}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (format !== 'hex') {
    return (
      <SoftKeyboard
        key={`${format}-${firstCharacter}`}
        canInsert={canInsert}
        canInsertSpace={canInsertSpace}
        colors={colors}
        initialMode={initialKeyboardMode(format, firstCharacter)}
        keyboardLabel={mode => `On-screen ${mode} ${label} keyboard`}
        keyboardTestID="private-key-keypad"
        keyTestIDPrefix="private-key-key-"
        modeControl="enabled"
        modeTestID="private-key-keypad-mode"
        modeToggleLabel="Change private key keyboard character mode"
        onInsert={onInsert}
        spaceTestID="private-key-key-space"
        style={styles.keypad}
      />
    );
  }

  const keySize = Math.min(
    MAX_HEX_KEY_SIZE,
    Math.max(1, Math.floor((availableWidth - KEY_GAP * (HEX_COLUMNS - 1)) / HEX_COLUMNS)),
  );
  const gridWidth = keySize * HEX_COLUMNS + KEY_GAP * (HEX_COLUMNS - 1);

  return (
    <View
      accessibilityLabel="On-screen hexadecimal private key keyboard"
      style={styles.keypad}
      testID="private-key-keypad"
    >
      <View style={[styles.hexGrid, { width: gridWidth }]}>
        {[...HEX_CHARACTERS].map(character => {
          const enabled = canInsert(character);
          return (
            <Pressable
              accessibilityLabel={`Enter hexadecimal character ${character}`}
              accessibilityRole="button"
              disabled={!enabled}
              key={character}
              onPress={() => onInsert(character)}
              style={({ pressed }) => [
                styles.hexKey,
                {
                  backgroundColor: colors.diceSurface,
                  borderColor: colors.diceBorder,
                  height: keySize,
                  opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                  width: keySize,
                },
              ]}
              testID={`private-key-key-${character}`}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={[styles.hexKeyLabel, { color: colors.diceText }]}
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

function initialPrefixes(
  format: PrivateKeyInputFormat,
  firstCharacter: string,
): readonly string[] | null {
  if (firstCharacter) {
    return null;
  }
  if (format === 'wif') {
    return WIF_PREFIXES;
  }
  if (format === 'mini') {
    return MINI_KEY_PREFIXES;
  }
  return null;
}

function initialKeyboardMode(
  format: PrivateKeyInputFormat,
  firstCharacter: string,
): SoftKeyboardMode {
  if (format === 'mini') {
    return 'upper';
  }
  if (format === 'wif') {
    if (firstCharacter === '5') {
      return 'number';
    }
    if (firstCharacter === 'K' || firstCharacter === 'L') {
      return 'upper';
    }
  }
  return 'lower';
}

const styles = StyleSheet.create({
  hexGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KEY_GAP,
    justifyContent: 'flex-start',
  },
  hexKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  hexKeyLabel: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  keypad: {
    marginTop: 10,
  },
  prefixKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  prefixKeyLabel: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
  },
  prefixRow: {
    flexDirection: 'row',
    gap: KEY_GAP,
    justifyContent: 'center',
  },
});