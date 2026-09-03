/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';

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