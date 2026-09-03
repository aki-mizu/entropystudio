/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { expectZeroEntropy } from '../../test/numberBaseTestSupport';

describe('Number Bases / Binary', () => {
  test('converts zero entropy', () => {
    expectZeroEntropy('bin', '0'.repeat(128));
  });

  test('enters binary entropy through the on-screen keypad', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-bin' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ accessibilityLabel: 'bin entropy keypad' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-0' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-key-1' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-1' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('10');
  });
});