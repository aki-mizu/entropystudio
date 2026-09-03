import { jest } from '@jest/globals';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const Picker = ({ children, ...props }) => React.createElement('Picker', props, children);
  Picker.Item = ({ label, value }) => React.createElement('Picker.Item', { label, value });
  return { Picker };
});
