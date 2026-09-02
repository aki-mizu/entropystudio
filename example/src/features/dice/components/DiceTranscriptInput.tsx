import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiceMethod, WordCount } from '../dice';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly method: DiceMethod;
  readonly onChange: (rolls: string) => void;
  readonly onClear: () => void;
  readonly progress: number;
  readonly progressText: string;
  readonly rolls: string;
  readonly wordCount: WordCount;
};

export function DiceTranscriptInput({
  colors,
  inputLabel,
  inputPlaceholder,
  method,
  onChange,
  onClear,
  progress,
  progressText,
  rolls,
  wordCount,
}: Props) {
  const displayRolls = formatDiceTranscript(rolls, method, wordCount);
  const isD8D16 = method === 'd8d16';

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
          onChangeText={value => onChange(value.replace(/\s/g, ''))}
          placeholder={inputPlaceholder}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          showSoftInputOnFocus={false}
          spellCheck={false}
          style={[styles.rollInput, { color: colors.text }]}
          testID="dice-rolls-input"
          textContentType="none"
          value={displayRolls}
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

function formatDiceTranscript(
  rolls: string,
  method: DiceMethod,
  wordCount: WordCount,
): string {
  if (method === 'bitbox') {
    return formatBitBoxTranscript(rolls, wordCount);
  }
  if (method === 'd8d16') {
    return formatD8D16Transcript(rolls, wordCount);
  }
  return rolls;
}

function formatBitBoxTranscript(rolls: string, wordCount: WordCount): string {
  let completedWords = 0;
  let rollsInWord = 0;
  let separateNextRoll = false;
  let transcript = '';

  for (const face of rolls) {
    if (separateNextRoll) {
      transcript += ' ';
      separateNextRoll = false;
    }
    transcript += face;

    if (completedWords >= wordCount - 1) {
      continue;
    }
    if (rollsInWord < 5) {
      if (face >= '1' && face <= '4') {
        rollsInWord += 1;
      }
    } else {
      completedWords += 1;
      rollsInWord = 0;
      separateNextRoll = true;
    }
  }

  return transcript;
}

function formatD8D16Transcript(rolls: string, wordCount: WordCount): string {
  const wordRollCount = (wordCount - 1) * 3;

  return Array.from(rolls, (face, index) => {
    const startsNewWord =
      index > 0 &&
      (index === wordRollCount || (index < wordRollCount && index % 3 === 0));
    return `${startsNewWord ? ' ' : ''}${face}`;
  }).join('');
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