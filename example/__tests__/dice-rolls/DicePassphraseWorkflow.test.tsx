/**
 * @format
 */

import {
  App,
  openDiceEntry,
  React,
  ReactTestRenderer,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

describe('Dice Rolls / BIP39 passphrase', () => {
  test('opens a visible optional BIP39 passphrase screen separately from deriving', async () => {
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
  });
});