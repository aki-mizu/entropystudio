import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import type { NumberBaseFormat } from '../numberBases';

const CONTENT_HORIZONTAL_PADDING = 24;
const KEY_GAP = 6;

type Props = {
  readonly canDelete: boolean;
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly characters: string;
  readonly colors: DiceColors;
  readonly deleteTestID: string;
  readonly format: NumberBaseFormat;
  readonly onDelete: () => void;
  readonly onInsert: (character: string) => void;
};

export function NumberBaseKeypad({
  canDelete,
  canInsert,
  canInsertSpace,
  characters,
  colors,
  deleteTestID,
  format,
  onDelete,
  onInsert,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();

  if (format === 'base64') {
    return (
      <SoftKeyboard
        canDelete={canDelete}
        canInsert={canInsert}
        canInsertSpace={canInsertSpace}
        colors={colors}
        deleteTestID={deleteTestID}
        keyboardTestID="number-base-keypad"
        keyTestIDPrefix="number-base-key-"
        modeControl="enabled"
        modeTestID="number-base-keypad-mode"
        onDelete={onDelete}
        onInsert={onInsert}
        spaceTestID="number-base-key-space"
        style={styles.keypad}
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
      <View style={[styles.keyGrid, { width: gridWidth }]}>
        {[...characters].map(character => {
          const enabled = canInsert(character);
          return (
            <Pressable
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
});