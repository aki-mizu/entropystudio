/**
 * @format
 */

import {
  activeMethodList,
  App,
  React,
  ReactTestRenderer,
  selectDiceMethod,
  selectEntropyTool,
  selectSeedPhraseLength,
  mockSynchronizeEntropy,
} from '../test/testSupport';
import { EntropySyncSource } from '../src/native/entropyStudio';
import type { EntropySyncSnapshot } from '../src/native/entropyStudio';
import { STUDIO_UI_TEXT } from '../src/features/studioUiCopy';
import { UPSTREAM_TEXT } from '../src/features/upstreamUiCopy';

const SYNCED_ZERO_ENTROPY_SNAPSHOT: EntropySyncSnapshot = {
  base4: '',
  base8: '',
  base32: '',
  base64: '',
  bin: '',
  bitCount: 128,
  bitboxDice: '',
  d8D16Dice: '',
  directCards: '',
  effectiveEntropyBits: 128,
  entropyBelowMinimum: false,
  entropyStrengthUnknown: false,
  hex: '',
  hexPrivateKey: '',
  minimumEntropyBits: 128,
  seedNumbersOneIndexed: '1 1 1 1 1 1 1 1 1 1 1 4',
  seedNumbersZeroIndexed: '0 0 0 0 0 0 0 0 0 0 0 3',
  seedWords: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  wifPrivateKey: '',
};

function expectStartAction(app: ReactTestRenderer.ReactTestRenderer, testID: string) {
  const button = app.root.findByProps({ testID });
  expect(button.props.accessibilityLabel).toBe(STUDIO_UI_TEXT.actions.start);
  expect(button.props.children.props.children).toBe(STUDIO_UI_TEXT.actions.start);
}

test('shows Dice, Cards, Number Bases, Seed Phrase, and Private Key workflows on the shared setup screen', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  expectStartAction(app!, 'open-dice-entry');
  const diceMethodList = activeMethodList(app!);
  expect(diceMethodList.findByProps({ testID: 'key-method-label' }).props.children).toBe(
    UPSTREAM_TEXT.keys.methodLabel,
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
  expectStartAction(app!, 'open-cards-entry');
  expect(app!.root.findAllByProps({ testID: 'cards-entry-view' })).toHaveLength(0);
  expect(
    activeMethodList(app!).findByProps({ testID: 'key-method-cards' }).props.accessibilityState,
  ).toEqual({
    selected: true,
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
  });

  await selectEntropyTool(app!, 'hex');
  expectStartAction(app!, 'open-number-bases-entry');

  await selectEntropyTool(app!, 'seed');
  expectStartAction(app!, 'open-seed-phrase-entry');

  await selectEntropyTool(app!, 'key');
  expectStartAction(app!, 'open-private-key-entry');

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

test('syncs entropy across methods through the native snapshot', async () => {
  mockSynchronizeEntropy.mockReset();
  mockSynchronizeEntropy.mockReturnValue(SYNCED_ZERO_ENTROPY_SNAPSHOT);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'hex');
  await selectSeedPhraseLength(app!, 12);
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'app-tab-settings' })
      .props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'entropy-sync-settings-toggle' })
      .props.onValueChange(true);
  });

  expect(mockSynchronizeEntropy).toHaveBeenLastCalledWith(
    '',
    EntropySyncSource.NumberBaseBin,
    12,
    false,
    '',
  );
  expect(
    app!.root.findByProps({ testID: 'entropy-sync-settings-status' }).props.children,
  ).toBe(UPSTREAM_TEXT.sync.status);
  expect(app!.root.findAllByProps({ testID: 'entropy-sync-settings-caution' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'app-tab-method' })
      .props.onPress();
  });

  await selectEntropyTool(app!, 'seed');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe(
    SYNCED_ZERO_ENTROPY_SNAPSHOT.seedWords,
  );
});
