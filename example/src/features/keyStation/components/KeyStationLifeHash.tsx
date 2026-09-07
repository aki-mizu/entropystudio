import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import { lifehashFromFingerprint } from '../../../native/entropyStudio';

type Props = {
  readonly fingerprint: string;
  readonly imageTestID: string;
};

export function KeyStationLifeHash({ fingerprint, imageTestID }: Props) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!fingerprint) {
      setUri(null);
      return;
    }

    try {
      setUri(lifehashFromFingerprint(fingerprint) || null);
    } catch {
      setUri(null);
    }
  }, [fingerprint]);

  if (!uri) {
    return null;
  }

  return (
    <Image
      accessible={false}
      resizeMode="cover"
      source={{ uri }}
      style={styles.image}
      testID={imageTestID}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 8,
    height: 48,
    marginLeft: 8,
    width: 48,
  },
});