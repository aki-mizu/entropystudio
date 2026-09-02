/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView } from 'react-native';
import entropyLabEnglish from '../../entropylab/src/locales/en.json';

const mockDiceRollsToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
const mockDirectDiceState = jest.fn();
const mockEntropyToMnemonic = jest.fn<string, [ArrayBuffer]>();
const mockMnemonicToEntropy = jest.fn<ArrayBuffer, [string]>();

jest.mock('entropystudio', () => ({
  DiceRollMethod: {
    Coldcard: 0,
    Coleman: 1,
  },
  DirectDiceMethod: {
    Bitbox: 0,
    D8d16: 1,
  },
  DirectDiceStep: {
    BitboxDie: 0,
    BitboxCoin: 1,
    BitboxFinalWord: 2,
    D8d16WordD8: 3,
    D8d16WordD16First: 4,
    D8d16WordD16Second: 5,
    D8d16ChecksumD8: 6,
    D8d16ChecksumD16: 7,
    D8d16ChecksumCoin: 8,
    D8d16Correction: 9,
    D8d16Complete: 10,
  },
  EntropyStudioError_Tags: {
    InvalidMnemonic: 'InvalidMnemonic',
    InvalidEntropy: 'InvalidEntropy',
    InvalidDiceRolls: 'InvalidDiceRolls',
    NoDiceRolls: 'NoDiceRolls',
    UnsupportedDiceWordCount: 'UnsupportedDiceWordCount',
  },
  directDiceState: mockDirectDiceState,
  diceRollsToEntropy: mockDiceRollsToEntropy,
  entropyToMnemonic: mockEntropyToMnemonic,
  mnemonicToEntropy: mockMnemonicToEntropy,
}));

const App = require('../src/App').default;

test('shows a live BIP39 phrase from hashed dice through the EntropyStudio binding', async () => {
  const entropy = new Uint8Array(16).buffer;
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  );

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'dice-screen-title' }).props.children).toBe(
    entropyLabEnglish['mode.dice'],
  );
  expect(app!.root.findByProps({ testID: 'dice-screen-how' }).props.children).toBe(
    entropyLabEnglish['dice.how'].replace('{words}', '24'),
  );
  expect(app!.root.findAllByType(ScrollView)).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'dice-method-summary' }).props.children).toBe(
    entropyLabEnglish['dice.coldcard.title'],
  );
  expect(app!.root.findByProps({ testID: 'seed-length-value' }).props.children).toBe(
    entropyLabEnglish['seedLength.words'].replace('{n}', '24'),
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-settings-sheet' })).toBeDefined();
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
  expect(app!.root.findByProps({ testID: 'seed-length-label' }).props.children).toBe(
    entropyLabEnglish['seedLength.label'],
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
    entropyLabEnglish['dice.label.hashed'],
  );
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.placeholder).toBe(
    '415263415263…',
  );
  expect(app!.root.findByProps({ testID: 'dice-progress' }).props.children).toBe(
    entropyLabEnglish['dice.meta.empty']
      .replace('{n}', '99')
      .replace('{method}', entropyLabEnglish['dice.method.coldcard']),
  );
  expect(
    app!.root.findByProps({ testID: 'derive-dice-phrase-label' }).props.children,
  ).toBe(entropyLabEnglish['action.derive']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });

  expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);
  expect(mockDiceRollsToEntropy).toHaveBeenCalledWith('1', 0, 24);
  expect(
    app!.root.findByProps({
      accessibilityLabel:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    }).props.testID,
  ).toBe('live-dice-words');
  expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-result-sheet' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'mnemonic-output' }).props.children).toBe(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-result-sheet-close' }).props.onPress();
  });

  const completeRolls = `${'123456'.repeat(16)}123`;
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText(completeRolls);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-coleman' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(mockDiceRollsToEntropy).toHaveBeenCalledWith(
    completeRolls,
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
  expect(app!.root.findByProps({ testID: 'result-phrase-label' }).props.children).toBe(
    entropyLabEnglish['result.seedPhraseN'].replace('{n}', '24'),
  );
  expect(app!.root.findByProps({ testID: 'result-entropy-label' }).props.children).toBe(
    entropyLabEnglish['result.entropyHex'],
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
      `${'1'.repeat(99)}x`,
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

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.multiline).toBe(false);
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

test('reveals each D8/D16 word as its three-roll group completes', async () => {
  const emptyState = {
    activeRoll: 0,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 3,
    words: [],
  };
  mockDirectDiceState.mockImplementation((rolls: string, method: number) =>
    method === 1 && rolls === '100'
      ? { ...emptyState, activeWord: 2, completedGroups: 1, words: ['abandon'] }
      : emptyState,
  );

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-d8d16' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('10');
  });
  expect(app!.root.findAllByProps({ testID: 'direct-dice-words' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('100');
  });
  expect(app!.root.findByProps({ accessibilityLabel: 'abandon' }).props.testID).toBe(
    'direct-dice-words',
  );
});

test('derives a BitBox direct-dice phrase from a selected checksum word', async () => {
  const entropy = new Uint8Array(16).buffer;
  mockDirectDiceState.mockReturnValue({
    activeRoll: 0,
    activeWord: 11,
    candidates: ['about'],
    complete: false,
    completedGroups: 11,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 11,
    skippedCount: 0,
    step: 2,
    words: Array.from({ length: 11 }, () => 'abandon'),
  });
  mockMnemonicToEntropy.mockReturnValue(entropy);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-bitbox' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'word-count-12' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-method-bitbox-title' }).props.children).toBe(
    entropyLabEnglish['dice.bitbox.title'],
  );
  expect(app!.root.findByProps({ testID: 'dice-method-bitbox-description' }).props.children).toBe(
    entropyLabEnglish['dice.bitbox.desc']
      .replace('{partialWords}', '11')
      .replace('{candidates}', '128'),
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
    entropyLabEnglish['dice.label.bitbox'],
  );
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.placeholder).toBe(
    '111111 222224…',
  );
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-direct-final-word' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'direct-final-word-label' }).props.children).toBe(
    entropyLabEnglish['seed.lastWordLabel'].replace('{n}', '1'),
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'direct-final-word-about' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  const mnemonic = `${Array.from({ length: 11 }, () => 'abandon').join(' ')} about`;
  expect(mockMnemonicToEntropy).toHaveBeenCalledWith(mnemonic);
  expect(app!.root.findByProps({ testID: 'mnemonic-output' }).props.children).toBe(
    mnemonic,
  );
});

test('derives a D8/D16 direct-dice phrase from its final roll selection', async () => {
  const entropy = new Uint8Array(16).buffer;
  mockDirectDiceState.mockReturnValue({
    activeRoll: 0,
    activeWord: 11,
    candidates: ['about'],
    complete: true,
    completedGroups: 11,
    extraCount: 0,
    finalWord: 'about',
    invalidCount: 0,
    partialWords: 11,
    skippedCount: 0,
    step: 10,
    words: Array.from({ length: 11 }, () => 'abandon'),
  });
  mockMnemonicToEntropy.mockReturnValue(entropy);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-d8d16' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'word-count-12' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-method-d8d16-title' }).props.children).toBe(
    entropyLabEnglish['dice.dplus.title'],
  );
  expect(app!.root.findByProps({ testID: 'dice-method-d8d16-description' }).props.children).toBe(
    entropyLabEnglish['dice.dplus.desc']
      .replace('{partialWords}', '11')
      .replace('{final}', 'roll a final D8 and D16'),
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
    entropyLabEnglish['dice.label.dplus'].replace(
      '{final}',
      'roll a final D8 and D16',
    ),
  );
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.placeholder).toBe(
    '100 2AF…',
  );
  expect(app!.root.findByProps({ testID: 'dice-face-A' })).toBeDefined();

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  const mnemonic = `${Array.from({ length: 11 }, () => 'abandon').join(' ')} about`;
  expect(mockMnemonicToEntropy).toHaveBeenCalledWith(mnemonic);
  expect(app!.root.findByProps({ testID: 'mnemonic-output' }).props.children).toBe(
    mnemonic,
  );
});
