/**
 * @format
 */

import {
  App,
  mockDirectDiceCalculations,
  mockDirectDiceState,
  openDiceEntry,
  React,
  ReactTestRenderer,
  selectDiceMethod,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

test('opens BitBox direct-word calculations from the dice key-input screen', async () => {
  mockDirectDiceState.mockReturnValue({
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 1,
    extraCount: 0,
    finalWord: '',
    invalidCount: 0,
    partialWords: 23,
    skippedCount: 0,
    step: 0,
    words: ['abandon'],
  });
  mockDirectDiceCalculations.mockReturnValue([
    {
      index: 1,
      number: 1,
      terms: [
        { contribution: 0, face: '1', kind: 0, multiplier: 512, value: 0 },
        { contribution: 0, face: '1', kind: 0, multiplier: 128, value: 0 },
        { contribution: 0, face: '1', kind: 0, multiplier: 32, value: 0 },
        { contribution: 0, face: '1', kind: 0, multiplier: 8, value: 0 },
        { contribution: 0, face: '1', kind: 0, multiplier: 2, value: 0 },
        { contribution: 1, face: '4', kind: 1, multiplier: 1, value: 1 },
      ],
      word: 'ability',
    },
  ]);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await openDiceEntry(app!);
  expect(app!.root.findByProps({ testID: 'open-direct-dice-calculations' }).props.children.props.children).toBe(
    UPSTREAM_TEXT.calculations.show,
  );

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-direct-dice-calculations' }).props.onPress();
  });

  expect(
    app!.root.findByProps({ testID: 'direct-dice-calculations-view-content-title' }).props.children,
  ).toBe(UPSTREAM_TEXT.calculations.bitboxTitle);
  expect(
    app!.root.findByProps({ testID: 'direct-dice-calculation-row-1-word' }).props.children,
  ).toBe('ability');
  expect(
    app!.root.findByProps({ testID: 'direct-dice-calculation-row-1-index' }).props.children,
  ).toBe(`${UPSTREAM_TEXT.calculations.bip39Index} 1`);
  expect(
    app!.root.findByProps({ testID: 'direct-dice-calculation-row-1-word-number' }).props.children,
  ).toBe(`${UPSTREAM_TEXT.calculations.wordNumber} 2`);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'direct-dice-calculations-view-back' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-view' })).toBeTruthy();
});