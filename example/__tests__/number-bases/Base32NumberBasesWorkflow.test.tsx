/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import {
  analyzeNumberBaseInput,
  numberBaseFormatConfig,
} from '../../src/features/numberBases/numberBases';
import { expectZeroEntropy } from '../../test/numberBaseTestSupport';

describe('Number Bases / Crockford Base32', () => {
  test('uses the same digit count as EntropyLab', () => {
    expect(numberBaseFormatConfig('base32', 12)).toMatchObject({
      digits: 28,
      fullDigits: 25,
      finalCharacters: '01',
      remainderBits: 3,
    });
  });

  test('converts zero entropy', () => {
    expectZeroEntropy('base32', '0'.repeat(28));
  });

  test('normalizes Crockford aliases', () => {
    const input = `${'O'.repeat(25)}000`;
    const aliases = analyzeNumberBaseInput(input, 'base32', 12);

    expect(aliases.isReady).toBe(true);
    expectZeroEntropy('base32', input);
  });

  test('enters Crockford Base32 entropy through the on-screen keypad', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-base32' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ accessibilityLabel: 'base32 entropy keypad' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-0' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-key-Z' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-Z' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('Z0');
  });
});