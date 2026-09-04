/**
 * @format
 */

import {
  App,
  closeDiceEntry,
  DiceGrid,
  diceScreenCopy,
  DiceWordList,
  expectPlaceholderSeedGrid,
  mockDiceRollsToEntropy,
  mockEntropyToMnemonic,
  openDiceEntry,
  React,
  ReactTestRenderer,
  ScrollView,
} from '../../test/testSupport';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe(UPSTREAM_TEXT.dice.coleman.title, () => {
  test('uses EntropyLab help copy', () => {
    expect(diceScreenCopy('coldcard', 24).inputHelp).toBe(
      UPSTREAM_TEXT.dice.help.coldcard.replace('{hashRolls}', '99'),
    );
  });

  test('shows a live BIP39 phrase through the EntropyStudio binding', async () => {
    const entropy = new Uint8Array(16).buffer;
    const liveMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockDiceRollsToEntropy.mockReturnValue(entropy);
    mockEntropyToMnemonic.mockReturnValue(liveMnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    expect(app!.root.findByProps({ testID: 'dice-screen-title' }).props.children).toBe(
      UPSTREAM_TEXT.mode.dice,
    );
    expect(app!.root.findByProps({ testID: 'dice-screen-how' }).props.children).toBe(
      UPSTREAM_TEXT.dice.how.replace('{words}', '24'),
    );
    expect(
      app!
        .root
        .findByProps({ testID: 'dice-screen-safe-area' })
        .findAllByType(ScrollView),
    ).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.edges).toEqual([
      'top',
    ]);
    expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
    expect(app!.root.findAllByType(DiceGrid)).toHaveLength(0);
    expect(app!.root.findAllByType(DiceWordList)).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'dice-setup-settings' })).toBeDefined();
    expect(app!.root.findAllByProps({ testID: 'dice-settings-sheet' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'dice-method-requirement' }).props.children).toBe(
      UPSTREAM_UI_FALLBACK_COPY.common.seedLengthEntropy(24, 256),
    );
    expect(app!.root.findByProps({ testID: 'dice-method-coldcard-title' }).props.children).toBe(
      UPSTREAM_TEXT.dice.coldcard.title,
    );
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'app-tab-settings' }).props.onPress();
    });
    expect(
      app!
        .root
        .findByProps({ testID: 'entropy-sync-settings-screen' })
        .findByProps({ testID: 'seed-length-value' }).props.children,
    ).toBe(
      UPSTREAM_TEXT.seedLength.words.replace('{n}', '24'),
    );
    expect(
      app!
        .root
        .findByProps({ testID: 'entropy-sync-settings-screen' })
        .findByProps({ testID: 'seed-length-label' }).props.children,
    ).toBe(UPSTREAM_TEXT.seedLength.label);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'app-tab-method' }).props.onPress();
    });
    await openDiceEntry(app!);
    expect(app!.root.findByProps({ testID: 'dice-rolls-view' })).toBeDefined();
    expect(app!.root.findByType(DiceGrid).props.columns).toBe(6);
    expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);
    await closeDiceEntry(app!);
    expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();

    expect(
      app!.root.findByProps({ testID: 'dice-method-coldcard-title' }).props
        .children,
    ).toBe(UPSTREAM_TEXT.dice.coldcard.title);
    expect(
      app!.root.findByProps({ testID: 'dice-method-coldcard-description' }).props
        .children,
    ).toBe(
      UPSTREAM_TEXT.dice.coldcard.desc
        .replace('{bits}', '256')
        .replace('{words}', '24')
        .replace('{hashRolls}', '99'),
    );
    await openDiceEntry(app!);
    expect(app!.root.findByProps({ testID: 'dice-method-help' }).props.children).toBe(
      UPSTREAM_TEXT.dice.help.coldcard.replace('{hashRolls}', '99'),
    );
    expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
      UPSTREAM_TEXT.dice.label.hashed,
    );
    expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.placeholder).toBe(
      '415263415263…',
    );
    expect(
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.showSoftInputOnFocus,
    ).toBe(false);
    expect(app!.root.findByProps({ testID: 'dice-progress' }).props.children).toBe(
      UPSTREAM_TEXT.dice.meta.empty
        .replace('{n}', '99')
        .replace('{method}', UPSTREAM_TEXT.dice.method.coldcard),
    );
    expect(
      app!.root.findByProps({ testID: 'derive-dice-phrase-label' }).props.children,
    ).toBe(UPSTREAM_TEXT.action.derive);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
    });

    expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);
    expect(mockDiceRollsToEntropy).toHaveBeenCalledWith('1', 0, 24);
    const liveDiceWords = app!.root.findByProps({
      accessibilityLabel: liveMnemonic,
      testID: 'live-dice-words',
    });
    expect(liveDiceWords.props.children).toHaveLength(3);
    expect(
      app!.root.findByProps({ testID: 'live-dice-words-column-1' }).props.children,
    ).toHaveLength(8);
    expect(
      app!.root.findByProps({ testID: 'live-dice-words-column-2' }).props.children,
    ).toHaveLength(8);
    expect(
      app!.root.findByProps({ testID: 'live-dice-words-column-3' }).props.children,
    ).toHaveLength(8);
    expect(
      app!.root.findByProps({ testID: 'live-dice-words-word-13' }).props.children,
    ).toBe('\u2014');
    expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-result-sheet' })).toBeDefined();
    expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);
    expect(app!.root.findAllByProps({ testID: 'result-phrase-label' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'entropy-output' }).props.children).toBe(
      '00000000000000000000000000000000',
    );
  });

  test('uses the upstream dice validation text', async () => {
    mockDiceRollsToEntropy.mockImplementation(() => {
      throw Object.assign(new Error('unused native text'), {
        tag: 'InvalidDiceRolls',
      });
    });

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await openDiceEntry(app!);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText(
        `${'1'.repeat(99)}x`,
      );
    });

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-error' }).props.children).toBe(
      UPSTREAM_TEXT.error.diceFaces.replace('{chars}', JSON.stringify('x')),
    );
  });

  test('adds and removes dice faces through the modular controls', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await openDiceEntry(app!);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-face-6' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.multiline).toBe(false);
    expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
      '6',
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
      '',
    );
  });
});