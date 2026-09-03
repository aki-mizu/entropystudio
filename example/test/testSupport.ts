import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView } from 'react-native';
import entropyLabEnglish from '../../entropylab/src/locales/en.json';

export const mockDiceRollsToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
export const mockDirectDiceState = jest.fn();
export const mockCardTranscriptToEntropy = jest.fn<ArrayBuffer, [string, number, number]>();
export const mockDirectCardState = jest.fn();
export const mockEntropyToMnemonic = jest.fn<string, [ArrayBuffer]>();
export const mockMnemonicToEntropy = jest.fn<ArrayBuffer, [string]>();

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