import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackspaceKey } from '../../../components/BackspaceKey';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

export type SeedPhraseEntryMethod = 'numbers' | 'words';

type Props = {
  readonly canDelete: boolean;
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly colors: DiceColors;
  readonly deleteTestID: string;
  readonly method: SeedPhraseEntryMethod;
  readonly onDelete: () => void;
  readonly onInsert: (character: string) => void;
};

export function SeedPhraseKeypad({
  canDelete,
  canInsert,
  canInsertSpace,
  colors,
  deleteTestID,
  method,
  onDelete,
  onInsert,
}: Props) {
  if (method === 'numbers') {
    return (
      <View style={styles.numberKeypad} testID="seed-number-keypad">
        <View style={styles.numberGrid} testID="seed-number-key-grid">
          {['01234', '56789'].map((row, rowIndex) => (
            <View key={row} style={styles.numberRow} testID={`seed-number-key-row-${rowIndex}`}>
              {row.split('').map(character => {
                const enabled = canInsert(character);
                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!enabled}
                    key={character}
                    onPress={() => onInsert(character)}
                    style={({ pressed }) => [
                      styles.numberKey,
                      {
                        backgroundColor: colors.diceSurface,
                        borderColor: colors.diceBorder,
                        opacity: enabled ? (pressed ? 0.78 : 1) : 0.38,
                      },
                    ]}
                    testID={`seed-number-key-${character}`}
                  >
                    <Text style={[styles.keyLabel, { color: colors.diceText }]}>{character}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={styles.numberActions}>
            <BackspaceKey
              colors={colors}
              disabled={!canDelete}
              onPress={onDelete}
              style={styles.numberDeleteKey}
              testID={deleteTestID}
            />
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.seed.nextWord}
              accessibilityRole="button"
              disabled={!canInsertSpace}
              onPress={() => onInsert(' ')}
              style={({ pressed }) => [
                styles.nextWordButton,
                {
                  backgroundColor: colors.segment,
                  borderColor: colors.border,
                  opacity: canInsertSpace ? (pressed ? 0.78 : 1) : 0.38,
                },
              ]}
              testID="seed-number-next-word"
            >
              <Text style={[styles.nextWordLabel, { color: colors.text }]}>
                {UPSTREAM_TEXT.seed.nextWord}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SoftKeyboard
      canDelete={canDelete}
      canInsert={canInsert}
      canInsertSpace={canInsertSpace}
      colors={colors}
      deleteTestID={deleteTestID}
      keyboardTestID="seed-phrase-keypad"
      keyTestIDPrefix="seed-phrase-key-"
      modeControl="disabled"
      modeTestID="seed-phrase-keypad-mode"
      onDelete={onDelete}
      onInsert={onInsert}
      rowTestIDPrefix="seed-phrase-key-row-"
      spaceTestID="seed-phrase-key-space"
      style={styles.wordKeypad}
    />
  );
}

const styles = StyleSheet.create({
  keyLabel: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
  },
  nextWordButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 4,
    justifyContent: 'center',
    minHeight: 40,
  },
  nextWordLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  numberGrid: {
    gap: 6,
  },
  numberActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  numberDeleteKey: {
    flex: 1,
    minHeight: 40,
  },
  numberKey: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 6,
  },
  numberKeypad: {
    marginTop: 10,
  },
  wordKeypad: {
    marginTop: 10,
  },
});