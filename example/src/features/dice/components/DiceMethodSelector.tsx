import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DiceMethod } from '../dice';
import type { DiceColors } from '../diceTheme';

type DiceMethodCopy = {
  readonly description: string;
  readonly title: string;
};

type Props = {
  readonly coldcardCopy: DiceMethodCopy;
  readonly colemanCopy: DiceMethodCopy;
  readonly colors: DiceColors;
  readonly method: DiceMethod;
  readonly onSelect: (method: DiceMethod) => void;
};

export function DiceMethodSelector({
  coldcardCopy,
  colemanCopy,
  colors,
  method,
  onSelect,
}: Props) {
  return (
    <View
      style={[
        styles.segmentedControl,
        { backgroundColor: colors.segment, borderColor: colors.border },
      ]}
    >
      <MethodOption
        colors={colors}
        copy={coldcardCopy}
        method="coldcard"
        onSelect={onSelect}
        selected={method === 'coldcard'}
      />
      <MethodOption
        colors={colors}
        copy={colemanCopy}
        method="coleman"
        onSelect={onSelect}
        selected={method === 'coleman'}
      />
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
  const methodLabel = method === 'coldcard' ? 'coldcard' : 'coleman';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(method)}
      style={[
        styles.segment,
        selected && { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID={`dice-method-${methodLabel}`}
    >
      <Text
        style={[styles.segmentLabel, { color: selected ? colors.text : colors.muted }]}
        testID={`dice-method-${methodLabel}-title`}
      >
        {copy.title}
      </Text>
      <Text
        style={[styles.segmentDetail, { color: colors.muted }]}
        testID={`dice-method-${methodLabel}-description`}
      >
        {copy.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedControl: {
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
});