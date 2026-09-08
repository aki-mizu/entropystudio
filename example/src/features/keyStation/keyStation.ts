import { mnemonicToMasterFingerprint, mnemonicToMasterXprv } from '../../native/entropyStudio';
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
