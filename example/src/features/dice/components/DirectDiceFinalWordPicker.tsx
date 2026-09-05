import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly finalWordLabel: string;
  readonly finalWordPlaceholder: string;
  readonly onChangeFinalWord: (word: string) => void;
  readonly onSelectFinalWord: (word: string) => void;
  readonly selectedFinalWord: string;
  readonly state: DirectDiceState;
};

export function DirectDiceFinalWordPicker({
  colors,
  finalWordLabel,
  finalWordPlaceholder,
  onChangeFinalWord,
  onSelectFinalWord,
  selectedFinalWord,
  state,
}: Props) {
  const selectedWord = selectedFinalWord.trim().toLowerCase();
  const matchingCandidates = state.candidates.filter(candidate =>
    candidate.startsWith(selectedWord),
  );

  return (
    <View>
      <Text style={[styles.label, { color: colors.muted }]} testID="direct-final-word-label">
        {finalWordLabel}
      </Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        importantForAutofill="no"
        onChangeText={onChangeFinalWord}
        placeholder={finalWordPlaceholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.accent}
        spellCheck={false}
        style={[
          styles.finalWordInput,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        ]}
        testID="direct-final-word-input"
        textContentType="none"
        value={selectedFinalWord}
      />
      <View style={styles.candidates}>
        {matchingCandidates.slice(0, 12).map(candidate => {
          const selected = candidate === selectedWord;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={candidate}
              onPress={() => onSelectFinalWord(candidate)}
              style={[
                styles.candidate,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              testID={`direct-final-word-${candidate}`}
            >
              <Text style={[styles.candidateText, { color: selected ? colors.onAccent : colors.text }]}>
                {candidate}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  candidate: {
    borderRadius: 5,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  candidateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  candidates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  finalWordInput: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
});