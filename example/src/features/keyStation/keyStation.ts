import { mnemonicToMasterFingerprint } from '../../native/entropyStudio';
import { formatCopy, UPSTREAM_TEXT } from '../upstreamUiCopy';

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
  readonly name: string;
  readonly number: number;
};

export function createKeyStationTab(
  derivation: KeyStationDerivation,
  id: number,
  number: number,
): KeyStationTab {
  let masterFingerprint = '';

  if (derivation.kind === 'bip39') {
    try {
      masterFingerprint = mnemonicToMasterFingerprint(derivation.mnemonic, derivation.passphrase);
    } catch {
      masterFingerprint = '';
    }
  }

  return {
    derivation,
    id,
    name:
      masterFingerprint || formatCopy(UPSTREAM_TEXT.keys.defaultTab, { n: number }),
    number,
  };
}