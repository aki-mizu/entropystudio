/**
 * @format
 */

import {
  activeMethodList,
  App,
  mockCardTranscriptToEntropy,
  mockDiceRollsToEntropy,
  mockEntropyToMnemonic,
  mockLifehashFromFingerprint,
  React,
  ReactTestRenderer,
  ScrollView,
  openDiceEntry,
  openCardsEntry,
  selectDiceMethod,
  selectEntropyTool,
  selectSeedPhraseLength,
  mockSynchronizeEntropy,
} from '../test/testSupport';
import { EntropySyncSource } from '../src/native/entropyStudio';
import type { EntropySyncSnapshot } from '../src/native/entropyStudio';
import { diceColors } from '../src/features/dice/diceTheme';
import { STUDIO_UI_TEXT } from '../src/features/studioUiCopy';
import { formatCopy, UPSTREAM_TEXT, UPSTREAM_UI_LABELS } from '../src/features/upstreamUiCopy';

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

test('uses the native method picker for switching workflows', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  const methodList = activeMethodList(app!);
  const picker = methodList.findByProps({ testID: 'key-method-picker' });

  expect(picker.props.mode).toBe('dropdown');
  expect(picker.props.selectedValue).toBe('dice');

  await ReactTestRenderer.act(async () => {
    picker.props.onValueChange('key', 4);
  });

  expect(activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.selectedValue).toBe('key');
  expect(app!.root.findByProps({ testID: 'private-key-setup-view' })).toBeDefined();
});

test('shows Dice, Cards, Number Bases, Seed Phrase, and Private Key workflows on the shared setup screen', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'app-workspace-safe-area' }).props.style).toContainEqual({
    backgroundColor: diceColors(false).background,
  });
  expectStartAction(app!, 'open-dice-entry');
  expect(app!.root.findByProps({ testID: 'app-tab-method' }).props.children.props.children).toBe(
    UPSTREAM_TEXT.keys.tabLabel,
  );
  const diceMethodList = activeMethodList(app!);
  expect(diceMethodList.findByProps({ testID: 'key-method-label' }).props.children).toBe(
    UPSTREAM_TEXT.keys.methodLabel,
  );
  expect(diceMethodList).toBeDefined();
  expect(diceMethodList.findByProps({ testID: 'key-method-picker' }).props.selectedValue).toBe('dice');

  await selectDiceMethod(app!, 'dice-method-coleman');
  await selectEntropyTool(app!, 'cards');
  expect(app!.root.findByProps({ testID: 'cards-screen-title' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'cards-setup-view' })).toBeDefined();
  expectStartAction(app!, 'open-cards-entry');
  expect(app!.root.findAllByProps({ testID: 'cards-entry-view' })).toHaveLength(0);
  expect(
    activeMethodList(app!).findByProps({ testID: 'key-method-picker' }).props.selectedValue,
  ).toBe('cards');
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

test('opens key derivation settings from Dice and Cards entry screens', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  expect(app!.root.findByProps({ testID: 'open-dice-key-settings' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-key-settings-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });

  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-cards-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'open-cards-key-settings' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-cards-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-key-settings-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-cards-key-settings' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-entry-view' })).toBeDefined();
});

test('Edit input returns to the originating Dice input screen', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-setup-view' })).toBeDefined();
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');
});

test('Edit input follows the selected tab method', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockCardTranscriptToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });

  await selectEntropyTool(app!, 'cards');
  await openCardsEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-transcript-input' }).props.onChangeText('4H 3H');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-card-phrase' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-entry-header-copy' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-2' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'cards-entry-view' })).toBeDefined();
  expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('4h 3h');
});

test('Edit input restores the selected Dice tab input', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('6');
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('6');
  expect(app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('1');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-dice-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-2' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'dice-rolls-input' }).props.value).toBe('6');
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

test('keeps derived keys in removable Key Station tabs', async () => {
  const entropy = new Uint8Array(16).buffer;
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  mockDiceRollsToEntropy.mockReturnValue(entropy);
  mockEntropyToMnemonic.mockReturnValue(mnemonic);
    mockLifehashFromFingerprint.mockReturnValue('data:image/png;base64,lifehash');

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.children.props.children).toBe(
    UPSTREAM_TEXT.keys.station,
  );
  expect(app!.root.findByProps({ testID: 'key-station-add' }).props.accessibilityLabel).toBe(
    UPSTREAM_TEXT.keys.add,
  );
  expect(app!.root.findByProps({ testID: 'key-station-delete' }).props.disabled).toBe(true);

  await openDiceEntry(app!);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'dice-rolls-input' }).props.onChangeText('1');
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'key-station-tab-1' }).props.children.props.children).toBe(
    '73c5da0a',
  );
  expect(app!.root.findByProps({ testID: 'key-station-master-fingerprint-value' }).props.children).toBe(
    '73c5da0a',
  );
  expect(app!.root.findByProps({ testID: 'key-station-method-value' }).props.children).toBe(
    UPSTREAM_UI_LABELS.keyMode.dice,
  );
  expect(app!.root.findByProps({ testID: 'key-station-script-value' }).props.children).toBe(
    UPSTREAM_TEXT.keys.scriptTypes.bip84,
  );
  expect(app!.root.findByProps({ testID: 'key-station-path-value' }).props.children).toBe(
    "m/84'/0'/0'/0/0",
  );
  expect(app!.root.findByProps({ testID: 'key-station-edit-inputs' }).props.accessibilityLabel).toBe(
    UPSTREAM_TEXT.keys.editInput,
  );
  expect(
    app!.root.findByProps({ testID: 'key-station-master-fingerprint-lifehash' }).props.source,
  ).toEqual({ uri: 'data:image/png;base64,lifehash' });
  mockLifehashFromFingerprint.mockReset();
  mockLifehashFromFingerprint.mockReturnValue('');
  expect(app!.root.findByProps({ testID: 'key-station-tab-1' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(app!.root.findByProps({ testID: 'key-station-delete' }).props.disabled).toBe(false);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-add' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'derive-dice-phrase' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'key-station-tab-2' })).toBeDefined();

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-tab-1' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-delete' }).props.onPress();
  });

  expect(app!.root.findAllByProps({ testID: 'key-station-tab-1' })).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'key-station-tab-2' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'key-station-delete' }).props.onPress();
  });
  expect(app!.root.findAllByProps({ testID: 'key-station-tab-2' })).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'key-station-tab-lab' }).props.accessibilityState).toEqual({
    selected: true,
  });
});

test('keeps every method setup view fixed', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  for (const [tool, setupView] of [
    ['dice', 'dice-setup-view'],
    ['cards', 'cards-setup-view'],
    ['hex', 'number-bases-setup-view'],
    ['seed', 'seed-phrase-setup-view'],
    ['key', 'private-key-setup-view'],
  ] as const) {
    await selectEntropyTool(app!, tool);
    expect(app!.root.findByProps({ testID: setupView }).findAllByType(ScrollView)).toHaveLength(0);
  }

  await selectEntropyTool(app!, 'hex');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base32' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'number-bases-setup-view' }).findAllByType(ScrollView),
  ).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'number-bases-setup-view' }).findAllByType(ScrollView),
  ).toHaveLength(0);
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

  expect(
    app!.root.findByProps({ testID: 'number-base-format-requirement' }).props.children,
  ).toBe(
    formatCopy(UPSTREAM_TEXT.numberBases.requirement, {
      digits: 128,
      unit: 'binary digits',
      words: 12,
    }),
  );

  await selectEntropyTool(app!, 'seed');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe(
    SYNCED_ZERO_ENTROPY_SNAPSHOT.seedWords,
  );
});
