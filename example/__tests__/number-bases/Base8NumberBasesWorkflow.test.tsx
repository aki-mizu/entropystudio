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

describe('Number Bases / Octal (Base 8)', () => {
  test('uses the same digit count as EntropyLab', () => {
    expect(numberBaseFormatConfig('base8', 12)).toMatchObject({
      digits: 43,
      finalCharacters: '0123',
    });
  });

  test('converts zero entropy', () => {
    expectZeroEntropy('base8', '0'.repeat(43));
  });

  test('rejects an invalid final digit', () => {
    const invalidFinal = analyzeNumberBaseInput(`${'0'.repeat(42)}4`, 'base8', 12);

    expect(invalidFinal.finalInvalid).toBe(true);
    expect(invalidFinal.isReady).toBe(false);
  });

  test('enters octal entropy through the on-screen keypad', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-base8' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ accessibilityLabel: 'base8 entropy keypad' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-0' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-key-7' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-7' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('70');
  });
});