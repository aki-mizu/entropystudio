import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { SoftKeyboardMode } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import { UPSTREAM_UI_FALLBACK_COPY } from '../../upstreamUiCopy';
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
  readonly onInsert: (character: string) => void;
};

export function PrivateKeyKeypad({
  canInsert,
  canInsertSpace,
  colors,
  firstCharacter,
  format,
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
    const prefixLabel = UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyInitial(
      format === 'wif' ? 'wif' : 'mini',
    );

    return (
      <View accessibilityLabel={prefixLabel} style={styles.keypad} testID="private-key-prefix-keypad">
        <View style={styles.prefixRow}>
          {prefixes.map(character => {
            const enabled = canInsert(character);
            return (
              <Pressable
                accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.enterCharacter(character)}
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
        keyboardLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKey}
        keyboardTestID="private-key-keypad"
        keyTestIDPrefix="private-key-key-"
        modeControl="enabled"
        modeTestID="private-key-keypad-mode"
        modeToggleLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyChangeMode()}
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
      accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyHex}
      style={styles.keypad}
      testID="private-key-keypad"
    >
      <View style={[styles.hexGrid, { width: gridWidth }]}>
        {[...HEX_CHARACTERS].map(character => {
          const enabled = canInsert(character);
          return (
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.enterCharacter(character)}
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