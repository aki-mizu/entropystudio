/**
 * @format
 */

import {
  activeMethodList,
  App,
  KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
  KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
  mockEntropyToMnemonic,
  mockKeyDerivationProjectAdvancedPath,
  mockKeyDerivationVisiblePathState,
  mockLifehashFromFingerprint,
  mockMnemonicToEntropy,
  mockMnemonicToMasterFingerprint,
  mockSeedQrData,
  mockMnemonicToSeed,
  React,
  ReactTestRenderer,
  selectAppTab,
  selectEntropyTool,
  selectSeedPhraseLength,
} from '../../test/testSupport';
import { KeyDerivationVisiblePathValidationKind } from '../../src/native/entropyStudio';
import type {
  KeyDerivationPathProjectionState,
  KeyDerivationVisiblePathState,
} from '../../src/native/entropyStudio';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../../src/features/upstreamUiCopy';
import { SeedPhraseScreen } from '../../src/screens/SeedPhraseScreen';

const ROOT_DERIVATION_PATH_FIXTURE: KeyDerivationVisiblePathState = {
  ...KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
  accountComponents: [],
  accountPath: '',
  address: undefined,
  branch: undefined,
  displayKind: 3,
  valid: false,
  validationKind: KeyDerivationVisiblePathValidationKind.Root,
  visiblePath: '',
};

const MISSING_COMPONENTS_DERIVATION_PATH_FIXTURE: KeyDerivationVisiblePathState =
  {
    ...ROOT_DERIVATION_PATH_FIXTURE,
    validationKind: KeyDerivationVisiblePathValidationKind.MissingComponents,
  };

const INDEX_DERIVATION_PATH_FIXTURE: KeyDerivationVisiblePathState = {
  ...ROOT_DERIVATION_PATH_FIXTURE,
  validationKind: KeyDerivationVisiblePathValidationKind.Index,
};

const BIP44_DERIVATION_PATH_FIXTURE: KeyDerivationVisiblePathState = {
  ...KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
  accountComponents: [
    { hardened: true, index: 44 },
    { hardened: true, index: 1 },
    { hardened: true, index: 2 },
  ],
  accountPath: "m/44'/1'/2'",
  address: { hardened: false, index: 7 },
  branch: { hardened: false, index: 0 },
  visiblePath: "m/44'/1'/2'/0/7",
};

const BIP84_DERIVATION_PATH_FIXTURE: KeyDerivationVisiblePathState = {
  ...BIP44_DERIVATION_PATH_FIXTURE,
  accountComponents: [
    { hardened: true, index: 84 },
    { hardened: true, index: 1 },
    { hardened: true, index: 2 },
  ],
  accountPath: "m/84'/1'/2'",
  visiblePath: "m/84'/1'/2'/0/7",
};

const BIP44_PATH_PROJECTION_FIXTURE: KeyDerivationPathProjectionState = {
  ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
  accountPath: "m/44'/1'/2'",
  visiblePath: "m/44'/1'/2'/0/7",
};

const BIP86_PATH_PROJECTION_FIXTURE: KeyDerivationPathProjectionState = {
  ...KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
  accountPath: "m/86'/1'/2'",
  visiblePath: "m/86'/1'/2'/0/7",
};

describe('Seed Phrase / Words', () => {
  afterEach(() => {
    mockLifehashFromFingerprint.mockReset();
    mockLifehashFromFingerprint.mockReturnValue('');
    mockKeyDerivationProjectAdvancedPath.mockReset();
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(
      KEY_DERIVATION_PATH_PROJECTION_DEFAULT_FIXTURE,
    );
    mockKeyDerivationVisiblePathState.mockReset();
    mockKeyDerivationVisiblePathState.mockReturnValue(
      KEY_DERIVATION_VISIBLE_PATH_DEFAULT_FIXTURE,
    );
  });

  test('validates a typed Seed Phrase through the native BIP39 binding', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const entropy = new Uint8Array(16).buffer;
    mockMnemonicToMasterFingerprint.mockClear();
    mockMnemonicToSeed.mockClear();
    mockMnemonicToEntropy.mockImplementation(phrase => {
      if (phrase !== mnemonic) {
        throw new Error('Invalid mnemonic');
      }
      return entropy;
    });

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'seed');

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props
        .children,
    ).toBe(formatCopy(UPSTREAM_TEXT.seed.requirementWords, { words: 24 }));

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-setup-view' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-screen-title' }).props
        .children,
    ).toBe(UPSTREAM_TEXT.mode.seed);
    expect(
      activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props
        .accessibilityValue,
    ).toEqual({
      text: UPSTREAM_UI_LABELS.keyMode.seed,
    });

    await selectSeedPhraseLength(app!, 12);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props
        .children,
    ).toBe(formatCopy(UPSTREAM_TEXT.seed.requirementWords, { words: 12 }));
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' })
        .props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-entry-view' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'open-seed-phrase-key-settings-label' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.keys.scriptTypes.bip84);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-seed-phrase-key-settings' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-settings-view' }),
    ).toBeDefined();
    const scriptTypePicker = app!.root.findByProps({
      testID: 'seed-phrase-script-type-picker',
    });
    expect(scriptTypePicker.props.accessibilityLabel).toBe(
      UPSTREAM_TEXT.keys.scriptType,
    );
    expect(scriptTypePicker.props.accessibilityRole).toBe('button');
    expect(scriptTypePicker.props.accessibilityValue).toEqual({
      text: UPSTREAM_TEXT.keys.scriptTypes.bip84,
    });
    await ReactTestRenderer.act(async () => {
      scriptTypePicker.props.onPress();
    });
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-script-type-picker-sheet-title',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.keys.scriptType);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-script-type-picker-wheel' })
        .props.selectedValue,
    ).toBe('bip84');
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-wheel' })
        .props.onValueChange('bip86', 3);
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-sheet-close' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-script-type-picker' }).props
        .accessibilityValue,
    ).toEqual({ text: UPSTREAM_TEXT.keys.scriptTypes.bip84 });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path' }).props
        .value,
    ).toBe("m/84'/0'/0'/0/0");
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path-help' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.keys.derivationPathHelp);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path' }).props[
        'aria-invalid'
      ],
    ).toBe(false);
    mockKeyDerivationVisiblePathState.mockReturnValue(
      ROOT_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText('not-a-path');
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path-help' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.keys.derivationPathErrors.root);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path' }).props[
        'aria-invalid'
      ],
    ).toBe(true);
    mockKeyDerivationVisiblePathState.mockReturnValue(
      MISSING_COMPONENTS_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText("m/84'/0'");
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path-help' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.keys.derivationPathErrors.missingComponents);
    mockKeyDerivationVisiblePathState.mockReturnValue(
      INDEX_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText("m/84'/0'/999999999999999999999/0/0");
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path-help' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.keys.derivationPathErrors.index);
    mockKeyDerivationVisiblePathState.mockReturnValue(
      BIP44_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText("m/44'/1'/2'/0/7");
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker' })
        .props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-wheel' })
        .props.onValueChange('bip86', 3);
    });
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(
      BIP86_PATH_PROJECTION_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-done' })
        .props.onPress();
    });
    mockKeyDerivationVisiblePathState.mockReturnValue(
      BIP84_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText("m/84'/1'/2'/0/7");
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker' })
        .props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-wheel' })
        .props.onValueChange('bip44', 0);
    });
    mockKeyDerivationProjectAdvancedPath.mockReturnValue(
      BIP44_PATH_PROJECTION_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-script-type-picker-done' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-derivation-path' }).props
        .value,
    ).toBe("m/44'/1'/2'/0/7");
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'close-seed-phrase-key-settings' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-entry-view' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-master-fingerprint-label' })
        .props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.master);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-base-label',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.baseSeed);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-label',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.withPassphrase);
    expect(
      app!.root.findAllByProps({
        testID: 'seed-phrase-master-fingerprint-base-value',
      }),
    ).toHaveLength(0);
    expect(
      app!.root.findAllByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-value',
      }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-base-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props
        .showSoftInputOnFocus,
    ).toBe(false);
    expect(
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled,
    ).toBe(true);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-status' }).props.children,
    ).toBe('0 of 12 BIP39 words entered · 12 remaining');

    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-input' })
        .props.onChangeText(mnemonic);
    });

    expect(
      app!.root.findAllByProps({ testID: 'seed-phrase-words' }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-status' }).props.children,
    ).toBe('12 of 12 BIP39 words entered · checksum valid · ready to derive');
    expect(
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled,
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-seed-phrase-key-settings' })
        .props.onPress();
    });
    mockKeyDerivationVisiblePathState.mockReturnValue(
      ROOT_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText('not-a-path');
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'close-seed-phrase-key-settings' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled,
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-seed-phrase-key-settings' })
        .props.onPress();
    });
    mockKeyDerivationVisiblePathState.mockReturnValue(
      BIP44_DERIVATION_PATH_FIXTURE,
    );
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-derivation-path' })
        .props.onChangeText("m/44'/1'/2'/0/7");
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'close-seed-phrase-key-settings' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled,
    ).toBe(false);
    expect(mockMnemonicToEntropy).toHaveBeenLastCalledWith(mnemonic);
    expect(mockMnemonicToMasterFingerprint).toHaveBeenLastCalledWith(
      mnemonic,
      '',
    );
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-base-value',
      }).props.children,
    ).toBe('73c5da0a');
    expect(
      app!.root.findAllByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-value',
      }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-base-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: false });
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: true });

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'key-station-tab-1' }).props
        .accessibilityState,
    ).toEqual({
      selected: true,
    });
    expect(
      app!.root.findByProps({ testID: 'key-station-tab-1-label' }).props
        .children,
    ).toBe('73c5da0a');
    expect(
      app!.root.findByProps({ testID: 'key-station-result-screen' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'key-station-master-fingerprint-value' })
        .props.children,
    ).toBe('73c5da0a');
    expect(
      app!.root.findByProps({ testID: 'key-station-script-value' }).props
        .children,
    ).toBe(UPSTREAM_TEXT.keys.scriptTypes.bip44);
    expect(
      app!.root.findByProps({ testID: 'key-station-path-value' }).props
        .children,
    ).toBe("m/44'/1'/2'/0/7");
    expect(
      app!.root.findAllByProps({ testID: 'key-station-seed-words' }),
    ).toHaveLength(0);
    expect(
      app!.root.findAllByProps({ testID: 'seed-phrase-result-sheet' }),
    ).toHaveLength(0);
    expect(
      app!.root.findAllByProps({ testID: 'seed-phrase-passphrase-view' }),
    ).toHaveLength(0);
    expect(mockMnemonicToSeed).toHaveBeenLastCalledWith(mnemonic, '');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-wallet-data' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'toggle-private-recovery-material' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'master-seed-label' }).props.children,
    ).toBe(UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex);
    expect(
      app!.root.findByProps({ testID: 'master-seed-output' }).props.children,
    ).toBe('0'.repeat(128));
    expect(mockSeedQrData).toHaveBeenLastCalledWith(mnemonic);
    expect(
      app!.root.findByProps({ testID: 'toggle-seed-qr' }).props
        .accessibilityState,
    ).toEqual({
      expanded: false,
    });
    expect(
      app!.root.findByProps({ testID: 'seed-qr-indicator' }).props.children,
    ).toBe('▶');
    expect(
      app!.root.findAllByProps({ testID: 'seed-qr-numeric-code' }),
    ).toHaveLength(0);
    expect(
      app!.root.findAllByProps({ testID: 'compact-seed-qr-code' }),
    ).toHaveLength(0);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'toggle-seed-qr' }).props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'toggle-seed-qr' }).props
        .accessibilityState,
    ).toEqual({
      expanded: true,
    });
    expect(
      app!.root.findByProps({ testID: 'seed-qr-indicator' }).props.children,
    ).toBe('▼');
    expect(
      app!.root.findByProps({ testID: 'seed-qr-intro' }).props.children,
    ).toEqual([UPSTREAM_TEXT.result.seedQrScan, '']);
    expect(
      app!.root.findByProps({ testID: 'open-seed-qr-popup' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'open-compact-seed-qr-popup' }),
    ).toBeDefined();
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-seed-qr-popup' }).props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-qr-numeric-digits' }).props
        .children,
    ).toBe(`${'0000'.repeat(11)}0003`);
    expect(
      app!.root.findByProps({ testID: 'seed-qr-numeric-code' }),
    ).toBeDefined();
    expect(
      app!.root.findAllByProps({ testID: 'compact-seed-qr-code' }),
    ).toHaveLength(0);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-seed-qr-popup' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-compact-seed-qr-popup' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'compact-seed-qr-code' }),
    ).toBeDefined();
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-wallet-data' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'key-station-edit-inputs' })
        .props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-entry-view' }),
    ).toBeDefined();
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value,
    ).toBe(mnemonic);
  });

  test('validates and autocompletes Seed Phrase keyboard prefixes', async () => {
    const prefix = Array.from({ length: 11 }, () => 'abandon').join(' ');
    const mnemonic = `${prefix} about`;
    const entropy = new Uint8Array(16).buffer;
    mockEntropyToMnemonic.mockReturnValue(mnemonic);
    mockMnemonicToEntropy.mockImplementation(phrase => {
      if (phrase !== mnemonic) {
        throw new Error('Invalid mnemonic');
      }
      return entropy;
    });

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'seed');
    expect(
      app!.root.findAllByProps({ testID: 'seed-phrase-autocomplete' }),
    ).toHaveLength(0);
    await selectSeedPhraseLength(app!, 12);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' })
        .props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-input' })
        .props.onChangeText('aba');
    });

    expect(
      app!.root.findAllByProps({ testID: 'seed-phrase-autocomplete' }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-n' }).props.disabled,
    ).toBe(false);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-z' }).props.disabled,
    ).toBe(true);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-space' }).props.disabled,
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-key-n' }).props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value,
    ).toBe('abandon ');

    const finalWordPrefix = `${prefix} `;
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-input' })
        .props.onChangeText(finalWordPrefix);
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-input' })
        .props.onSelectionChange({
          nativeEvent: {
            selection: {
              end: finalWordPrefix.length,
              start: finalWordPrefix.length,
            },
          },
        });
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-a' }).props.disabled,
    ).toBe(false);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-key-z' }).props.disabled,
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-key-a' }).props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value,
    ).toBe(`${mnemonic} `);
    expect(
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled,
    ).toBe(false);
  });

  test('uses the Settings preference for BIP39 word autocomplete', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectAppTab(app!, 'settings');
    const autocompleteSetting = app!.root.findByProps({
      testID: 'seed-phrase-autocomplete-setting',
    });
    expect(autocompleteSetting.props.accessibilityLabel).toBe(
      UPSTREAM_UI_FALLBACK_COPY.seedPhrase.autocomplete,
    );
    expect(autocompleteSetting.props.value).toBe(true);
    expect(
      app!.root.findByType(SeedPhraseScreen).props.autocompleteEnabled,
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      autocompleteSetting.props.onValueChange(false);
    });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-autocomplete-setting' })
        .props.value,
    ).toBe(false);
    expect(
      app!.root.findByType(SeedPhraseScreen).props.autocompleteEnabled,
    ).toBe(false);
  });

  test('opens an optional BIP39 passphrase screen separately from deriving a seed result', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const entropy = new Uint8Array(16).buffer;
    mockLifehashFromFingerprint.mockImplementation(
      fingerprint => `data:image/png;base64,${fingerprint}`,
    );
    mockMnemonicToMasterFingerprint.mockClear();
    mockMnemonicToEntropy.mockImplementation(phrase => {
      if (phrase !== mnemonic) {
        throw new Error('Invalid mnemonic');
      }
      return entropy;
    });

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'seed');
    await selectSeedPhraseLength(app!, 12);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-seed-phrase-entry' })
        .props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-input' })
        .props.onChangeText(mnemonic);
    });
    const passphraseButton = app!.root.findByProps({
      testID: 'open-seed-phrase-passphrase',
    });
    expect(
      app!.root.findByProps({
        accessibilityLabel: UPSTREAM_TEXT.passphrase.label,
      }),
    ).toBeDefined();
    await ReactTestRenderer.act(async () => {
      passphraseButton.props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-view' }),
    ).toBeDefined();
    expect(
      app!.root.findAllByProps({
        testID: 'derive-seed-phrase-with-passphrase',
      }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-label',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.master);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-base-label',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.baseSeed);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-base-value',
      }).props.children,
    ).toBe('73c5da0a');
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-base-lifehash',
      }).props.source,
    ).toEqual({ uri: 'data:image/png;base64,73c5da0a' });
    expect(
      app!.root.findAllByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-arrow',
      }),
    ).toHaveLength(0);

    expect(
      app!.root.findByProps({
        testID:
          'seed-phrase-passphrase-view-master-fingerprint-passphrase-label',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.fingerprint.withPassphrase);
    expect(
      app!.root.findAllByProps({
        testID:
          'seed-phrase-passphrase-view-master-fingerprint-passphrase-value',
      }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-base-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: false });
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-passphrase-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props
        .accessibilityLabel,
    ).toBe(UPSTREAM_TEXT.passphrase.label);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props
        .placeholder,
    ).toBe(UPSTREAM_TEXT.passphrase.placeholder);

    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-passphrase-input' })
        .props.onChangeText('TREZOR');
    });
    expect(
      app!.root.findByProps({
        testID:
          'seed-phrase-passphrase-view-master-fingerprint-passphrase-value',
      }).props.children,
    ).toBe('b4e3f5ed');
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-passphrase-row',
      }).props.accessibilityState,
    ).toEqual({ disabled: false });
    expect(
      app!.root.findByProps({
        testID:
          'seed-phrase-passphrase-view-master-fingerprint-passphrase-lifehash',
      }).props.source,
    ).toEqual({ uri: 'data:image/png;base64,b4e3f5ed' });
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-passphrase-view-master-fingerprint-arrow',
      }).props.children,
    ).toBe(UPSTREAM_TEXT.calculations.conversionArrow);
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'close-seed-phrase-passphrase' })
        .props.onPress();
    });
    expect(mockMnemonicToMasterFingerprint).toHaveBeenLastCalledWith(
      mnemonic,
      'TREZOR',
    );
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-base-value',
      }).props.children,
    ).toBe('73c5da0a');
    expect(
      app!.root.findByProps({
        testID: 'seed-phrase-master-fingerprint-passphrase-value',
      }).props.children,
    ).toBe('b4e3f5ed');
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'open-seed-phrase-passphrase' })
        .props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props
        .value,
    ).toBe('TREZOR');
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'close-seed-phrase-passphrase' })
        .props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-wallet-data' }).props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'wallet-data-safety-note-0' }).props
        .children,
    ).toBe(UPSTREAM_TEXT.result.safety.passphrase);
  });

  test('uses EntropyLab alphabetical Seed Phrase keyboard rows', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'seed');
    await ReactTestRenderer.act(async () => {
      app!.root
        .findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' })
        .props.onPress();
    });

    const rowKeys = (row: number) =>
      React.Children.toArray(
        app!.root.findByProps({ testID: `seed-phrase-key-row-${row}` }).props
          .children,
      ).flatMap(key =>
        React.isValidElement<{ testID: string }>(key) ? [key.props.testID] : [],
      );

    expect(rowKeys(1)).toEqual(
      'abcdefghij'.split('').map(character => `seed-phrase-key-${character}`),
    );
    expect(rowKeys(2)).toEqual(
      'klmnopqrs'.split('').map(character => `seed-phrase-key-${character}`),
    );
    expect(rowKeys(3)).toEqual([
      ...'tuvwxyz'.split('').map(character => `seed-phrase-key-${character}`),
      'seed-phrase-undo',
    ]);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-keypad-mode' }).props
        .disabled,
    ).toBe(true);
  });
});
