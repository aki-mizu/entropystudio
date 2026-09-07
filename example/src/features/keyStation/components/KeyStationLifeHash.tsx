import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import { lifehashFromFingerprint } from '../../../native/entropyStudio';

type Props = {
  readonly compact?: boolean;
  readonly fingerprint: string;
  readonly imageTestID: string;
  readonly trailing?: boolean;
};

export function KeyStationLifeHash({
  compact = false,
  fingerprint,
  imageTestID,
  trailing = false,
}: Props) {
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
      style={[styles.image, compact && styles.compactImage, compact && trailing && styles.trailingImage]}
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
  compactImage: {
    borderRadius: 4,
    height: 22,
    marginLeft: 0,
    marginRight: 8,
    width: 22,
  },
  trailingImage: {
    marginLeft: 8,
    marginRight: 0,
  },
});