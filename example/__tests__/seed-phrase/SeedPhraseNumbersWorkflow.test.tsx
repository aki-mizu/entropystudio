/**
 * @format
 */

import {
  App,
  mockMnemonicToEntropy,
  React,
  ReactTestRenderer,
  selectEntropyTool,
  selectSeedPhraseLength,
} from '../../test/testSupport';
import { formatCopy, UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

describe('Seed Phrase / Numbers', () => {
  test('converts BIP39 word numbers through the on-screen keypad', async () => {
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
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'seed-method-numbers' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props.children).toBe(
      formatCopy(UPSTREAM_TEXT.seed.requirementNumbers, {
        range: UPSTREAM_TEXT.seed.range1,
        words: 24,
      }),
    );
    await selectSeedPhraseLength(app!, 12);
    expect(app!.root.findByProps({ testID: 'seed-phrase-method-requirement' }).props.children).toBe(
      formatCopy(UPSTREAM_TEXT.seed.requirementNumbers, {
        range: UPSTREAM_TEXT.seed.range1,
        words: 12,
      }),
    );
    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-phrase-setup-view' })
        .findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-number-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(app!.root.findByProps({ testID: 'seed-number-key-1' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'seed-number-next-word' }).props.disabled).toBe(true);
    expect(
      app!
        .root.findByProps({ testID: 'seed-number-key-row-0' })
        .props.children.map((key: { props: { testID: string } }) => key.props.testID),
    ).toEqual('01234'.split('').map(digit => `seed-number-key-${digit}`));
    expect(
      app!
        .root.findByProps({ testID: 'seed-number-key-row-1' })
        .props.children.map((key: { props: { testID: string } }) => key.props.testID),
    ).toEqual('56789'.split('').map(digit => `seed-number-key-${digit}`));

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-number-key-1' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-number-next-word' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'seed-number-input' }).props.value).toBe('1 ');

    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'seed-number-input' })
        .props.onChangeText('1 1 1 1 1 1 1 1 1 1 1 4');
    });

    expect(app!.root.findByProps({ testID: 'seed-phrase-words-word-1' }).props.children).toBe(
      'abandon',
    );
    expect(app!.root.findByProps({ testID: 'seed-phrase-words-word-12' }).props.children).toBe(
      'about',
    );
    expect(app!.root.findByProps({ testID: 'seed-number-status' }).props.children).toBe(
      '12 of 12 BIP39 word numbers entered · checksum valid · ready to derive',
    );
    expect(app!.root.findByProps({ testID: 'derive-seed-phrase' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'seed-number-zero-index' }).props.onValueChange(true);
    });

    expect(app!.root.findByProps({ testID: 'seed-number-input' }).props.value).toBe(
      '0 0 0 0 0 0 0 0 0 0 0 3',
    );
  });
});