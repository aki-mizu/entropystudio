/**
 * @format
 */

import {
  activeMethodList,
  App,
  mockEntropyToMnemonic,
  mockMnemonicToEntropy,
  mockMnemonicToSeed,
  React,
  ReactTestRenderer,
  selectEntropyTool,
  selectSeedPhraseLength,
} from '../../test/testSupport';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe('Seed Phrase / Words', () => {
  test('validates a typed Seed Phrase through the native BIP39 binding', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const entropy = new Uint8Array(16).buffer;
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

    expect(app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.seedPhrase.requirementWords(24),
    );

    expect(app!.root.findByProps({ testID: 'seed-phrase-setup-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'seed-phrase-screen-title' }).props.children).toBe(
      UPSTREAM_TEXT.mode.seed,
    );
    expect(
      activeMethodList(app!).findByProps({ testID: 'key-method-seed' }).props.accessibilityState,
    ).toEqual({ selected: true });

    await selectSeedPhraseLength(app!, 12);
    expect(app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.seedPhrase.requirementWords(12),
    );
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-entry-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'seed-phrase-status' }).props.children).toBe(
      '0 of 12 BIP39 words entered · 12 remaining',
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.onChangeText(mnemonic);
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-words-word-1' }).props.children).toBe(
      'abandon',
    );
    expect(app!.root.findByProps({ testID: 'seed-phrase-words-word-12' }).props.children).toBe(
      'about',
    );
    expect(app!.root.findByProps({ testID: 'seed-phrase-status' }).props.children).toBe(
      '12 of 12 BIP39 words entered · checksum valid · ready to derive',
    );
    expect(app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled).toBe(false);
    expect(mockMnemonicToEntropy).toHaveBeenLastCalledWith(mnemonic);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-result-sheet' }).props.visible).toBe(true);
    expect(app!.root.findAllByProps({ testID: 'seed-phrase-passphrase-view' })).toHaveLength(0);
    expect(mockMnemonicToSeed).toHaveBeenLastCalledWith(mnemonic, '');
    expect(app!.root.findByProps({ testID: 'master-seed-label' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex,
    );
    expect(app!.root.findByProps({ testID: 'master-seed-output' }).props.children).toBe(
      '0'.repeat(128),
    );
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
    expect(app!.root.findAllByProps({ testID: 'seed-phrase-autocomplete' })).toHaveLength(0);
    await selectSeedPhraseLength(app!, 12);
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.onChangeText('aba');
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-autocomplete' }).props.value).toBe(true);
    expect(app!.root.findByProps({ testID: 'seed-phrase-key-n' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'seed-phrase-key-z' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'seed-phrase-key-space' }).props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-key-n' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe('abandon ');

    const finalWordPrefix = `${prefix} `;
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.onChangeText(finalWordPrefix);
    });
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-input' })
        .props.onSelectionChange({
          nativeEvent: {
            selection: { end: finalWordPrefix.length, start: finalWordPrefix.length },
          },
        });
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-key-a' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'seed-phrase-key-z' }).props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-key-a' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe(`${mnemonic} `);
    expect(app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled).toBe(false);
  });

  test('opens an optional BIP39 passphrase screen separately from deriving a seed result', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const entropy = new Uint8Array(16).buffer;
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
      app!
        .root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-phrase-input' }).props.onChangeText(mnemonic);
    });
    const passphraseButton = app!.root.findByProps({ testID: 'open-seed-phrase-passphrase' });
    expect(
      app!.root.findByProps({ accessibilityLabel: UPSTREAM_TEXT.passphrase.label }),
    ).toBeDefined();
    await ReactTestRenderer.act(async () => {
      passphraseButton.props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-passphrase-view' })).toBeDefined();
    expect(
      app!.root.findAllByProps({ testID: 'derive-seed-phrase-with-passphrase' }),
    ).toHaveLength(0);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props.accessibilityLabel,
    ).toBe(UPSTREAM_TEXT.passphrase.label);
    expect(
      app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props.placeholder,
    ).toBe(UPSTREAM_TEXT.passphrase.placeholder);

    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-passphrase-input' })
        .props.onChangeText('TREZOR');
    });
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'close-seed-phrase-passphrase' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-seed-phrase-passphrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-passphrase-input' }).props.value).toBe(
      'TREZOR',
    );
  });

  test('uses EntropyLab alphabetical Seed Phrase keyboard rows', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'seed');
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' })
        .props.onPress();
    });

    const rowKeys = (row: number) =>
      React.Children.toArray(
        app!.root.findByProps({ testID: `seed-phrase-key-row-${row}` }).props.children,
      ).flatMap(key =>
        React.isValidElement<{ testID: string }>(key) ? [key.props.testID] : [],
      );

    expect(rowKeys(1)).toEqual(
      'abcdefghij'.split('').map(character => `seed-phrase-key-${character}`),
    );
    expect(rowKeys(2)).toEqual(
      'klmnopqrs'.split('').map(character => `seed-phrase-key-${character}`),
    );
    expect(rowKeys(3)).toEqual(
      [...'tuvwxyz'.split('').map(character => `seed-phrase-key-${character}`), 'seed-phrase-undo'],
    );
    expect(app!.root.findByProps({ testID: 'seed-phrase-keypad-mode' }).props.disabled).toBe(true);
  });
});