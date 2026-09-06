/**
 * @format
 */

import {
  App,
  mockNumberBaseCalculations,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../../src/features/upstreamUiCopy';

test('opens Base 4 calculations from the number-base key-input screen', async () => {
  mockNumberBaseCalculations.mockReturnValue({
    digitValues: [
      { bits: '00', digit: '0' },
      { bits: '01', digit: '1' },
      { bits: '10', digit: '2' },
      { bits: '11', digit: '3' },
    ],
    rows: [
      {
        index: 1,
        number: 1,
        terms: [
          { bit: 0, bitWeight: 1024, contribution: 0 },
          { bit: 0, bitWeight: 512, contribution: 0 },
          { bit: 0, bitWeight: 256, contribution: 0 },
          { bit: 0, bitWeight: 128, contribution: 0 },
          { bit: 0, bitWeight: 64, contribution: 0 },
          { bit: 0, bitWeight: 32, contribution: 0 },
          { bit: 0, bitWeight: 16, contribution: 0 },
          { bit: 0, bitWeight: 8, contribution: 0 },
          { bit: 0, bitWeight: 4, contribution: 0 },
          { bit: 0, bitWeight: 2, contribution: 0 },
          { bit: 1, bitWeight: 1, contribution: 1 },
        ],
        word: 'ability',
      },
    ],
  });

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await selectEntropyTool(app!, 'hex');
  const setup = app!.root.findByProps({ testID: 'number-bases-setup-view' });
  await ReactTestRenderer.act(async () => {
    setup.findByProps({ testID: 'number-base-format-base4' }).props.onPress();
    setup.findByProps({ testID: 'open-number-bases-entry' }).props.onPress();
  });

  expect(app!.root.findByProps({ testID: 'open-number-base-calculations' }).props.children.props.children).toBe(
    UPSTREAM_TEXT.calculations.show,
  );
  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'open-number-base-calculations' }).props.onPress();
  });

  expect(
    app!.root.findByProps({ testID: 'number-base-calculations-view-content-title' }).props.children,
  ).toBe(
    UPSTREAM_UI_FALLBACK_COPY.calculations.numberBaseTitle(
      UPSTREAM_UI_LABELS.hexFormat.base4.label,
    ),
  );
  expect(
    app!.root.findByProps({ testID: 'number-base-calculation-conversion-bits-3' }).props.children,
  ).toBe('11');
  expect(
    app!.root.findByProps({ testID: 'number-base-calculation-conversion-arrow-3' }).props.children,
  ).toBe(UPSTREAM_TEXT.calculations.conversionArrow);
  expect(
    app!.root.findByProps({ testID: 'number-base-calculation-row-1-index' }).props.children,
  ).toBe(`${UPSTREAM_TEXT.calculations.bip39Index} 1`);
  expect(
    app!.root.findByProps({ testID: 'number-base-calculation-row-1-word-number' }).props.children,
  ).toBe(`${UPSTREAM_TEXT.calculations.wordNumber} 2`);

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'number-base-calculations-view-back' }).props.onPress();
  });
  expect(app!.root.findByProps({ testID: 'number-bases-entry-view' })).toBeTruthy();
});