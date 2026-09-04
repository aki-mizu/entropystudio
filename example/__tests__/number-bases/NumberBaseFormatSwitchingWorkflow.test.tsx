/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import { UPSTREAM_UI_FALLBACK_COPY, UPSTREAM_UI_LABELS } from '../../src/features/upstreamUiCopy';

test('preserves independent drafts while switching Number Bases formats', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'hex');
  const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
  await ReactTestRenderer.act(async () => {
    numberBasesSetup.findByProps({ testID: 'number-base-format-hex' }).props.onPress();
    numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-input' }).props.onChangeText('0A');
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-number-bases-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
  });
  const base64 = UPSTREAM_UI_LABELS.hexFormat.base64;
  expect(app!.root.findByProps({ testID: 'number-base-format-requirement' }).props.children).toBe(
    `${UPSTREAM_UI_FALLBACK_COPY.numberBases.requirement(24, 46, base64.unit)}${UPSTREAM_UI_FALLBACK_COPY.numberBases.setupRemainderBinary(42, base64.shortLabel, 4)}`,
  );
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-input' }).props.onChangeText('A');
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-number-bases-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-hex' }).props.onPress();
    app!.root.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('0A');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-number-bases-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
    app!.root.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'number-base-input' }).props.value).toBe('A');
});