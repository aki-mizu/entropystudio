/**
 * @format
 */

import {
  App,
  closeDiceEntry,
  expectPlaceholderSeedGrid,
  mockDirectDiceState,
  openDiceEntry,
  React,
  ReactTestRenderer,
  selectDiceMethod,
  selectSeedPhraseLength,
} from '../../test/testSupport';

test('shows placeholders across hashed and direct dice methods', async () => {
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

  await openDiceEntry(app!);
  expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);
  await closeDiceEntry(app!);

  await selectDiceMethod(app!, 'dice-method-coleman');

  await openDiceEntry(app!);
  expectPlaceholderSeedGrid(app!, 'live-dice-words', 24);
  await closeDiceEntry(app!);

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await selectSeedPhraseLength(app!, 12);

  await openDiceEntry(app!);
  expectPlaceholderSeedGrid(app!, 'direct-dice-words', 12);
});

test('preserves independent transcripts while switching dice methods', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);

  async function selectMethod(testID: string) {
    await closeDiceEntry(app!);
    await selectDiceMethod(app!, testID);
    await openDiceEntry(app!);
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