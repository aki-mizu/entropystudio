import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DICE_FACES } from '../dice';
import type { DiceInputFace } from '../dice';
import type { DiceColors } from '../diceTheme';

const CONTENT_HORIZONTAL_PADDING = 24;
const DICE_GRID_GAP = 6;

type CoinFlipLabels = {
  readonly heads: string;
  readonly headsRange: string;
  readonly tails: string;
  readonly tailsRange: string;
};

type Props = {
  readonly coinFlipLabels?: CoinFlipLabels;
  readonly columns?: number;
  readonly colors: DiceColors;
  readonly enabledFaces?: readonly DiceInputFace[];
  readonly faces?: readonly DiceInputFace[];
  readonly maxTileSize?: number;
  readonly onSelect: (face: DiceInputFace) => void;
};

export function DiceGrid({
  coinFlipLabels,
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
  const coinLabelFontSize = Math.max(14, Math.min(18, Math.floor(diceTileSize * 0.36)));
  const coinRangeFontSize = Math.max(10, Math.min(13, Math.floor(diceTileSize * 0.24)));
  const gridWidth = diceTileSize * columns + DICE_GRID_GAP * (columns - 1);
  const displayedFaces = coinFlipLabels ? faces.filter(face => face === '1' || face === '4') : faces;

  return (
    <View style={[styles.grid, { width: gridWidth }]}>
      {displayedFaces.map(face => {
        const disabled = !activeFaces.includes(face);
        const coinKey =
          coinFlipLabels && (face === '1' || face === '4')
            ? face === '1'
              ? { label: coinFlipLabels.heads, range: coinFlipLabels.headsRange }
              : { label: coinFlipLabels.tails, range: coinFlipLabels.tailsRange }
            : null;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={coinKey ? `${coinKey.label} ${coinKey.range}` : String(face)}
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
                width: coinKey ? diceTileSize * 3 + DICE_GRID_GAP * 2 : diceTileSize,
              },
            ]}
            testID={`dice-face-${face}`}
          >
            <Text
              style={[
                coinKey ? styles.diceCoinLabel : styles.diceFaceText,
                {
                  color: colors.diceText,
                  fontSize: coinKey ? coinLabelFontSize : diceFaceFontSize,
                  lineHeight: (coinKey ? coinLabelFontSize : diceFaceFontSize) + 4,
                },
              ]}
            >
              {coinKey?.label ?? face}
            </Text>
            {coinKey ? (
              <Text
                style={[
                  styles.diceCoinRange,
                  { color: colors.diceText, fontSize: coinRangeFontSize, lineHeight: coinRangeFontSize + 3 },
                ]}
              >
                {coinKey.range}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  diceCoinLabel: {
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  diceCoinRange: {
    fontWeight: '600',
    includeFontPadding: false,
    marginTop: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
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