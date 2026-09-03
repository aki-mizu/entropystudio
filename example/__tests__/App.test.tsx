/**
 * @format
 */

import {
  activeMethodList,
  App,
  entropyLabEnglish,
  React,
  ReactTestRenderer,
  selectDiceMethod,
  selectEntropyTool,
} from '../test/testSupport';

test('shows Dice, Cards, Number Bases, Seed Phrase, and Private Key workflows on the shared setup screen', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  const diceMethodList = activeMethodList(app!);
  expect(diceMethodList.findByProps({ testID: 'key-method-label' }).props.children).toBe(
    entropyLabEnglish['keys.methodLabel'],
  );
  expect(diceMethodList).toBeDefined();
  expect(diceMethodList.findByProps({ testID: 'key-method-dice' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(diceMethodList.findByProps({ testID: 'key-method-cards' }).props.accessibilityState).toEqual({
    selected: false,
  });
  expect(diceMethodList.findByProps({ testID: 'key-method-hex' }).props.accessibilityState).toEqual({
    selected: false,
  });
  expect(diceMethodList.findByProps({ testID: 'key-method-seed' }).props.accessibilityState).toEqual({
    selected: false,
  });
  expect(diceMethodList.findByProps({ testID: 'key-method-key' }).props.accessibilityState).toEqual({
    selected: false,
  });

  await selectDiceMethod(app!, 'dice-method-coleman');
  await selectEntropyTool(app!, 'cards');
  expect(app!.root.findByProps({ testID: 'cards-screen-title' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'cards-setup-view' })).toBeDefined();
  expect(app!.root.findAllByProps({ testID: 'cards-entry-view' })).toHaveLength(0);
  expect(
    activeMethodList(app!).findByProps({ testID: 'key-method-cards' }).props.accessibilityState,
  ).toEqual({
    selected: true,
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
  });

  await selectEntropyTool(app!, 'dice');

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-method-coleman' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await selectEntropyTool(app!, 'cards');

  expect(app!.root.findByProps({ testID: 'card-method-direct' }).props.accessibilityState).toEqual({
    selected: true,
  });
});

test('keeps native workflow trees mounted while changing methods', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  const diceScreen = app!.root.findByProps({ testID: 'dice-screen-safe-area' });
  const cardsScreen = app!.root.findByProps({ testID: 'cards-screen-safe-area' });
  const privateKeyScreen = app!.root.findByProps({ testID: 'private-key-screen-safe-area' });
  expect(diceScreen.props.pointerEvents).toBe('auto');
  expect(cardsScreen.props.pointerEvents).toBe('none');
  expect(cardsScreen.props.style).toContainEqual({ display: 'none' });
  expect(privateKeyScreen.props.pointerEvents).toBe('none');
  expect(privateKeyScreen.props.style).toContainEqual({ display: 'none' });

  await selectEntropyTool(app!, 'cards');

  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'none',
  );
  expect(
    app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.style,
  ).toContainEqual({ display: 'none' });
  expect(app!.root.findByProps({ testID: 'cards-screen-safe-area' }).props.pointerEvents).toBe(
    'auto',
  );

  await selectEntropyTool(app!, 'dice');

  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'auto',
  );
  expect(app!.root.findByProps({ testID: 'cards-screen-safe-area' }).props.pointerEvents).toBe(
    'none',
  );
});
