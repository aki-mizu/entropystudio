import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { formatDiceTranscript } from '../dice';
import type { DiceMethod, WordCount } from '../dice';
import type { DiceColors } from '../diceTheme';

export type DiceTranscriptSelection = {
  readonly end: number;
  readonly start: number;
};

type Props = {
  readonly colors: DiceColors;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly method: DiceMethod;
  readonly onChange: (rolls: string) => void;
  readonly onProgrammaticSelectionChange: (selection: DiceTranscriptSelection) => void;
  readonly onSelectionChange: (selection: DiceTranscriptSelection) => void;
  readonly progress: number;
  readonly progressText: string;
  readonly rolls: string;
  readonly selection: DiceTranscriptSelection | null;
  readonly selectionRequestId: number;
  readonly wordCount: WordCount;
};

export function DiceTranscriptInput({
  colors,
  inputLabel,
  inputPlaceholder,
  method,
  onChange,
  onProgrammaticSelectionChange,
  onSelectionChange,
  progress,
  progressText,
  rolls,
  selection,
  selectionRequestId,
  wordCount,
}: Props) {
  const inputRef = useRef<TextInputInstance>(null);
  const appliedSelectionRequestId = useRef(selectionRequestId);
  const displayRolls = formatDiceTranscript(rolls, method, wordCount);
  const displaySelection = selection
    ? displaySelectionFromRawSelection(displayRolls, selection)
    : undefined;
  const hasSelectedRange = Boolean(selection && selection.end > selection.start);
  const isD8D16 = method === 'd8d16';

  useEffect(() => {
    if (selectionRequestId === appliedSelectionRequestId.current) {
      return;
    }

    appliedSelectionRequestId.current = selectionRequestId;
    if (displaySelection) {
      inputRef.current?.setSelection?.(displaySelection.start, displaySelection.end);
    }
  }, [displaySelection, selectionRequestId]);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]} testID="dice-input-label">
          {inputLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasSelectedRange ? 'Remove selected rolls' : 'Remove roll before cursor'}
          disabled={rolls.length === 0}
          onPress={() => {
            const result = removeDiceRollAtSelection(rolls, selection);
            onProgrammaticSelectionChange(result.selection);
            onChange(result.rolls);
          }}
          style={({ pressed }) => [
            styles.undoButton,
            { opacity: rolls.length === 0 ? 0.38 : pressed ? 0.72 : 1 },
          ]}
          testID="remove-dice-roll"
        >
          <Text style={[styles.undoLabel, { color: colors.accent }]}>Undo</Text>
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
          onSelectionChange={({ nativeEvent }) => {
            onSelectionChange(rawSelectionFromDisplaySelection(displayRolls, nativeEvent.selection));
          }}
          placeholder={inputPlaceholder}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          showSoftInputOnFocus={false}
          spellCheck={false}
          style={[styles.rollInput, { color: colors.text }]}
          ref={inputRef}
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

function rawSelectionFromDisplaySelection(
  displayRolls: string,
  selection: DiceTranscriptSelection,
): DiceTranscriptSelection {
  return {
    end: rawPositionFromDisplayPosition(displayRolls, selection.end),
    start: rawPositionFromDisplayPosition(displayRolls, selection.start),
  };
}

function displaySelectionFromRawSelection(
  displayRolls: string,
  selection: DiceTranscriptSelection,
): DiceTranscriptSelection {
  return {
    end: displayPositionFromRawPosition(displayRolls, selection.end),
    start: displayPositionFromRawPosition(displayRolls, selection.start),
  };
}

function rawPositionFromDisplayPosition(displayRolls: string, position: number): number {
  const end = Math.min(Math.max(position, 0), displayRolls.length);
  return Array.from(displayRolls.slice(0, end)).filter(character => character !== ' ').length;
}

function displayPositionFromRawPosition(displayRolls: string, position: number): number {
  const rawLength = rawPositionFromDisplayPosition(displayRolls, displayRolls.length);
  const target = Math.min(Math.max(position, 0), rawLength);
  let rawPosition = 0;

  for (let index = 0; index < displayRolls.length; index += 1) {
    if (rawPosition === target && displayRolls[index] !== ' ') {
      return index;
    }
    if (displayRolls[index] !== ' ') {
      rawPosition += 1;
    }
  }

  return displayRolls.length;
}

function removeDiceRollAtSelection(
  rolls: string,
  selection: DiceTranscriptSelection | null,
): { readonly rolls: string; readonly selection: DiceTranscriptSelection } {
  if (!rolls) {
    return { rolls: '', selection: { end: 0, start: 0 } };
  }

  const selectionStart = Math.min(
    Math.max(selection?.start ?? rolls.length, 0),
    rolls.length,
  );
  const selectionEnd = Math.min(
    Math.max(selection?.end ?? selectionStart, selectionStart),
    rolls.length,
  );
  const deleteStart =
    selectionEnd > selectionStart ? selectionStart : Math.max(selectionStart - 1, 0);
  const deleteEnd = selectionEnd > selectionStart ? selectionEnd : selectionStart;
  const nextRolls = `${rolls.slice(0, deleteStart)}${rolls.slice(deleteEnd)}`;

  return {
    rolls: nextRolls,
    selection: { end: deleteStart, start: deleteStart },
  };
}

const styles = StyleSheet.create({
  undoButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  undoLabel: {
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