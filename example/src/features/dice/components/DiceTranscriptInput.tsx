import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly isD8D16: boolean;
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
  isD8D16,
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
          <Text style={[styles.clearIcon, { color: colors.accent }]}>Clear</Text>
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
          autoCapitalize={isD8D16 ? 'characters' : 'none'}
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          keyboardType={isD8D16 ? 'default' : 'number-pad'}
          multiline={false}
          numberOfLines={1}
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
        <Text
          numberOfLines={2}
          style={[styles.progressText, { color: colors.muted }]}
          testID="dice-progress"
        >
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
    fontSize: 13,
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
    lineHeight: 18,
    marginTop: 9,
  },
  progressTrack: {
    borderRadius: 2,
    height: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  rollInput: {
    fontFamily: 'monospace',
    fontSize: 17,
    height: 42,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 16,
  },
  surface: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
});