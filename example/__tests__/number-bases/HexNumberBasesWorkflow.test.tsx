/**
 * @format
 */

import {
  activeMethodList,
  App,
  entropyLabEnglish,
  mockEntropyToMnemonic,
  React,
  ReactTestRenderer,
  ScrollView,
  selectEntropyTool,
} from '../../test/testSupport';
import {
  numberBaseFormatConfig,
} from '../../src/features/numberBases/numberBases';
import { expectZeroEntropy } from '../../test/numberBaseTestSupport';

describe('Number Bases / Hexadecimal', () => {
  test('uses the same digit count as EntropyLab', () => {
    expect(numberBaseFormatConfig('hex', 12)).toMatchObject({
      digits: 32,
      finalCharacters: '0123456789ABCDEF',
    });
  });

  test('converts zero entropy', () => {
    expectZeroEntropy('hex', '0'.repeat(32));
  });

  test('derives entropy through the native BIP39 binding', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    mockEntropyToMnemonic.mockReturnValue(mnemonic);

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');

    expect(app!.root.findByProps({ testID: 'number-bases-setup-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-bases-screen-title' }).props.children).toBe(
      entropyLabEnglish['mode.hex'],
    );
    expect(
      activeMethodList(app!).findByProps({ testID: 'key-method-hex' }).props.accessibilityState,
    ).toEqual({ selected: true });

    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-hex' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'word-count-12' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-bases-entry-view' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.placeholder).toBe(
      'Enter 32 hexadecimal characters',
    );
    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.showSoftInputOnFocus).toBe(
      false,
    );
    expect(
      app!
        .root.findByProps({ testID: 'number-bases-entry-view' })
        .findAllByType(ScrollView),
    ).toHaveLength(0);
    expect(app!.root.findByProps({ testID: 'derive-number-base-phrase' }).props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-A' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('0A');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-undo' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('0');

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-input' }).props.onChangeText('0'.repeat(32));
    });

    expect(app!.root.findByProps({ testID: 'derive-number-base-phrase' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-words-word-1' }).props.children).toBe(
      'abandon',
    );
    expect(app!.root.findByProps({ testID: 'number-base-words-word-12' }).props.children).toBe(
      'about',
    );
    expect(mockEntropyToMnemonic).toHaveBeenLastCalledWith(expect.any(ArrayBuffer));
  });
});