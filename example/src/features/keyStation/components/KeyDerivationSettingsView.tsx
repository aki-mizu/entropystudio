import { Picker } from '@react-native-picker/picker';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import {
  KEY_STATION_SCRIPT_TYPES,
  keyStationDerivationPathState,
  type KeyStationScriptType,
} from '../keyStation';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
} from '../../upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
  readonly derivationPath: string;
  readonly onBack: () => void;
  readonly onSetDerivationPath: (path: string) => void;
  readonly onSetScriptType: (scriptType: KeyStationScriptType) => void;
  readonly scriptType: KeyStationScriptType;
  readonly testIDPrefix: string;
};

const SCRIPT_TYPE_LABELS: Record<KeyStationScriptType, string> = {
  bip44: UPSTREAM_TEXT.keys.scriptTypes.bip44,
  bip49: UPSTREAM_TEXT.keys.scriptTypes.bip49,
  bip84: UPSTREAM_TEXT.keys.scriptTypes.bip84,
  bip86: UPSTREAM_TEXT.keys.scriptTypes.bip86,
};

export function KeyDerivationSettingsView({
  colors,
  derivationPath,
  onBack,
  onSetDerivationPath,
  onSetScriptType,
  scriptType,
  testIDPrefix,
}: Props) {
  const derivationPathState = keyStationDerivationPathState(derivationPath);

  return (
    <View style={styles.screen} testID={`${testIDPrefix}-key-settings-view`}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
          testID={`close-${testIDPrefix}-key-settings`}
        >
          <Text style={[styles.backButtonText, { color: colors.accent }]}>
            {UPSTREAM_UI_FALLBACK_COPY.common.back}
          </Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {UPSTREAM_TEXT.keys.scriptType}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.setting}>
          <Text style={[styles.label, { color: colors.muted }]}>
            {UPSTREAM_TEXT.keys.scriptType}
          </Text>
          <View
            style={[
              styles.pickerShell,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Picker
              accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
              dropdownIconColor={colors.muted}
              mode="dropdown"
              onValueChange={value => onSetScriptType(value as KeyStationScriptType)}
              selectedValue={scriptType}
              style={[styles.picker, { color: colors.text }]}
              testID={`${testIDPrefix}-script-type-picker`}
            >
              {KEY_STATION_SCRIPT_TYPES.map(({ id }) => (
                <Picker.Item key={id} label={SCRIPT_TYPE_LABELS[id]} value={id} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.setting}>
          <Text style={[styles.label, { color: colors.muted }]}>
            {UPSTREAM_TEXT.keys.derivationPath}
          </Text>
          <TextInput
            accessibilityLabel={UPSTREAM_TEXT.keys.derivationPath}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={onSetDerivationPath}
            selectionColor={colors.accent}
            spellCheck={false}
            style={[
              styles.pathInput,
              {
                backgroundColor: colors.surface,
                borderColor: derivationPathState.valid ? colors.border : colors.error,
                color: colors.text,
              },
              !derivationPathState.valid && styles.invalidPathInput,
            ]}
            aria-invalid={!derivationPathState.valid}
            testID={`${testIDPrefix}-derivation-path`}
            textContentType="none"
            value={derivationPath}
          />
          <Text
            style={[styles.fieldNote, { color: derivationPathState.valid ? colors.muted : colors.error }]}
            testID={`${testIDPrefix}-derivation-path-help`}
          >
            {derivationPathState.message}
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  fieldNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 24,
  },
  invalidPathInput: {
    borderWidth: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  pathInput: {
    borderRadius: 6,
    borderWidth: 1,
    fontFamily: 'monospace',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  picker: {
    minHeight: 48,
    width: '100%',
  },
  pickerShell: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
  },
  setting: {
    marginTop: 18,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
});