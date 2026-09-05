import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiceColors } from '../../dice/diceTheme';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type ButtonProps = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly onPress: () => void;
  readonly testID: string;
};

type ViewProps = {
  readonly backTestID: string;
  readonly colors: DiceColors;
  readonly inputTestID: string;
  readonly onBack: () => void;
  readonly onChangePassphrase: (value: string) => void;
  readonly screenTestID: string;
  readonly value: string;
};

export function Bip39PassphraseButton({
  compact = false,
  colors,
  onPress,
  testID,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={UPSTREAM_TEXT.passphrase.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        {
          borderColor: colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
      testID={testID}
    >
      <Text
        adjustsFontSizeToFit={compact}
        numberOfLines={compact ? 2 : 1}
        style={[styles.buttonText, compact && styles.compactButtonText, { color: colors.accent }]}
      >
        {UPSTREAM_TEXT.passphrase.label}
      </Text>
    </Pressable>
  );
}

export function Bip39PassphraseView({
  backTestID,
  colors,
  inputTestID,
  onBack,
  onChangePassphrase,
  screenTestID,
  value,
}: ViewProps) {
  return (
    <View style={styles.content} testID={screenTestID}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
          testID={backTestID}
        >
          <Text style={[styles.backButtonText, { color: colors.accent }]}>
            {UPSTREAM_UI_FALLBACK_COPY.common.back}
          </Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {UPSTREAM_TEXT.passphrase.label}
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.muted }]}>
          {UPSTREAM_TEXT.passphrase.label}
        </Text>
        <View
          style={[
            styles.inputSurface,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            accessibilityLabel={UPSTREAM_TEXT.passphrase.label}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={onChangePassphrase}
            placeholder={UPSTREAM_TEXT.passphrase.placeholder}
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.accent}
            spellCheck={false}
            style={[styles.input, { color: colors.text }]}
            testID={inputTestID}
            textContentType="none"
            value={value}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingRight: 14,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactButton: {
    flexShrink: 0,
    marginLeft: 8,
    marginTop: 0,
    minHeight: 44,
    paddingHorizontal: 8,
    width: 140,
  },
  compactButtonText: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 12,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  form: {
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 58,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputSurface: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
});