import { mnemonicToMasterFingerprint, mnemonicToMasterXprv } from '../../native/entropyStudio';
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
export const DEFAULT_KEY_STATION_DERIVATION_PATH = "m/84'/0'/0'/0/0";

export type KeyStationDerivationPathState = {
  readonly message: string;
  readonly valid: boolean;
};

export function keyStationDerivationPathState(path: string): KeyStationDerivationPathState {
  const normalizedPath = path.trim();
  if (!/^m(?:\/[^/]+)*$/.test(normalizedPath)) {
    return { message: UPSTREAM_TEXT.keys.derivationPathErrors.root, valid: false };
  }

  const components = normalizedPath === '' || normalizedPath === 'm' ? [] : normalizedPath.slice(2).split('/');
  for (const component of components) {
    const match = /^(\d+)([hH']?)$/.exec(component);
    const index = Number(match?.[1]);
    if (!match || !Number.isSafeInteger(index) || index < 0 || index > 2147483647) {
      return { message: UPSTREAM_TEXT.keys.derivationPathErrors.index, valid: false };
    }
  }

  if (components.length < 5) {
    return {
      message: UPSTREAM_TEXT.keys.derivationPathErrors.missingComponents,
      valid: false,
    };
  }

  return { message: UPSTREAM_TEXT.keys.derivationPathHelp, valid: true };
}

export function keyStationDerivationPathForScriptType(
  scriptType: KeyStationScriptType,
  currentPath: string,
): string {
  const definition = KEY_STATION_SCRIPT_TYPES.find(({ id }) => id === scriptType);
  const normalizedPath = currentPath.trim();
  if (!/^m(?:\/\d+[hH']?){3,}$/.test(normalizedPath)) {
    return `m/${definition?.purpose ?? 84}'/0'/0'/0/0`;
  }

  const components = normalizedPath.slice(2).split('/');
  return `m/${definition?.purpose ?? 84}'/${components.slice(1).join('/')}`;
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
};

export function createKeyStationTab(
  derivation: KeyStationDerivation,
  id: number,
  number: number,
  settings: {
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
    scriptType: settings.scriptType ?? DEFAULT_KEY_STATION_SCRIPT_TYPE,
    derivationPath: settings.derivationPath ?? DEFAULT_KEY_STATION_DERIVATION_PATH,
  };
}