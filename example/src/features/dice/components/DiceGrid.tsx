import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DICE_FACES } from '../dice';
import type { DiceInputFace } from '../dice';
import type { DiceColors } from '../diceTheme';

const CONTENT_HORIZONTAL_PADDING = 24;
const DICE_GRID_GAP = 6;

type Props = {
  readonly columns?: number;
  readonly colors: DiceColors;
  readonly enabledFaces?: readonly DiceInputFace[];
  readonly faces?: readonly DiceInputFace[];
  readonly maxTileSize?: number;
  readonly onSelect: (face: DiceInputFace) => void;
};

export function DiceGrid({
  columns = 6,
  colors,
  enabledFaces,
  faces = DICE_FACES,
  maxTileSize = columns >= 6 ? 56 : 84,
  onSelect,
}: Props) {
  const activeFaces = enabledFaces ?? faces;
  const { width: windowWidth } = useWindowDimensions();
  const availableGridWidth =
    windowWidth - CONTENT_HORIZONTAL_PADDING * 2 - DICE_GRID_GAP * (columns - 1);
  const diceTileSize = Math.min(
    maxTileSize,
    Math.floor(availableGridWidth / columns),
  );
  const diceFaceFontSize = Math.max(16, Math.min(22, Math.floor(diceTileSize * 0.52)));
  const gridWidth = diceTileSize * columns + DICE_GRID_GAP * (columns - 1);

  return (
    <View style={[styles.grid, { width: gridWidth }]}>
      {faces.map(face => {
        const disabled = !activeFaces.includes(face);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(face)}
            disabled={disabled}
            key={face}
            onPress={() => onSelect(face)}
            style={({ pressed }) => [
              styles.diceFace,
              {
                backgroundColor: colors.diceSurface,
                borderColor: colors.diceBorder,
                height: diceTileSize,
                opacity: disabled ? 0.38 : pressed ? 0.78 : 1,
                width: diceTileSize,
              },
            ]}
            testID={`dice-face-${face}`}
          >
            <Text
              style={[
                styles.diceFaceText,
                {
                  color: colors.diceText,
                  fontSize: diceFaceFontSize,
                  lineHeight: diceFaceFontSize + 4,
                },
              ]}
            >
              {face}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  diceFace: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
  },
  diceFaceText: {
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  grid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DICE_GRID_GAP,
    justifyContent: 'flex-start',
    marginTop: 12,
  },
});