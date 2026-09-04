/**
 * @format
 */

import {
  App,
  DiceGrid,
  diceScreenCopy,
  expectEnabledDiceFaces,
  expectPlaceholderSeedGrid,
  mockDirectDiceState,
  mockMnemonicToEntropy,
  openDiceEntry,
  React,
  ReactTestRenderer,
  selectDiceMethod,
  selectSeedPhraseLength,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

test('uses EntropyLab D8/D16 help copy', () => {
  expect(diceScreenCopy('d8d16', 24).inputHelp).toBe(
    UPSTREAM_TEXT.dice.help.dplus.replace(
      '{finalHelp}',
      UPSTREAM_TEXT.dice.dplus.helpOne.replace('{die}', 'D8'),
    ),
  );
});

test('formats D8/D16 direct-dice transcript groups without storing separators', async () => {
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

  await selectDiceMethod(app!, 'dice-method-d8d16');
  await openDiceEntry(app!);
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

test('enables only D8/D16 faces valid for the current direct-dice step', async () => {
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
  mockDirectDiceState.mockImplementation((rolls: string) => {
    if (rolls === '1') {
      return {
        ...directState,
        activeRoll: 2,
        allowedFaces: d8D16Faces,
        step: 4,
      };
    }
    if (rolls === 'correction') {
      return { ...directState, activeRoll: 0, allowedFaces: [], step: 9 };
    }
    return {
      ...directState,
      allowedFaces: ['1', '2', '3', '4', '5', '6', '7', '8'],
      step: 3,
    };
  });

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectDiceMethod(app!, 'dice-method-d8d16');
  await openDiceEntry(app!);

  const d8D16Faces = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ];
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

  await selectDiceMethod(app!, 'dice-method-d8d16');

  await openDiceEntry(app!);
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
    canDerive: true,
    mnemonic: `${Array.from({ length: 11 }, () => 'abandon').join(' ')} about`,
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

  await selectDiceMethod(app!, 'dice-method-d8d16');
  await selectSeedPhraseLength(app!, 12);

  expect(app!.root.findByProps({ testID: 'dice-method-d8d16-title' }).props.children).toBe(
    UPSTREAM_TEXT.dice.dplus.title,
  );
  expect(app!.root.findByProps({ testID: 'dice-method-d8d16-description' }).props.children).toBe(
    UPSTREAM_TEXT.dice.dplus.desc
      .replace('{partialWords}', '11')
      .replace('{final}', 'roll a final D8 and D16'),
  );

  await openDiceEntry(app!);
  expect(app!.root.findByProps({ testID: 'dice-input-label' }).props.children).toBe(
    UPSTREAM_TEXT.dice.label.dplus.replace(
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