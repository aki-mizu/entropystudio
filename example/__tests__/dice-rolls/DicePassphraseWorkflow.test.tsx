/**
 * @format
 */

import {
  App,
  mockDiceRollsToEntropy,
  mockEntropyToMnemonic,
  mockMnemonicToSeed,
  openDiceEntry,
  React,
  ReactTestRenderer,
} from '../../test/testSupport';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe('Dice Rolls / BIP39 passphrase', () => {
  test('opens a visible optional BIP39 passphrase screen separately from deriving', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockDiceRollsToEntropy.mockReturnValue(new Uint8Array(16).buffer);
    mockEntropyToMnemonic.mockReturnValue(mnemonic);
    mockMnemonicToSeed.mockClear();
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await openDiceEntry(app!);

    const passphraseButton = app!.root.findByProps({ testID: 'open-dice-passphrase' });
    expect(
      app!.root.findByProps({ accessibilityLabel: UPSTREAM_TEXT.passphrase.label }),
    ).toBeDefined();

    await ReactTestRenderer.act(async () => {
      passphraseButton.props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-passphrase-view' })).toBeDefined();
    expect(
      app!.root.findAllByProps({ testID: 'derive-dice-phrase-with-passphrase' }),
    ).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.placeholder).toBe(
      UPSTREAM_TEXT.passphrase.placeholder,
    );
    expect(
      app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.showSoftInputOnFocus,
    ).toBe(false);
    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.multiline).toBe(true);
    expect(
      app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.scrollEnabled,
    ).toBe(true);
    expect(app!.root.findByProps({ testID: 'bip39-passphrase-keypad' })).toBeDefined();

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'bip39-passphrase-key-a' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.value).toBe('a');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'bip39-passphrase-undo' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.value).toBe('');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'bip39-passphrase-keypad-mode' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'bip39-passphrase-key-A' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.value).toBe('A');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.onChangeText('TREZOR');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-passphrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-passphrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-passphrase-input' }).props.value).toBe('TREZOR');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-dice-passphrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });

    expect(mockMnemonicToSeed).toHaveBeenLastCalledWith(mnemonic, 'TREZOR');
    expect(app!.root.findByProps({ testID: 'master-seed-label' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex,
    );
    expect(app!.root.findByProps({ testID: 'master-seed-output' }).props.children).toBe(
      '0'.repeat(128),
    );
  });
});