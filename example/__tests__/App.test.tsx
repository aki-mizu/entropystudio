/**
 * @format
 */

import { StyleSheet } from 'react-native';

import {
  activeMethodList,
  appTabBar,
  App,
  KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
  KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
  KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
  mockAccountAddressCheck,
  mockCardTranscriptToEntropy,
  mockAccountPrivateMaterial,
  mockDiceRollsToEntropy,
  mockEntropyToMnemonic,
  mockKeyDerivationAddressBenchmarkMilliseconds,
  mockKeyDerivationAddressEstimateMilliseconds,
  mockKeyDerivationAdvancedState,
  mockKeyDerivationProjectAdvancedPath,
  mockKeyDerivationVisiblePathState,
  mockLifehashFromFingerprint,
  mockMnemonicToMasterFingerprint,
  React,
  ReactTestRenderer,
  ScrollView,
  openDiceEntry,
  openCardsEntry,
  selectDiceMethod,
  selectEntropyTool,
  selectSeedPhraseLength,
  mockSynchronizeEntropy,
} from '../test/testSupport';
import {
  EntropySyncSource,
  KeyDerivationBranchRole,
  KeyDerivationNetworkKind,
  KeyDerivationVisiblePathValidationKind,
} from '../src/native/entropyStudio';
import type {
  EntropySyncSnapshot,
  KeyDerivationAdvancedState,
  KeyDerivationPathProjectionState,
  KeyDerivationVisiblePathState,
} from '../src/native/entropyStudio';
import { diceColors } from '../src/features/dice/diceTheme';
import { STUDIO_UI_TEXT } from '../src/features/studioUiCopy';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../src/features/upstreamUiCopy';

const SYNCED_ZERO_ENTROPY_SNAPSHOT: EntropySyncSnapshot = {
  base4: '',
  base8: '',
  base32: '',
  base64: '',
  bin: '',
  bitCount: 128,
  bitboxDice: '',
  d8D16Dice: '',
  directCards: '',
  effectiveEntropyBits: 128,
  entropyBelowMinimum: false,
  entropyStrengthUnknown: false,
  hex: '',
  hexPrivateKey: '',
  minimumEntropyBits: 128,
  seedNumbersOneIndexed: '1 1 1 1 1 1 1 1 1 1 1 4',
  seedNumbersZeroIndexed: '0 0 0 0 0 0 0 0 0 0 0 3',
  seedWords: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  wifPrivateKey: '',
};

function restoreMasterFingerprintFixture() {
  mockMnemonicToMasterFingerprint.mockImplementation((phrase, passphrase) => {
    if (
      phrase !==
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    ) {
      return '';
    }
    return passphrase === 'TREZOR' ? 'b4e3f5ed' : passphrase === '' ? '73c5da0a' : '';
  });
}

function expectStartAction(app: ReactTestRenderer.ReactTestRenderer, testID: string) {
  const button = app.root.findByProps({ testID });
  expect(button.props.accessibilityLabel).toBe(STUDIO_UI_TEXT.actions.start);
  expect(button.props.children.props.children).toBe(STUDIO_UI_TEXT.actions.start);
}

test('opens a native iOS method wheel in a bottom sheet for switching workflows', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  const methodList = activeMethodList(app!);
  const picker = methodList.findByProps({ testID: 'key-method-picker' });

  expect(picker.props.accessibilityRole).toBe('button');
  expect(picker.props.accessibilityValue).toEqual({ text: UPSTREAM_UI_LABELS.keyMode.dice });
  expect(app!.root.findAllByProps({ testID: 'key-method-picker-sheet-title' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    picker.props.onPress();
  });

  expect(picker.props.accessibilityState).toEqual({ disabled: false, expanded: true });
  expect(app!.root.findByProps({ testID: 'key-method-picker-sheet-title' }).props.children).toBe(
    UPSTREAM_TEXT.keys.methodLabel,
  );
  expect(app!.root.findByProps({ testID: 'key-method-picker-wheel' }).props.selectedValue).toBe('dice');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-method-picker-wheel' }).props.onValueChange('cards', 1);
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-method-picker-sheet-close' }).props.onPress();
  });
  expect(activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.accessibilityValue).toEqual({
    text: UPSTREAM_UI_LABELS.keyMode.dice,
  });

  await ReactTestRenderer.act(async () => {
    activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-method-picker-wheel' }).props.onValueChange('key', 4);
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-method-picker-done' }).props.onPress();
  });

  expect(app!.root.findAllByProps({ testID: 'key-method-picker-sheet-title' })).toHaveLength(0);
  expect(activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.accessibilityValue).toEqual({
    text: UPSTREAM_UI_LABELS.keyMode.key,
  });
  expect(app!.root.findByProps({ testID: 'private-key-setup-view' })).toBeDefined();
});

test('shows Dice, Cards, Number Bases, Seed Phrase, and Private Key workflows on the shared setup screen', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'app-workspace-safe-area' }).props.style).toContainEqual({
    backgroundColor: diceColors(false).background,
  });
  expect(appTabBar(app!).props.tabBarStyle).toEqual({
    backgroundColor: diceColors(false).background,
  });
  expectStartAction(app!, 'open-dice-entry');
  expect(appTabBar(app!).props.navigationState.routes[0].title).toBe(
    UPSTREAM_TEXT.keys.tabLabel,
  );
  expect(appTabBar(app!).props.navigationState.routes[1].title).toBe(
    UPSTREAM_TEXT.vanity.tabLabel,
  );
  expect(appTabBar(app!).props.navigationState.routes[2].title).toBe(
    STUDIO_UI_TEXT.navigation.settings,
  );
  const diceMethodList = activeMethodList(app!);
  expect(diceMethodList.findByProps({ testID: 'key-method-label' }).props.children).toBe(
    UPSTREAM_TEXT.keys.methodLabel,
  );
  expect(diceMethodList).toBeDefined();
  expect(diceMethodList.findByProps({ testID: 'key-method-picker' }).props.accessibilityValue).toEqual({
    text: UPSTREAM_UI_LABELS.keyMode.dice,
  });

  await selectDiceMethod(app!, 'dice-method-coleman');
  await selectEntropyTool(app!, 'cards');
  expect(app!.root.findByProps({ testID: 'cards-screen-title' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'cards-setup-view' })).toBeDefined();
  expectStartAction(app!, 'open-cards-entry');
  expect(app!.root.findAllByProps({ testID: 'cards-entry-view' })).toHaveLength(0);
  expect(activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.accessibilityValue).toEqual({
    text: UPSTREAM_UI_LABELS.keyMode.cards,
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
  });

  await selectEntropyTool(app!, 'hex');
  expectStartAction(app!, 'open-number-bases-entry');

  await selectEntropyTool(app!, 'seed');
  expectStartAction(app!, 'open-seed-phrase-entry');

  await selectEntropyTool(app!, 'key');
  expectStartAction(app!, 'open-private-key-entry');

  await selectEntropyTool(app!, 'dice');

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-method-coleman' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await selectEntropyTool(app!, 'cards');

  expect(app!.root.findByProps({ testID: 'card-method-direct' }).props.accessibilityState).toEqual({
    selected: true,
  });
});

test('opens key derivation settings from Dice and Cards entry screens', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  expect(
    app!.root.findByProps({ testID: 'dice-entry-header-actions' }).props.style,
  ).toMatchObject({
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 4,
  });
  expect(app!.root.findByProps({ testID: 'open-dice-key-settings' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-key-settings-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });

  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-cards-entry' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'cards-entry-header-actions' }).props.style,
  ).toMatchObject({
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 4,
  });
  expect(app!.root.findByProps({ testID: 'open-cards-key-settings' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-cards-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-key-settings-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-cards-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-entry-view' })).toBeDefined();
});

test('opens Advanced entry controls and updates the derivation path', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });

  const keySettingsScroll = app!.root.findByProps({ testID: 'dice-key-settings-scroll' });
  expect(keySettingsScroll.type).toBe(ScrollView);
  expect(keySettingsScroll.props.keyboardShouldPersistTaps).toBe('handled');

  const advancedEntry = app!.root.findByProps({ testID: 'dice-advanced-entry' });
  expect(advancedEntry.props.accessibilityLabel).toBe(UPSTREAM_TEXT.keys.advancedEntry);
  expect(advancedEntry.props.accessibilityState).toEqual({ expanded: false });
  expect(
    advancedEntry.findByProps({ testID: 'dice-advanced-entry-indicator' }).props.children,
  ).toBe('▶');
  expect(app!.root.findAllByProps({ testID: 'dice-advanced-fields' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    advancedEntry.props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.accessibilityState).toEqual({
    expanded: true,
  });
  expect(
    app!.root.findByProps({ testID: 'dice-advanced-entry-indicator' }).props.children,
  ).toBe('▼');
  expect(app!.root.findByProps({ testID: 'dice-advanced-fields' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.value).toBe('1');
  expect(app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.value).toBe('1');
  expect(
    StyleSheet.flatten(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.style),
  ).toMatchObject({ minHeight: 48 });
  expect(
    StyleSheet.flatten(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.style),
  ).not.toHaveProperty('flex');
  expect(
    StyleSheet.flatten(app!.root.findByProps({ testID: 'dice-advanced-branch' }).props.style),
  ).toMatchObject({ flex: 1, minHeight: 48 });
  expect(app!.root.findByProps({ testID: 'dice-advanced-purpose-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.purposeIndexHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-network-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.coinTypeIndexHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-account-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.accountIndexHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-branch-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.startingAddressBranchHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.addressBranchRangeHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-address-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.startingAddressIndexHelp,
  );
  expect(app!.root.findByProps({ testID: 'dice-advanced-address-range-help' }).props.children).toBe(
    UPSTREAM_TEXT.keys.addressRangeHelp,
  );

  const changedPurposeProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/45'/0'/0'",
    visiblePath: "m/45'/0'/0'/0/0",
  };
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(changedPurposeProjection);

  try {
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-purpose' }).props.onChangeText('45');
    });
    expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
      accountPath: "m/84'/0'/0'",
      advanced: {
        account: "0'",
        addressRange: '1',
        addressStart: '0',
        branchRange: '1',
        branchStart: '0',
        coinType: "0'",
        purpose: '45',
      },
    });
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/45'/0'/0'/0/0",
    );
  } finally {
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('accepts upstream hardening-marker drafts and restores an empty Advanced field', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
  });

  const purpose = () => app!.root.findByProps({ testID: 'dice-advanced-purpose' });
  expect(purpose().props.value).toBe("84'");

  await ReactTestRenderer.act(async () => {
    purpose().props.onChangeText('45H');
  });
  expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
    accountPath: "m/84'/0'/0'",
    advanced: {
      account: "0'",
      addressRange: '1',
      addressStart: '0',
      branchRange: '1',
      branchStart: '0',
      coinType: "0'",
      purpose: "45'",
    },
  });
  expect(purpose().props.value).toBe("45'");

  await ReactTestRenderer.act(async () => {
    purpose().props.onChangeText('');
  });
  expect(purpose().props.value).toBe('');
  await ReactTestRenderer.act(async () => {
    purpose().props.onBlur();
  });
  expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
    accountPath: "m/84'/0'/0'",
    advanced: {
      account: "0'",
      addressRange: '1',
      addressStart: '0',
      branchRange: '1',
      branchStart: '0',
      coinType: "0'",
      purpose: "84'",
    },
  });
  expect(purpose().props.value).toBe("84'");
});

test('retains the Harden control while an Advanced index draft is invalid', async () => {
  const invalidNetworkState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    coinType: { hardened: false, valid: false, value: 0 },
    networkKind: 3,
    pathHelpKind: 4,
    valid: false,
    validationKind: 1,
  };
  const invalidNetworkProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: '',
    advancedState: invalidNetworkState,
    displayKind: 3,
    valid: false,
    visiblePath: '',
  };
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;

  mockKeyDerivationAdvancedState.mockImplementation(input =>
    input.coinType === '' ? invalidNetworkState : KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
  );
  mockKeyDerivationProjectAdvancedPath.mockImplementation(({ advanced }) =>
    advanced.coinType === ''
      ? invalidNetworkProjection
      : KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
  );

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });

    const network = () => app!.root.findByProps({ testID: 'dice-advanced-network' });
    const networkHarden = () =>
      app!.root.findByProps({ testID: 'dice-advanced-network-harden' });
    const networkHelp = () => app!.root.findByProps({ testID: 'dice-advanced-network-help' });

    await ReactTestRenderer.act(async () => {
      network().props.onChangeText('');
    });
    expect(network().props.value).toBe('');
    expect(networkHarden().props.value).toBe(true);
    expect(networkHelp().props.children).toBe(advancedCopy.coinTypeIndexHelp('invalid', true));

    await ReactTestRenderer.act(async () => {
      networkHarden().props.onValueChange(false);
    });
    expect(network().props.value).toBe('');
    expect(networkHarden().props.value).toBe(false);
    expect(networkHelp().props.children).toBe(advancedCopy.coinTypeIndexHelp('invalid', false));

    await ReactTestRenderer.act(async () => {
      networkHarden().props.onValueChange(true);
    });
    expect(network().props.value).toBe('');
    expect(networkHarden().props.value).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    expect(network().props.value).toBe('');
    expect(networkHarden().props.value).toBe(true);
    expect(networkHelp().props.children).toBe(advancedCopy.coinTypeIndexHelp('invalid', true));

    await ReactTestRenderer.act(async () => {
      network().props.onBlur();
    });
    expect(network().props.value).toBe("0'");
    expect(networkHarden().props.value).toBe(true);
    expect(networkHelp().props.children).toBe(UPSTREAM_TEXT.keys.coinTypeIndexHelp);
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('renders Testnet, custom-branch, and hardened Advanced-entry copy variants', async () => {
  const changeBranch = [{ index: 1, role: 'change' }] as const;
  const customBranch = [{ index: 2, role: 'custom' }] as const;
  const testnetChangeState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    account: { hardened: false, valid: true, value: 0 },
    addressWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.addressWindow,
      start: { hardened: true, valid: true, value: 0 },
    },
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [{ index: 1, role: KeyDerivationBranchRole.Change }],
      end: 1,
      start: { hardened: true, valid: true, value: 1 },
    },
    coinType: { hardened: false, valid: true, value: 1 },
    networkKind: KeyDerivationNetworkKind.Testnet,
    purpose: { hardened: false, valid: true, value: 84 },
  };
  const customBranchState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.addressWindow,
      start: { hardened: false, valid: true, value: 0 },
    },
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [{ index: 2, role: KeyDerivationBranchRole.Custom }],
      end: 2,
      start: { hardened: false, valid: true, value: 2 },
    },
    coinType: { hardened: true, valid: true, value: 2 },
    networkKind: KeyDerivationNetworkKind.CustomMainnetAddresses,
  };
  const testnetChangeProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: 'm/84/1/0',
    advancedState: testnetChangeState,
    visiblePath: "m/84/1/0/1'/0'",
  };
  const customBranchProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/2'/0'",
    advancedState: customBranchState,
    visiblePath: "m/84'/2'/0'/2/0",
  };
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
  });

  const field = (name: string) => app!.root.findByProps({ testID: `dice-advanced-${name}` });
  const helper = (name: string) =>
    app!.root.findByProps({ testID: `dice-advanced-${name}-help` });
  const harden = (name: string) =>
    app!.root.findByProps({ testID: `dice-advanced-${name}-harden` });

  mockKeyDerivationAdvancedState.mockReturnValue(testnetChangeState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(testnetChangeProjection);

  try {
    await ReactTestRenderer.act(async () => {
      field('purpose').props.onChangeText('84');
      field('network').props.onChangeText('1');
      field('account').props.onChangeText('0');
      field('branch').props.onChangeText("1'");
      field('address').props.onChangeText("0'");
    });

    expect(harden('purpose').props.value).toBe(false);
    expect(harden('network').props.value).toBe(false);
    expect(harden('account').props.value).toBe(false);
    expect(harden('branch').props.value).toBe(true);
    expect(harden('address').props.value).toBe(true);
    expect(helper('purpose').props.children).toBe(advancedCopy.purposeIndexHelp(false));
    expect(helper('network').props.children).toBe(
      advancedCopy.coinTypeIndexHelp('testnet', false),
    );
    expect(helper('account').props.children).toBe(advancedCopy.accountIndexHelp(false));
    expect(helper('branch').props.children).toBe(advancedCopy.branchStartHelp(true));
    expect(helper('branch-range').props.children).toBe(
      advancedCopy.branchRangeHelp(changeBranch, true, 2),
    );
    expect(helper('address').props.children).toBe(
      advancedCopy.addressStartHelp(changeBranch, true),
    );
    expect(helper('address-range').props.children).toBe(
      advancedCopy.addressRangeHelp(changeBranch, 1, 1, 10_000),
    );

    mockKeyDerivationAdvancedState.mockReturnValue(customBranchState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(customBranchProjection);
    await ReactTestRenderer.act(async () => {
      field('purpose').props.onChangeText("84'");
      field('network').props.onChangeText("2'");
      field('account').props.onChangeText("0'");
      field('branch').props.onChangeText('2');
      field('address').props.onChangeText('0');
    });

    expect(harden('purpose').props.value).toBe(true);
    expect(harden('network').props.value).toBe(true);
    expect(harden('account').props.value).toBe(true);
    expect(harden('branch').props.value).toBe(false);
    expect(harden('address').props.value).toBe(false);
    expect(helper('purpose').props.children).toBe(advancedCopy.purposeIndexHelp(true));
    expect(helper('network').props.children).toBe(
      advancedCopy.coinTypeIndexHelp('custom-mainnet-addresses', true),
    );
    expect(helper('account').props.children).toBe(advancedCopy.accountIndexHelp(true));
    expect(helper('branch').props.children).toBe(advancedCopy.branchStartHelp(false));
    expect(helper('branch-range').props.children).toBe(
      advancedCopy.branchRangeHelp(customBranch, false, 2),
    );
    expect(helper('address').props.children).toBe(
      advancedCopy.addressStartHelp(customBranch, false),
    );
    expect(helper('address-range').props.children).toBe(
      advancedCopy.addressRangeHelp(customBranch, 1, 1, 10_000),
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('renders the upstream address-estimate variants from native timing', async () => {
  const estimateMilliseconds = 1_250;
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;
  mockKeyDerivationAddressBenchmarkMilliseconds.mockClear();
  mockKeyDerivationAddressEstimateMilliseconds.mockReturnValue(estimateMilliseconds);

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });

    expect(mockKeyDerivationAddressBenchmarkMilliseconds).toHaveBeenCalled();
    expect(mockKeyDerivationAddressEstimateMilliseconds).toHaveBeenLastCalledWith({
      account: "0'",
      addressRange: '1',
      addressStart: '0',
      branchRange: '1',
      branchStart: '0',
      coinType: "0'",
      purpose: "84'",
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-estimate' }).props.children).toBe(
      advancedCopy.addressEstimate(advancedCopy.formatAddressEstimate(estimateMilliseconds)),
    );
    expect(advancedCopy.formatAddressEstimate(Number.NaN)).toBe(
      UPSTREAM_TEXT.keys.addressEstimate.underPointOneSeconds,
    );
    expect(advancedCopy.formatAddressEstimate(10_000)).toBe(
      formatCopy(UPSTREAM_TEXT.keys.addressEstimate.aboutSeconds, { n: 10 }),
    );
    expect(advancedCopy.formatAddressEstimate(60_000)).toBe(
      formatCopy(UPSTREAM_TEXT.keys.addressEstimate.aboutMinutes, { n: 1 }),
    );
  } finally {
    mockKeyDerivationAddressBenchmarkMilliseconds.mockImplementation(() => 0.01);
    mockKeyDerivationAddressEstimateMilliseconds.mockImplementation(() => 0.04);
  }
});

test('gives an Advanced range error precedence over an invalid direct path', async () => {
  const invalidBranchRangeState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 0,
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [],
      end: 0,
      range: { displayValue: '0', maximum: 2, valid: false, value: 0 },
      valid: false,
    },
    pathHelpKind: 4,
    valid: false,
    validationKind: 3,
    windowsValid: false,
  };
  const invalidProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: '',
    advancedState: invalidBranchRangeState,
    displayKind: 3,
    valid: false,
    visiblePath: '',
  };
  const invalidVisiblePath: KeyDerivationVisiblePathState = {
    ...KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
    valid: false,
    validationKind: KeyDerivationVisiblePathValidationKind.Root,
  };
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });

    mockKeyDerivationVisiblePathState.mockReturnValue(invalidVisiblePath);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-derivation-path' }).props.onChangeText('not-a-path');
    });
    mockKeyDerivationAdvancedState.mockReturnValue(invalidBranchRangeState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(invalidProjection);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('0');
    });

    expect(app!.root.findByProps({ testID: 'dice-derivation-path-help' }).props.children).toBe(
      advancedCopy.pathValidationHelp('branch-range', 2, 10_000),
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
    mockKeyDerivationVisiblePathState.mockImplementation(
      () => KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
    );
  }
});

test('renders receive-and-change Advanced-entry variants from native state', async () => {
  const receiveAndChangeState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 10,
    addressWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.addressWindow,
      end: 4,
      range: { displayValue: '5', maximum: 10_000, valid: true, value: 5 },
    },
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [
        { index: 0, role: 0 },
        { index: 1, role: 1 },
      ],
      end: 1,
      range: { displayValue: '2', maximum: 2, valid: true, value: 2 },
    },
    pathHelpKind: 3,
  };
  const receiveAndChangeProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/0'/0'",
    advancedState: receiveAndChangeState,
    displayKind: 0,
    visiblePath: "m/84'/0'/0'",
  };
  const advancedCopy = UPSTREAM_UI_FALLBACK_COPY.keys.advanced;
  mockKeyDerivationAdvancedState.mockReturnValue(receiveAndChangeState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(receiveAndChangeProjection);

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('2');
      app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.onChangeText('5');
    });

    expect(mockKeyDerivationAdvancedState).toHaveBeenLastCalledWith({
      account: "0'",
      addressRange: '5',
      addressStart: '0',
      branchRange: '2',
      branchStart: '0',
      coinType: "0'",
      purpose: "84'",
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.value).toBe('2');
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.value).toBe('5');
    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.addressBranchRangeReceiveAndChangeHelp,
    );
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.startingAddressIndexReceiveAndChangeHelp,
    );
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-range-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.addressRangeReceiveAndChangeHelp,
    );
    expect(app!.root.findByProps({ testID: 'dice-derivation-path-help' }).props.children).toBe(
      advancedCopy.derivationPathHelp('multiple-branches-and-indexes'),
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('retains the last valid address-start helper while either range draft is invalid', async () => {
  const receiveAndChangeState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 10,
    addressWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.addressWindow,
      end: 4,
      range: { displayValue: '5', maximum: 10_000, valid: true, value: 5 },
    },
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [
        { index: 0, role: 0 },
        { index: 1, role: 1 },
      ],
      end: 1,
      range: { displayValue: '2', maximum: 2, valid: true, value: 2 },
    },
    pathHelpKind: 3,
  };
  const invalidBranchRangeState: KeyDerivationAdvancedState = {
    ...receiveAndChangeState,
    addressCount: 0,
    branchWindow: {
      ...receiveAndChangeState.branchWindow,
      branches: [],
      end: 0,
      range: { displayValue: '0', maximum: 2, valid: false, value: 0 },
      valid: false,
    },
    pathHelpKind: 4,
    valid: false,
    validationKind: 3,
    windowsValid: false,
  };
  const invalidAddressRangeState: KeyDerivationAdvancedState = {
    ...receiveAndChangeState,
    addressCount: 0,
    addressWindow: {
      ...receiveAndChangeState.addressWindow,
      end: 0,
      range: { displayValue: '0', maximum: 10_000, valid: false, value: 0 },
      valid: false,
    },
    pathHelpKind: 4,
    valid: false,
    validationKind: 5,
    windowsValid: false,
  };
  const receiveAndChangeProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/0'/0'",
    advancedState: receiveAndChangeState,
    displayKind: 0,
    visiblePath: "m/84'/0'/0'",
  };
  const invalidBranchProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: '',
    advancedState: invalidBranchRangeState,
    displayKind: 3,
    valid: false,
    visiblePath: '',
  };
  const invalidAddressProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: '',
    advancedState: invalidAddressRangeState,
    displayKind: 3,
    valid: false,
    visiblePath: '',
  };

  mockKeyDerivationAdvancedState.mockReturnValue(receiveAndChangeState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(receiveAndChangeProjection);

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.startingAddressIndexReceiveAndChangeHelp,
    );

    mockKeyDerivationAdvancedState.mockReturnValue(invalidBranchRangeState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(invalidBranchProjection);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('0');
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.startingAddressIndexReceiveAndChangeHelp,
    );

    mockKeyDerivationAdvancedState.mockReturnValue(receiveAndChangeState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(receiveAndChangeProjection);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('2');
    });
    mockKeyDerivationAdvancedState.mockReturnValue(invalidAddressRangeState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(invalidAddressProjection);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.onChangeText('0');
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-help' }).props.children).toBe(
      UPSTREAM_TEXT.keys.startingAddressIndexReceiveAndChangeHelp,
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('uses the account-level visible derivation path for a two-branch range', async () => {
  const twoBranchState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 2,
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [
        { index: 0, role: 0 },
        { index: 1, role: 1 },
      ],
      end: 1,
      range: { displayValue: '2', maximum: 2, valid: true, value: 2 },
    },
    pathHelpKind: 1,
  };
  const twoBranchProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/0'/0'",
    advancedState: twoBranchState,
    displayKind: 0,
    visiblePath: "m/84'/0'/0'",
  };

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
  });

  mockKeyDerivationAdvancedState.mockReturnValue(twoBranchState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(twoBranchProjection);

  try {
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('2');
    });

    expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
      accountPath: "m/84'/0'/0'",
      advanced: {
        account: "0'",
        addressRange: '1',
        addressStart: '0',
        branchRange: '2',
        branchStart: '0',
        coinType: "0'",
        purpose: "84'",
      },
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.value).toBe('2');
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/84'/0'/0'",
    );
    expect(mockKeyDerivationVisiblePathState).toHaveBeenLastCalledWith({
      addressRange: '1',
      addressStart: '0',
      branchRange: '2',
      branchStart: '0',
      path: "m/84'/0'/0'",
    });
    expect(app!.root.findByProps({ testID: 'dice-derivation-path-help' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.keys.advanced.derivationPathHelp('multiple-branches'),
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('uses the branch-level visible derivation path for a two-address range', async () => {
  const twoAddressState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 2,
    addressWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.addressWindow,
      end: 1,
      range: { displayValue: '2', maximum: 10_000, valid: true, value: 2 },
    },
    pathHelpKind: 2,
  };
  const twoAddressProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/0'/0'",
    advancedState: twoAddressState,
    displayKind: 1,
    visiblePath: "m/84'/0'/0'/0",
  };

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
  });

  mockKeyDerivationAdvancedState.mockReturnValue(twoAddressState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(twoAddressProjection);

  try {
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.onChangeText('2');
    });

    expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
      accountPath: "m/84'/0'/0'",
      advanced: {
        account: "0'",
        addressRange: '2',
        addressStart: '0',
        branchRange: '1',
        branchStart: '0',
        coinType: "0'",
        purpose: "84'",
      },
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-address-range' }).props.value).toBe('2');
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/84'/0'/0'/0",
    );
    expect(app!.root.findByProps({ testID: 'dice-derivation-path-help' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.keys.advanced.derivationPathHelp('multiple-indexes'),
    );
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
  }
});

test('keeps an Advanced range while reopening settings and editing its Key Station tab', async () => {
  const twoBranchState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 2,
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [
        { index: 0, role: 0 },
        { index: 1, role: 1 },
      ],
      end: 1,
      range: { displayValue: '2', maximum: 2, valid: true, value: 2 },
    },
    pathHelpKind: 1,
  };
  const twoBranchProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: "m/84'/0'/0'",
    advancedState: twoBranchState,
    displayKind: 0,
    visiblePath: "m/84'/0'/0'",
  };
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  mockKeyDerivationAdvancedState.mockReturnValue(twoBranchState);
  mockKeyDerivationProjectAdvancedPath.mockReturnValue(twoBranchProjection);
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('2');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.value).toBe('2');
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/84'/0'/0'",
    );
    expect(mockKeyDerivationVisiblePathState).toHaveBeenLastCalledWith({
      addressRange: '1',
      addressStart: '0',
      branchRange: '2',
      branchStart: '0',
      path: "m/84'/0'/0'",
    });

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
    });
    expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'key-station-path-value' }).props.children).toBe(
      "m/84'/0'/0'",
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-rolls-view' })).toBeDefined();
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.value).toBe('2');
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/84'/0'/0'",
    );
    expect(mockKeyDerivationVisiblePathState).toHaveBeenLastCalledWith({
      addressRange: '1',
      addressStart: '0',
      branchRange: '2',
      branchStart: '0',
      path: "m/84'/0'/0'",
    });
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
    mockDiceRollsToEntropy.mockReset();
    mockEntropyToMnemonic.mockReset();
  }
});

test('blocks derivation when an invalid Advanced range is left in Key Settings', async () => {
  const invalidBranchRangeState: KeyDerivationAdvancedState = {
    ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    addressCount: 0,
    branchWindow: {
      ...KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE.branchWindow,
      branches: [],
      range: { displayValue: '0', maximum: 2, valid: false, value: 0 },
      valid: false,
    },
    pathHelpKind: 4,
    valid: false,
    validationKind: 3,
    windowsValid: false,
  };
  const invalidProjection: KeyDerivationPathProjectionState = {
    ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    accountPath: '',
    advancedState: invalidBranchRangeState,
    displayKind: 3,
    valid: false,
    visiblePath: '',
  };
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
    });
    expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-entry' }).props.onPress();
    });
    mockKeyDerivationAdvancedState.mockReturnValue(invalidBranchRangeState);
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(invalidProjection);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props.onChangeText('0');
    });

    expect(app!.root.findByProps({ testID: 'dice-advanced-branch-range' }).props['aria-invalid']).toBe(
      true,
    );
    expect(mockKeyDerivationProjectAdvancedPath).toHaveBeenLastCalledWith({
      accountPath: "m/84'/0'/0'",
      advanced: {
        account: "0'",
        addressRange: '1',
        addressStart: '0',
        branchRange: '0',
        branchStart: '0',
        coinType: "0'",
        purpose: "84'",
      },
    });
    expect(app!.root.findByProps({ testID: 'dice-derivation-path' }).props.value).toBe(
      "m/84'/0'/0'/0/0",
    );
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(true);
  } finally {
    mockKeyDerivationAdvancedState.mockImplementation(
      () => KEY_DERIVATION_ADVANCED_DEFAULT_FIXTURE,
    );
    mockKeyDerivationProjectAdvancedPath.mockImplementation(
      () => KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
    mockDiceRollsToEntropy.mockReset();
    mockEntropyToMnemonic.mockReset();
  }
});

test('Edit input returns to the originating Dice input screen', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-tab-1' })).toBeDefined();
  expect(app!.root.findAllByProps({ testID: 'key-station-tab-2' })).toHaveLength(0);
});

test('editing inputs keeps the original tab when the derived fingerprint changes', async () => {
  const entropy = new Uint8Array(16).buffer;
  const originalMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const replacementMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(originalMnemonic);
  mockMnemonicToMasterFingerprint.mockImplementation(phrase =>
    phrase === originalMnemonic ? '73c5da0a' : phrase === replacementMnemonic ? 'b4e3f5ed' : '',
  );

  try {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await openDiceEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
      app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
    });

    mockEntropyToMnemonic.mockReturnValue(replacementMnemonic);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('6');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'key-station-tab-1-label' }).props.children).toBe(
      '73c5da0a',
    );
    expect(app!.root.findByProps({ testID: 'key-station-tab-2-label' }).props.children).toBe(
      'b4e3f5ed',
    );
  } finally {
    restoreMasterFingerprintFixture();
    mockEntropyToMnemonic.mockReset();
  }
});

test('Edit input follows the selected tab method', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const cardsMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockCardTranscriptToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);
  mockMnemonicToMasterFingerprint.mockImplementation(phrase =>
    phrase === mnemonic ? '73c5da0a' : phrase === cardsMnemonic ? 'b4e3f5ed' : '',
  );

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });

  await selectEntropyTool(app!, 'cards');
  await openCardsEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-transcript-input' }).props.onChangeText('4H 3H');
  });
  mockEntropyToMnemonic.mockReturnValue(cardsMnemonic);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-card-phrase' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-2' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-entry-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('4h 3h');
  restoreMasterFingerprintFixture();
});

test('Edit input restores the selected Dice tab input', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const secondMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);
  mockMnemonicToMasterFingerprint.mockImplementation(phrase =>
    phrase === mnemonic ? '73c5da0a' : phrase === secondMnemonic ? 'b4e3f5ed' : '',
  );

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('6');
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('6');
  expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);
  mockEntropyToMnemonic.mockReturnValue(secondMnemonic);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-2' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('6');
  restoreMasterFingerprintFixture();
});

test('keeps native workflow trees mounted while changing methods', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  const diceScreen = app!.root.findByProps({ testID: 'dice-screen-safe-area' });
  const cardsScreen = app!.root.findByProps({ testID: 'cards-screen-safe-area' });
  const privateKeyScreen = app!.root.findByProps({ testID: 'private-key-screen-safe-area' });
  expect(diceScreen.props.pointerEvents).toBe('auto');
  expect(cardsScreen.props.pointerEvents).toBe('none');
  expect(cardsScreen.props.style).toContainEqual({ display: 'none' });
  expect(privateKeyScreen.props.pointerEvents).toBe('none');
  expect(privateKeyScreen.props.style).toContainEqual({ display: 'none' });

  await selectEntropyTool(app!, 'cards');

  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'none',
  );
  expect(
    app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.style,
  ).toContainEqual({ display: 'none' });
  expect(app!.root.findByProps({ testID: 'cards-screen-safe-area' }).props.pointerEvents).toBe(
    'auto',
  );

  await selectEntropyTool(app!, 'dice');

  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'auto',
  );
  expect(app!.root.findByProps({ testID: 'cards-screen-safe-area' }).props.pointerEvents).toBe(
    'none',
  );
});

test('keeps derived keys in removable Key Station tabs', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);
    mockLifehashFromFingerprint.mockReturnValue('data:image/png;base64,lifehash');

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.children.props.children).toBe(
    UPSTREAM_TEXT.keys.station,
  );
  expect(app!.root.findByProps({ testID: 'key-station-add' }).props.accessibilityLabel).toBe(
    UPSTREAM_TEXT.keys.add,
  );
  expect(app!.root.findByProps({ testID: 'key-station-delete' }).props.disabled).toBe(true);

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'key-station-tab-1-label' }).props.children).toBe('73c5da0a');
  expect(app!.root.findByProps({ testID: 'key-station-tab-1-lifehash' }).props.source).toEqual({
    uri: 'data:image/png;base64,lifehash',
  });
  expect(app!.root.findByProps({ testID: 'key-station-master-fingerprint-value' }).props.children).toBe(
    '73c5da0a',
  );
  expect(app!.root.findByProps({ testID: 'key-station-method-value' }).props.children).toBe(
    UPSTREAM_UI_LABELS.keyMode.dice,
  );
  expect(app!.root.findByProps({ testID: 'key-station-script-value' }).props.children).toBe(
    UPSTREAM_TEXT.keys.scriptTypes.bip84,
  );
  expect(app!.root.findByProps({ testID: 'key-station-path-value' }).props.children).toBe(
    "m/84'/0'/0'/0/0",
  );
  expect(app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.accessibilityLabel).toBe(
    UPSTREAM_TEXT.keys.editInput,
  );
  const scriptTypeButton = app!.root.findByProps({ testID: 'open-key-station-script-type' });
  expect(scriptTypeButton.props.accessibilityLabel).toBe(UPSTREAM_TEXT.keys.scriptType);
  await ReactTestRenderer.act(async () => {
    scriptTypeButton.props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-script-type-screen' })).toBeDefined();
  const scriptTypePicker = app!.root.findByProps({ testID: 'key-station-script-type-picker' });
  expect(scriptTypePicker.props.accessibilityValue).toEqual({
    text: UPSTREAM_TEXT.keys.scriptTypes.bip84,
  });
  await ReactTestRenderer.act(async () => {
    scriptTypePicker.props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'key-station-script-type-picker-wheel' })
      .props.onValueChange('bip86', 3);
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-script-type-picker-done' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-script-type-kicker' }).props.children).toBe(
    UPSTREAM_UI_FALLBACK_COPY.keys.scriptTypeKicker("84'", 'mainnet'),
  );
  expect(app!.root.findByProps({ testID: 'key-station-script-type-description' }).props.children).toBe(
    UPSTREAM_UI_LABELS.scriptBeginner.bip86,
  );
  const privateAccountMaterial = app!.root.findByProps({ testID: 'toggle-private-account-material' });
  expect(privateAccountMaterial.props.accessibilityState).toEqual({ expanded: false });
  await ReactTestRenderer.act(async () => {
    privateAccountMaterial.props.onPress();
  });
  expect(mockAccountPrivateMaterial).toHaveBeenCalledWith(
    expect.any(String),
    '',
    "m/84'/0'/0'",
    '73c5da0a',
    3,
    [0],
    0,
    1,
    false,
    false,
  );
  expect(app!.root.findByProps({ testID: 'private-account-material' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'toggle-watch-only-account-data' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'watch-only-cannot-spend-warning' }).props.children,
  ).toEqual([
    expect.objectContaining({ props: expect.objectContaining({ children: UPSTREAM_TEXT.result.watchOnlyAccountWarningLead }) }),
    ' ',
    UPSTREAM_TEXT.result.watchOnlyAccountWarningTail,
  ]);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-watch-only-descriptor-qr-popup' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'watch-only-descriptor-qr-code' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'watch-only-descriptor-qr-code' }).props.accessibilityLabel).toBe(
    UPSTREAM_UI_FALLBACK_COPY.result.watchOnlyWalletDescriptor,
  );
  const branchDescriptors = app!.root.findByProps({
    testID: 'toggle-watch-only-branch-descriptors',
  });
  expect(branchDescriptors.props.accessibilityState).toEqual({ expanded: false });
  await ReactTestRenderer.act(async () => {
    branchDescriptors.props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'toggle-watch-only-branch-descriptors' }).props.accessibilityState,
  ).toEqual({ expanded: true });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-watch-only-descriptor-qr-popup' }).props.onPress();
    app!.root.findByProps({ testID: 'toggle-addresses' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'open-first-watch-only-address-popup' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'check-an-address-input' }).props.onChangeText('bitcoin:1PXNDrQ1LGeGDeyJHSjrF4kBrkqCEtmMX1?amount=1');
  });
  expect(mockAccountAddressCheck).toHaveBeenCalledWith(
    expect.any(String),
    '',
    "m/84'/0'/0'",
    3,
    [0],
    0,
    1,
    false,
    false,
    'bitcoin:1PXNDrQ1LGeGDeyJHSjrF4kBrkqCEtmMX1?amount=1',
  );
  expect(app!.root.findByProps({ testID: 'check-an-address-status' }).props.children).toBe(
    UPSTREAM_UI_FALLBACK_COPY.result.addressCheckMatch(
      UPSTREAM_TEXT.keys.branchLabels.receive,
      0,
      "m/84'/0'/0'/0/0",
      false,
      1,
    ),
  );
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-first-watch-only-address-popup' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'first-watch-only-address-qr-code' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-key-station-script-type' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-script-value' }).props.children).toBe(
    UPSTREAM_TEXT.keys.scriptTypes.bip84,
  );
  expect(
    app!.root.findByProps({ testID: 'key-station-master-fingerprint-lifehash' }).props.source,
  ).toEqual({ uri: 'data:image/png;base64,lifehash' });
  mockLifehashFromFingerprint.mockReset();
  mockLifehashFromFingerprint.mockReturnValue('');
  expect(app!.root.findByProps({ testID: 'key-station-tab-1' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(app!.root.findByProps({ testID: 'key-station-delete' }).props.disabled).toBe(false);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-add' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  // A second derivation of the same seed reuses the matching-fingerprint tab.
  expect(app!.root.findAllByProps({ testID: 'key-station-tab-2' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-delete' }).props.onPress();
  });

  expect(app!.root.findAllByProps({ testID: 'key-station-tab-1' })).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.accessibilityState).toEqual({
    selected: true,
  });
});

test('keeps every method setup view fixed', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  for (const [tool, setupView] of [
    ['dice', 'dice-setup-view'],
    ['cards', 'cards-setup-view'],
    ['hex', 'number-bases-setup-view'],
    ['seed', 'seed-phrase-setup-view'],
    ['key', 'private-key-setup-view'],
  ] as const) {
    await selectEntropyTool(app!, tool);
    expect(app!.root.findByProps({ testID: setupView }).findAllByType(ScrollView)).toHaveLength(0);
  }

  await selectEntropyTool(app!, 'hex');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base32' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'number-bases-setup-view' }).findAllByType(ScrollView),
  ).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'number-bases-setup-view' }).findAllByType(ScrollView),
  ).toHaveLength(0);
});

test('syncs entropy across methods through the native snapshot', async () => {
  mockSynchronizeEntropy.mockReset();
  mockSynchronizeEntropy.mockReturnValue(SYNCED_ZERO_ENTROPY_SNAPSHOT);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'hex');
  await selectSeedPhraseLength(app!, 12);
  await ReactTestRenderer.act(async () => {
    appTabBar(app!).props.onIndexChange(2);
  });
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'entropy-sync-settings-toggle' })
      .props.onValueChange(true);
  });

  expect(mockSynchronizeEntropy).toHaveBeenLastCalledWith(
    '',
    EntropySyncSource.NumberBaseBin,
    12,
    false,
    '',
  );
  expect(
    app!.root.findByProps({ testID: 'entropy-sync-settings-status' }).props.children,
  ).toBe(UPSTREAM_TEXT.sync.status);
  expect(app!.root.findAllByProps({ testID: 'entropy-sync-settings-caution' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    appTabBar(app!).props.onIndexChange(0);
  });

  expect(
    app!.root.findByProps({ testID: 'number-base-format-requirement' }).props.children,
  ).toBe(
    formatCopy(UPSTREAM_TEXT.numberBases.requirement, {
      digits: 128,
      unit: 'binary digits',
      words: 12,
    }),
  );

  await selectEntropyTool(app!, 'seed');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe(
    SYNCED_ZERO_ENTROPY_SNAPSHOT.seedWords,
  );
});
