import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT, UPSTREAM_UI_LABELS } from '../features/upstreamUiCopy';

export type EntropyTool = 'cards' | 'dice' | 'hex' | 'key' | 'seed';

const ENTROPY_TOOLS: readonly EntropyTool[] = ['dice', 'cards', 'hex', 'seed', 'key'];
const ENTROPY_TOOL_LABELS: Record<EntropyTool, string> = {
  cards: UPSTREAM_UI_LABELS.keyMode.cards,
  dice: UPSTREAM_UI_LABELS.keyMode.dice,
  hex: UPSTREAM_UI_LABELS.keyMode.hex,
  key: UPSTREAM_UI_LABELS.keyMode.key,
  seed: UPSTREAM_UI_LABELS.keyMode.seed,
};

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
      <View
        style={[
          styles.pickerShell,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Picker
          accessibilityLabel={UPSTREAM_TEXT.keys.methodLabel}
          dropdownIconColor={colors.muted}
          enabled={isActive}
          mode="dropdown"
          onValueChange={value => onSelect(value as EntropyTool)}
          selectedValue={activeTool}
          style={[styles.picker, { color: colors.text }]}
          testID="key-method-picker"
        >
          {ENTROPY_TOOLS.map(tool => (
            <Picker.Item key={tool} label={ENTROPY_TOOL_LABELS[tool]} value={tool} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  picker: {
    minHeight: 48,
    width: '100%',
  },
  pickerShell: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
});