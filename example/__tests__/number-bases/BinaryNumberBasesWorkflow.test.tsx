/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { UPSTREAM_UI_FALLBACK_COPY } from '../../src/features/upstreamUiCopy';

describe('Number Bases / Binary', () => {
  test('keeps deletion outside the binary controls', async () => {
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

    expect(app!.root.findByProps({ testID: 'number-base-key-0' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-key-1' }).props.disabled).toBe(false);
    expect(app!.root.findByProps({ testID: 'number-base-undo' }).props.disabled).toBe(true);
    expect(
      app!
        .root
        .findByProps({ testID: 'number-base-keypad' })
        .findAllByProps({ testID: 'number-base-undo' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-1' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-key-0' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('10');
    expect(app!.root.findByProps({ testID: 'number-base-undo' }).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-undo' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('1');
  });
});