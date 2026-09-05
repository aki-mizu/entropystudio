import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SoftKeyboard } from '../../../components/SoftKeyboard';
import type { DiceColors } from '../../dice/diceTheme';
import {
  analyzeBip39Passphrase,
  bip39PassphraseAutocomplete,
  bip39PassphraseKeyAllowed,
  bip39PassphraseSpaceAllowed,
  bip39PassphraseStatusCopy,
} from '../seedPhrase';
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
  readonly options: Bip39PassphraseOptions;
  readonly screenTestID: string;
  readonly value: string;
};

export type Bip39PassphraseOptions = {
  readonly autocompleteEnabled: boolean;
  readonly buildFromBip39Words: boolean;
  readonly canDerive: boolean;
  readonly setBuildFromBip39Words: (enabled: boolean) => void;
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

export function useBip39PassphraseOptions(
  value: string,
  autocompleteEnabled: boolean,
): Bip39PassphraseOptions {
  const [buildFromBip39Words, setBuildFromBip39Words] = useState(false);
  const state = buildFromBip39Words ? analyzeBip39Passphrase(value) : null;

  return {
    autocompleteEnabled,
    buildFromBip39Words,
    canDerive: !buildFromBip39Words || Boolean(state?.canDerive),
    setBuildFromBip39Words,
  };
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
  options,
  screenTestID,
  value,
}: ViewProps) {
  const [inputSelection, setInputSelection] = useState<InputSelection | null>(null);
  const selectedInput = normalizedInputSelection(value, inputSelection);
  const bip39State = options.buildFromBip39Words
    ? analyzeBip39Passphrase(value, selectedInput.start)
    : null;
  const canDeleteInput = selectedInput.end > selectedInput.start || selectedInput.start > 0;
  const hasInvalidBip39Input = Boolean(bip39State?.invalidCount);

  function canInsertInputCharacter(character: string) {
    return (
      !options.buildFromBip39Words ||
      bip39PassphraseKeyAllowed(value, selectedInput, character)
    );
  }

  function canInsertInputSpace() {
    return (
      !options.buildFromBip39Words || bip39PassphraseSpaceAllowed(value, selectedInput)
    );
  }

  function insertInputCharacter(character: string) {
    const canInsert =
      character === ' ' ? canInsertInputSpace() : canInsertInputCharacter(character);
    if (!canInsert) {
      return;
    }

    const insertedValue = replaceInputSelection(value, selectedInput, character);
    const insertedCursor = selectedInput.start + character.length;
    const autocompleted = options.buildFromBip39Words
      ? bip39PassphraseAutocomplete(
          insertedValue,
          insertedCursor,
          options.autocompleteEnabled,
        )
      : { cursor: insertedCursor, value: insertedValue };
    const cursor = Math.min(autocompleted.cursor, autocompleted.value.length);
    setInputSelection({ end: cursor, start: cursor });
    onChangePassphrase(autocompleted.value);
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
        <View style={styles.bip39Options}>
          <View style={styles.bip39Toggle}>
            <View style={styles.bip39Copy}>
              <Text
                style={[styles.bip39Label, { color: colors.text }]}
                testID="bip39-passphrase-bip39-label"
              >
                {UPSTREAM_TEXT.passphrase.buildFromWords}
              </Text>
              <Text
                style={[styles.bip39Note, { color: colors.muted }]}
                testID="bip39-passphrase-bip39-note"
              >
                {UPSTREAM_TEXT.passphrase.wordsNote}
              </Text>
            </View>
            <Switch
              accessibilityLabel={UPSTREAM_TEXT.passphrase.buildFromWords}
              onValueChange={options.setBuildFromBip39Words}
              testID="bip39-passphrase-bip39-toggle"
              thumbColor={options.buildFromBip39Words ? colors.surface : colors.muted}
              trackColor={{ false: colors.segment, true: colors.accent }}
              value={options.buildFromBip39Words}
            />
          </View>
        </View>
        <View style={styles.inputHeader}>
          <Text style={[styles.label, { color: colors.muted }]}>
            {UPSTREAM_TEXT.passphrase.label}
          </Text>
        </View>
        <View
          style={[
            styles.inputSurface,
            { backgroundColor: colors.surface, borderColor: colors.border },
            hasInvalidBip39Input && { borderColor: colors.error },
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
          {bip39State ? (
            <Text
              style={[
                styles.bip39Status,
                { color: hasInvalidBip39Input ? colors.error : colors.muted },
                bip39State.canDerive && value.length > 0 && { color: colors.accent },
              ]}
              testID="bip39-passphrase-bip39-status"
            >
              {bip39PassphraseStatusCopy(bip39State)}
            </Text>
          ) : null}
        </View>
        <SoftKeyboard
          canDelete={canDeleteInput}
          canInsert={canInsertInputCharacter}
          canInsertSpace={canInsertInputSpace()}
          colors={colors}
          deleteTestID="bip39-passphrase-undo"
          key={options.buildFromBip39Words ? 'bip39-words' : 'passphrase'}
          keyboardTestID="bip39-passphrase-keypad"
          keyTestIDPrefix="bip39-passphrase-key-"
          modeControl={options.buildFromBip39Words ? 'disabled' : 'enabled'}
          modeTestID="bip39-passphrase-keypad-mode"
          onDelete={deleteInputCharacter}
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
  bip39Copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  bip39Label: {
    fontSize: 12,
    fontWeight: '700',
  },
  bip39Note: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bip39Options: {
    marginBottom: 14,
  },
  bip39Status: {
    fontSize: 12,
    lineHeight: 17,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  bip39Toggle: {
    alignItems: 'center',
    flexDirection: 'row',
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
});