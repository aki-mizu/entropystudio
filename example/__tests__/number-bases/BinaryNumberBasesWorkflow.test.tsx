/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe('Number Bases / Binary', () => {
  test('enters binary entropy through the on-screen keypad', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    expect(
      app!.root.findByProps({ testID: 'number-base-format-requirement' }).props.children,
    ).toBe(UPSTREAM_UI_FALLBACK_COPY.numberBases.requirement(24, 256, 'binary digits'));
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-bin' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(
      app!.root.findByProps({
        accessibilityLabel: UPSTREAM_TEXT.hex.keypadAria.replace(
          '{label}',
          UPSTREAM_TEXT.hex.format.bin,
        ),
      }),
    ).toBeDefined();
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