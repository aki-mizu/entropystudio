import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import { NativeSelect, type NativeSelectOption } from '../../../components/NativeSelect';
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

const SCRIPT_TYPE_OPTIONS: readonly NativeSelectOption<KeyStationScriptType>[] =
  KEY_STATION_SCRIPT_TYPES.map(({ id }) => ({ label: SCRIPT_TYPE_LABELS[id], value: id }));

type AdvancedPathField = 'purpose' | 'network' | 'account' | 'branch' | 'address';

type AdvancedPathValue = {
  readonly hardened: boolean;
  readonly value: string;
};

type AdvancedPathState = Record<AdvancedPathField, AdvancedPathValue>;

type AdvancedRangeField = 'branch' | 'address';

const ADVANCED_PATH_FIELDS: readonly {
  readonly field: AdvancedPathField;
  readonly label: string;
  readonly testID: string;
}[] = [
  { field: 'purpose', label: UPSTREAM_TEXT.keys.purpose, testID: 'purpose' },
  { field: 'network', label: UPSTREAM_TEXT.keys.network, testID: 'network' },
  { field: 'account', label: UPSTREAM_TEXT.keys.account, testID: 'account' },
  {
    field: 'branch',
    label: UPSTREAM_TEXT.keys.startingAddressBranch,
    testID: 'branch',
  },
  {
    field: 'address',
    label: UPSTREAM_TEXT.keys.startingAddressIndex,
    testID: 'address',
  },
];

function defaultAdvancedPathState(scriptType: KeyStationScriptType): AdvancedPathState {
  const purpose = KEY_STATION_SCRIPT_TYPES.find(({ id }) => id === scriptType)?.purpose ?? 84;
  return {
    account: { hardened: true, value: '0' },
    address: { hardened: false, value: '0' },
    branch: { hardened: false, value: '0' },
    network: { hardened: true, value: '0' },
    purpose: { hardened: true, value: String(purpose) },
  };
}

function parseAdvancedPath(path: string, scriptType: KeyStationScriptType): AdvancedPathState {
  const state = defaultAdvancedPathState(scriptType);
  const components = /^m\/(.+)$/.exec(path.trim())?.[1].split('/') ?? [];
  const fields: readonly AdvancedPathField[] = ['purpose', 'network', 'account', 'branch', 'address'];

  fields.forEach((field, index) => {
    const match = /^(\d+)([hH']?)$/.exec(components[index] ?? '');
    if (match) {
      state[field] = { hardened: Boolean(match[2]), value: match[1] };
    }
  });

  return state;
}

function advancedPathValue(value: AdvancedPathValue): string {
  return `${value.value}${value.hardened ? "'" : ''}`;
}

function buildAdvancedPath(
  path: string,
  scriptType: KeyStationScriptType,
  field: AdvancedPathField,
  value: AdvancedPathValue,
): string {
  const state = parseAdvancedPath(path, scriptType);
  state[field] = value;
  const components = (['purpose', 'network', 'account', 'branch', 'address'] as const).map(
    currentField => advancedPathValue(state[currentField]),
  );
  return `m/${components.join('/')}`;
}

export function KeyDerivationSettingsView({
  colors,
  derivationPath,
  onBack,
  onSetDerivationPath,
  onSetScriptType,
  scriptType,
  testIDPrefix,
}: Props) {
  const [advancedEntryOpen, setAdvancedEntryOpen] = useState(false);
  const [advancedRanges, setAdvancedRanges] = useState<Record<AdvancedRangeField, string>>({
    address: '1',
    branch: '1',
  });
  const derivationPathState = keyStationDerivationPathState(derivationPath);
  const advancedPath = parseAdvancedPath(derivationPath, scriptType);

  function updateAdvancedPath(field: AdvancedPathField, value: AdvancedPathValue) {
    onSetDerivationPath(buildAdvancedPath(derivationPath, scriptType, field, value));
  }

  function renderAdvancedField({ field, label, testID }: (typeof ADVANCED_PATH_FIELDS)[number]) {
    const currentValue = advancedPath[field];
    return (
      <View key={`path-${field}`} style={styles.advancedSetting}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <View style={styles.advancedControl}>
          <TextInput
            accessibilityLabel={label}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            onChangeText={value => {
              const digits = value.replace(/[^0-9]/g, '');
              if (digits) {
                updateAdvancedPath(field, { ...currentValue, value: digits });
              }
            }}
            selectTextOnFocus
            selectionColor={colors.accent}
            spellCheck={false}
            style={[
              styles.advancedInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            testID={`${testIDPrefix}-advanced-${testID}`}
            value={currentValue.value}
          />
          <View style={styles.hardenControl}>
            <Switch
              accessibilityLabel={`${label} ${UPSTREAM_TEXT.keys.harden}`}
              onValueChange={hardened => updateAdvancedPath(field, { ...currentValue, hardened })}
              testID={`${testIDPrefix}-advanced-${testID}-harden`}
              trackColor={{ false: colors.border, true: colors.accent }}
              value={currentValue.hardened}
            />
            <Text style={[styles.hardenLabel, { color: colors.muted }]}>
              {UPSTREAM_TEXT.keys.harden}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderAdvancedRange(
    field: AdvancedRangeField,
    label: string,
    testID: string,
  ) {
    return (
      <View key={`range-${field}`} style={styles.advancedSetting}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          onChangeText={value => {
            const digits = value.replace(/[^0-9]/g, '');
            setAdvancedRanges(current => ({ ...current, [field]: digits || '1' }));
          }}
          selectTextOnFocus
          selectionColor={colors.accent}
          style={[
            styles.advancedInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          testID={`${testIDPrefix}-advanced-${testID}`}
          value={advancedRanges[field]}
        />
      </View>
    );
  }

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
          <NativeSelect
            accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
            controlTestID={`${testIDPrefix}-script-type-picker`}
            colors={colors}
            onValueChange={onSetScriptType}
            options={SCRIPT_TYPE_OPTIONS}
            selectedValue={scriptType}
          />
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
        <View style={[styles.advancedEntry, { borderTopColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedEntryOpen }}
            onPress={() => setAdvancedEntryOpen(open => !open)}
            style={styles.advancedSummary}
            testID={`${testIDPrefix}-advanced-entry`}
          >
            <Text style={[styles.advancedSummaryText, { color: advancedEntryOpen ? colors.text : colors.muted }]}>
              {UPSTREAM_TEXT.keys.advancedEntry}
            </Text>
          </Pressable>
          {advancedEntryOpen ? (
            <View style={styles.advancedFields} testID={`${testIDPrefix}-advanced-fields`}>
              <View style={styles.advancedRow}>
                {ADVANCED_PATH_FIELDS.slice(0, 2).map(renderAdvancedField)}
              </View>
              <View style={styles.advancedRow}>
                {ADVANCED_PATH_FIELDS.slice(2, 3).map(renderAdvancedField)}
                <View style={styles.advancedSetting} />
              </View>
              <View style={styles.advancedRow}>
                {renderAdvancedField(ADVANCED_PATH_FIELDS[3])}
                {renderAdvancedRange(
                  'branch',
                  UPSTREAM_TEXT.keys.addressBranchRange,
                  'branch-range',
                )}
              </View>
              <View style={styles.advancedRow}>
                {renderAdvancedField(ADVANCED_PATH_FIELDS[4])}
                {renderAdvancedRange('address', UPSTREAM_TEXT.keys.addressRange, 'address-range')}
              </View>
            </View>
          ) : null}
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
  advancedControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  advancedEntry: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 8,
  },
  advancedFields: {
    gap: 10,
    marginTop: 10,
  },
  advancedInput: {
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 15,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  advancedRow: {
    flexDirection: 'row',
    gap: 12,
  },
  advancedSetting: {
    flex: 1,
    minWidth: 0,
  },
  advancedSummary: {
    minHeight: 36,
    justifyContent: 'center',
  },
  advancedSummaryText: {
    fontSize: 14,
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
  hardenControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  hardenLabel: {
    fontSize: 12,
    fontWeight: '600',
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
