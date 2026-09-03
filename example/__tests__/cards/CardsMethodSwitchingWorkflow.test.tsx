/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';

test('preserves the Ian Coleman preference while switching card methods', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'cards');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-ian-coleman-toggle' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'card-ian-coleman-toggle' }).props.accessibilityState,
  ).toEqual({ checked: true });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
  });
  expect(app!.root.findAllByProps({ testID: 'card-ian-coleman-toggle' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'card-method-hashed' }).props.onPress();
  });
  expect(
    app!.root.findByProps({ testID: 'card-ian-coleman-toggle' }).props.accessibilityState,
  ).toEqual({ checked: true });
});