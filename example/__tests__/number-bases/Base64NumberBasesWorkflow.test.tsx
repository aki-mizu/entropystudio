/**
 * @format
 */

import {
  App,
  React,
  ReactTestRenderer,
  ScrollView,
  selectEntropyTool,
} from '../../test/testSupport';

describe('Number Bases / Base64', () => {
  test('uses the upstream-style soft keyboard', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-key-a' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-z' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-space' }).props.disabled).toBe(true);
    expect(app!.root.findByProps({ testID: 'number-base-keypad-mode' }).props.accessibilityLabel).toBe(
      'Change Base64 keyboard character mode',
    );

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-keypad-mode' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-key-A' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-Z' })).toBeDefined();

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'number-base-keypad-mode' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-key-0' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-9' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-+' })).toBeDefined();
    expect(app!.root.findByProps({ testID: 'number-base-key-/' })).toBeDefined();
  });

  test('matches EntropyLab coin-flip progress text exactly', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'hex');
    const numberBasesSetup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
    await ReactTestRenderer.act(async () => {
      numberBasesSetup.findByProps({ testID: 'number-base-format-base64' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'word-count-21' }).props.onPress();
      numberBasesSetup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'number-base-help' }).props.children).toBe(
      'Each complete Base64 character contributes 6 bits. Seed-word cards fill as enough bits arrive; the checksum-derived final word appears when all 39 characters are entered. Enter 37 complete Base64 characters; the controls and progress message then switch to 2 coin flip(s), using Heads (0) or Tails (1). No generator \u2014 enter entropy you already created.',
    );
    expect(
      app!
        .root.findByProps({ testID: 'number-bases-entry-view' })
        .findAllByType(ScrollView),
    ).toHaveLength(1);
    expect(app!.root.findByProps({ testID: 'number-base-help-scroll' }).props.nestedScrollEnabled).toBe(
      true,
    );
    expect(app!.root.findByProps({ testID: 'number-base-help-scroll' }).props.overScrollMode).toBe(
      'never',
    );

    const input = app!.root.findByProps({ testID: 'number-base-input' });
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('A'.repeat(37));
    });

    expect(app!.root.findByProps({ testID: 'number-base-progress' }).props.children).toBe(
      '37 Base64 characters complete \u00B7 coin flip 1 of 2 \u00B7 Heads (0) or Tails (1)',
    );

    await ReactTestRenderer.act(async () => {
      input.props.onChangeText(`${'A'.repeat(37)}01`);
    });

    expect(app!.root.findByProps({ testID: 'number-base-progress' }).props.children).toBe(
      '37 Base64 characters complete \u00B7 2 of 2 coin flips entered \u00B7 ready to derive',
    );
  });
});