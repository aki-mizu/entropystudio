/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import entropyLabEnglish from '../../entropylab/src/locales/en.json';

const mockDiceRollsToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
const mockEntropyToMnemonic = jest.fn<string, [ArrayBuffer]>();

jest.mock('entropystudio', () => ({
  DiceRollMethod: {
    Coldcard: 0,
    Coleman: 1,
  },
  EntropyStudioError_Tags: {
    InvalidMnemonic: 'InvalidMnemonic',
    InvalidEntropy: 'InvalidEntropy',
    InvalidDiceRolls: 'InvalidDiceRolls',
    NoDiceRolls: 'NoDiceRolls',
    UnsupportedDiceWordCount: 'UnsupportedDiceWordCount',
  },
  diceRollsToEntropy: mockDiceRollsToEntropy,
  entropyToMnemonic: mockEntropyToMnemonic,
}));

const App = require('../src/App').default;

test('derives a BIP39 phrase from dice through the EntropyStudio binding', async () => {
  const entropy = new Uint8Array(16).buffer;
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  );

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(
    app!.root.findByProps({ testID: 'dice-method-coldcard-title' }).props
      .children,
  ).toBe(entropyLabEnglish['dice.coldcard.title']);
  expect(
    app!.root.findByProps({ testID: 'dice-method-coldcard-description' }).props
      .children,
  ).toBe(
    entropyLabEnglish['dice.coldcard.desc']
      .replace('{bits}', '256')
      .replace('{words}', '24')
      .replace('{hashRolls}', '99'),
  );
  expect(
    app!.root.findByProps({ testID: 'dice-method-coleman-title' }).props
      .children,
  ).toBe(entropyLabEnglish['dice.coleman.title']);
  expect(
    app!.root.findByProps({ testID: 'dice-method-coleman-description' }).props
      .children,
  ).toBe(
    entropyLabEnglish['dice.coleman.desc']
      .replace('{bits}', '256')
      .replace('{words}', '24')
      .replace('{hashRolls}', '99'),
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText(
      '123456',
    );
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-coleman' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(mockDiceRollsToEntropy).toHaveBeenCalledWith(
    '123456',
    1,
    24,
  );
  expect(mockEntropyToMnemonic).toHaveBeenCalledWith(entropy);
  expect(
    app!.root.findByProps({ testID: 'entropy-output' }).props.children,
  ).toBe('00000000000000000000000000000000');
  expect(
    app!.root.findByProps({ testID: 'mnemonic-output' }).props.children,
  ).toBe(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
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

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText(
      '123x',
    );
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-error' }).props.children).toBe(
    entropyLabEnglish['error.diceFaces'].replace('{chars}', JSON.stringify('x')),
  );
});

test('adds and clears dice faces through the modular controls', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-face-6' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '6',
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'clear-dice-rolls' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '',
  );
});
