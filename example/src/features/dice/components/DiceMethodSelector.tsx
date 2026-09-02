import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DICE_METHODS } from '../dice';
import type { DiceMethod } from '../dice';
import type { DiceColors } from '../diceTheme';

type DiceMethodCopy = {
  readonly description: string;
  readonly title: string;
};

type Props = {
  readonly copies: Record<DiceMethod, DiceMethodCopy>;
  readonly colors: DiceColors;
  readonly method: DiceMethod;
  readonly onSelect: (method: DiceMethod) => void;
};

export function DiceMethodSelector({
  copies,
  colors,
  method,
  onSelect,
}: Props) {
  const selectedCopy = copies[method];

  return (
    <View>
      <View
        style={[
          styles.segmentedControl,
          { backgroundColor: colors.segment, borderColor: colors.border },
        ]}
      >
        {DICE_METHODS.map(methodOption => (
          <MethodOption
            colors={colors}
            copy={copies[methodOption]}
            key={methodOption}
            method={methodOption}
            onSelect={onSelect}
            selected={method === methodOption}
          />
        ))}
      </View>
      <Text
        style={[styles.selectedDescription, { color: colors.muted }]}
        testID={`dice-method-${method}-description`}
      >
        {selectedCopy.description}
      </Text>
    </View>
  );
}

function MethodOption({
  colors,
  copy,
  method,
  onSelect,
  selected,
}: {
  readonly colors: DiceColors;
  readonly copy: DiceMethodCopy;
  readonly method: DiceMethod;
  readonly onSelect: (method: DiceMethod) => void;
  readonly selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(method)}
      style={[
        styles.segment,
        selected && { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID={`dice-method-${method}`}
    >
      <Text
        style={[styles.segmentLabel, { color: selected ? colors.text : colors.muted }]}
        testID={`dice-method-${method}-title`}
      >
        {copy.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  segmentedControl: {
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'column',
    gap: 3,
    padding: 3,
  },
  selectedDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
});