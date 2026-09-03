/**
 * @format
 */

import {
  activeMethodList,
  App,
  entropyLabEnglish,
  mockPrivateKeyEntropy,
  mockPrivateKeyInputState,
  mockPrivateKeyKeyAllowed,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';

const WIF = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';

describe('Private Key', () => {
  test('validates a private key through the native binding without rendering a seed phrase', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'key');

    expect(app!.root.findByProps({ testID: 'private-key-setup-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'private-key-screen-title' }).props.children).toBe(
      entropyLabEnglish['mode.key'],
    );
    expect(
      activeMethodList(app!).findByProps({ testID: 'key-method-key' }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(app!.root.findByProps({ testID: 'private-key-format-wif' }).props.accessibilityState).toEqual({
      selected: true,
    });

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-private-key-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.placeholder).toBe(
      entropyLabEnglish['key.placeholderWif'],
    );
    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(app!.root.findByProps({ testID: 'derive-private-key' }).props.disabled).toBe(true);
    expect(app!.root.findAllByProps({ testID: 'private-key-words' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '0 of 51 or 52 WIF characters entered · starts with 5, K, or L',
    );
    expect(app!.root.findByProps({ testID: 'private-key-prefix-keypad' })).toBeDefined();
    expect(app!.root.findAllByProps({ testID: 'private-key-keypad-mode' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'private-key-key-5' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-key-K' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-key-L' }).props.disabled).toBe(false);
    expect(app!.root.findAllByProps({ testID: 'private-key-key-9' })).toHaveLength(0);
    expect(app!.root.findAllByProps({ testID: 'private-key-key-c' })).toHaveLength(0);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-key-5' }).props.onPress();
    });

    expect(mockPrivateKeyKeyAllowed).toHaveBeenCalledWith('', 0, 0, '5', 0);
    expect(mockPrivateKeyInputState).toHaveBeenCalledWith('5', 0);
    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.value).toBe('5');
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '1 of 51 WIF characters entered · 50 remaining',
    );
    expect(app!.root.findAllByProps({ testID: 'private-key-status' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'private-key-keypad' }).props.accessibilityLabel).toBe(
      'On-screen number WIF keyboard',
    );
    expect(app!.root.findByProps({ testID: 'private-key-key-1' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-key-0' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'private-key-undo' }).props.disabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-undo' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.value).toBe('');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-input' }).props.onChangeText(WIF);
    });

    expect(mockPrivateKeyEntropy).toHaveBeenLastCalledWith(WIF, 0);
    expect(app!.root.findByProps({ testID: 'derive-private-key' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '52 of 52 WIF characters entered · Bitcoin mainnet checksum valid · ready to derive',
    );
    expect(app!.root.findAllByProps({ testID: 'private-key-words' })).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'derive-private-key' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'result-entropy-label' }).props.children).toBe(
      entropyLabEnglish['result.privateKey'],
    );
    expect(app!.root.findByProps({ testID: 'entropy-output' }).props.children).toBe('0'.repeat(64));
  });

  test('uses a direct hexadecimal grid and an enabled brain-wallet space key', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'key');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-format-hex' }).props.onPress();
      app!.root.findByProps({ testID: 'open-private-key-entry' }).props.onPress();
    });

    expect(app!.root.findAllByProps({ testID: 'private-key-keypad-mode' })).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'private-key-key-A' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '0 of 64 hexadecimal characters entered · 64 remaining',
    );
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-key-A' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.value).toBe('A');
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '1 of 64 hexadecimal characters entered · 63 remaining',
    );

    await ReactTestRenderer.act(async () => {
      app!
        .root.findByProps({ testID: 'private-key-input' })
        .props.onSelectionChange({ nativeEvent: { selection: { end: 1, start: 0 } } });
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-key-0' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.value).toBe('0');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'close-private-key-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-format-brain' }).props.onPress();
      app!.root.findByProps({ testID: 'open-private-key-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'private-key-key-space' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      'No text entered · brain wallets are unsafe',
    );
  });

  test('gates a Mini key behind its mandatory S prefix and opens uppercase input', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'key');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-format-mini' }).props.onPress();
      app!.root.findByProps({ testID: 'open-private-key-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'private-key-prefix-keypad' }).props.accessibilityLabel).toBe(
      'Choose the first Mini key character',
    );
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '0 of 22 or 30 Mini-key characters entered · must start with S',
    );
    expect(app!.root.findByProps({ testID: 'private-key-key-S' }).props.disabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-key-S' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'private-key-input' }).props.value).toBe('S');
    expect(app!.root.findByProps({ testID: 'private-key-progress' }).props.children).toBe(
      '1 of 22 Mini-key characters entered · 21 remaining',
    );
    expect(app!.root.findByProps({ testID: 'private-key-keypad' }).props.accessibilityLabel).toBe(
      'On-screen upper Mini key keyboard',
    );
    expect(app!.root.findByProps({ testID: 'private-key-key-A' }).props.disabled).toBe(false);
  });

  test('keeps format selection in the UI and renders native validation errors', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'key');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-format-brain' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'private-key-format-brain' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-format-wif' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'open-private-key-entry' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'private-key-input' }).props.onChangeText('not-a-wif');
    });

    expect(app!.root.findByProps({ testID: 'private-key-status' }).props.children).toBe(
      entropyLabEnglish['error.priv.wif']
        .replace('{network}', 'Bitcoin mainnet')
        .replace('{hint}', '5/K/L'),
    );
  });
});