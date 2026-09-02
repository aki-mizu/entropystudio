import {
  DiceRollMethod,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
} from 'entropystudio';
import entropyLabEnglish from '../entropylab/src/locales/en.json';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const DICE_FACES = ['1', '2', '3', '4', '5', '6'] as const;
const CONTENT_HORIZONTAL_PADDING = 24;
const DICE_GRID_GAP = 10;
const WORD_COUNTS = [12, 15, 18, 21, 24] as const;
const RECOMMENDED_ROLLS = {
  12: 50,
  15: 62,
  18: 75,
  21: 87,
  24: 99,
} as const;
const ENTROPY_BITS = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
} as const;

type WordCount = (typeof WORD_COUNTS)[number];
type DiceResult =
  | { readonly entropy: string; readonly mnemonic: string; readonly error?: never }
  | { readonly entropy?: never; readonly mnemonic?: never; readonly error: string };

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function countDiceFaces(rolls: string): number {
  return Array.from(rolls).filter(face => face >= '1' && face <= '6').length;
}

function interpolateDiceMethodDescription(template: string, wordCount: WordCount): string {
  return template
    .replace('{bits}', String(ENTROPY_BITS[wordCount]))
    .replace('{words}', String(wordCount))
    .replace('{hashRolls}', String(RECOMMENDED_ROLLS[wordCount]));
}

function upstreamDiceError(error: unknown, rolls: string): string {
  const tag =
    typeof error === 'object' && error !== null && 'tag' in error && typeof error.tag === 'string'
      ? error.tag
      : undefined;

  if (tag === EntropyStudioError_Tags.InvalidDiceRolls) {
    let ignored = '';
    for (const character of rolls) {
      if (!/\s|,|;|\|/.test(character) && (character < '1' || character > '6')) {
        ignored += character;
      }
    }
    return entropyLabEnglish['error.diceFaces'].replace(
      '{chars}',
      JSON.stringify(ignored.slice(0, 24)),
    );
  }

  if (tag === EntropyStudioError_Tags.NoDiceRolls) {
    return entropyLabEnglish['error.diceEmpty'];
  }

  return entropyLabEnglish['error.generic'];
}

function diceMethodCopy(method: DiceRollMethod, wordCount: WordCount) {
  if (method === DiceRollMethod.Coldcard) {
    return {
      title: entropyLabEnglish['dice.coldcard.title'],
      description: interpolateDiceMethodDescription(
        entropyLabEnglish['dice.coldcard.desc'],
        wordCount,
      ),
    };
  }

  return {
    title: entropyLabEnglish['dice.coleman.title'],
    description: interpolateDiceMethodDescription(
      entropyLabEnglish['dice.coleman.desc'],
      wordCount,
    ),
  };
}

function deriveDiceResult(
  rolls: string,
  method: DiceRollMethod,
  wordCount: WordCount,
): DiceResult {
  try {
    const entropy = diceRollsToEntropy(rolls, method, wordCount);
    return {
      entropy: arrayBufferToHex(entropy),
      mnemonic: entropyToMnemonic(entropy),
    };
  } catch (error) {
    return { error: upstreamDiceError(error, rolls) };
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <DiceRollsScreen isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function DiceRollsScreen({ isDarkMode }: { isDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [rolls, setRolls] = useState('');
  const [method, setMethod] = useState(DiceRollMethod.Coldcard);
  const [wordCount, setWordCount] = useState<WordCount>(24);
  const [result, setResult] = useState<DiceResult | null>(null);
  const colors = isDarkMode ? darkColors : lightColors;
  const rollCount = countDiceFaces(rolls);
  const recommendedRolls = RECOMMENDED_ROLLS[wordCount];
  const estimatedBits = rollCount * Math.log2(6);
  const progress = Math.min(rollCount / recommendedRolls, 1);
  const coldcardCopy = diceMethodCopy(DiceRollMethod.Coldcard, wordCount);
  const colemanCopy = diceMethodCopy(DiceRollMethod.Coleman, wordCount);
  const diceTileSize = Math.floor(
    (windowWidth - CONTENT_HORIZONTAL_PADDING * 2 - DICE_GRID_GAP * 2) / 3,
  );

  function updateRolls(value: string) {
    setRolls(value);
    setResult(null);
  }

  function selectMethod(value: DiceRollMethod) {
    setMethod(value);
    setResult(null);
  }

  function selectWordCount(value: WordCount) {
    setWordCount(value);
    setResult(null);
  }

  return (
    <ScrollView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: safeAreaInsets.bottom + 32,
          paddingTop: safeAreaInsets.top + 28,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          ENTROPYSTUDIO
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Dice rolls
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Build a BIP39 phrase from a physical dice transcript.
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.muted }]}>HASH METHOD</Text>
      <View
        style={[
          styles.segmentedControl,
          { backgroundColor: colors.segment, borderColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: method === DiceRollMethod.Coldcard }}
          onPress={() => selectMethod(DiceRollMethod.Coldcard)}
          style={[
            styles.segment,
            method === DiceRollMethod.Coldcard && {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          testID="dice-method-coldcard"
        >
          <Text
            style={[
              styles.segmentLabel,
              { color: method === DiceRollMethod.Coldcard ? colors.text : colors.muted },
            ]}
            testID="dice-method-coldcard-title"
          >
            {coldcardCopy.title}
          </Text>
          <Text
            style={[styles.segmentDetail, { color: colors.muted }]}
            testID="dice-method-coldcard-description"
          >
            {coldcardCopy.description}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: method === DiceRollMethod.Coleman }}
          onPress={() => selectMethod(DiceRollMethod.Coleman)}
          style={[
            styles.segment,
            method === DiceRollMethod.Coleman && {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          testID="dice-method-coleman"
        >
          <Text
            style={[
              styles.segmentLabel,
              { color: method === DiceRollMethod.Coleman ? colors.text : colors.muted },
            ]}
            testID="dice-method-coleman-title"
          >
            {colemanCopy.title}
          </Text>
          <Text
            style={[styles.segmentDetail, { color: colors.muted }]}
            testID="dice-method-coleman-description"
          >
            {colemanCopy.description}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]}>SEED PHRASE LENGTH</Text>
        <Text style={[styles.sectionValue, { color: colors.accent }]}>
          {wordCount} words
        </Text>
      </View>
      <View style={styles.wordCounts}>
        {WORD_COUNTS.map(count => {
          const selected = wordCount === count;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={count}
              onPress={() => selectWordCount(count)}
              style={[
                styles.wordCount,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              testID={`word-count-${count}`}
            >
              <Text style={[styles.wordCountText, { color: selected ? colors.onAccent : colors.text }]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.label, { color: colors.muted }]}>TRANSCRIPT</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear dice rolls"
          onPress={() => updateRolls('')}
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
          onChangeText={updateRolls}
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
          <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {rollCount} of {recommendedRolls} recommended rolls
          </Text>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {estimatedBits.toFixed(1)} bits
          </Text>
        </View>
      </View>

      <View style={styles.diceGrid}>
        {DICE_FACES.map(face => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add dice face ${face}`}
            key={face}
            onPress={() => updateRolls(`${rolls}${face}`)}
            style={({ pressed }) => [
              styles.diceFace,
              {
                backgroundColor: colors.diceSurface,
                borderColor: colors.diceBorder,
                height: diceTileSize,
                opacity: pressed ? 0.78 : 1,
                width: diceTileSize,
              },
            ]}
            testID={`dice-face-${face}`}
          >
            <Text style={[styles.diceFaceText, { color: colors.diceText }]}>{face}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={rollCount === 0}
        onPress={() => setResult(deriveDiceResult(rolls, method, wordCount))}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accent,
            opacity: rollCount === 0 ? 0.45 : pressed ? 0.82 : 1,
          },
        ]}
        testID="derive-dice-phrase"
      >
        <Text style={[styles.buttonText, { color: colors.onAccent }]}>Derive phrase</Text>
      </Pressable>

      {result ? (
        <View style={[styles.result, { borderColor: colors.border }]}>
          {result.error ? (
            <Text style={[styles.error, { color: colors.error }]} testID="dice-error">
              {result.error}
            </Text>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>BIP39 PHRASE</Text>
              <Text selectable style={[styles.mnemonic, { color: colors.text }]} testID="mnemonic-output">
                {result.mnemonic}
              </Text>
              <Text style={[styles.label, styles.entropyLabel, { color: colors.muted }]}>ENTROPY</Text>
              <Text selectable style={[styles.entropy, { color: colors.text }]} testID="entropy-output">
                {result.entropy}
              </Text>
            </>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const lightColors = {
  accent: '#006B54',
  background: '#F4F6F1',
  border: '#CBD4CB',
  diceBorder: '#D37457',
  diceSurface: '#FFF6F1',
  diceText: '#A23417',
  error: '#B42318',
  muted: '#53645B',
  onAccent: '#FFFFFF',
  placeholder: '#7A8B80',
  segment: '#E8EEE8',
  surface: '#FFFFFF',
  text: '#17231B',
};

const darkColors = {
  accent: '#66D7AF',
  background: '#102019',
  border: '#355344',
  diceBorder: '#9A5848',
  diceSurface: '#321F1A',
  diceText: '#FFB39D',
  error: '#FFB4AB',
  muted: '#B1C5B8',
  onAccent: '#102019',
  placeholder: '#839A8C',
  segment: '#21382B',
  surface: '#182B21',
  text: '#E6F2E8',
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  diceFace: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
  },
  diceFaceText: {
    fontSize: 22,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DICE_GRID_GAP,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  entropy: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
  },
  entropyLabel: {
    marginTop: 22,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  mnemonic: {
    fontSize: 16,
    lineHeight: 25,
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
  result: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 28,
    paddingTop: 22,
  },
  rollInput: {
    fontFamily: 'monospace',
    fontSize: 18,
    lineHeight: 26,
    minHeight: 76,
    padding: 0,
    textAlignVertical: 'top',
  },
  screen: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 26,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  segment: {
    borderColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedControl: {
    borderRadius: 7,
    borderWidth: 1,
    gap: 3,
    padding: 3,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  surface: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 39,
    marginTop: 8,
  },
  wordCount: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  wordCounts: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default App;
