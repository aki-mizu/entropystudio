/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';

test('converts a valid draft while switching Seed Phrase entry methods', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'seed');
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });
  expect(
    app!
      .root.findByProps({ testID: 'seed-phrase-entry-view' })
      .findAllByProps({ testID: 'seed-phrase-help-scroll' }),
  ).toHaveLength(0);
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'seed-phrase-input' }).props.onChangeText('abandon about');
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-seed-phrase-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'seed-method-numbers' }).props.onPress();
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });
  expect(
    app!
      .root.findByProps({ testID: 'seed-phrase-entry-view' })
      .findAllByProps({ testID: 'seed-phrase-help-scroll' }),
  ).toHaveLength(0);
  expect(app!.root.findByProps({ testID: 'seed-number-input' }).props.value).toBe('1 4');

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'close-seed-phrase-entry' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'seed-method-words' }).props.onPress();
    app!.root.findByProps({ testID: 'open-seed-phrase-entry' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'seed-phrase-input' }).props.value).toBe(
    'abandon about',
  );
});