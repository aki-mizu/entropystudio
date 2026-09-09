import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
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
  type KeyStationAdvancedDerivationUpdater,
  type KeyStationAdvancedHardening,
  type KeyStationScriptType,
} from '../keyStation';
import {
  KeyDerivationBranchRole,
  KeyDerivationNetworkKind,
  KeyDerivationPathHelpKind,
  KeyDerivationValidationKind,
  KeyDerivationVisiblePathValidationKind,
  keyDerivationAddressBenchmarkMilliseconds,
  keyDerivationAddressEstimateMilliseconds,
  keyDerivationAdvancedState,
  keyDerivationVisiblePathState,
} from '../../../native/entropyStudio';
import type {
  KeyDerivationAdvancedInput,
  KeyDerivationAdvancedState,
} from '../../../native/entropyStudio';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  type KeyDerivationAdvancedCopyBranch,
  type KeyDerivationAdvancedCopyNetworkKind,
  type KeyDerivationAdvancedCopyPathHelpKind,
  type KeyDerivationAdvancedCopyValidationKind,
} from '../../upstreamUiCopy';

type Props = {
  readonly advancedDerivationHardening: KeyStationAdvancedHardening;
  readonly advancedDerivationInput: KeyDerivationAdvancedInput;
  readonly colors: DiceColors;
  readonly derivationPath: string;
  readonly onBack: () => void;
  readonly onSetAdvancedDerivation: (update: KeyStationAdvancedDerivationUpdater) => void;
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

type AdvancedRangeField = 'branch' | 'address';
type DerivationPathEditSource = 'advanced' | 'path';

function advancedHardeningField(
  field: AdvancedPathField,
): keyof KeyStationAdvancedHardening {
  switch (field) {
    case 'purpose':
      return 'purpose';
    case 'network':
      return 'coinType';
    case 'account':
      return 'account';
    case 'branch':
      return 'branch';
    case 'address':
      return 'address';
  }
}

const ADVANCED_PATH_FIELDS: readonly {
  readonly field: AdvancedPathField;
  readonly label: string;
  readonly testID: string;
}[] = [
  {
    field: 'purpose',
    label: UPSTREAM_TEXT.keys.purpose,
    testID: 'purpose',
  },
  {
    field: 'network',
    label: UPSTREAM_TEXT.keys.network,
    testID: 'network',
  },
  {
    field: 'account',
    label: UPSTREAM_TEXT.keys.account,
    testID: 'account',
  },
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

function advancedPathValue(value: AdvancedPathValue): string {
  return `${value.value}${value.hardened ? "'" : ''}`;
}

function sanitizeAdvancedPathDraft(value: string): string {
  let result = '';
  let hardened = false;

  for (const character of value) {
    if (character >= '0' && character <= '9' && !hardened) {
      result += character;
    } else if ((character === "'" || character === 'h' || character === 'H') && !hardened) {
      result += "'";
      hardened = true;
    }
  }

  return result;
}

function advancedPathDraft(
  input: KeyDerivationAdvancedInput,
  field: AdvancedPathField,
): string {
  switch (field) {
    case 'purpose':
      return input.purpose;
    case 'network':
      return input.coinType;
    case 'account':
      return input.account;
    case 'branch':
      return input.branchStart;
    case 'address':
      return input.addressStart;
  }
}

function advancedPathValueFromDraft(draft: string): AdvancedPathValue {
  const hardened = /[hH']$/.test(draft);
  return {
    hardened,
    value: hardened ? draft.slice(0, -1) : draft,
  };
}

function setAdvancedPathValue(
  input: KeyDerivationAdvancedInput,
  field: AdvancedPathField,
  value: AdvancedPathValue,
): KeyDerivationAdvancedInput {
  const draft = advancedPathValue(value);
  switch (field) {
    case 'purpose':
      return { ...input, purpose: draft };
    case 'network':
      return { ...input, coinType: draft };
    case 'account':
      return { ...input, account: draft };
    case 'branch':
      return { ...input, branchStart: draft };
    case 'address':
      return { ...input, addressStart: draft };
  }
}

function setAdvancedRangeValue(
  input: KeyDerivationAdvancedInput,
  field: AdvancedRangeField,
  value: string,
): KeyDerivationAdvancedInput {
  return field === 'branch'
    ? { ...input, branchRange: value }
    : { ...input, addressRange: value };
}

function restoredAdvancedPathDraft(
  draft: string,
  field: AdvancedPathField,
  scriptType: KeyStationScriptType,
): string | undefined {
  const sanitized = sanitizeAdvancedPathDraft(draft);
  if (sanitized !== '' && sanitized !== "'") {
    return undefined;
  }
  if (sanitized === "'") {
    return "0'";
  }
  if (field === 'purpose') {
    const purpose = KEY_STATION_SCRIPT_TYPES.find(type => type.id === scriptType)?.purpose ?? 84;
    return `${purpose}'`;
  }
  return field === 'network' || field === 'account' ? "0'" : '0';
}

function advancedCopyBranches(
  state: KeyDerivationAdvancedState,
): readonly KeyDerivationAdvancedCopyBranch[] {
  return state.branchWindow.branches.map(branch => ({
    index: branch.index,
    role:
      branch.role === KeyDerivationBranchRole.Receive
        ? 'receive'
        : branch.role === KeyDerivationBranchRole.Change
          ? 'change'
          : 'custom',
  }));
}

function advancedCopyNetworkKind(
  networkKind: typeof KeyDerivationNetworkKind[keyof typeof KeyDerivationNetworkKind],
): KeyDerivationAdvancedCopyNetworkKind {
  switch (networkKind) {
    case KeyDerivationNetworkKind.Mainnet:
      return 'mainnet';
    case KeyDerivationNetworkKind.Testnet:
      return 'testnet';
    case KeyDerivationNetworkKind.CustomMainnetAddresses:
      return 'custom-mainnet-addresses';
    case KeyDerivationNetworkKind.Invalid:
      return 'invalid';
  }
}

function advancedCopyPathHelpKind(
  pathHelpKind: typeof KeyDerivationPathHelpKind[keyof typeof KeyDerivationPathHelpKind],
): KeyDerivationAdvancedCopyPathHelpKind {
  switch (pathHelpKind) {
    case KeyDerivationPathHelpKind.Exact:
      return 'exact';
    case KeyDerivationPathHelpKind.MultipleBranches:
      return 'multiple-branches';
    case KeyDerivationPathHelpKind.MultipleIndexes:
      return 'multiple-indexes';
    case KeyDerivationPathHelpKind.MultipleBranchesAndIndexes:
      return 'multiple-branches-and-indexes';
    case KeyDerivationPathHelpKind.Invalid:
      return 'invalid';
  }
}

function advancedCopyValidationKind(
  validationKind: typeof KeyDerivationValidationKind[keyof typeof KeyDerivationValidationKind],
): KeyDerivationAdvancedCopyValidationKind {
  switch (validationKind) {
    case KeyDerivationValidationKind.Valid:
      return 'valid';
    case KeyDerivationValidationKind.AccountPrefix:
      return 'account-prefix';
    case KeyDerivationValidationKind.BranchStart:
      return 'branch-start';
    case KeyDerivationValidationKind.BranchRange:
      return 'branch-range';
    case KeyDerivationValidationKind.AddressStart:
      return 'address-start';
    case KeyDerivationValidationKind.AddressRange:
      return 'address-range';
  }
}

function advancedPathValidationHelp(state: KeyDerivationAdvancedState): string | undefined {
  return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.pathValidationHelp(
    advancedCopyValidationKind(state.validationKind),
    state.branchWindow.range.maximum,
    state.addressWindow.range.maximum,
  );
}

function addressEstimateValidationHelp(state: KeyDerivationAdvancedState): string | undefined {
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;

  // EntropyLab's status reads the address window before the branch window
  // and intentionally does not require a valid purpose/coin/account prefix.
  if (!state.addressWindow.start.valid) {
    return advancedCopy.pathValidationHelp(
      'address-start',
      state.branchWindow.range.maximum,
      state.addressWindow.range.maximum,
    );
  }
  if (!state.addressWindow.range.valid) {
    return advancedCopy.pathValidationHelp(
      'address-range',
      state.branchWindow.range.maximum,
      state.addressWindow.range.maximum,
    );
  }
  if (!state.branchWindow.start.valid) {
    return advancedCopy.pathValidationHelp(
      'branch-start',
      state.branchWindow.range.maximum,
      state.addressWindow.range.maximum,
    );
  }
  if (!state.branchWindow.range.valid) {
    return advancedCopy.pathValidationHelp(
      'branch-range',
      state.branchWindow.range.maximum,
      state.addressWindow.range.maximum,
    );
  }
  return undefined;
}

function visiblePathValidationHelp(
  validationKind: typeof KeyDerivationVisiblePathValidationKind[keyof typeof KeyDerivationVisiblePathValidationKind],
  advancedState: KeyDerivationAdvancedState,
): string | undefined {
  switch (validationKind) {
    case KeyDerivationVisiblePathValidationKind.Valid:
      return undefined;
    case KeyDerivationVisiblePathValidationKind.Root:
      return UPSTREAM_TEXT.keys.derivationPathErrors.root;
    case KeyDerivationVisiblePathValidationKind.Index:
      return UPSTREAM_TEXT.keys.derivationPathErrors.index;
    case KeyDerivationVisiblePathValidationKind.MissingComponents:
      return UPSTREAM_TEXT.keys.derivationPathErrors.missingComponents;
    case KeyDerivationVisiblePathValidationKind.MissingAccount:
      return UPSTREAM_TEXT.keys.derivationPathErrors.missingAccount;
    case KeyDerivationVisiblePathValidationKind.BranchStart:
      return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.pathValidationHelp(
        'branch-start',
        advancedState.branchWindow.range.maximum,
        advancedState.addressWindow.range.maximum,
      );
    case KeyDerivationVisiblePathValidationKind.BranchRange:
      return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.pathValidationHelp(
        'branch-range',
        advancedState.branchWindow.range.maximum,
        advancedState.addressWindow.range.maximum,
      );
    case KeyDerivationVisiblePathValidationKind.AddressStart:
      return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.pathValidationHelp(
        'address-start',
        advancedState.branchWindow.range.maximum,
        advancedState.addressWindow.range.maximum,
      );
    case KeyDerivationVisiblePathValidationKind.AddressRange:
      return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.pathValidationHelp(
        'address-range',
        advancedState.branchWindow.range.maximum,
        advancedState.addressWindow.range.maximum,
      );
  }
}

function advancedIndexState(field: AdvancedPathField, state: KeyDerivationAdvancedState) {
  switch (field) {
    case 'purpose':
      return state.purpose;
    case 'network':
      return state.coinType;
    case 'account':
      return state.account;
    case 'branch':
      return state.branchWindow.start;
    case 'address':
      return state.addressWindow.start;
  }
}

function advancedFieldHardened(
  field: AdvancedPathField,
  state: KeyDerivationAdvancedState,
  hardening: KeyStationAdvancedHardening,
): boolean {
  const indexState = advancedIndexState(field, state);
  return indexState.valid ? indexState.hardened : hardening[advancedHardeningField(field)];
}

function advancedFieldHelp(
  field: AdvancedPathField,
  state: KeyDerivationAdvancedState,
  hardened: boolean,
  retainedAddressStartHelp: string,
): string {
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;

  switch (field) {
    case 'purpose':
      return advancedCopy.purposeIndexHelp(hardened);
    case 'network':
      return advancedCopy.coinTypeIndexHelp(
        advancedCopyNetworkKind(state.networkKind),
        hardened,
      );
    case 'account':
      return advancedCopy.accountIndexHelp(hardened);
    case 'branch':
      return advancedCopy.branchStartHelp(hardened);
    case 'address':
      return state.windowsValid
        ? advancedCopy.addressStartHelp(
            advancedCopyBranches(state),
            hardened,
          )
        : retainedAddressStartHelp;
  }
}

function advancedRangeHelp(
  field: AdvancedRangeField,
  state: KeyDerivationAdvancedState,
): string {
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;
  if (!state.windowsValid) {
    return field === 'branch'
      ? advancedCopy.invalidBranchRangeHelp
      : advancedCopy.invalidAddressRangeHelp;
  }

  const branches = advancedCopyBranches(state);
  if (field === 'branch') {
    return advancedCopy.branchRangeHelp(
      branches,
      state.branchWindow.start.hardened,
      state.branchWindow.range.maximum,
    );
  }

  return advancedCopy.addressRangeHelp(
    branches,
    state.addressWindow.range.value,
    state.addressCount,
    state.addressWindow.range.maximum,
  );
}

export function KeyDerivationSettingsView({
  advancedDerivationHardening,
  advancedDerivationInput,
  colors,
  derivationPath,
  onBack,
  onSetAdvancedDerivation,
  onSetDerivationPath,
  onSetScriptType,
  scriptType,
  testIDPrefix,
}: Props) {
  const [advancedEntryOpen, setAdvancedEntryOpen] = useState(false);
  const [addressBenchmarkReady, setAddressBenchmarkReady] = useState(false);
  const advancedState = useMemo(
    () => keyDerivationAdvancedState(advancedDerivationInput),
    [advancedDerivationInput],
  );
  useEffect(() => {
    keyDerivationAddressBenchmarkMilliseconds();
    setAddressBenchmarkReady(true);
  }, []);
  const retainedAddressStartHelp = useRef(
    UPSTREAM_UI_FALLBACK_COPY.keys.advanced.genericAddressStartHelp(
      advancedFieldHardened('address', advancedState, advancedDerivationHardening),
    ),
  );
  if (advancedState.windowsValid) {
    retainedAddressStartHelp.current = UPSTREAM_UI_FALLBACK_COPY.keys.advanced.addressStartHelp(
      advancedCopyBranches(advancedState),
      advancedFieldHardened('address', advancedState, advancedDerivationHardening),
    );
  }
  const lastDerivationPathEditSource = useRef<DerivationPathEditSource>('path');
  const visiblePathState = useMemo(
    () =>
      keyDerivationVisiblePathState({
        addressRange: advancedDerivationInput.addressRange,
        addressStart: advancedDerivationInput.addressStart,
        branchRange: advancedDerivationInput.branchRange,
        branchStart: advancedDerivationInput.branchStart,
        path: derivationPath,
      }),
    [advancedDerivationInput, derivationPath],
  );
  const rangePathHelp = UPSTREAM_UI_FALLBACK_COPY.keys.advanced.derivationPathHelp(
    advancedCopyPathHelpKind(advancedState.pathHelpKind),
  );
  let validationPathHelp: string | undefined;
  if (lastDerivationPathEditSource.current === 'advanced' && !advancedState.valid) {
    validationPathHelp = advancedPathValidationHelp(advancedState);
  } else if (visiblePathState.valid) {
    validationPathHelp = advancedPathValidationHelp(advancedState);
  } else {
    validationPathHelp = visiblePathValidationHelp(
      visiblePathState.validationKind,
      advancedState,
    );
  }
  const derivationPathHelp =
    validationPathHelp ?? rangePathHelp ?? UPSTREAM_TEXT.keys.derivationPathHelp;
  const derivationPathValid = advancedState.valid && visiblePathState.valid;
  const addressEstimateError = addressEstimateValidationHelp(advancedState);
  const addressEstimate =
    addressEstimateError ??
    (addressBenchmarkReady
      ? UPSTREAM_UI_FALLBACK_COPY.keys.advanced.addressEstimate(
          UPSTREAM_UI_FALLBACK_COPY.keys.advanced.formatAddressEstimate(
            keyDerivationAddressEstimateMilliseconds(advancedDerivationInput),
          ),
        )
      : UPSTREAM_TEXT.keys.addressEstimate.measuring);

  function updateAdvancedPath(field: AdvancedPathField, value: AdvancedPathValue) {
    lastDerivationPathEditSource.current = 'advanced';
    onSetAdvancedDerivation(current => ({
      ...current,
      advancedInput: setAdvancedPathValue(current.advancedInput, field, value),
    }));
  }

  function selectScriptType(value: KeyStationScriptType) {
    lastDerivationPathEditSource.current = 'advanced';
    onSetScriptType(value);
  }

  function updateAdvancedHardening(field: AdvancedPathField, hardened: boolean) {
    // Upstream refreshes its basic hardening help before trying to rebuild an
    // address window. If that window is invalid, its generic address note is
    // the one that remains visible.
    retainedAddressStartHelp.current =
      UPSTREAM_UI_FALLBACK_COPY.keys.advanced.genericAddressStartHelp(
        field === 'address'
          ? hardened
          : advancedFieldHardened('address', advancedState, advancedDerivationHardening),
    );
    lastDerivationPathEditSource.current = 'advanced';
    const hardeningField = advancedHardeningField(field);
    onSetAdvancedDerivation(current => {
      // Text and switch events can be batched before this update runs. Read
      // the native state from the current draft so toggling Harden never
      // restores an index from the previous render.
      const currentState = advancedIndexState(
        field,
        keyDerivationAdvancedState(current.advancedInput),
      );
      return {
        advancedHardening: {
          ...current.advancedHardening,
          [hardeningField]: hardened,
        },
        advancedInput: currentState.valid
          ? setAdvancedPathValue(current.advancedInput, field, {
              hardened,
              value: String(currentState.value),
            })
          : current.advancedInput,
      };
    });
  }

  function restoreAdvancedPath(field: AdvancedPathField) {
    const restored = restoredAdvancedPathDraft(
      advancedPathDraft(advancedDerivationInput, field),
      field,
      scriptType,
    );
    if (restored === undefined) {
      return;
    }
    updateAdvancedPath(field, advancedPathValueFromDraft(restored));
  }

  function renderAdvancedField({
    field,
    label,
    testID,
  }: (typeof ADVANCED_PATH_FIELDS)[number]) {
    const currentState = advancedIndexState(field, advancedState);
    const hardened = advancedFieldHardened(
      field,
      advancedState,
      advancedDerivationHardening,
    );
    const help = advancedFieldHelp(
      field,
      advancedState,
      hardened,
      retainedAddressStartHelp.current,
    );
    return (
      <View key={`path-${field}`} style={styles.advancedSetting}>
        <Text style={[styles.advancedLabel, { color: colors.muted }]}>{label}</Text>
        <View style={styles.advancedControl}>
          <TextInput
            accessibilityLabel={label}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            onChangeText={value => {
              updateAdvancedPath(
                field,
                advancedPathValueFromDraft(sanitizeAdvancedPathDraft(value)),
              );
            }}
            onBlur={() => restoreAdvancedPath(field)}
            selectTextOnFocus
            selectionColor={colors.accent}
            spellCheck={false}
            style={[
              styles.advancedInput,
              styles.advancedIndexInput,
              {
                backgroundColor: colors.surface,
                borderColor: currentState.valid ? colors.border : colors.error,
                color: colors.text,
              },
              !currentState.valid && styles.invalidAdvancedInput,
            ]}
            aria-invalid={!currentState.valid}
            testID={`${testIDPrefix}-advanced-${testID}`}
            value={advancedPathDraft(advancedDerivationInput, field)}
          />
          <View style={styles.hardenControl}>
            <Switch
              accessibilityLabel={`${label} ${UPSTREAM_TEXT.keys.harden}`}
              onValueChange={hardened => updateAdvancedHardening(field, hardened)}
              testID={`${testIDPrefix}-advanced-${testID}-harden`}
              trackColor={{ false: colors.border, true: colors.accent }}
              value={hardened}
            />
            <Text style={[styles.hardenLabel, { color: colors.muted }]}>
              {UPSTREAM_TEXT.keys.harden}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.advancedFieldNote, { color: colors.muted }]}
          testID={`${testIDPrefix}-advanced-${testID}-help`}
        >
          {help}
        </Text>
      </View>
    );
  }

  function renderAdvancedRange(
    field: AdvancedRangeField,
    label: string,
    testID: string,
  ) {
    const rangeState =
      field === 'branch' ? advancedState.branchWindow.range : advancedState.addressWindow.range;
    const help = advancedRangeHelp(field, advancedState);
    return (
      <View key={`range-${field}`} style={styles.advancedSetting}>
        <Text style={[styles.advancedLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          onChangeText={value => {
            const digits = value.replace(/[^0-9]/g, '');
            lastDerivationPathEditSource.current = 'advanced';
            onSetAdvancedDerivation(current => ({
              ...current,
              advancedInput: setAdvancedRangeValue(current.advancedInput, field, digits),
            }));
          }}
          selectTextOnFocus
          selectionColor={colors.accent}
          style={[
            styles.advancedInput,
            {
              backgroundColor: colors.surface,
              borderColor: rangeState.valid ? colors.border : colors.error,
              color: colors.text,
            },
            !rangeState.valid && styles.invalidAdvancedInput,
          ]}
          aria-invalid={!rangeState.valid}
          testID={`${testIDPrefix}-advanced-${testID}`}
          value={rangeState.displayValue}
        />
        <Text
          style={[styles.advancedFieldNote, { color: colors.muted }]}
          testID={`${testIDPrefix}-advanced-${testID}-help`}
        >
          {help}
        </Text>
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        style={styles.scrollView}
        testID={`${testIDPrefix}-key-settings-scroll`}
      >
        <View style={styles.scriptTypeSetting}>
          <NativeSelect
            accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
            controlTestID={`${testIDPrefix}-script-type-picker`}
            colors={colors}
            onValueChange={selectScriptType}
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
            onChangeText={value => {
              lastDerivationPathEditSource.current = 'path';
              onSetDerivationPath(value);
            }}
            selectionColor={colors.accent}
            spellCheck={false}
            style={[
              styles.pathInput,
              {
                backgroundColor: colors.surface,
                borderColor: derivationPathValid ? colors.border : colors.error,
                color: colors.text,
              },
              !derivationPathValid && styles.invalidPathInput,
            ]}
            aria-invalid={!derivationPathValid}
            testID={`${testIDPrefix}-derivation-path`}
            textContentType="none"
            value={derivationPath}
          />
          <Text
            style={[styles.fieldNote, { color: derivationPathValid ? colors.muted : colors.error }]}
            testID={`${testIDPrefix}-derivation-path-help`}
          >
            {derivationPathHelp}
          </Text>
        </View>
        <View style={[styles.advancedEntry, { borderTopColor: colors.border }]}>
          <Pressable
            accessibilityLabel={UPSTREAM_TEXT.keys.advancedEntry}
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedEntryOpen }}
            onPress={() => setAdvancedEntryOpen(open => !open)}
            style={styles.advancedSummary}
            testID={`${testIDPrefix}-advanced-entry`}
          >
            <View style={styles.advancedSummaryContent}>
              <Text
                accessibilityElementsHidden
                style={[styles.advancedDisclosure, { color: advancedEntryOpen ? colors.text : colors.muted }]}
                testID={`${testIDPrefix}-advanced-entry-indicator`}
              >
                {advancedEntryOpen ? '▼' : '▶'}
              </Text>
              <Text
                style={[
                  styles.advancedSummaryText,
                  { color: advancedEntryOpen ? colors.text : colors.muted },
                ]}
              >
                {UPSTREAM_TEXT.keys.advancedEntry}
              </Text>
            </View>
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
                {renderAdvancedRange(
                  'address',
                  UPSTREAM_TEXT.keys.addressRange,
                  'address-range',
                )}
              </View>
            </View>
          ) : null}
        </View>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.derivationEstimate, { color: colors.muted }]}
          testID={`${testIDPrefix}-advanced-address-estimate`}
        >
          {addressEstimate}
        </Text>
      </ScrollView>
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
  advancedFieldNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
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
    fontFamily: 'monospace',
    fontSize: 15,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  advancedIndexInput: {
    flex: 1,
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
  advancedSummaryContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  advancedDisclosure: {
    fontSize: 16,
    lineHeight: 20,
  },
  advancedSummaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  advancedLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  derivationEstimate: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
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
    minHeight: 44,
    paddingHorizontal: 16,
  },
  invalidPathInput: {
    borderWidth: 2,
  },
  invalidAdvancedInput: {
    borderWidth: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
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
  scrollView: {
    flex: 1,
  },
  setting: {
    marginTop: 10,
  },
  scriptTypeSetting: {
    marginTop: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
});
