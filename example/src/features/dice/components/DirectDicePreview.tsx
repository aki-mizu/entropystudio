import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DirectDiceMethodId } from '../dice';
import type { DiceColors } from '../diceTheme';

type Props = {
  readonly colors: DiceColors;
  readonly finalWordAria: string;
  readonly finalWordLabel: string;
  readonly finalWordPlaceholder: string;
  readonly method: DirectDiceMethodId;
  readonly onSelectFinalWord: (word: string) => void;
  readonly selectedFinalWord: string;
  readonly state: DirectDiceState;
  readonly wordSlotsAria: string;
};

export function DirectDicePreview({
  colors,
  finalWordAria,
  finalWordLabel,
  finalWordPlaceholder,
  method,
  onSelectFinalWord,
  selectedFinalWord,
  state,
  wordSlotsAria,
}: Props) {
  const selectedWord = selectedFinalWord.trim().toLowerCase();
  const selectedCandidate = state.candidates.includes(selectedWord) ? selectedWord : '';
  const finalWord = method === 'd8d16' ? state.finalWord : selectedCandidate;
  const words = finalWord ? [...state.words, finalWord] : state.words;
  const matchingCandidates = state.candidates.filter(candidate =>
    candidate.startsWith(selectedWord),
  );

  if (words.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View accessibilityLabel={wordSlotsAria} style={styles.wordGrid} testID="direct-dice-words">
        {words.map((word, index) => (
          <View
            key={`${word}-${index}`}
            style={[
              styles.word,
              { backgroundColor: colors.segment, borderColor: colors.border },
              index === words.length - 1 && finalWord
                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                : undefined,
            ]}
          >
            <Text
              selectable
              style={[styles.wordText, { color: index === words.length - 1 && finalWord ? colors.onAccent : colors.text }]}
            >
              {word}
            </Text>
          </View>
        ))}
      </View>

      {method === 'bitbox' && state.candidates.length > 0 ? (
        <View style={styles.selection}>
          <Text style={[styles.label, { color: colors.muted }]} testID="direct-final-word-label">
            {finalWordLabel}
          </Text>
          <TextInput
            accessibilityLabel={finalWordAria}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
            onChangeText={onSelectFinalWord}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  candidate: {
    borderRadius: 5,
    borderWidth: 1,
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
    marginTop: 10,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 22,
    paddingTop: 20,
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
  selection: {
    marginTop: 20,
  },
  word: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '700',
  },
});