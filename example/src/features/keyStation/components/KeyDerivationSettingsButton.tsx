import { Pressable, StyleSheet, Text } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import type { KeyStationScriptType } from '../keyStation';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

type Props = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly onPress: () => void;
  readonly scriptType: KeyStationScriptType;
  readonly testID: string;
};

export function KeyDerivationSettingsButton({
  compact = false,
  colors,
  onPress,
  scriptType,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}
      testID={testID}
    >
      <Text
        style={[styles.text, compact && styles.compactText, { color: colors.text }]}
        testID={`${testID}-label`}
      >
        {UPSTREAM_TEXT.keys.scriptTypes[scriptType]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 124,
    paddingHorizontal: 10,
  },
  compactButton: {
    flexShrink: 0,
    marginLeft: 8,
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 5,
    width: 92,
  },
  compactText: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});