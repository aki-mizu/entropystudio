import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BackspaceKey } from '../../../components/BackspaceKey';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { SoftKeyboardMode } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import type { PrivateKeyInputFormat } from '../privateKey';

const CONTENT_HORIZONTAL_PADDING = 24;
const HEX_ROWS = ['0123456789', 'ABCDEF'] as const;
const HEX_COLUMNS = 10;
const KEY_GAP = 6;
const MAX_HEX_KEY_SIZE = 40;
const MAX_PREFIX_KEY_SIZE = 72;
const MINI_KEY_PREFIXES = ['S'];
const WIF_PREFIXES = ['5', 'K', 'L'];

type Props = {
  readonly canDelete: boolean;
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly colors: DiceColors;
  readonly deleteTestID: string;
  readonly firstCharacter: string;
  readonly format: PrivateKeyInputFormat;
  readonly onDelete: () => void;
  readonly onInsert: (character: string) => void;
};

export function PrivateKeyKeypad({
  canDelete,
  canInsert,
  canInsertSpace,
  colors,
  deleteTestID,
  firstCharacter,
  format,
  onDelete,
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

    return (
      <View style={styles.keypad} testID="private-key-prefix-keypad">
        <View style={styles.prefixRow}>
          {prefixes.map(character => {
            const enabled = canInsert(character);
            return (
              <Pressable
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
        canDelete={canDelete}
        canInsert={canInsert}
        canInsertSpace={canInsertSpace}
        colors={colors}
        deleteTestID={deleteTestID}
        initialMode={initialKeyboardMode(format, firstCharacter)}
        keyboardTestID="private-key-keypad"
        keyTestIDPrefix="private-key-key-"
        modeControl="enabled"
        modeTestID="private-key-keypad-mode"
        onDelete={onDelete}
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
    <View style={styles.keypad} testID="private-key-keypad">
      <View style={[styles.hexGrid, { width: gridWidth }]}>
        {HEX_ROWS.map((row, rowIndex) => (
          <View key={row} style={styles.hexRow}>
            {[...row].map(character => {
              const enabled = canInsert(character);
              return (
                <Pressable
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
            {rowIndex === HEX_ROWS.length - 1 ? (
              <BackspaceKey
                colors={colors}
                disabled={!canDelete}
                onPress={onDelete}
                style={{ height: keySize, width: keySize }}
                testID={deleteTestID}
              />
            ) : null}
          </View>
        ))}
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
    gap: KEY_GAP,
  },
  hexRow: {
    flexDirection: 'row',
    gap: KEY_GAP,
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