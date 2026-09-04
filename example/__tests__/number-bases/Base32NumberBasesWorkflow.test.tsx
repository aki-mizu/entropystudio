/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { UPSTREAM_TEXT } from '../../src/features/upstreamUiCopy';

describe('Number Bases / Crockford Base32', () => {
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

    expect(
      app!.root.findByProps({
        accessibilityLabel: UPSTREAM_TEXT.hex.keypadAria.replace(
          '{label}',
          UPSTREAM_TEXT.hex.format.base32,
        ),
      }),
    ).toBeDefined();
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