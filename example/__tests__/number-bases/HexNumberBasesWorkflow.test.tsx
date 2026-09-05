/**
 * @format
 */

import {
  activeMethodList,
  App,
  mockEntropyToMnemonic,
  React,
  ReactTestRenderer,
  ScrollView,
  selectEntropyTool,
  selectSeedPhraseLength,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

describe('Number Bases / Hexadecimal', () => {
  test('derives entropy through the native BIP39 binding', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockEntropyToMnemonic.mockReturnValue(mnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');

    expect(app!.root.findByProps({ testID: 'number-bases-setup-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-bases-screen-title' }).props.children).toBe(
      UPSTREAM_TEXT.mode.hex,
    );
    expect(
      activeMethodList(app!).findByProps({ testID: 'key-method-hex' }).props.accessibilityState,
    ).toEqual({ selected: true });

    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'number-bases-setup-view' })
        .findByProps({ testID: 'number-base-format-hex' }).props.onPress();
    });
    await selectSeedPhraseLength(app!, 12);
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'number-bases-setup-view' })
        .findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-bases-entry-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.placeholder).toBe(
      UPSTREAM_TEXT.hex.placeholder
        .replace('{digits}', '32')
        .replace('{unit}', UPSTREAM_TEXT.hex.unit.hex),
    );
    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(
      app!
        .root.findByProps({ testID: 'number-bases-entry-view' })
        .findAllByType(ScrollView),
    ).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'derive-number-base-phrase' }).props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-A' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('0A');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-undo' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('0');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-input' }).props.onChangeText('0'.repeat(32));
    });

    expect(app!.root.findByProps({ testID: 'derive-number-base-phrase' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-words-word-1' }).props.children).toBe(
      'abandon',
    );
    expect(app!.root.findByProps({ testID: 'number-base-words-word-12' }).props.children).toBe(
      'about',
    );
    expect(mockEntropyToMnemonic).toHaveBeenLastCalledWith(expect.any(ArrayBuffer));
  });

  test('opens an optional BIP39 passphrase screen from number-base seed input', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    const passphraseButton = app!.root.findByProps({ testID: 'open-number-bases-passphrase' });
    expect(
      app!.root.findByProps({ accessibilityLabel: UPSTREAM_TEXT.passphrase.label }),
    ).toBeDefined();

    await ReactTestRenderer.act(async () => {
      passphraseButton.props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-bases-passphrase-view' })).toBeDefined();
    expect(app!.root.findAllByProps({ testID: 'derive-number-base-phrase' })).toHaveLength(0);
    expect(
      app!.root.findByProps({ testID: 'number-bases-passphrase-input' }).props.placeholder,
    ).toBe(UPSTREAM_TEXT.passphrase.placeholder);

    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'number-bases-passphrase-input' })
        .props.onChangeText('TREZOR');
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-number-bases-passphrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-number-bases-passphrase' }).props.onPress();
    });

    expect(
      app!.root.findByProps({ testID: 'number-bases-passphrase-input' }).props.value,
    ).toBe('TREZOR');
  });
});