/**
 * @format
 */

import {
  App,
  entropyLabEnglish,
  mockCardTranscriptToEntropy,
  mockEntropyToMnemonic,
  openCardsEntry,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe('Hashed cards', () => {
  test('derives a hashed card transcript through the native binding', async () => {
    const entropy = new Uint8Array(16).buffer;
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockCardTranscriptToEntropy.mockReset();
    mockEntropyToMnemonic.mockReset();
    mockCardTranscriptToEntropy.mockReturnValue(entropy);
    mockEntropyToMnemonic.mockReturnValue(mnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'cards');
    expect(app!.root.findByProps({ testID: 'cards-screen-title' }).props.children).toBe(
      entropyLabEnglish['mode.cards'],
    );
    await openCardsEntry(app!);
    expect(app!.root.findByProps({ testID: 'cards-entry-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'card-input-label' }).props.children).toBe(
      entropyLabEnglish['cards.transcript'],
    );
    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(app!.root.findByProps({ testID: 'derive-card-phrase' }).props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-transcript-input' }).props.onChangeText('4H 3H');
    });

    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('4h 3h');
    expect(mockCardTranscriptToEntropy).toHaveBeenCalledWith('4h 3h', 0, 24);
    expect(app!.root.findByProps({ testID: 'derive-card-phrase' }).props.disabled).toBe(false);
    expect(
      app!.root.findByProps({ accessibilityLabel: mnemonic, testID: 'live-card-words' }).props
        .accessibilityLabel,
    ).toBe(mnemonic);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-card-phrase' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'card-result-sheet' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'card-entropy-output' }).props.children).toBe(
      '00000000000000000000000000000000',
    );
  });

  test('uses a checkbox to match Ian Coleman card formatting and hashing', async () => {
    const entropy = new Uint8Array(16).buffer;
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockCardTranscriptToEntropy.mockReset();
    mockEntropyToMnemonic.mockReset();
    mockCardTranscriptToEntropy.mockReturnValue(entropy);
    mockEntropyToMnemonic.mockReturnValue(mnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'cards');
    expect(app!.root.findAllByProps({ testID: 'card-method-coleman' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'card-method-hashed' }).props.accessibilityState).toEqual({
      selected: true,
    });

    const toggle = app!.root.findByProps({ testID: 'card-ian-coleman-toggle' });
    expect(toggle.props.accessibilityRole).toBe('checkbox');
    expect(toggle.props.accessibilityState).toEqual({ checked: false });

    await openCardsEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-transcript-input' }).props.onChangeText('As 2c');
    });
    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('As 2c');
    expect(mockCardTranscriptToEntropy).toHaveBeenLastCalledWith('As 2c', 0, 24);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-cards-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-ian-coleman-toggle' }).props.onPress();
    });
    expect(
      app!.root.findByProps({ testID: 'card-ian-coleman-toggle' }).props.accessibilityState,
    ).toEqual({ checked: true });

    await openCardsEntry(app!);
    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.placeholder).toBe(
      UPSTREAM_UI_FALLBACK_COPY.cards.placeholders.ianColeman,
    );
    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe(
      'A\u2660 2\u2663',
    );
    expect(mockCardTranscriptToEntropy).toHaveBeenLastCalledWith('A\u2660 2\u2663', 1, 24);
  });

  test('blocks invalid card key presses before they enter the transcript', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await selectEntropyTool(app!, 'cards');
    await openCardsEntry(app!);

    const input = app!.root.findByProps({ testID: 'card-transcript-input' });
    const preventInvalid = jest.fn();
    const preventValid = jest.fn();
    input.props.onKeyPress({ nativeEvent: { key: 'B' }, preventDefault: preventInvalid });
    input.props.onKeyPress({ nativeEvent: { key: '4' }, preventDefault: preventValid });

    expect(preventInvalid).toHaveBeenCalledTimes(1);
    expect(preventValid).not.toHaveBeenCalled();
  });

  test('locks other ranks after selecting a hashed card rank', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await selectEntropyTool(app!, 'cards');
    await openCardsEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-rank-4' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'card-rank-4' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'card-rank-3' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'card-rank-K' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'card-suit-H' }).props.disabled).toBe(false);
  });

  test('commits a hashed card after the rank and suit are selected', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });
    await selectEntropyTool(app!, 'cards');
    await openCardsEntry(app!);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-rank-5' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-suit-C' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('5c');
    expect(app!.root.findAllByProps({ testID: 'deal-card' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'card-rank-4' }).props.disabled).toBe(false);
  });
});