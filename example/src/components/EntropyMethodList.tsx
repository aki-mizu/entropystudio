import { Pressable, StyleSheet, Text, View } from 'react-native';
import entropyLabEnglish from '../../../entropylab/src/locales/en.json';
import type { DiceColors } from '../features/dice/diceTheme';

export type EntropyTool = 'cards' | 'dice';

const ENTROPY_TOOLS: readonly EntropyTool[] = ['dice', 'cards'];

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
        {entropyLabEnglish['keys.methodLabel']}
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
                {tool === 'dice' ? entropyLabEnglish['mode.dice'] : entropyLabEnglish['mode.cards']}
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