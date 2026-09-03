import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';
import entropyLabEnglish from '../../../entropylab/src/locales/en.json';
import type { DiceColors } from '../features/dice/diceTheme';

export type EntropyTool = 'dice' | 'cards';

type Props = {
  readonly activeTool: EntropyTool;
  readonly colors: DiceColors;
  readonly onSelect: (tool: EntropyTool) => void;
};

export function MethodPicker({ activeTool, colors, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]} testID="key-method-label">
        {entropyLabEnglish['keys.methodLabel']}
      </Text>
      <View style={[styles.pickerFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Picker
          accessibilityLabel={entropyLabEnglish['keys.methodLabel']}
          dropdownIconColor={colors.text}
          mode="dropdown"
          onValueChange={value => {
            if (value === 'dice' || value === 'cards') {
              onSelect(value);
            }
          }}
          selectedValue={activeTool}
          style={[styles.picker, { color: colors.text }]}
          testID="key-method-select"
        >
          <Picker.Item label={entropyLabEnglish['mode.dice']} value="dice" />
          <Picker.Item label={entropyLabEnglish['mode.cards']} value="cards" />
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  picker: {
    height: 56,
    width: '100%',
  },
  pickerFrame: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
    overflow: 'hidden',
  },
});