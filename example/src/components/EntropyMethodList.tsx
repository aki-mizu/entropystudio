import { StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT, UPSTREAM_UI_LABELS } from '../features/upstreamUiCopy';
import { NativeSelect, type NativeSelectOption } from './NativeSelect';

export type EntropyTool = 'cards' | 'dice' | 'hex' | 'key' | 'seed';

const ENTROPY_TOOL_OPTIONS: readonly NativeSelectOption<EntropyTool>[] = [
  { label: UPSTREAM_UI_LABELS.keyMode.dice, value: 'dice' },
  { label: UPSTREAM_UI_LABELS.keyMode.cards, value: 'cards' },
  { label: UPSTREAM_UI_LABELS.keyMode.hex, value: 'hex' },
  { label: UPSTREAM_UI_LABELS.keyMode.seed, value: 'seed' },
  { label: UPSTREAM_UI_LABELS.keyMode.key, value: 'key' },
];

type Props = {
  readonly activeTool: EntropyTool;
  readonly colors: DiceColors;
  readonly isActive: boolean;
  readonly onSelect: (tool: EntropyTool) => void;
};

export function EntropyMethodList({
  activeTool,
  colors,
  isActive,
  onSelect,
}: Props) {
  return (
    <View
      accessibilityElementsHidden={!isActive}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      style={styles.container}
      testID="key-method-list"
    >
      <Text style={[styles.label, { color: colors.muted }]} testID="key-method-label">
        {UPSTREAM_TEXT.keys.methodLabel}
      </Text>
      <NativeSelect
        accessibilityLabel={UPSTREAM_TEXT.keys.methodLabel}
        controlTestID="key-method-picker"
        colors={colors}
        disabled={!isActive}
        onValueChange={onSelect}
        options={ENTROPY_TOOL_OPTIONS}
        selectedValue={activeTool}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
});
