/**
 * @format
 */

import {
  App,
  diceScreenCopy,
  entropyLabEnglish,
  expectEnabledDiceFaces,
  mockDirectDiceState,
  mockMnemonicToEntropy,
  openDiceEntry,
  React,
  ReactTestRenderer,
  selectDiceMethod,
} from '../../test/testSupport';

test('uses EntropyLab BitBox help copy', () => {
  expect(diceScreenCopy('bitbox', 24).inputHelp).toBe(
    entropyLabEnglish['dice.help.bitbox'].replace('{partialWords}', '23'),
  );
});

test('formats BitBox direct-dice transcript groups without storing separators', async () => {
  mockDirectDiceState.mockReturnValue({
    activeRoll: 1,
    activeWord: 1,
    candidates: [],
    complete: false,
    completedGroups: 0,
    extraCount: 0,
    finalWord: 'about',
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

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await openDiceEntry(app!);
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
    app!
      .root.findByProps({ testID: 'dice-rolls-input' })
      .props.onChangeText('');
  });
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'dice-rolls-input' })
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
});

test('removes a selected BitBox dice range through Undo', async () => {
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

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!
      .root
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

test('inserts BitBox keypad faces at the transcript cursor', async () => {
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

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!
      .root
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

test('enables only BitBox faces valid for the current direct-dice step', async () => {
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
    if (rolls === '11111') {
      return {
        ...directState,
        activeRoll: 6,
        allowedFaces: ['1', '2', '3', '4', '5', '6'],
        step: 1,
      };
    }
    if (rolls === 'complete') {
      return { ...directState, allowedFaces: [], step: 2 };
    }
    return { ...directState, allowedFaces: ['1', '2', '3', '4'] };
  });

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectDiceMethod(app!, 'dice-method-bitbox');
  await openDiceEntry(app!);

  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('11111');
  });
  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4', '5', '6']);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('complete');
  });
  expectEnabledDiceFaces(app!, ['1', '2', '3', '4', '5', '6'], []);
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
    finalWord: 'about',
    invalidCount: 0,
    canDerive: true,
    mnemonic: `${Array.from({ length: 11 }, () => 'abandon').join(' ')} about`,
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

  await selectDiceMethod(app!, 'dice-method-bitbox');

  await ReactTestRenderer.act(async () => {
    app!.root
      .findByProps({ testID: 'dice-setup-view' })
      .findByProps({ testID: 'word-count-12' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-method-bitbox-title' }).props.children).toBe(
    entropyLabEnglish['dice.bitbox.title'],
  );
  expect(app!.root.findByProps({ testID: 'dice-method-bitbox-description' }).props.children).toBe(
    entropyLabEnglish['dice.bitbox.desc']
      .replace('{partialWords}', '11')
      .replace('{candidates}', '128'),
  );

  await openDiceEntry(app!);
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