import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly onChange: (rolls: string) => void;
  readonly onClear: () => void;
  readonly progress: number;
  readonly progressText: string;
  readonly rolls: string;
};

export function DiceTranscriptInput({
  colors,
  inputLabel,
  inputPlaceholder,
  onChange,
  onClear,
  progress,
  progressText,
  rolls,
}: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]} testID="dice-input-label">
          {inputLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={inputLabel}
          onPress={onClear}
          style={styles.clearButton}
          testID="clear-dice-rolls"
        >
          <Text style={[styles.clearIcon, { color: colors.accent }]}>X</Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.surface,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel={inputLabel}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          keyboardType="number-pad"
          multiline
          onChangeText={onChange}
          placeholder={inputPlaceholder}
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
        <Text style={[styles.progressText, { color: colors.muted }]} testID="dice-progress">
          {progressText}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  clearIcon: {
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
  progressText: {
    fontSize: 13,
    marginTop: 9,
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