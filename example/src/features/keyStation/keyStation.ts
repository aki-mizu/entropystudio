import { getHashedCardState, isHashedCardMethod } from '../cards/cards';
import { getHashedDiceState, isHashedDiceMethod } from '../dice/dice';
import { analyzeNumberBaseInput } from '../numberBases/numberBases';
import { privateKeyInputState } from '../privateKey/privateKey';
import {
  bip39EntropyBits,
  mnemonicToMasterFingerprint,
  mnemonicToMasterXprv,
} from '../../native/entropyStudio';
import type { KeyDerivationAdvancedInput } from '../../native/entropyStudio';
import type { CardMethod } from '../cards/cards';
import type { DiceMethod, WordCount } from '../dice/dice';
import type { NumberBaseFormat } from '../numberBases/numberBases';
import type { BrainWalletOutput, PrivateKeyInputFormat } from '../privateKey/privateKey';
import type { SeedPhraseEntryMethod } from '../seedPhrase/components/SeedPhraseKeypad';
import { formatCopy, UPSTREAM_TEXT } from '../upstreamUiCopy';

export const KEY_STATION_SCRIPT_TYPES = [
  { id: 'bip44', purpose: 44 },
  { id: 'bip49', purpose: 49 },
  { id: 'bip84', purpose: 84 },
  { id: 'bip86', purpose: 86 },
] as const;

export type KeyStationScriptType = (typeof KEY_STATION_SCRIPT_TYPES)[number]['id'];
export type KeyStationMethod = 'cards' | 'dice' | 'hex' | 'key' | 'seed';

export type KeyStationInput =
  | {
      readonly kind: 'dice';
      readonly method: DiceMethod;
      readonly passphrase: string;
      readonly rolls: string;
      readonly selectedFinalWord: string;
      readonly wordCount: WordCount;
    }
  | {
      readonly kind: 'cards';
      readonly matchesIanColeman: boolean;
      readonly method: CardMethod;
      readonly passphrase: string;
      readonly transcript: string;
      readonly wordCount: WordCount;
    }
  | {
      readonly kind: 'number-bases';
      readonly format: NumberBaseFormat;
      readonly inputValues: Record<NumberBaseFormat, string>;
      readonly passphrase: string;
      readonly wordCount: WordCount;
    }
  | {
      readonly brainWalletOutput: BrainWalletOutput;
      readonly brainWalletTrim: boolean;
      readonly format: PrivateKeyInputFormat;
      readonly inputValues: Record<PrivateKeyInputFormat, string>;
      readonly kind: 'private-key';
    }
  | {
      readonly kind: 'seed-phrase';
      readonly method: SeedPhraseEntryMethod;
      readonly numberInput: string;
      readonly passphrase: string;
      readonly wordCount: WordCount;
      readonly wordInput: string;
      readonly zeroIndexed: boolean;
    };

export const DEFAULT_KEY_STATION_SCRIPT_TYPE: KeyStationScriptType = 'bip84';

/**
 * The visible BIP32 path and the retained account-level path are separate
 * when an Advanced-entry range selects more than one branch or address.
 * Rust projects and validates this state; the UI only retains its drafts.
 */
export type KeyStationDerivationSettings = {
  readonly accountPath: string;
  readonly advancedInput: KeyDerivationAdvancedInput;
  /**
   * The Harden controls are independent of their editable BIP32 drafts.
   * EntropyLab retains a control's value while its draft is temporarily
   * invalid, then synchronizes it again when the draft becomes valid.
   */
  readonly advancedHardening: KeyStationAdvancedHardening;
  readonly visiblePath: string;
};

export type KeyStationAdvancedHardening = {
  readonly account: boolean;
  readonly address: boolean;
  readonly branch: boolean;
  readonly coinType: boolean;
  readonly purpose: boolean;
};

export type KeyStationAdvancedDerivationState = Pick<
  KeyStationDerivationSettings,
  'advancedHardening' | 'advancedInput'
>;

/**
 * A UI draft/control update applied against the latest Advanced-entry state.
 * This prevents two native text-input events delivered in one render from
 * accidentally restoring an earlier field value or Harden control.
 */
export type KeyStationAdvancedDerivationUpdater = (
  state: KeyStationAdvancedDerivationState,
) => KeyStationAdvancedDerivationState;

export function defaultKeyStationDerivationSettings(
  scriptType: KeyStationScriptType = DEFAULT_KEY_STATION_SCRIPT_TYPE,
): KeyStationDerivationSettings {
  const purpose = KEY_STATION_SCRIPT_TYPES.find(({ id }) => id === scriptType)?.purpose ?? 84;
  const advancedInput: KeyDerivationAdvancedInput = {
    account: "0'",
    addressRange: '1',
    addressStart: '0',
    branchRange: '1',
    branchStart: '0',
    coinType: "0'",
    purpose: `${purpose}'`,
  };
  const advancedHardening: KeyStationAdvancedHardening = {
    account: true,
    address: false,
    branch: false,
    coinType: true,
    purpose: true,
  };
  const accountPath = `m/${advancedInput.purpose}/${advancedInput.coinType}/${advancedInput.account}`;

  return {
    accountPath,
    advancedHardening,
    advancedInput,
    visiblePath: `${accountPath}/${advancedInput.branchStart}/${advancedInput.addressStart}`,
  };
}

export type KeyStationDerivation =
  | {
      readonly kind: 'bip39';
      readonly entropy: string;
      readonly masterSeed: string;
      readonly mnemonic: string;
      readonly passphrase: string;
    }
  | {
      readonly kind: 'private-key';
      readonly entropy: string;
      readonly wifCompressed: string;
      readonly wifUncompressed: string;
    };

export type KeyStationTab = {
  readonly derivation: KeyStationDerivation;
  readonly id: number;
  readonly input: KeyStationInput;
  readonly masterFingerprint: string;
  readonly rootXprv: string;
  readonly method: KeyStationMethod;
  readonly name: string;
  readonly number: number;
  readonly scriptType: KeyStationScriptType;
  readonly derivationPath: string;
  readonly derivationSettings: KeyStationDerivationSettings;
};

export type KeyStationSafetyNote = {
  readonly centeredArrow?: true;
  readonly kind: 'note' | 'warning';
  readonly text: string;
};

export function keyStationSafetyNotes(tab: KeyStationTab): readonly KeyStationSafetyNote[] {
  if (
    tab.derivation.kind === 'bip39' &&
    tab.input.kind === 'private-key' &&
    tab.input.format === 'brain' &&
    tab.input.brainWalletOutput === 'hd'
  ) {
    return [
      { kind: 'warning', text: UPSTREAM_TEXT.result.safety.privateKey.brainHdStrength },
      { kind: 'warning', text: UPSTREAM_TEXT.result.safety.privateKey.brainHdUnsalted },
      { kind: 'warning', text: UPSTREAM_TEXT.result.safety.privateKey.brainHdNotBackup },
      { kind: 'warning', text: UPSTREAM_TEXT.result.safety.privateKey.brainHdMnemonic },
      {
        centeredArrow: true,
        kind: 'note',
        text: tab.input.brainWalletTrim
          ? UPSTREAM_TEXT.result.safety.privateKey.brainHdEntropyTrimmed
          : UPSTREAM_TEXT.result.safety.privateKey.brainHdEntropyExact,
      },
    ];
  }

  const resultWarnings: KeyStationSafetyNote[] =
    tab.derivation.kind === 'bip39' && tab.derivation.passphrase
      ? [{ kind: 'warning', text: UPSTREAM_TEXT.result.safety.passphrase }]
      : [];
  const passphraseInputWarnings: KeyStationSafetyNote[] =
    tab.derivation.kind === 'bip39' && tab.derivation.passphrase
      ? [{ kind: 'warning', text: UPSTREAM_TEXT.result.safety.passphraseInUse }]
      : [];
  const combineSafetyNotes = (
    sourceWarnings: readonly KeyStationSafetyNote[],
    sourceNotes: readonly KeyStationSafetyNote[],
  ): readonly KeyStationSafetyNote[] => [
    ...resultWarnings,
    ...sourceWarnings,
    ...passphraseInputWarnings,
    ...sourceNotes,
  ];

  if (tab.input.kind === 'dice' && isHashedDiceMethod(tab.input.method)) {
    const state = getHashedDiceState(tab.input.rolls, tab.input.wordCount);
    if (!state.hasRolls) {
      return combineSafetyNotes([], []);
    }

    const bits = state.estimatedEntropyBits.toFixed(1);
    const entropyBits = bip39EntropyBits(tab.input.wordCount);
    const sourceWarnings: KeyStationSafetyNote[] = [];
    const sourceNotes: KeyStationSafetyNote[] = [];

    if (state.rollCount < state.recommendedRolls) {
      sourceWarnings.push({
        kind: 'warning',
        text: formatCopy(UPSTREAM_TEXT.result.safety.dice.insufficient, {
          bits,
          have: state.rollCount,
          need: state.recommendedRolls,
          words: tab.input.wordCount,
        }),
      });
    }
    sourceNotes.push({
      kind: 'note',
      text: formatCopy(UPSTREAM_TEXT.result.safety.dice.count, { bits, n: state.rollCount }),
    });
    sourceNotes.push({
      kind: 'note',
      text: formatCopy(
        tab.input.method === 'coldcard'
          ? UPSTREAM_TEXT.result.safety.dice.methodColdcard
          : UPSTREAM_TEXT.result.safety.dice.methodColeman,
        { bits: entropyBits, words: tab.input.wordCount },
      ),
    });
    if (state.rollCount > state.recommendedRolls) {
      sourceNotes.push({
        kind: 'note',
        text: formatCopy(UPSTREAM_TEXT.result.safety.dice.extra, {
          extra: state.rollCount - state.recommendedRolls,
          n: state.rollCount,
        }),
      });
    }
    return combineSafetyNotes(sourceWarnings, sourceNotes);
  }

  if (tab.input.kind === 'cards' && isHashedCardMethod(tab.input.method)) {
    const state = getHashedCardState(tab.input.transcript, tab.input.wordCount);
    if (!state.hasInput) {
      return combineSafetyNotes([], []);
    }

    const bits = state.entropyBits.toFixed(1);
    const entropyBits = bip39EntropyBits(tab.input.wordCount);
    const sourceWarnings: KeyStationSafetyNote[] = [];
    const sourceNotes: KeyStationSafetyNote[] = [];

    if (state.cardCount < state.requiredCards) {
      sourceWarnings.push({
        kind: 'warning',
        text: formatCopy(UPSTREAM_TEXT.result.safety.cards.insufficient, {
          bits,
          have: state.cardCount,
          need: state.requiredCards,
          words: tab.input.wordCount,
        }),
      });
    }
    sourceNotes.push({
      kind: 'note',
      text: formatCopy(
        state.cardCount === 1
          ? UPSTREAM_TEXT.result.safety.cards.countOne
          : UPSTREAM_TEXT.result.safety.cards.countMany,
        { bits, n: state.cardCount },
      ),
    });
    sourceNotes.push({
      kind: 'note',
      text: formatCopy(
        tab.input.matchesIanColeman
          ? UPSTREAM_TEXT.result.safety.cards.methodColeman
          : UPSTREAM_TEXT.result.safety.cards.methodAscii,
        { bits: entropyBits, words: tab.input.wordCount },
      ),
    });
    if (state.cardCount > state.requiredCards) {
      sourceNotes.push({
        kind: 'note',
        text: formatCopy(UPSTREAM_TEXT.result.safety.cards.extra, { n: state.cardCount }),
      });
    }
    return combineSafetyNotes(sourceWarnings, sourceNotes);
  }

  if (tab.input.kind === 'number-bases') {
    const value = tab.input.inputValues[tab.input.format];
    const analysis = analyzeNumberBaseInput(value, tab.input.format, tab.input.wordCount);
    if (!analysis.isReady) {
      return combineSafetyNotes([], []);
    }

    const { config } = analysis;
    const sourceNotes: KeyStationSafetyNote[] = [
      {
        kind: 'note',
        text: formatCopy(UPSTREAM_TEXT.result.safety.numberBases.entropy, {
          bits: config.bits,
          digits: config.digits,
          label: config.shortLabel,
          unit: config.unit,
        }),
      },
    ];

    if (config.remainderBits) {
      const remainderTemplate = config.binaryRemainder
        ? config.remainderBits === 1
          ? UPSTREAM_TEXT.result.safety.numberBases.trailingCoinBit
          : UPSTREAM_TEXT.result.safety.numberBases.trailingCoinBits
        : config.remainderBits === 1
          ? UPSTREAM_TEXT.result.safety.numberBases.mixedRadixOne
          : UPSTREAM_TEXT.result.safety.numberBases.mixedRadixMany;
      sourceNotes.push({
        kind: 'note',
        text: formatCopy(
          remainderTemplate,
          config.binaryRemainder
            ? {
                full: config.fullDigits,
                label: config.shortLabel,
                n: config.remainderBits,
              }
            : {
                chars: Array.from(config.finalCharacters).join(', '),
                n: config.remainderBits,
              },
        ),
      });
    }
    sourceNotes.push({
      centeredArrow: true,
      kind: 'note',
      text: formatCopy(UPSTREAM_TEXT.result.safety.numberBases.finalLength, {
        bits: config.bits,
        words: tab.input.wordCount,
      }),
    });
    return combineSafetyNotes([], sourceNotes);
  }

  if (tab.input.kind === 'private-key') {
    const inputState = privateKeyInputState(
      tab.input.inputValues[tab.input.format],
      tab.input.format,
      tab.input.brainWalletTrim,
    );
    if (!inputState.canDerive) {
      return combineSafetyNotes([], []);
    }

    const sourceWarnings: KeyStationSafetyNote[] = [];
    const sourceNotes: KeyStationSafetyNote[] = [];
    switch (tab.input.format) {
      case 'brain':
        sourceWarnings.push({
          kind: 'warning',
          text: UPSTREAM_TEXT.result.safety.privateKey.brainWarning,
        });
        sourceNotes.push({
          kind: 'note',
          text: tab.input.brainWalletTrim
            ? UPSTREAM_TEXT.result.safety.privateKey.brainRecoveryTrimmed
            : UPSTREAM_TEXT.result.safety.privateKey.brainRecoveryExact,
        });
        break;
      case 'hex':
        sourceNotes.push({ kind: 'note', text: UPSTREAM_TEXT.result.safety.privateKey.hex });
        break;
      case 'mini':
        sourceNotes.push({ kind: 'note', text: UPSTREAM_TEXT.result.safety.privateKey.mini });
        break;
      case 'wif':
        sourceNotes.push({
          kind: 'note',
          text:
            inputState.requiredCount === inputState.maximumCount
              ? UPSTREAM_TEXT.result.safety.privateKey.wifCompressed
              : UPSTREAM_TEXT.result.safety.privateKey.wifUncompressed,
        });
        break;
    }
    return combineSafetyNotes(sourceWarnings, sourceNotes);
  }

  return combineSafetyNotes([], []);
}

export function createKeyStationTab(
  derivation: KeyStationDerivation,
  id: number,
  number: number,
  settings: {
    readonly derivationSettings?: KeyStationDerivationSettings;
    readonly derivationPath?: string;
    readonly input: KeyStationInput;
    readonly method?: KeyStationMethod;
    readonly scriptType?: KeyStationScriptType;
  },
): KeyStationTab {
  let masterFingerprint = '';
  let rootXprv = '';

  if (derivation.kind === 'bip39') {
    try {
      masterFingerprint = mnemonicToMasterFingerprint(derivation.mnemonic, derivation.passphrase);
      rootXprv = mnemonicToMasterXprv(derivation.mnemonic, derivation.passphrase);
    } catch {
      masterFingerprint = '';
      rootXprv = '';
    }
  }

  const scriptType = settings.scriptType ?? DEFAULT_KEY_STATION_SCRIPT_TYPE;
  const defaultDerivationSettings = defaultKeyStationDerivationSettings(scriptType);
  const derivationSettings = settings.derivationSettings ?? {
    ...defaultDerivationSettings,
    visiblePath: settings.derivationPath ?? defaultDerivationSettings.visiblePath,
  };

  return {
    derivation,
    id,
    input: settings.input,
    masterFingerprint,
    rootXprv,
    method: settings.method ?? 'key',
    name:
      masterFingerprint || formatCopy(UPSTREAM_TEXT.keys.defaultTab, { n: number }),
    number,
    scriptType,
    derivationPath: derivationSettings.visiblePath,
    derivationSettings,
  };
}
