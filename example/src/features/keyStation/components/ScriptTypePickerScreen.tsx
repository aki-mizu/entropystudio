import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NativeSelect, type NativeSelectOption } from '../../../components/NativeSelect';
import type { DiceColors } from '../../dice/diceTheme';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../../upstreamUiCopy';
import { KEY_STATION_SCRIPT_TYPES, type KeyStationScriptType } from '../keyStation';

type Props = {
  readonly colors: DiceColors;
  readonly network: string;
  readonly onBack: () => void;
  readonly onSetScriptType: (scriptType: KeyStationScriptType) => void;
  readonly purpose: string;
  readonly scriptType: KeyStationScriptType;
};

const SCRIPT_TYPE_OPTIONS: readonly NativeSelectOption<KeyStationScriptType>[] =
  KEY_STATION_SCRIPT_TYPES.map(({ id }) => ({
    label: UPSTREAM_TEXT.keys.scriptTypes[id],
    value: id,
  }));

/** A focused, native-picker screen matching EntropyLab's Script type control. */
export function ScriptTypePickerScreen({
  colors,
  network,
  onBack,
  onSetScriptType,
  purpose,
  scriptType,
}: Props) {
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]} testID="key-station-script-type-screen">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
          testID="close-key-station-script-type"
        >
          <Text style={[styles.backButtonText, { color: colors.accent }]}>
            {UPSTREAM_UI_FALLBACK_COPY.common.back}
          </Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.muted }]}>{UPSTREAM_TEXT.keys.scriptType}</Text>
        <NativeSelect
          accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
          controlTestID="key-station-script-type-picker"
          colors={colors}
          onValueChange={onSetScriptType}
          options={SCRIPT_TYPE_OPTIONS}
          selectedValue={scriptType}
        />
        <Text
          style={[styles.descriptionKicker, { color: colors.muted }]}
          testID="key-station-script-type-kicker"
        >
          {UPSTREAM_UI_FALLBACK_COPY.keys.scriptTypeKicker(purpose, network)}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]} testID="key-station-script-type-description">
          {UPSTREAM_UI_LABELS.scriptBeginner[scriptType]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingVertical: 6 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 22 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  descriptionKicker: { fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 12 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 24,
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  screen: { flex: 1 },
});
