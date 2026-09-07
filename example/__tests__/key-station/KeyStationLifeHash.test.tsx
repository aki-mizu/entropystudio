import {
  mockLifehashFromFingerprint,
  React,
  ReactTestRenderer,
} from '../../test/testSupport';
import { KeyStationLifeHash } from '../../src/features/keyStation/components/KeyStationLifeHash';

afterEach(() => {
  mockLifehashFromFingerprint.mockReset();
  mockLifehashFromFingerprint.mockReturnValue('');
});

test('renders the native LifeHash data URL for a fingerprint', async () => {
  const image = 'data:image/png;base64,upstream-lifehash';
  mockLifehashFromFingerprint.mockReturnValue(image);

  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <KeyStationLifeHash fingerprint="73c5da0a" imageTestID="lifehash" />,
    );
  });

  expect(mockLifehashFromFingerprint).toHaveBeenCalledWith('73c5da0a');
  expect(app!.root.findByProps({ testID: 'lifehash' }).props.source).toEqual({ uri: image });
});

test('does not render an image without a fingerprint', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<KeyStationLifeHash fingerprint="" imageTestID="lifehash" />);
  });

  expect(mockLifehashFromFingerprint).not.toHaveBeenCalled();
  expect(app!.root.findAllByProps({ testID: 'lifehash' })).toHaveLength(0);
});