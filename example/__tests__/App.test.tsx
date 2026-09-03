/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView } from 'react-native';
import entropyLabEnglish from '../../entropylab/src/locales/en.json';

const mockDiceRollsToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
const mockDirectDiceState = jest.fn();
const mockCardTranscriptToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
const mockDirectCardState = jest.fn();
const mockEntropyToMnemonic = jest.fn<string, [ArrayBuffer]>();
const mockMnemonicToEntropy = jest.fn<ArrayBuffer, [string]>();

jest.mock('entropystudio', () => ({
  CardHashMethod: {
    Ascii: 0,
    Coleman: 1,
  },
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
  DirectCardStep: {
    Word: 0,
    Final: 1,
    Correction: 2,
    Complete: 3,
  },
  EntropyStudioError_Tags: {
    InvalidMnemonic: 'InvalidMnemonic',
    InvalidEntropy: 'InvalidEntropy',
    InvalidDiceRolls: 'InvalidDiceRolls',
    NoDiceRolls: 'NoDiceRolls',
    UnsupportedDiceWordCount: 'UnsupportedDiceWordCount',
    InvalidCardTranscript: 'InvalidCardTranscript',
    NoCards: 'NoCards',
    DuplicateCard: 'DuplicateCard',
  },
  cardTranscriptToEntropy: mockCardTranscriptToEntropy,
  directCardState: mockDirectCardState,
  directDiceState: mockDirectDiceState,
  diceRollsToEntropy: mockDiceRollsToEntropy,
  entropyToMnemonic: mockEntropyToMnemonic,
  mnemonicToEntropy: mockMnemonicToEntropy,
}));

const App = require('../src/App').default;
const { DiceGrid } = require('../src/features/dice/components/DiceGrid');
const { DiceWordList } = require('../src/features/dice/components/DirectDicePreview');
const { diceScreenCopy } = require('../src/features/dice/dice');

function expectPlaceholderSeedGrid(
  app: ReactTestRenderer.ReactTestRenderer,
  testID: string,
  wordCount: number,
) {
  const rows = wordCount / 3;

  for (const column of [1, 2, 3]) {
    expect(
      app.root.findByProps({ testID: `${testID}-column-${column}` }).props.children,
    ).toHaveLength(rows);
  }
  expect(app.root.findByProps({ testID: `${testID}-word-1` }).props.children).toBe('\u2014');
  expect(
    app.root.findByProps({ testID: `${testID}-word-${wordCount}` }).props.children,
  ).toBe('\u2014');
}

function expectEnabledDiceFaces(
  app: ReactTestRenderer.ReactTestRenderer,
  faces: readonly string[],
  enabledFaces: readonly string[],
) {
  for (const face of faces) {
    expect(app.root.findByProps({ testID: `dice-face-${face}` }).props.disabled).toBe(
      !enabledFaces.includes(face),
    );
  }
}

async function selectEntropyTool(
  app: ReactTestRenderer.ReactTestRenderer,
  tool: 'cards' | 'dice',
) {
  await ReactTestRenderer.act(async () => {
    app.root.findByProps({ testID: 'key-method-select' }).props.onValueChange(tool);
  });
}

test('uses EntropyLab help copy for every dice method', () => {
  expect(diceScreenCopy('coldcard', 24).inputHelp).toBe(
    entropyLabEnglish['dice.help.coldcard'].replace('{hashRolls}', '99'),
  );
  expect(diceScreenCopy('coleman', 24).inputHelp).toBe(
    entropyLabEnglish['dice.help.coleman'].replace('{hashRolls}', '99'),
  );
  expect(diceScreenCopy('bitbox', 24).inputHelp).toBe(
    entropyLabEnglish['dice.help.bitbox'].replace('{partialWords}', '23'),
  );
  expect(diceScreenCopy('d8d16', 24).inputHelp).toBe(
    entropyLabEnglish['dice.help.dplus'].replace(
      '{finalHelp}',
      entropyLabEnglish['dice.dplus.helpOne'].replace('{die}', 'D8'),
    ),
  );
});

test('uses an upstream-style dropdown for the top-level method', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  const picker = app!.root.findByProps({ testID: 'key-method-select' });
  expect(app!.root.findByProps({ testID: 'key-method-label' }).props.children).toBe(
    entropyLabEnglish['keys.methodLabel'],
  );
  expect(picker.props.mode).toBe('dropdown');
  expect(picker.props.selectedValue).toBe('dice');

  await selectEntropyTool(app!, 'cards');
  expect(app!.root.findByProps({ testID: 'key-method-select' }).props.selectedValue).toBe('cards');
});

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
  const diceScrollView = app!.root.findByType(ScrollView);
  expect(diceScrollView.props.keyboardShouldPersistTaps).toBe('handled');
  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.edges).toEqual([
    'top',
  ]);
  expect(app!.root.findByType(DiceGrid).props.columns).toBe(6);
  expect(app!.root.findByType(DiceWordList).props.compact).toBe(true);
  expect(app!.root.findByProps({ testID: 'dice-method-summary' }).props.children).toBe(
    entropyLabEnglish['dice.coldcard.title'],
  );
  expect(app!.root.findByProps({ testID: 'seed-length-value' }).props.children).toBe(
    entropyLabEnglish['seedLength.words'].replace('{n}', '24'),
  );
  expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);

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
  expect(app!.root.findByProps({ testID: 'dice-method-help' }).props.children).toBe(
    entropyLabEnglish['dice.help.coldcard'].replace('{hashRolls}', '99'),
  );
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.placeholder).toBe(
    '415263415263…',
  );
  expect(
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.showSoftInputOnFocus,
  ).toBe(false);
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
  const liveMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
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
  expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);
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

test('adds and removes dice faces through the modular controls', async () => {
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
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '',
  );
});

test('shares hashed rolls and restores independent direct-dice transcripts', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  async function selectMethod(testID: string) {
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
    });
  }

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('123456');
  });
  await selectMethod('dice-method-coleman');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('123456');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('654321');
  });
  await selectMethod('dice-method-bitbox');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1111111');
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 1',
  );

  await selectMethod('dice-method-d8d16');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1234');
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('123 4');

  await selectMethod('dice-method-bitbox');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 1',
  );

  await selectMethod('dice-method-d8d16');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('123 4');

  await selectMethod('dice-method-coldcard');
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('654321');
});

test('shows placeholders for every dice method and selected seed length', async () => {
  mockDirectDiceState.mockReturnValue({
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
  });

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-coleman' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-bitbox' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'word-count-12' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expectPlaceholderSeedGrid(app!, 'direct-dice-words', 12);
});

test('formats direct-dice transcript groups without storing separators', async () => {
  mockDirectDiceState.mockReturnValue({
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 0,
    words: [],
  });

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
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1111111');
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 1',
  );
  expect(mockDirectDiceState).toHaveBeenCalledWith('1111111', 0, 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111',
  );
  expect(mockDirectDiceState).toHaveBeenCalledWith('111111', 0, 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('11111');

  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'dice-rolls-input' })
      .props.onChangeText('');
  });
  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'dice-rolls-input' })
      .props.onChangeText('111111222222333333');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onSelectionChange({
      nativeEvent: { selection: { start: 9 } },
    });
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 222223 33333',
  );
  expect(mockDirectDiceState).toHaveBeenCalledWith('11111122222333333', 0, 24);

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
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('123 4');
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('123 4');
  expect(mockDirectDiceState).toHaveBeenCalledWith('1234', 1, 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('123');
  expect(mockDirectDiceState).toHaveBeenCalledWith('123', 1, 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('123456789');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onSelectionChange({
      nativeEvent: { selection: { start: 5 } },
    });
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '123 567 89',
  );
  expect(mockDirectDiceState).toHaveBeenCalledWith('12356789', 1, 24);
});

test('removes a selected dice range through Undo', async () => {
  mockDirectDiceState.mockReturnValue({
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 0,
    words: [],
  });

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
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'dice-rolls-input' })
      .props.onChangeText('111111222222333333');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onSelectionChange({
      nativeEvent: { selection: { end: 13, start: 7 } },
    });
  });

  expect(
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.accessibilityLabel,
  ).toBe('Remove selected rolls');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'remove-dice-roll' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 333333',
  );
  expect(mockDirectDiceState).toHaveBeenLastCalledWith('111111333333', 0, 24);
});

test('inserts keypad faces at the transcript cursor', async () => {
  mockDirectDiceState.mockReturnValue({
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 0,
    words: [],
  });

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
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'dice-rolls-input' })
      .props.onChangeText('111111222222333333');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onSelectionChange({
      nativeEvent: { selection: { end: 9, start: 9 } },
    });
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-face-4' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe(
    '111111 224222 233333 3',
  );
  expect(mockDirectDiceState).toHaveBeenLastCalledWith('1111112242222333333', 0, 24);
});

test('enables only dice faces valid for the current direct-dice step', async () => {
  const directState = {
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 0,
    words: [],
  };
  mockDirectDiceState.mockImplementation((rolls: string, method: number) => {
    if (method === 0) {
      if (rolls === '11111') {
        return { ...directState, activeRoll: 6, step: 1 };
      }
      if (rolls === 'complete') {
        return { ...directState, step: 2 };
      }
      return directState;
    }
    if (rolls === '1') {
      return { ...directState, activeRoll: 2, step: 4 };
    }
    if (rolls === 'correction') {
      return { ...directState, activeRoll: 0, step: 9 };
    }
    return { ...directState, step: 3 };
  });

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
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('11111');
  });
  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4', '5', '6']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('complete');
  });
  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], []);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-method-d8d16' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-settings-sheet-close' }).props.onPress();
  });

  const d8D16Faces = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  expectEnabledDiceFaces(app!, d8D16Faces, ['1', '2', '3', '4', '5', '6', '7', '8']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  expectEnabledDiceFaces(app!, d8D16Faces, d8D16Faces);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('correction');
  });
  expectEnabledDiceFaces(app!, d8D16Faces, []);
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

  expectPlaceholderSeedGrid(app!, 'direct-dice-words', 24);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('10');
  });
  expect(
    app!.root.findByProps({ testID: 'direct-dice-words-word-1' }).props.children,
  ).toBe('\u2014');

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
  expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);
  expect(
    app!.root.findByProps({ accessibilityLabel: mnemonic, testID: 'direct-dice-words' }).props
      .accessibilityLabel,
  ).toBe(mnemonic);
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
  expect(app!.root.findByType(DiceGrid).props.columns).toBe(8);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  const mnemonic = `${Array.from({ length: 11 }, () => 'abandon').join(' ')} about`;
  expect(mockMnemonicToEntropy).toHaveBeenCalledWith(mnemonic);
  expect(app!.root.findAllByProps({ testID: 'mnemonic-output' })).toHaveLength(0);
  expect(
    app!.root.findByProps({ accessibilityLabel: mnemonic, testID: 'direct-dice-words' }).props
      .accessibilityLabel,
  ).toBe(mnemonic);
});

test('switches to cards and derives a hashed card transcript through the native binding', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockCardTranscriptToEntropy.mockReset();
  mockDirectCardState.mockReset();
  mockEntropyToMnemonic.mockReset();
  mockCardTranscriptToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'cards');

  expect(app!.root.findByProps({ testID: 'cards-screen-title' }).props.children).toBe(
    entropyLabEnglish['mode.cards'],
  );
  expect(app!.root.findByProps({ testID: 'card-input-label' }).props.children).toBe(
    entropyLabEnglish['cards.transcript'],
  );
  expect(app!.root.findByProps({ testID: 'derive-card-phrase' }).props.disabled).toBe(true);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-transcript-input' }).props.onChangeText('4H 3H');
  });

  expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('4h 3h');
  expect(mockCardTranscriptToEntropy).toHaveBeenCalledWith('4h 3h', 0, 24);
  expect(app!.root.findByProps({ testID: 'derive-card-phrase' }).props.disabled).toBe(false);
  expect(
    app!.root.findByProps({ accessibilityLabel: mnemonic, testID: 'live-card-words' }).props
      .accessibilityLabel,
  ).toBe(mnemonic);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-card-phrase' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'card-result-sheet' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'card-entropy-output' }).props.children).toBe(
    '00000000000000000000000000000000',
  );
});

test('blocks invalid card key presses before they enter the transcript', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await selectEntropyTool(app!, 'cards');

  const input = app!.root.findByProps({ testID: 'card-transcript-input' });
  const preventInvalid = jest.fn();
  const preventValid = jest.fn();
  input.props.onKeyPress({ nativeEvent: { key: 'B' }, preventDefault: preventInvalid });
  input.props.onKeyPress({ nativeEvent: { key: '4' }, preventDefault: preventValid });

  expect(preventInvalid).toHaveBeenCalledTimes(1);
  expect(preventValid).not.toHaveBeenCalled();
});

test('locks other ranks after selecting a hashed card rank', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-rank-4' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'card-rank-4' }).props.disabled).toBe(false);
  expect(app!.root.findByProps({ testID: 'card-rank-3' }).props.disabled).toBe(true);
  expect(app!.root.findByProps({ testID: 'card-rank-K' }).props.disabled).toBe(true);
  expect(app!.root.findByProps({ testID: 'card-suit-H' }).props.disabled).toBe(false);
});

test('commits a hashed card after the rank and suit are selected', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-rank-5' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-suit-C' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('5c');
  expect(app!.root.findAllByProps({ testID: 'deal-card' })).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'card-rank-4' }).props.disabled).toBe(false);
});

test('uses rank-only controls for direct card selection', async () => {
  mockDirectCardState.mockReset();
  mockDirectCardState.mockReturnValue({
    activeDraw: 1,
    activeMax: 8,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    step: 0,
    words: [],
  });

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-card-settings' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-settings-sheet-close' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'direct-card-rank-8' }).props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'direct-card-rank-A' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('A');
  expect(mockDirectCardState).toHaveBeenLastCalledWith('A', 24);
});
