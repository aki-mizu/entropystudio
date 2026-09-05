import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
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

type InputSelection = {
  readonly end: number;
  readonly start: number;
};

function normalizedInputSelection(
  value: string,
  selection: InputSelection | null,
): InputSelection {
  const start = Math.min(Math.max(selection?.start ?? value.length, 0), value.length);
  const end = Math.min(Math.max(selection?.end ?? start, start), value.length);
  return { end, start };
}

function replaceInputSelection(
  value: string,
  selection: InputSelection,
  inserted: string,
): string {
  return `${value.slice(0, selection.start)}${inserted}${value.slice(selection.end)}`;
}

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
  const [inputSelection, setInputSelection] = useState<InputSelection | null>(null);
  const selectedInput = normalizedInputSelection(value, inputSelection);
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;

  function insertInputCharacter(character: string) {
    const nextValue = replaceInputSelection(value, selectedInput, character);
    const cursor = selectedInput.start + character.length;
    setInputSelection({ end: cursor, start: cursor });
    onChangePassphrase(nextValue);
  }

  function deleteInputCharacter() {
    if (!canDeleteInput) {
      return;
    }

    const start =
      selectedInput.end > selectedInput.start ? selectedInput.start : selectedInput.start - 1;
    const nextValue = `${value.slice(0, start)}${value.slice(selectedInput.end)}`;
    setInputSelection({ end: start, start });
    onChangePassphrase(nextValue);
  }

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
        <View style={styles.inputHeader}>
          <Text style={[styles.label, { color: colors.muted }]}>
            {UPSTREAM_TEXT.passphrase.label}
          </Text>
          <Pressable
            accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
            accessibilityRole="button"
            disabled={!canDeleteInput}
            onPress={deleteInputCharacter}
            style={({ pressed }) => [
              styles.undoButton,
              { opacity: canDeleteInput ? (pressed ? 0.72 : 1) : 0.38 },
            ]}
            testID="bip39-passphrase-undo"
          >
            <Text style={[styles.undoLabel, { color: colors.accent }]}>
              {UPSTREAM_UI_FALLBACK_COPY.keyboard.deletePreviousCharacter}
            </Text>
          </Pressable>
        </View>
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
            importantForAutofill="no"
            multiline
            onChangeText={onChangePassphrase}
            onSelectionChange={({ nativeEvent }) => setInputSelection(nativeEvent.selection)}
            placeholder={UPSTREAM_TEXT.passphrase.placeholder}
            placeholderTextColor={colors.placeholder}
            scrollEnabled
            selection={inputSelection ? selectedInput : undefined}
            selectionColor={colors.accent}
            showSoftInputOnFocus={false}
            spellCheck={false}
            style={[styles.input, { color: colors.text }]}
            testID={inputTestID}
            textContentType="none"
            value={value}
          />
        </View>
        <SoftKeyboard
          canInsert={() => true}
          canInsertSpace
          colors={colors}
          keyboardLabel={() => UPSTREAM_TEXT.passphrase.label}
          keyboardTestID="bip39-passphrase-keypad"
          keyTestIDPrefix="bip39-passphrase-key-"
          modeControl="enabled"
          modeTestID="bip39-passphrase-keypad-mode"
          modeToggleLabel={UPSTREAM_UI_FALLBACK_COPY.keyboard.modeButton}
          onInsert={insertInputCharacter}
          spaceTestID="bip39-passphrase-key-space"
          style={styles.keypad}
        />
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
    flex: 1,
    marginTop: 20,
    minHeight: 0,
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
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  inputSurface: {
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  inputHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  keypad: {
    marginTop: 10,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  undoButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  undoLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});