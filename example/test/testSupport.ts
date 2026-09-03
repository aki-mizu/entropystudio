import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView } from 'react-native';
import entropyLabEnglish from '../../entropylab/src/locales/en.json';
import type { HashedCardState, NumberBaseAnalysis } from '../src/native/entropyStudio';
import { installCardUiFixtures } from './cardUiFixtures';
import { installDiceUiFixtures } from './diceUiFixtures';
import { installNumberBaseUiFixtures } from './numberBaseUiFixtures';
import { installSeedPhraseUiFixtures } from './seedPhraseUiFixtures';

export const mockDiceRollsToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
export const mockDirectDiceState = jest.fn();
export const mockDiceMethodInfo = jest.fn();
export const mockDirectDiceInputState = jest.fn();
export const mockFormatDiceTranscript = jest.fn();
export const mockHashedDiceState = jest.fn();
export const mockSeedPhraseAutocomplete = jest.fn();
export const mockSeedPhraseKeyAllowed = jest.fn();
export const mockSeedPhraseNumbersToWords = jest.fn();
export const mockSeedPhraseSpaceAllowed = jest.fn();
export const mockSeedPhraseState = jest.fn();
export const mockSeedPhraseWordsToNumbers = jest.fn();
export const mockTranslateSeedNumberIndices = jest.fn();
export const mockCardTranscriptToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
export const mockCardKeyAllowed = jest.fn<boolean, [string, number, number]>();
export const mockDirectCardState = jest.fn();
export const mockEntropyToMnemonic = jest.fn<string, [ArrayBuffer]>();
export const mockHashedCardState = jest.fn<HashedCardState, [string, number]>();
export const mockMnemonicToEntropy = jest.fn<ArrayBuffer, [string]>();
export const mockNormalizeCardToken = jest.fn<string, [string]>();
export const mockNormalizeDirectCardTranscript = jest.fn<string, [string]>();
export const mockAnalyzeNumberBaseInput = jest.fn<NumberBaseAnalysis, [string, number, number]>();
export const mockNumberBaseEntropy = jest.fn<ArrayBuffer, [string, number, number]>();

jest.mock('entropystudio', () => ({
  CardHashMethod: {
    Ascii: 0,
    Coleman: 1,
  },
  CardInputMethod: {
    Hashed: 0,
    Direct: 1,
  },
  DiceRollMethod: {
    Coldcard: 0,
    Coleman: 1,
  },
  DiceInputMethod: {
    Coldcard: 0,
    Coleman: 1,
    Bitbox: 2,
    D8d16: 3,
  },
  DiceFinalStep: {
    D8: 0,
    D16: 1,
    Coin: 2,
  },
  SeedPhraseInputMethod: {
    Words: 0,
    Numbers: 1,
  },
  SeedPhraseStatus: {
    Remaining: 0,
    Extra: 1,
    ChooseFinal: 2,
    Ready: 3,
    FinalPrefix: 4,
    NoFinalPrefix: 5,
    InvalidWord: 6,
    InvalidNumber: 7,
    ChecksumInvalid: 8,
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
  NumberBaseFormat: {
    Bin: 0,
    Base4: 1,
    Base8: 2,
    Hex: 3,
    Base32: 4,
    Base64: 5,
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
  HashedCardInstruction: {
    Empty: 0,
    FirstShuffle: 1,
    ShuffleAgain: 2,
    SecondShuffle: 3,
    Complete: 4,
  },
  cardTranscriptToEntropy: mockCardTranscriptToEntropy,
  cardKeyAllowed: mockCardKeyAllowed,
  analyzeNumberBaseInput: mockAnalyzeNumberBaseInput,
  diceMethodInfo: mockDiceMethodInfo,
  directCardState: mockDirectCardState,
  directDiceInputState: mockDirectDiceInputState,
  directDiceState: mockDirectDiceState,
  diceRollsToEntropy: mockDiceRollsToEntropy,
  entropyToMnemonic: mockEntropyToMnemonic,
  formatDiceTranscript: mockFormatDiceTranscript,
  hashedCardState: mockHashedCardState,
  hashedDiceState: mockHashedDiceState,
  mnemonicToEntropy: mockMnemonicToEntropy,
  normalizeCardToken: mockNormalizeCardToken,
  normalizeDirectCardTranscript: mockNormalizeDirectCardTranscript,
  numberBaseEntropy: mockNumberBaseEntropy,
  seedPhraseAutocomplete: mockSeedPhraseAutocomplete,
  seedPhraseKeyAllowed: mockSeedPhraseKeyAllowed,
  seedPhraseNumbersToWords: mockSeedPhraseNumbersToWords,
  seedPhraseSpaceAllowed: mockSeedPhraseSpaceAllowed,
  seedPhraseState: mockSeedPhraseState,
  seedPhraseWordsToNumbers: mockSeedPhraseWordsToNumbers,
  translateSeedNumberIndices: mockTranslateSeedNumberIndices,
}));

installCardUiFixtures({
  setCardKeyAllowed: implementation => mockCardKeyAllowed.mockImplementation(implementation),
  setHashedCardState: implementation => mockHashedCardState.mockImplementation(implementation),
  setNormalizeCardToken: implementation => mockNormalizeCardToken.mockImplementation(implementation),
  setNormalizeDirectCardTranscript: implementation =>
    mockNormalizeDirectCardTranscript.mockImplementation(implementation),
});
installNumberBaseUiFixtures({
  setAnalyzeNumberBaseInput: implementation =>
    mockAnalyzeNumberBaseInput.mockImplementation(implementation),
  setNumberBaseEntropy: implementation => mockNumberBaseEntropy.mockImplementation(implementation),
});
installDiceUiFixtures({
  getDirectDiceState: (rolls, method, targetWords) =>
    mockDirectDiceState(rolls, method, targetWords) as Record<string, unknown> | undefined,
  setDiceMethodInfo: implementation => mockDiceMethodInfo.mockImplementation(implementation),
  setDirectDiceInputState: implementation =>
    mockDirectDiceInputState.mockImplementation(implementation),
  setFormatDiceTranscript: implementation => mockFormatDiceTranscript.mockImplementation(implementation),
  setHashedDiceState: implementation => mockHashedDiceState.mockImplementation(implementation),
});
installSeedPhraseUiFixtures({
  setSeedPhraseAutocomplete: implementation =>
    mockSeedPhraseAutocomplete.mockImplementation(implementation),
  setSeedPhraseKeyAllowed: implementation => mockSeedPhraseKeyAllowed.mockImplementation(implementation),
  setSeedPhraseNumbersToWords: implementation =>
    mockSeedPhraseNumbersToWords.mockImplementation(implementation),
  setSeedPhraseSpaceAllowed: implementation =>
    mockSeedPhraseSpaceAllowed.mockImplementation(implementation),
  setSeedPhraseState: implementation => mockSeedPhraseState.mockImplementation(implementation),
  setSeedPhraseWordsToNumbers: implementation =>
    mockSeedPhraseWordsToNumbers.mockImplementation(implementation),
  setTranslateSeedNumberIndices: implementation =>
    mockTranslateSeedNumberIndices.mockImplementation(implementation),
});

export const App = require('../src/App').default;
export const { DiceGrid } = require('../src/features/dice/components/DiceGrid');
export const { DiceWordList } = require('../src/features/dice/components/DirectDicePreview');
export const { diceScreenCopy } = require('../src/features/dice/dice');

export { React, ReactTestRenderer, ScrollView, entropyLabEnglish };

export function expectPlaceholderSeedGrid(
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

export function expectEnabledDiceFaces(
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

export function activeMethodList(app: ReactTestRenderer.ReactTestRenderer) {
  const methodList = app.root
    .findAllByProps({ testID: 'key-method-list' })
    .find(list => list.props.accessibilityElementsHidden === false);

  if (!methodList) {
    throw new Error('Expected an accessibility-visible Method list.');
  }

  return methodList;
}

export async function selectEntropyTool(
  app: ReactTestRenderer.ReactTestRenderer,
  tool: 'cards' | 'dice' | 'hex' | 'seed',
) {
  await ReactTestRenderer.act(async () => {
    activeMethodList(app).findByProps({ testID: `key-method-${tool}` }).props.onPress();
  });
}

export async function openDiceEntry(app: ReactTestRenderer.ReactTestRenderer) {
  const entryButton = app.root.findAllByProps({ testID: 'open-dice-entry' })[0];
  if (!entryButton) {
    return;
  }

  await ReactTestRenderer.act(async () => {
    entryButton.props.onPress();
  });
}

export async function closeDiceEntry(app: ReactTestRenderer.ReactTestRenderer) {
  const backButton = app.root.findAllByProps({ testID: 'close-dice-entry' })[0];
  if (!backButton) {
    return;
  }

  await ReactTestRenderer.act(async () => {
    backButton.props.onPress();
  });
}

export async function openCardsEntry(app: ReactTestRenderer.ReactTestRenderer) {
  const entryButton = app.root.findAllByProps({ testID: 'open-cards-entry' })[0];
  if (!entryButton) {
    return;
  }

  await ReactTestRenderer.act(async () => {
    entryButton.props.onPress();
  });
}

export async function selectDiceMethod(
  app: ReactTestRenderer.ReactTestRenderer,
  testID: string,
) {
  await ReactTestRenderer.act(async () => {
    app.root.findByProps({ testID }).props.onPress();
  });
}