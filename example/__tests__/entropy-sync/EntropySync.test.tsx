/**
 * @format
 */

import {
  App,
  mockSynchronizeEntropy,
  React,
  ReactTestRenderer,
} from '../../test/testSupport';
import { EntropySyncSource } from '../../src/native/entropyStudio';
import type { EntropySyncSnapshot } from '../../src/native/entropyStudio';
import { STUDIO_UI_TEXT } from '../../src/features/studioUiCopy';
import {
  formatCopy,
  UPSTREAM_TEXT,
} from '../../src/features/upstreamUiCopy';

const SYNCED_ENTROPY_SNAPSHOT: EntropySyncSnapshot = {
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
  seedNumbersOneIndexed: '',
  seedNumbersZeroIndexed: '',
  seedWords: '',
  wifPrivateKey: '',
};

const SYNCED_SHORT_ENTROPY_SNAPSHOT: EntropySyncSnapshot = {
  ...SYNCED_ENTROPY_SNAPSHOT,
  effectiveEntropyBits: 15,
  entropyBelowMinimum: true,
};

const SYNCED_UNKNOWN_ENTROPY_SNAPSHOT: EntropySyncSnapshot = {
  ...SYNCED_ENTROPY_SNAPSHOT,
  entropyStrengthUnknown: true,
};

test('starts entropy synchronization disabled', async () => {
  mockSynchronizeEntropy.mockReset();

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  expect(app!.root.findAllByProps({ testID: 'dice-entropy-sync' })).toHaveLength(0);
  expect(app!.root.findAllByProps({ testID: 'open-entropy-sync-settings' })).toHaveLength(0);
  expect(
    app!
      .root.findByProps({ testID: 'dice-setup-view' })
      .findAllByProps({ testID: 'word-count-24' }),
  ).toHaveLength(0);
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'app-tab-settings' })
      .props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'app-tab-settings' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(app!.root.findByProps({ testID: 'app-tab-settings' }).props.accessibilityLabel).toBe(
    STUDIO_UI_TEXT.navigation.settings,
  );
  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'none',
  );
  expect(
    app!.root.findByProps({ testID: 'entropy-sync-settings-safe-area' }).props.pointerEvents,
  ).toBe('auto');
  expect(app!.root.findByProps({ testID: 'word-count-24' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(app!.root.findByProps({ testID: 'entropy-sync-settings-toggle' }).props.value).toBe(false);
  expect(app!.root.findAllByProps({ testID: 'entropy-sync-settings-status' })).toHaveLength(0);
  expect(mockSynchronizeEntropy).not.toHaveBeenCalled();

  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'app-tab-method' })
      .props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'app-tab-method' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(app!.root.findByProps({ testID: 'dice-screen-safe-area' }).props.pointerEvents).toBe(
    'auto',
  );
});

test('updates synchronized entropy when Settings changes seed phrase length', async () => {
  mockSynchronizeEntropy.mockReset();
  mockSynchronizeEntropy.mockReturnValue(SYNCED_ENTROPY_SNAPSHOT);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

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
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'word-count-12' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'word-count-12' }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(mockSynchronizeEntropy).toHaveBeenLastCalledWith(
    '',
    EntropySyncSource.DiceColdcard,
    12,
    false,
    '',
  );
});

test('shows native shortfall and unknown-strength cautions for synced entropy', async () => {
  mockSynchronizeEntropy.mockReset();
  mockSynchronizeEntropy.mockReturnValue(SYNCED_SHORT_ENTROPY_SNAPSHOT);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

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

  expect(app!.root.findByProps({ testID: 'entropy-sync-settings-caution' }).props.children).toBe(
    formatCopy(UPSTREAM_TEXT.sync.shortfall, { min: 128, n: 15 }),
  );

  mockSynchronizeEntropy.mockReturnValue(SYNCED_UNKNOWN_ENTROPY_SNAPSHOT);
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'entropy-sync-settings-toggle' })
      .props.onValueChange(false);
  });
  await ReactTestRenderer.act(async () => {
    app!
      .root.findByProps({ testID: 'entropy-sync-settings-toggle' })
      .props.onValueChange(true);
  });

  expect(app!.root.findByProps({ testID: 'entropy-sync-settings-caution' }).props.children).toBe(
    UPSTREAM_TEXT.sync.entropyUnknown,
  );
});