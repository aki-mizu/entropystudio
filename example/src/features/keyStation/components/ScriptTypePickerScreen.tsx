import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NativeSelect, type NativeSelectOption } from '../../../components/NativeSelect';
import type { DiceColors } from '../../dice/diceTheme';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../../upstreamUiCopy';
import { KEY_STATION_SCRIPT_TYPES, type KeyStationScriptType } from '../keyStation';
import {
  AccountScriptType,
  accountPrivateMaterial,
  type AccountPrivateMaterial,
} from '../../../native/entropyStudio';

type Props = {
  readonly colors: DiceColors;
  readonly network: string;
  readonly onBack: () => void;
  readonly onSetScriptType: (scriptType: KeyStationScriptType) => void;
  readonly purpose: string;
  readonly privateAccountMaterialInput?: {
    readonly accountPath: string;
    readonly masterFingerprint: string;
    readonly mnemonic: string;
    readonly passphrase: string;
    readonly addressHardened: boolean;
    readonly branchHardened: boolean;
  };
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
  privateAccountMaterialInput,
  purpose,
  scriptType,
}: Props) {
  const [privateMaterial, setPrivateMaterial] = useState<AccountPrivateMaterial | null>(null);
  const [showingPrivateMaterial, setShowingPrivateMaterial] = useState(false);

  useEffect(() => {
    setPrivateMaterial(null);
    setShowingPrivateMaterial(false);
  }, [scriptType, privateAccountMaterialInput?.accountPath]);

  const revealPrivateMaterial = () => {
    if (!showingPrivateMaterial && !privateMaterial && privateAccountMaterialInput) {
      setPrivateMaterial(
        accountPrivateMaterial(
          privateAccountMaterialInput.mnemonic,
          privateAccountMaterialInput.passphrase,
          privateAccountMaterialInput.accountPath,
          privateAccountMaterialInput.masterFingerprint,
          nativeScriptType(scriptType),
          privateAccountMaterialInput.branchHardened,
          privateAccountMaterialInput.addressHardened,
        ),
      );
    }
    setShowingPrivateMaterial(value => !value);
  };

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        {privateAccountMaterialInput ? (
          <View style={styles.privateMaterialSection}>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.privateAccountMaterial}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingPrivateMaterial }}
              onPress={revealPrivateMaterial}
              style={({ pressed }) => [
                styles.privateMaterialButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-private-account-material"
            >
              <Text style={[styles.privateMaterialTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.privateAccountMaterial}
              </Text>
            </Pressable>
            {showingPrivateMaterial && privateMaterial ? (
              <View testID="private-account-material">
                <Text style={[styles.privateMaterialIntro, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.privateAccountMaterialIntro}
                </Text>
                <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                  {UPSTREAM_UI_FALLBACK_COPY.result.bitcoinCore('xprv')}
                </Text>
                <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                  {privateMaterial.bitcoinCoreXprv}
                </Text>
                {privateMaterial.slip132Private ? (
                  <>
                    <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                      {UPSTREAM_UI_FALLBACK_COPY.result.slip132(
                        privateMaterial.slip132PrivateLabel ?? '',
                      )}
                    </Text>
                    <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                      {privateMaterial.slip132Private}
                    </Text>
                  </>
                ) : null}
                <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                  {UPSTREAM_UI_FALLBACK_COPY.result.spendingDescriptor('Change')}
                </Text>
                <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                  {privateMaterial.spendingChangeDescriptor}
                </Text>
                {privateMaterial.slip132Private ? (
                  <View style={[styles.genericCompatibilitySection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                      {UPSTREAM_UI_FALLBACK_COPY.result.genericDescriptorCompatibility('xprv')}
                    </Text>
                    <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                      {privateMaterial.bitcoinCoreXprv}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.privateMaterialWarning, { color: colors.muted }]}>
                  <Text style={styles.privateMaterialWarningLead}>
                    {UPSTREAM_TEXT.result.privateAccountMaterialWarningLead}
                  </Text>{' '}
                  {UPSTREAM_TEXT.result.privateAccountMaterialWarningTail}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingVertical: 6 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 28, paddingHorizontal: 24, paddingTop: 22 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  descriptionKicker: { fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 12 },
  genericCompatibilitySection: { borderTopWidth: 1, marginTop: 4, paddingTop: 16 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 24,
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  privateMaterialButton: {
    alignItems: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  privateMaterialIntro: { fontSize: 14, lineHeight: 21, marginBottom: 16, marginTop: 16 },
  privateMaterialLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  privateMaterialSection: { marginTop: 22 },
  privateMaterialTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  privateMaterialValue: { fontFamily: 'monospace', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  privateMaterialWarning: { fontSize: 14, lineHeight: 21, marginTop: 2 },
  privateMaterialWarningLead: { fontWeight: '700' },
  screen: { flex: 1 },
});

function nativeScriptType(scriptType: KeyStationScriptType): AccountScriptType {
  switch (scriptType) {
    case 'bip44': return AccountScriptType.Legacy;
    case 'bip49': return AccountScriptType.NestedSegwit;
    case 'bip84': return AccountScriptType.NativeSegwit;
    case 'bip86': return AccountScriptType.Taproot;
  }
}
