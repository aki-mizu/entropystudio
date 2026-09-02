import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DICE_FACES } from '../dice';
import type { DiceInputFace } from '../dice';
import type { DiceColors } from '../diceTheme';

const CONTENT_HORIZONTAL_PADDING = 24;
const DICE_GRID_GAP = 10;

type Props = {
  readonly columns?: number;
  readonly colors: DiceColors;
  readonly faces?: readonly DiceInputFace[];
  readonly inputLabel: string;
  readonly onSelect: (face: DiceInputFace) => void;
};

export function DiceGrid({
  columns = 3,
  colors,
  faces = DICE_FACES,
  inputLabel,
  onSelect,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const diceTileSize = Math.max(
    48,
    Math.floor(
      (windowWidth - CONTENT_HORIZONTAL_PADDING * 2 - DICE_GRID_GAP * (columns - 1)) /
        columns,
    ),
  );

  return (
    <View style={styles.grid}>
      {faces.map(face => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${inputLabel}: ${face}`}
          key={face}
          onPress={() => onSelect(face)}
          style={({ pressed }) => [
            styles.diceFace,
            {
              backgroundColor: colors.diceSurface,
              borderColor: colors.diceBorder,
              height: diceTileSize,
              opacity: pressed ? 0.78 : 1,
              width: diceTileSize,
            },
          ]}
          testID={`dice-face-${face}`}
        >
          <Text style={[styles.diceFaceText, { color: colors.diceText }]}>{face}</Text>
        </Pressable>
      ))}
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
    fontSize: 22,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DICE_GRID_GAP,
    justifyContent: 'flex-start',
    marginTop: 14,
  },
});