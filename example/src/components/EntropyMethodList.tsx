import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export function EntropyMethodList({ activeTool, colors, isActive, onSelect }: Props) {
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
        style={[styles.options, { backgroundColor: colors.segment, borderColor: colors.border }]}
      >
        {ENTROPY_TOOLS.map(tool => {
          const selected = tool === activeTool;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={tool}
              onPress={() => onSelect(tool)}
              style={[
                styles.option,
                selected && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              testID={`key-method-${tool}`}
            >
              <Text style={[styles.optionLabel, { color: selected ? colors.text : colors.muted }]}>
                {ENTROPY_TOOL_LABELS[tool]}
              </Text>
            </Pressable>
          );
        })}
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
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  options: {
    borderRadius: 7,
    borderWidth: 1,
    gap: 3,
    padding: 3,
  },
});