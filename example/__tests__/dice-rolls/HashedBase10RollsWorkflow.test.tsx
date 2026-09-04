/**
 * @format
 */

import {
  App,
  diceScreenCopy,
  mockDiceRollsToEntropy,
  mockEntropyToMnemonic,
  openDiceEntry,
  React,
  ReactTestRenderer,
  selectDiceMethod,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

describe(UPSTREAM_TEXT.dice.coldcard.title, () => {
  test('uses EntropyLab help copy', () => {
    expect(diceScreenCopy('coleman', 24).inputHelp).toBe(
      UPSTREAM_TEXT.dice.help.coleman.replace('{hashRolls}', '99'),
    );
  });

  test('derives a BIP39 phrase through the EntropyStudio binding', async () => {
    const entropy = new Uint8Array(16).buffer;
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const rolls = `${'123456'.repeat(16)}123`;
    mockDiceRollsToEntropy.mockReturnValue(entropy);
    mockEntropyToMnemonic.mockReturnValue(mnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectDiceMethod(app!, 'dice-method-coleman');
    expect(app!.root.findByProps({ testID: 'dice-method-coleman-title' }).props.children).toBe(
      UPSTREAM_TEXT.dice.coleman.title,
    );

    await openDiceEntry(app!);
    expect(app!.root.findByProps({ testID: 'dice-method-help' }).props.children).toBe(
      UPSTREAM_TEXT.dice.help.coleman.replace('{hashRolls}', '99'),
    );
    expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
      UPSTREAM_TEXT.dice.label.hashed,
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText(rolls);
    });

    expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
    });

    expect(mockDiceRollsToEntropy).toHaveBeenCalledWith(rolls, 1, 24);
    expect(mockEntropyToMnemonic).toHaveBeenCalledWith(entropy);
    expect(app!.root.findByProps({ testID: 'entropy-output' }).props.children).toBe(
      '00000000000000000000000000000000',
    );
  });
});