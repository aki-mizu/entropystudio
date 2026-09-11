import { StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
};

export function KeyStationIntroduction({ colors }: Props) {
  return (
    <View style={styles.container} testID="key-station-introduction">
      <Text style={[styles.title, { color: colors.text }]}>
        {UPSTREAM_TEXT.keys.stationIntroduction.title}
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>
        {UPSTREAM_TEXT.keys.stationIntroduction.heading}
      </Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        {UPSTREAM_TEXT.keys.stationIntroduction.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});