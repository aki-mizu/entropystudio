/**
 * @format
 */

import { Platform } from 'react-native';

import {
  App,
  appTabBar,
  mockVanityFilterPrefix,
  mockVanityBenchmark,
  mockVanityDefaultWorkerCount,
  mockVanityInputState,
  mockVanityRunClear,
  mockVanityRunConstructor,
  mockVanityRunNew,
  mockVanityRunNextChunk,
  mockVanityRunState,
  mockVanityRunStop,
  React,
  ReactTestRenderer,
  selectAppTab,
  VANITY_BENCHMARK_DEFAULT_FIXTURE,
  VANITY_CHUNK_DEFAULT_FIXTURE,
  VANITY_INPUT_STATE_DEFAULT_FIXTURE,
  VANITY_MATCH_DEFAULT_FIXTURE,
} from '../../test/testSupport';
import {
  VanityMethod,
  VanityScript,
  VanityValidationKind,
} from '../../src/native/entropyStudio';
import type {
  VanityChunk,
  VanityInputState,
  VanityMatch,
} from '../../src/native/entropyStudio';
import { VanityScreen } from '../../src/screens/VanityScreen';
import type { KeyStationTab } from '../../src/features/keyStation/keyStation';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

const SOURCE_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const SOURCE_TAB: KeyStationTab = {
  derivation: {
    entropy: '00000000000000000000000000000000',
    kind: 'bip39',
    masterSeed: '',
    mnemonic: SOURCE_MNEMONIC,
    passphrase: '',
  },
  derivationPath: "m/84'/0'/0'/0/0",
  derivationSettings: {
    accountPath: "m/84'/0'/0'",
    advancedHardening: {
      account: true,
      address: false,
      branch: false,
      coinType: true,
      purpose: true,
    },
    advancedInput: {
      account: "0'",
      addressRange: '1',
      addressStart: '0',
      branchRange: '1',
      branchStart: '0',
      coinType: "0'",
      purpose: "84'",
    },
    visiblePath: "m/84'/0'/0'/0/0",
  },
  id: 7,
  input: {
    kind: 'seed-phrase',
    method: 'words',
    numberInput: '',
    passphrase: '',
    wordCount: 12,
    wordInput: SOURCE_MNEMONIC,
    zeroIndexed: false,
  },
  masterFingerprint: '73c5da0a',
  method: 'seed',
  name: '73c5da0a',
  number: 1,
  resultScriptType: 'bip84',
  rootXprv: '',
  rootXpub: '',
  scriptType: 'bip84',
};

const BRAIN_HD_SOURCE_TAB: KeyStationTab = {
  ...SOURCE_TAB,
  derivation: {
    ...SOURCE_TAB.derivation,
    passphrase: '',
  },
  id: 8,
  input: {
    brainWalletOutput: 'hd',
    brainWalletTrim: false,
    format: 'brain',
    inputValues: {
      brain: 'brain wallet recovery text',
      hex: '',
      mini: '',
      wif: '',
    },
    kind: 'private-key',
  },
  masterFingerprint: 'b4e3f5ed',
  method: 'key',
  name: 'b4e3f5ed',
  number: 2,
};

type ValidationErrorCase = {
  readonly expectedError: string;
  readonly method: 'passphrase' | 'derivation';
  readonly name: string;
  readonly state: Partial<VanityInputState>;
};

const VALIDATION_ERROR_CASES: readonly ValidationErrorCase[] = [
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.mnemonicTooLong(
      1_025,
      1_024,
    ),
    method: 'passphrase',
    name: 'an overlong mnemonic',
    state: {
      maximumMnemonicByteLength: 1_024,
      normalizedMnemonicByteLength: 1_025,
      validationKind: VanityValidationKind.MnemonicTooLong,
    },
  },
  {
    expectedError:
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.startingPassphraseTooLong(
        257,
        256,
      ),
    method: 'passphrase',
    name: 'an overlong starting passphrase',
    state: {
      maximumStartingPassphraseByteLength: 256,
      normalizedStartingPassphraseByteLength: 257,
      validationKind: VanityValidationKind.PassphraseTooLong,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.pathRoot,
    method: 'passphrase',
    name: 'an invalid path root',
    state: { validationKind: VanityValidationKind.PathRoot },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.pathIndex,
    method: 'passphrase',
    name: 'an invalid path index',
    state: { validationKind: VanityValidationKind.PathIndex },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.pathTooDeep(16),
    method: 'passphrase',
    name: 'an overlong path',
    state: {
      maximumPathComponents: 16,
      validationKind: VanityValidationKind.PathTooLong,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.mainnetOnly(
      SOURCE_TAB.masterFingerprint,
      1,
    ),
    method: 'passphrase',
    name: 'a non-mainnet coin type',
    state: {
      coinType: 1,
      validationKind: VanityValidationKind.NonMainnetCoinType,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.passphraseLength(32),
    method: 'passphrase',
    name: 'an invalid passphrase length',
    state: {
      maximumPassphraseLength: 32,
      validationKind: VanityValidationKind.InvalidPassphraseLength,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.wholeNumber(
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterLabels.startCounter,
    ),
    method: 'passphrase',
    name: 'a nonnumeric passphrase start counter',
    state: { validationKind: VanityValidationKind.InvalidStart },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.wholeNumber(
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterLabels.rangeSize,
    ),
    method: 'passphrase',
    name: 'a nonnumeric passphrase range size',
    state: { validationKind: VanityValidationKind.InvalidCount },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterRangeMinimum,
    method: 'passphrase',
    name: 'a zero-sized passphrase range',
    state: { validationKind: VanityValidationKind.PassphraseRangeMinimum },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterStartBeyond(8),
    method: 'passphrase',
    name: 'a passphrase counter beyond its space',
    state: {
      passphraseLength: 8,
      validationKind: VanityValidationKind.PassphraseStartBeyond,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterRangePast(
      8,
      '218340105584896',
    ),
    method: 'passphrase',
    name: 'a passphrase range past its space',
    state: {
      counterLimit: '218340105584896',
      passphraseLength: 8,
      validationKind: VanityValidationKind.PassphraseRangePast,
    },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterRangePast64Bit,
    method: 'passphrase',
    name: 'a passphrase range past the native counter limit',
    state: { validationKind: VanityValidationKind.PassphraseRangePast64Bit },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.wholeNumber(
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterLabels.startAccount,
    ),
    method: 'derivation',
    name: 'a nonnumeric derivation start account',
    state: { validationKind: VanityValidationKind.InvalidStart },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.wholeNumber(
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.counterLabels.accountRange,
    ),
    method: 'derivation',
    name: 'a nonnumeric derivation account range',
    state: { validationKind: VanityValidationKind.InvalidCount },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.accountRangeMinimum,
    method: 'derivation',
    name: 'a zero-sized derivation range',
    state: { validationKind: VanityValidationKind.DerivationRangeMinimum },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.accountStartBeyond,
    method: 'derivation',
    name: 'a derivation start account beyond BIP32',
    state: { validationKind: VanityValidationKind.DerivationStartBeyond },
  },
  {
    expectedError: UPSTREAM_UI_FALLBACK_COPY.vanity.errors.accountRangePast,
    method: 'derivation',
    name: 'a derivation range past BIP32',
    state: { validationKind: VanityValidationKind.DerivationRangePast },
  },
];

function validInputState(overrides: Partial<VanityInputState> = {}): VanityInputState {
  return {
    ...VANITY_INPUT_STATE_DEFAULT_FIXTURE,
    expectedCandidates: '32',
    normalizedPrefix: 'bc1qf',
    valid: true,
    validationKind: VanityValidationKind.Valid,
    ...overrides,
  };
}

function completedChunk(matches: readonly VanityMatch[]): VanityChunk {
  return {
    ...VANITY_CHUNK_DEFAULT_FIXTURE,
    matches: [...matches],
  };
}

function resetVanityFixtures() {
  mockVanityFilterPrefix.mockReset();
  mockVanityFilterPrefix.mockReturnValue('bc1q');
  mockVanityBenchmark.mockReset();
  mockVanityBenchmark.mockReturnValue(VANITY_BENCHMARK_DEFAULT_FIXTURE);
  mockVanityDefaultWorkerCount.mockReset();
  mockVanityDefaultWorkerCount.mockReturnValue(1);
  mockVanityInputState.mockReset();
  mockVanityInputState.mockReturnValue(VANITY_INPUT_STATE_DEFAULT_FIXTURE);
  mockVanityRunState.mockReset();
  mockVanityRunState.mockReturnValue(VANITY_INPUT_STATE_DEFAULT_FIXTURE);
  mockVanityRunNextChunk.mockReset();
  mockVanityRunNextChunk.mockReturnValue(VANITY_CHUNK_DEFAULT_FIXTURE);
  mockVanityRunConstructor.mockClear();
  mockVanityRunNew.mockClear();
  mockVanityRunClear.mockClear();
  mockVanityRunStop.mockClear();
}

async function chooseNativeSelect(
  app: ReactTestRenderer.ReactTestRenderer,
  testID: string,
  value: string,
) {
  if (Platform.OS === 'ios') {
    await ReactTestRenderer.act(async () => {
      app.root.findByProps({ testID }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app.root.findByProps({ testID: `${testID}-wheel` }).props.onValueChange(value, 0);
    });
    await ReactTestRenderer.act(async () => {
      app.root.findByProps({ testID: `${testID}-done` }).props.onPress();
    });
    return;
  }

  await ReactTestRenderer.act(async () => {
    app.root.findByProps({ testID }).props.onValueChange(value, 0);
  });
}

async function selectSource(
  app: ReactTestRenderer.ReactTestRenderer,
  source: KeyStationTab = SOURCE_TAB,
) {
  await ReactTestRenderer.act(async () => {
    app.root.findByProps({ testID: `vanity-source-${source.id}` }).props.onPress();
  });
}

describe(UPSTREAM_TEXT.vanity.tabLabel, () => {
  beforeEach(() => {
    resetVanityFixtures();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('adds a distinct middle root tab and blocks a run until a key is selected', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    expect(appTabBar(app!).props.navigationState.routes[1].title).toBe(
      UPSTREAM_TEXT.vanity.tabLabel,
    );

    await selectAppTab(app!, 'vanity');

    expect(appTabBar(app!).props.navigationState.index).toBe(1);
    expect(app!.root.findByProps({ testID: 'vanity-screen-safe-area' }).props.pointerEvents).toBe(
      'auto',
    );
    expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
      'none',
    );
    expect(app!.root.findByProps({ testID: 'vanity-screen-title' }).props.children).toBe(
      UPSTREAM_TEXT.vanity.intro.title,
    );
    expect(app!.root.findByProps({ testID: 'vanity-prefix' }).props.value).toBe('');
    expect(app!.root.findByProps({ testID: 'vanity-passphrase-length' }).props.value).toBe('8');
    expect(app!.root.findByProps({ testID: 'vanity-start-counter' }).props.value).toBe('0');
    expect(app!.root.findByProps({ testID: 'vanity-range-size' }).props.value).toBe('1000000');
    expect(app!.root.findByProps({ testID: 'vanity-workers' }).props.value).toBe('1');
    expect(app!.root.findByProps({ testID: 'vanity-start' }).props.disabled).toBe(true);
    expect(app!.root.findAllByProps({ testID: 'vanity-source-7' })).toHaveLength(0);
  });

  test('passes the selected Workers value to native and uses its normalized count in the estimate', async () => {
    mockVanityInputState.mockImplementation(input => ({
      ...validInputState({
        expectedCandidates: '34977600',
        normalizedPrefix: 'bc1qf',
      }),
      workers: Number(input.workers) || 1,
    }));

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={() => 'unused'}
          onApplyPassphrase={() => 'unused'}
          tabs={[SOURCE_TAB]}
        />,
      );
    });
    await selectSource(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-workers' }).props.onChangeText('4');
    });

    expect(mockVanityInputState).toHaveBeenLastCalledWith(
      expect.objectContaining({ workers: '4' }),
    );
    expect(app!.root.findByProps({ testID: 'vanity-estimate' }).props.children).toContain(
      'on 4 workers',
    );
  });

  test('uses the native public-fixture benchmark for the pre-run estimate', async () => {
    mockVanityInputState.mockReturnValue(
      validInputState({
        expectedCandidates: '34977600',
        normalizedPrefix: 'bc1qf',
      }),
    );

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={() => 'unused'}
          onApplyPassphrase={() => 'unused'}
          tabs={[SOURCE_TAB]}
        />,
      );
    });
    await selectSource(app!);

    expect(mockVanityBenchmark).toHaveBeenCalledTimes(1);
    expect(app!.root.findByProps({ testID: 'vanity-estimate' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.summary(
        'bc1qf',
        BigInt(34_977_600).toLocaleString('en-US'),
        UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.p2wpkh,
        UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.timing(
          VANITY_BENCHMARK_DEFAULT_FIXTURE.passphraseCandidatesPerSecond.toLocaleString('en-US'),
          false,
          1,
          UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.formatDuration(7_200),
        ),
      ),
    );
  });

  test.each(VALIDATION_ERROR_CASES)(
    'renders matching upstream validation copy for $name',
    async ({ expectedError, method, state }) => {
      const inputState: VanityInputState = {
        ...VANITY_INPUT_STATE_DEFAULT_FIXTURE,
        ...state,
        valid: false,
      };
      mockVanityInputState.mockReturnValue(inputState);

      let app: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        app = ReactTestRenderer.create(
          <VanityScreen
            isActive
            isDarkMode={false}
            onApplyAccount={() => 'unused'}
            onApplyPassphrase={() => 'unused'}
            tabs={[SOURCE_TAB]}
          />,
        );
      });

      await selectSource(app!);
      if (method === 'derivation') {
        await chooseNativeSelect(app!, 'vanity-method', 'derivation');
      }

      expect(mockVanityInputState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method:
            method === 'derivation'
              ? VanityMethod.Derivation
              : VanityMethod.Passphrase,
        }),
      );
      expect(app!.root.findByProps({ testID: 'vanity-error' }).props.children).toBe(
        expectedError,
      );
    },
  );

  test('uses native validation and a bounded passphrase chunk, masks its match, and clears it', async () => {
    const onApplyAccount = jest.fn(
      (_source: KeyStationTab, _accountIndex: number, _accountHardened: boolean) =>
        'unused',
    );
    const onApplyPassphrase = jest.fn(
      (_source: KeyStationTab, _passphrase: string) => 'c55401c7',
    );
    const validState = validInputState();
    const match: VanityMatch = {
      ...VANITY_MATCH_DEFAULT_FIXTURE,
      accountIndex: undefined,
      candidatePassphrase: 'correct horse battery staplea',
      counter: BigInt(0),
    };

    mockVanityFilterPrefix.mockReturnValue('bc1qf');
    mockVanityInputState.mockReturnValue(validState);
    mockVanityRunState.mockReturnValue(validState);
    mockVanityRunNextChunk.mockReturnValue(completedChunk([match]));
    jest.useFakeTimers();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={onApplyAccount}
          onApplyPassphrase={onApplyPassphrase}
          tabs={[SOURCE_TAB]}
        />,
      );
    });

    await selectSource(app!);

    expect(app!.root.findByProps({ testID: 'vanity-source-7' }).props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
    expect(mockVanityInputState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        accountPath: "m/84'/0'/0'",
        addressHardened: false,
        addressIndex: '0',
        branchHardened: false,
        branchIndex: '0',
        count: '1000000',
        method: VanityMethod.Passphrase,
        mnemonic: SOURCE_MNEMONIC,
        passphraseLength: '8',
        prefix: '',
        script: VanityScript.P2wpkh,
        start: '0',
        startingPassphrase: '',
      }),
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-prefix' }).props.onChangeText('BC1QF');
    });

    expect(mockVanityFilterPrefix).toHaveBeenLastCalledWith('BC1QF', VanityScript.P2wpkh);
    expect(app!.root.findByProps({ testID: 'vanity-prefix' }).props.value).toBe('bc1qf');
    expect(app!.root.findByProps({ testID: 'vanity-start' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-start' }).props.onPress();
    });

    expect(mockVanityRunConstructor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: VanityMethod.Passphrase,
        prefix: 'bc1qf',
        script: VanityScript.P2wpkh,
      }),
    );
    expect(app!.root.findByProps({ testID: 'vanity-progress' })).toBeDefined();

    await ReactTestRenderer.act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(mockVanityRunNextChunk).toHaveBeenCalledTimes(1);
    expect(mockVanityRunClear).toHaveBeenCalledTimes(1);
    expect(app!.root.findByProps({ testID: 'vanity-match-0-address' }).props.children).toBe(
      match.address,
    );
    expect(app!.root.findByProps({ testID: 'vanity-match-0-passphrase' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.vanity.result.maskedPassphrase(),
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-reveal-passphrases' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'vanity-match-0-passphrase' }).props.children).toBe(
      match.candidatePassphrase,
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-match-0-apply' }).props.onPress();
    });

    expect(onApplyPassphrase).toHaveBeenCalledWith(
      SOURCE_TAB,
      match.candidatePassphrase,
    );
    expect(onApplyAccount).not.toHaveBeenCalled();
    expect(app!.root.findByProps({ testID: 'vanity-status' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.vanity.status.saved(
        'c55401c7',
        null,
        SOURCE_TAB.masterFingerprint,
      ),
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-clear' }).props.onPress();
    });

    expect(app!.root.findAllByProps({ testID: 'vanity-results' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'vanity-status' }).props.children).toBe(
      UPSTREAM_TEXT.vanity.status.idle,
    );
  });

  test('rejects a completed passphrase match when its source was replaced', async () => {
    const replacementSource: KeyStationTab = {
      ...SOURCE_TAB,
      derivation: {
        ...SOURCE_TAB.derivation,
        passphrase: 'replacement passphrase',
      },
      input: {
        ...SOURCE_TAB.input,
        passphrase: 'replacement passphrase',
      },
      masterFingerprint: 'b4e3f5ed',
      name: 'b4e3f5ed',
    };
    const onApplyAccount = jest.fn(
      (_source: KeyStationTab, _accountIndex: number, _accountHardened: boolean) =>
        'unused',
    );
    const onApplyPassphrase = jest.fn(
      (_source: KeyStationTab, _passphrase: string) => 'unused',
    );
    const validState = validInputState();
    const match: VanityMatch = {
      ...VANITY_MATCH_DEFAULT_FIXTURE,
      accountIndex: undefined,
      candidatePassphrase: 'correct horse battery staplea',
      counter: BigInt(0),
    };

    mockVanityInputState.mockReturnValue(validState);
    mockVanityRunState.mockReturnValue(validState);
    mockVanityRunNextChunk.mockReturnValue(completedChunk([match]));
    jest.useFakeTimers();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={onApplyAccount}
          onApplyPassphrase={onApplyPassphrase}
          tabs={[SOURCE_TAB]}
        />,
      );
    });

    await selectSource(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-start' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      jest.runOnlyPendingTimers();
    });

    await ReactTestRenderer.act(async () => {
      app!.update(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={onApplyAccount}
          onApplyPassphrase={onApplyPassphrase}
          tabs={[replacementSource]}
        />,
      );
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-match-0-apply' }).props.onPress();
    });

    expect(onApplyPassphrase).not.toHaveBeenCalled();
    expect(onApplyAccount).not.toHaveBeenCalled();
    expect(app!.root.findByProps({ testID: 'vanity-error' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.vanity.errors.keyNoLongerInStation(
        SOURCE_TAB.masterFingerprint,
      ),
    );
  });

  test('uses a Brain-wallet HD source for derivation-only vanity matching', async () => {
    const onApplyAccount = jest.fn(
      (_source: KeyStationTab, _accountIndex: number, _accountHardened: boolean) =>
        BRAIN_HD_SOURCE_TAB.masterFingerprint,
    );
    const onApplyPassphrase = jest.fn(
      (_source: KeyStationTab, _passphrase: string) => 'unused',
    );
    const validState = validInputState({ accountHardened: true });
    const match: VanityMatch = {
      ...VANITY_MATCH_DEFAULT_FIXTURE,
      accountIndex: 3,
      candidatePassphrase: '',
      counter: BigInt(3),
      masterFingerprint: BRAIN_HD_SOURCE_TAB.masterFingerprint,
      path: "m/84'/0'/3'/0/0",
    };

    mockVanityInputState.mockReturnValue(validState);
    mockVanityRunState.mockReturnValue(validState);
    mockVanityRunNextChunk.mockReturnValue(completedChunk([match]));
    jest.useFakeTimers();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={onApplyAccount}
          onApplyPassphrase={onApplyPassphrase}
          tabs={[BRAIN_HD_SOURCE_TAB]}
        />,
      );
    });

    expect(
      app!.root.findByProps({ testID: `vanity-source-${BRAIN_HD_SOURCE_TAB.id}` }),
    ).toBeDefined();
    await selectSource(app!, BRAIN_HD_SOURCE_TAB);

    const methodPicker = app!.root.findByProps({ controlTestID: 'vanity-method' });
    expect(methodPicker.props.selectedValue).toBe('derivation');
    expect(methodPicker.props.options).toEqual([
      {
        label: UPSTREAM_TEXT.vanity.form.methodOptions.derivation,
        value: 'derivation',
      },
    ]);
    expect(app!.root.findAllByProps({ testID: 'vanity-passphrase-length' })).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-start' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      jest.runOnlyPendingTimers();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-match-0-apply' }).props.onPress();
    });

    expect(mockVanityRunConstructor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: VanityMethod.Derivation,
        mnemonic: BRAIN_HD_SOURCE_TAB.derivation.mnemonic,
      }),
    );
    expect(onApplyAccount).toHaveBeenCalledWith(BRAIN_HD_SOURCE_TAB, 3, true);
    expect(onApplyPassphrase).not.toHaveBeenCalled();
  });

  test('uses the native derivation mode result to update its account dial', async () => {
    const onApplyAccount = jest.fn(
      (_source: KeyStationTab, _accountIndex: number, _accountHardened: boolean) =>
        SOURCE_TAB.masterFingerprint,
    );
    const onApplyPassphrase = jest.fn(
      (_source: KeyStationTab, _passphrase: string) => 'unused',
    );
    const validState = validInputState({ accountHardened: true });
    const match: VanityMatch = {
      ...VANITY_MATCH_DEFAULT_FIXTURE,
      accountIndex: 3,
      candidatePassphrase: '',
      counter: BigInt(3),
      masterFingerprint: SOURCE_TAB.masterFingerprint,
      path: "m/84'/0'/3'/0/0",
    };

    mockVanityInputState.mockReturnValue(validState);
    mockVanityRunState.mockReturnValue(validState);
    mockVanityRunNextChunk.mockReturnValue(completedChunk([match]));
    jest.useFakeTimers();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <VanityScreen
          isActive
          isDarkMode={false}
          onApplyAccount={onApplyAccount}
          onApplyPassphrase={onApplyPassphrase}
          tabs={[SOURCE_TAB]}
        />,
      );
    });

    await selectSource(app!);
    await chooseNativeSelect(app!, 'vanity-method', 'derivation');

    expect(app!.root.findAllByProps({ testID: 'vanity-passphrase-length' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'vanity-start-account' }).props.value).toBe('0');
    expect(app!.root.findByProps({ testID: 'vanity-accounts-to-try' }).props.value).toBe(
      '100000',
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-start' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      jest.runOnlyPendingTimers();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'vanity-match-0-apply' }).props.onPress();
    });

    expect(mockVanityRunConstructor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        count: '100000',
        method: VanityMethod.Derivation,
        start: '0',
      }),
    );
    expect(onApplyAccount).toHaveBeenCalledWith(SOURCE_TAB, 3, true);
    expect(onApplyPassphrase).not.toHaveBeenCalled();
  });
});
