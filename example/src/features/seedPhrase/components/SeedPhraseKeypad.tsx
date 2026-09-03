import { Pressable, StyleSheet, Text, View } from 'react-native';
import entropyLabEnglish from '../../../../../entropylab/src/locales/en.json';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';

export type SeedPhraseEntryMethod = 'numbers' | 'words';

type Props = {
  readonly canInsert: (character: string) => boolean;
  readonly canInsertSpace: boolean;
  readonly colors: DiceColors;
  readonly method: SeedPhraseEntryMethod;
  readonly onInsert: (character: string) => void;
};

export function SeedPhraseKeypad({
  canInsert,
  canInsertSpace,
  colors,
  method,
  onInsert,
}: Props) {
  if (method === 'numbers') {
    return (
      <View
        accessibilityLabel={entropyLabEnglish['seed.numberKeypadAria']}
        style={styles.numberKeypad}
        testID="seed-number-keypad"
      >
        <View style={styles.numberGrid} testID="seed-number-key-grid">
          {['01234', '56789'].map((row, rowIndex) => (
            <View key={row} style={styles.numberRow} testID={`seed-number-key-row-${rowIndex}`}>
              {row.split('').map(character => {
                const enabled = canInsert(character);
                return (
                  <Pressable
                      accessibilityLabel={entropyLabEnglish['seed.enterDigit'].replace(
                        '{n}',
                        character,
                      )}
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
        </View>
        <Pressable
          accessibilityLabel="Enter next BIP39 word number"
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
            {entropyLabEnglish['seed.nextWord']}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SoftKeyboard
      canInsert={canInsert}
      canInsertSpace={canInsertSpace}
      colors={colors}
      keyboardLabel={() => 'On-screen lowercase seed phrase keyboard'}
      keyboardTestID="seed-phrase-keypad"
      keyTestIDPrefix="seed-phrase-key-"
      modeControl="disabled"
      modeTestID="seed-phrase-keypad-mode"
      modeToggleLabel="Character mode switching is available for the passphrase"
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
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 40,
  },
  nextWordLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  numberGrid: {
    gap: 6,
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