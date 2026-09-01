/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

const mockMnemonicToEntropy = jest.fn<ArrayBuffer, [string]>();

jest.mock('entropystudio', () => ({
  mnemonicToEntropy: mockMnemonicToEntropy,
}));

const App = require('../App').default;

test('derives BIP39 entropy through the EntropyStudio binding', async () => {
  mockMnemonicToEntropy.mockReturnValue(new Uint8Array(16).buffer);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    app!.root.findByProps({ testID: 'verify-bip39' }).props.onPress();
  });

  expect(mockMnemonicToEntropy).toHaveBeenCalledWith(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  );
  expect(
    app!.root.findByProps({ testID: 'entropy-output' }).props.children,
  ).toBe('00000000000000000000000000000000');
});
