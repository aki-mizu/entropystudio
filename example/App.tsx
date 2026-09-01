import { mnemonicToEntropy } from 'entropystudio';
import { useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const BIP39_TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BIP39_TEST_ENTROPY = '00000000000000000000000000000000';

type Bip39Result =
  | { readonly entropy: string; readonly error?: never }
  | { readonly entropy?: never; readonly error: string };

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function deriveTestEntropy(): Bip39Result {
  try {
    return {
      entropy: arrayBufferToHex(mnemonicToEntropy(BIP39_TEST_MNEMONIC)),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Rust bridge error: ${message}` };
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Bip39Demo isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function Bip39Demo({ isDarkMode }: { isDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const [result, setResult] = useState<Bip39Result>(deriveTestEntropy);
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingBottom: safeAreaInsets.bottom + 28,
          paddingTop: safeAreaInsets.top + 28,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          ENTROPYSTUDIO
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          BIP39 entropy
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Rust-backed BIP39 test vector
        </Text>
      </View>

      <View
        style={[
          styles.surface,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.muted }]}>MNEMONIC</Text>
        <Text selectable style={[styles.mnemonic, { color: colors.text }]}>
          {BIP39_TEST_MNEMONIC}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setResult(deriveTestEntropy())}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
        ]}
        testID="verify-bip39"
      >
        <Text style={styles.buttonText}>Verify with Rust</Text>
      </Pressable>

      <View style={[styles.result, { borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.muted }]}>ENTROPY</Text>
        {result.entropy ? (
          <Text
            selectable
            style={[styles.entropy, { color: colors.text }]}
            testID="entropy-output"
          >
            {result.entropy}
          </Text>
        ) : (
          <Text
            style={[styles.error, { color: colors.error }]}
            testID="entropy-error"
          >
            {result.error}
          </Text>
        )}
        {result.entropy === BIP39_TEST_ENTROPY ? (
          <Text style={[styles.status, { color: colors.accent }]}>
            BIP39 checksum verified
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const lightColors = {
  accent: '#006B54',
  background: '#F4F6F1',
  border: '#CBD4CB',
  error: '#B42318',
  muted: '#53645B',
  surface: '#FFFFFF',
  text: '#17231B',
};

const darkColors = {
  accent: '#66D7AF',
  background: '#102019',
  border: '#355344',
  error: '#FFB4AB',
  muted: '#B1C5B8',
  surface: '#182B21',
  text: '#E6F2E8',
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 22,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  entropy: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    marginBottom: 34,
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
  result: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 28,
    paddingTop: 22,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  surface: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 39,
    marginTop: 8,
  },
});

export default App;
