import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DiceColors } from '../features/dice/diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID: string;
};

export function BackspaceKey({ colors, disabled, onPress, style, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        style,
        {
          backgroundColor: colors.diceSurface,
          borderColor: colors.diceBorder,
          opacity: disabled ? 0.38 : pressed ? 0.78 : 1,
        },
      ]}
      testID={testID}
    >
      <Text style={[styles.icon, { color: colors.diceText }]}>{'\u232B'}</Text>
    </Pressable>
  );
}

export function BackspaceIconButton({ colors, disabled, onPress, style, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        style,
        { opacity: disabled ? 0.38 : pressed ? 0.72 : 1 },
      ]}
      testID={testID}
    >
      <Text style={[styles.iconButtonLabel, { color: colors.accent }]}>{'\u232B'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  iconButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  iconButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  key: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
});