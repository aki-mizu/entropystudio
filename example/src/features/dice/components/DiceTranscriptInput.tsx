import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly estimatedBits: number;
  readonly onChange: (rolls: string) => void;
  readonly onClear: () => void;
  readonly progress: number;
  readonly requiredRolls: number;
  readonly rollCount: number;
  readonly rolls: string;
};

export function DiceTranscriptInput({
  colors,
  estimatedBits,
  onChange,
  onClear,
  progress,
  requiredRolls,
  rollCount,
  rolls,
}: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]}>TRANSCRIPT</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear dice rolls"
          onPress={onClear}
          style={styles.clearButton}
          testID="clear-dice-rolls"
        >
          <Text style={[styles.clearText, { color: colors.accent }]}>Clear</Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.surface,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel="Dice rolls"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          keyboardType="number-pad"
          multiline
          onChangeText={onChange}
          placeholder="Enter or paste faces 1-6"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          spellCheck={false}
          style={[styles.rollInput, { color: colors.text }]}
          testID="dice-rolls-input"
          textContentType="none"
          value={rolls}
        />
        <View style={[styles.progressTrack, { backgroundColor: colors.segment }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {rollCount} of {requiredRolls} recommended rolls
          </Text>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {estimatedBits.toFixed(1)} bits
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  progressText: {
    fontSize: 13,
  },
  progressTrack: {
    borderRadius: 2,
    height: 4,
    marginTop: 18,
    overflow: 'hidden',
  },
  rollInput: {
    fontFamily: 'monospace',
    fontSize: 18,
    lineHeight: 26,
    minHeight: 76,
    padding: 0,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 26,
  },
  surface: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
});