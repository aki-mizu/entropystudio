import { useEffect, useState } from 'react';
import {
  type LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NativeSelect, type NativeSelectOption } from '../../../components/NativeSelect';
import type { DiceColors } from '../../dice/diceTheme';
import { QrCode } from './SeedQrPanel';
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
    readonly branches: readonly number[];
    readonly addressIndex: number;
    readonly addressCount: number;
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

type AddressTableColumn = 'index' | 'path' | 'address';
type AddressTableColumnWidths = Readonly<Record<AddressTableColumn, number>>;

const EMPTY_ADDRESS_TABLE_COLUMN_WIDTHS: AddressTableColumnWidths = {
  address: 0,
  index: 0,
  path: 0,
};

const ADDRESS_TABLE_MONOSPACE_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function watchOnlyBranchLabel(branch: number): string {
  return UPSTREAM_UI_FALLBACK_COPY.keys.advanced.branchLabel({
    index: branch,
    role: branch === 0 ? 'receive' : branch === 1 ? 'change' : 'custom',
  });
}

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
  const [showingWatchOnlyMaterial, setShowingWatchOnlyMaterial] = useState(false);
  const [showingWatchOnlyDescriptorQr, setShowingWatchOnlyDescriptorQr] = useState(false);
  const [showingBranchDescriptors, setShowingBranchDescriptors] = useState(false);
  const [showingAdvancedWatchOnlyExport, setShowingAdvancedWatchOnlyExport] = useState(false);
  const [showingAddresses, setShowingAddresses] = useState(false);
  const [showingFirstAddressPopup, setShowingFirstAddressPopup] = useState(false);
  const [addressTableColumnWidths, setAddressTableColumnWidths] = useState<AddressTableColumnWidths>(
    EMPTY_ADDRESS_TABLE_COLUMN_WIDTHS,
  );
  const { width } = useWindowDimensions();
  const qrWidth = Math.max(0, width - 72);
  const measureAddressTableColumn = (column: AddressTableColumn) => (event: LayoutChangeEvent) => {
    const measuredWidth = Math.ceil(event.nativeEvent.layout.width);
    setAddressTableColumnWidths(current =>
      measuredWidth <= current[column] ? current : { ...current, [column]: measuredWidth },
    );
  };
  const addressTableColumnStyle = (column: AddressTableColumn) =>
    addressTableColumnWidths[column] > 0 ? { width: addressTableColumnWidths[column] } : undefined;

  useEffect(() => {
    setAddressTableColumnWidths(EMPTY_ADDRESS_TABLE_COLUMN_WIDTHS);
    setPrivateMaterial(null);
    setShowingPrivateMaterial(false);
    setShowingWatchOnlyMaterial(false);
    setShowingWatchOnlyDescriptorQr(false);
    setShowingBranchDescriptors(false);
    setShowingAdvancedWatchOnlyExport(false);
    setShowingAddresses(false);
    setShowingFirstAddressPopup(false);
  }, [scriptType, privateAccountMaterialInput?.accountPath]);

  useEffect(() => {
    setAddressTableColumnWidths(EMPTY_ADDRESS_TABLE_COLUMN_WIDTHS);
  }, [privateMaterial]);

  const revealPrivateMaterial = () => {
    if (!showingPrivateMaterial && !privateMaterial && privateAccountMaterialInput) {
      setPrivateMaterial(
        accountPrivateMaterial(
          privateAccountMaterialInput.mnemonic,
          privateAccountMaterialInput.passphrase,
          privateAccountMaterialInput.accountPath,
          privateAccountMaterialInput.masterFingerprint,
          nativeScriptType(scriptType),
          [...privateAccountMaterialInput.branches],
          privateAccountMaterialInput.addressIndex,
          privateAccountMaterialInput.addressCount,
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
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.watchOnlyWalletData}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingWatchOnlyMaterial }}
              onPress={() => {
                if (!privateMaterial) {
                  setPrivateMaterial(
                    accountPrivateMaterial(
                      privateAccountMaterialInput.mnemonic,
                      privateAccountMaterialInput.passphrase,
                      privateAccountMaterialInput.accountPath,
                      privateAccountMaterialInput.masterFingerprint,
                      nativeScriptType(scriptType),
                      [...privateAccountMaterialInput.branches],
                      privateAccountMaterialInput.addressIndex,
                      privateAccountMaterialInput.addressCount,
                      privateAccountMaterialInput.branchHardened,
                      privateAccountMaterialInput.addressHardened,
                    ),
                  );
                }
                setShowingWatchOnlyMaterial(value => !value);
              }}
              style={({ pressed }) => [
                styles.privateMaterialButton,
                styles.watchOnlyButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-watch-only-account-data"
            >
              <Text style={[styles.privateMaterialTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.watchOnlyWalletData}
              </Text>
            </Pressable>
            {showingWatchOnlyMaterial && privateMaterial ? (
              <View testID="watch-only-account-data">
                <Text
                  style={[styles.privateMaterialIntro, { color: colors.muted }]}
                  testID="watch-only-cannot-spend-warning"
                >
                  <Text style={styles.privateMaterialWarningLead}>
                    {UPSTREAM_TEXT.result.watchOnlyAccountWarningLead}
                  </Text>{' '}
                  {UPSTREAM_TEXT.result.watchOnlyAccountWarningTail}
                </Text>
                <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                  {UPSTREAM_UI_FALLBACK_COPY.result.bitcoinCore('xpub')}
                </Text>
                <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                  {privateMaterial.bitcoinCoreXpub}
                </Text>
                {privateMaterial.slip132Public ? (
                  <>
                    <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                      {UPSTREAM_UI_FALLBACK_COPY.result.slip132(
                        privateMaterial.slip132PublicLabel ?? '',
                      )}
                    </Text>
                    <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                      {privateMaterial.slip132Public}
                    </Text>
                  </>
                ) : null}
                <Text style={[styles.privateMaterialIntro, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.slip132PrefixNote}
                </Text>
                {privateMaterial.multisigCosignerXpub ? (
                  <>
                    <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                      {UPSTREAM_UI_FALLBACK_COPY.result.multisigCosigner(
                        'xpub',
                        UPSTREAM_TEXT.result.nativeSegwitBip48,
                      )}
                    </Text>
                    <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                      {privateMaterial.multisigCosignerXpub}
                    </Text>
                  </>
                ) : null}
                <Pressable
                  accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.result.watchOnlyWalletDescriptor}
                  accessibilityRole="button"
                  onPress={() => setShowingWatchOnlyDescriptorQr(true)}
                  style={({ pressed }) => [styles.descriptorButton, { opacity: pressed ? 0.72 : 1 }]}
                  testID="open-watch-only-descriptor-qr-popup"
                >
                  <View style={styles.descriptorButtonContent}>
                    <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                      {UPSTREAM_UI_FALLBACK_COPY.result.watchOnlyWalletDescriptor}
                    </Text>
                    <Text accessibilityElementsHidden style={[styles.descriptorArrow, { color: colors.muted }]}>
                      ›
                    </Text>
                  </View>
                </Pressable>
                {privateMaterial.watchOnlyBranchDescriptors.length ? (
                  <>
                    <Pressable
                      accessibilityLabel={UPSTREAM_TEXT.result.addressBranchDescriptors}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showingBranchDescriptors }}
                      onPress={() => setShowingBranchDescriptors(value => !value)}
                      style={({ pressed }) => [styles.branchDescriptorsHeader, { opacity: pressed ? 0.72 : 1 }]}
                      testID="toggle-watch-only-branch-descriptors"
                    >
                      <View style={styles.branchDescriptorsHeaderContent}>
                        <Text
                          accessibilityElementsHidden
                          style={[styles.branchDescriptorsIndicator, { color: showingBranchDescriptors ? colors.text : colors.muted }]}
                        >
                          {showingBranchDescriptors ? '▼' : '▶'}
                        </Text>
                        <Text style={[styles.branchDescriptorsTitle, { color: showingBranchDescriptors ? colors.text : colors.muted }]}>
                          {UPSTREAM_TEXT.result.addressBranchDescriptors}
                        </Text>
                      </View>
                    </Pressable>
                    {showingBranchDescriptors
                      ? privateMaterial.watchOnlyBranchDescriptors.map(item => (
                          <View key={item.branch} style={styles.branchDescriptorRow}>
                            <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                              {UPSTREAM_UI_FALLBACK_COPY.result.watchOnlyDescriptor(
                                watchOnlyBranchLabel(item.branch),
                              )}
                            </Text>
                            <Text selectable style={[styles.branchDescriptorValue, { color: colors.text }]}>
                              {item.descriptor}
                            </Text>
                          </View>
                        ))
                      : null}
                  </>
                ) : null}
                {privateMaterial.advancedWatchOnlyExport ? (
                  <>
                    <Pressable
                      accessibilityLabel={UPSTREAM_TEXT.result.advancedWatchOnlyExport}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showingAdvancedWatchOnlyExport }}
                      onPress={() => setShowingAdvancedWatchOnlyExport(value => !value)}
                      style={({ pressed }) => [styles.branchDescriptorsHeader, { opacity: pressed ? 0.72 : 1 }]}
                      testID="toggle-advanced-watch-only-export"
                    >
                      <View style={styles.branchDescriptorsHeaderContent}>
                        <Text
                          accessibilityElementsHidden
                          style={[styles.branchDescriptorsIndicator, { color: showingAdvancedWatchOnlyExport ? colors.text : colors.muted }]}
                        >
                          {showingAdvancedWatchOnlyExport ? '▼' : '▶'}
                        </Text>
                        <Text style={[styles.branchDescriptorsTitle, { color: showingAdvancedWatchOnlyExport ? colors.text : colors.muted }]}>
                          {UPSTREAM_TEXT.result.advancedWatchOnlyExport}
                        </Text>
                      </View>
                    </Pressable>
                    {showingAdvancedWatchOnlyExport ? (
                      <View>
                        <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                          {UPSTREAM_UI_FALLBACK_COPY.result.genericDescriptorCompatibility('xpub')}
                        </Text>
                        <Text selectable style={[styles.branchDescriptorValue, { color: colors.text }]}>
                          {privateMaterial.advancedWatchOnlyExport}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.addresses}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingAddresses }}
              onPress={() => {
                if (!privateMaterial) {
                  setPrivateMaterial(
                    accountPrivateMaterial(
                      privateAccountMaterialInput.mnemonic,
                      privateAccountMaterialInput.passphrase,
                      privateAccountMaterialInput.accountPath,
                      privateAccountMaterialInput.masterFingerprint,
                      nativeScriptType(scriptType),
                      [...privateAccountMaterialInput.branches],
                      privateAccountMaterialInput.addressIndex,
                      privateAccountMaterialInput.addressCount,
                      privateAccountMaterialInput.branchHardened,
                      privateAccountMaterialInput.addressHardened,
                    ),
                  );
                }
                setShowingAddresses(value => !value);
              }}
              style={({ pressed }) => [
                styles.privateMaterialButton,
                styles.addressesButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-addresses"
            >
              <Text style={[styles.privateMaterialTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.addresses}
              </Text>
            </Pressable>
            {showingAddresses && privateMaterial ? (
              <View>
                <Text style={[styles.privateMaterialIntro, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.addressesVerification}
                </Text>
                {privateMaterial.firstWatchOnlyAddress ? (
                  <>
                    <Pressable
                      accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.result.address(
                        watchOnlyBranchLabel(privateMaterial.firstWatchOnlyAddress.branch),
                        privateMaterial.firstWatchOnlyAddress.index,
                      )}
                      accessibilityRole="button"
                      onPress={() => setShowingFirstAddressPopup(true)}
                      style={({ pressed }) => [styles.descriptorButton, { opacity: pressed ? 0.72 : 1 }]}
                      testID="open-first-watch-only-address-popup"
                    >
                      <View style={styles.descriptorButtonContent}>
                        <Text style={[styles.privateMaterialLabel, { color: colors.muted }]}>
                          {UPSTREAM_UI_FALLBACK_COPY.result.address(
                            watchOnlyBranchLabel(privateMaterial.firstWatchOnlyAddress.branch),
                            privateMaterial.firstWatchOnlyAddress.index,
                          )}
                        </Text>
                        <Text accessibilityElementsHidden style={[styles.descriptorArrow, { color: colors.muted }]}>
                          ›
                        </Text>
                      </View>
                    </Pressable>
                    <Text style={[styles.addressTableTitle, { color: colors.text }]}>
                      {watchOnlyBranchLabel(privateMaterial.firstWatchOnlyAddress.branch)}
                    </Text>
                    <View style={[styles.addressTable, { borderColor: colors.border }]}>
                      <View
                        accessible={false}
                        importantForAccessibility="no-hide-descendants"
                        pointerEvents="none"
                        style={styles.addressTableMeasure}
                      >
                        <Text numberOfLines={1} onLayout={measureAddressTableColumn('index')} style={styles.addressTableMeasureText}>#</Text>
                        <Text numberOfLines={1} onLayout={measureAddressTableColumn('path')} style={styles.addressTableMeasureText}>{UPSTREAM_TEXT.result.path}</Text>
                        <Text numberOfLines={1} onLayout={measureAddressTableColumn('address')} style={styles.addressTableMeasureText}>{UPSTREAM_TEXT.result.address}</Text>
                        {privateMaterial.watchOnlyAddresses.map(item => (
                          <View key={`measure-${item.branch}-${item.index}`}>
                            <Text numberOfLines={1} onLayout={measureAddressTableColumn('index')} style={styles.addressTableMeasureText}>{item.index}</Text>
                            <Text numberOfLines={1} onLayout={measureAddressTableColumn('path')} style={[styles.addressTableMeasureText, styles.addressTableValue]}>{item.path}</Text>
                            <Text numberOfLines={1} onLayout={measureAddressTableColumn('address')} style={[styles.addressTableMeasureText, styles.addressTableValue]}>{item.address}</Text>
                          </View>
                        ))}
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View style={styles.addressTableContent}>
                          <View style={[styles.addressTableRow, styles.addressTableHeader]}>
                            <Text numberOfLines={1} style={[styles.addressTableCell, styles.addressIndexCell, addressTableColumnStyle('index'), { color: colors.muted }]}>#</Text>
                            <Text numberOfLines={1} style={[styles.addressTableCell, styles.addressPathCell, addressTableColumnStyle('path'), { color: colors.muted }]}>{UPSTREAM_TEXT.result.path}</Text>
                            <Text numberOfLines={1} style={[styles.addressTableCell, styles.addressValueCell, addressTableColumnStyle('address'), { color: colors.muted }]}>{UPSTREAM_TEXT.result.address}</Text>
                            <Text numberOfLines={1} style={[styles.addressTableCell, styles.addressWifCell, { color: colors.muted }]}>{UPSTREAM_TEXT.result.wif}</Text>
                          </View>
                          {privateMaterial.watchOnlyAddresses.map(item => (
                            <View key={`${item.branch}-${item.index}`} style={[styles.addressTableRow, styles.addressTableDataRow, { borderTopColor: colors.border }]}>
                              <Text numberOfLines={1} style={[styles.addressTableCell, styles.addressIndexCell, addressTableColumnStyle('index'), { color: colors.text }]}>
                                {item.index}
                              </Text>
                              <Text numberOfLines={1} selectable style={[styles.addressTableCell, styles.addressPathCell, styles.addressTableValue, addressTableColumnStyle('path'), { color: colors.text }]}>
                                {item.path}
                              </Text>
                              <Text numberOfLines={1} selectable style={[styles.addressTableCell, styles.addressValueCell, styles.addressTableValue, addressTableColumnStyle('address'), { color: colors.text }]}>
                                {item.address}
                              </Text>
                              <Text numberOfLines={1} selectable style={[styles.addressTableCell, styles.addressWifCell, styles.addressTableValue, { color: colors.text }]}>
                                {item.wif}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
            <Modal
              animationType="fade"
              onRequestClose={() => setShowingWatchOnlyDescriptorQr(false)}
              transparent
              visible={showingWatchOnlyDescriptorQr && privateMaterial !== null}
            >
              <View style={styles.modalBackdrop}>
                <Pressable
                  accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
                  onPress={() => setShowingWatchOnlyDescriptorQr(false)}
                  style={styles.modalDismissArea}
                  testID="close-watch-only-descriptor-qr-popup"
                />
                <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                  {privateMaterial ? (
                    <>
                      <Text
                        selectable
                        style={[styles.descriptorPopupValue, { color: colors.text }]}
                        testID="watch-only-descriptor-popup-value"
                      >
                        {privateMaterial.watchOnlyChangeDescriptor}
                      </Text>
                      <QrCode
                        accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.result.watchOnlyWalletDescriptor}
                        border={4}
                        data={privateMaterial.watchOnlyChangeDescriptor}
                        ecc="M"
                        size={qrWidth}
                        testID="watch-only-descriptor-qr-code"
                      />
                      <Text style={[styles.qrImportNote, { color: colors.muted }]}>
                        {UPSTREAM_TEXT.result.watchOnlyWalletDescriptorImport}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            </Modal>
            <Modal
              animationType="fade"
              onRequestClose={() => setShowingFirstAddressPopup(false)}
              transparent
              visible={showingFirstAddressPopup && privateMaterial?.firstWatchOnlyAddress !== undefined}
            >
              <View style={styles.modalBackdrop}>
                <Pressable
                  accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
                  onPress={() => setShowingFirstAddressPopup(false)}
                  style={styles.modalDismissArea}
                  testID="close-first-watch-only-address-popup"
                />
                {privateMaterial?.firstWatchOnlyAddress ? (
                  <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                    <QrCode
                      accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.result.address(
                        watchOnlyBranchLabel(privateMaterial.firstWatchOnlyAddress.branch),
                        privateMaterial.firstWatchOnlyAddress.index,
                      )}
                      border={2}
                      data={privateMaterial.firstWatchOnlyAddress.address}
                      ecc="M"
                      size={qrWidth}
                      testID="first-watch-only-address-qr-code"
                    />
                    <Text selectable style={[styles.privateMaterialValue, { color: colors.text }]}>
                      {privateMaterial.firstWatchOnlyAddress.address}
                    </Text>
                    <Text selectable style={[styles.addressPath, { color: colors.muted }]}>
                      {privateMaterial.firstWatchOnlyAddress.path}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Modal>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingVertical: 6 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
  addressesButton: { marginTop: 16 },
  addressPath: { fontFamily: 'monospace', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  addressIndexCell: { marginRight: 4 },
  addressPathCell: { marginRight: 4 },
  addressTable: { borderRadius: 9, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  addressTableCell: { alignSelf: 'flex-start', flexShrink: 0, fontSize: 12, lineHeight: 18, paddingVertical: 4 },
  addressTableContent: { alignSelf: 'flex-start', flexShrink: 0, paddingHorizontal: 4 },
  addressTableDataRow: { borderTopWidth: 1 },
  addressTableHeader: { backgroundColor: 'transparent' },
  addressTableMeasure: { left: -10000, opacity: 0, position: 'absolute', top: -10000 },
  addressTableMeasureText: { alignSelf: 'flex-start', flexShrink: 0, fontSize: 12, lineHeight: 18 },
  addressTableRow: { flexDirection: 'row' },
  addressTableTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 20, marginBottom: 6 },
  addressTableValue: { fontFamily: ADDRESS_TABLE_MONOSPACE_FONT, fontVariant: ['tabular-nums'] },
  addressValueCell: { marginRight: 8 },
  addressWifCell: {},
  content: { paddingBottom: 28, paddingHorizontal: 24, paddingTop: 22 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  descriptionKicker: { fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 12 },
  descriptorArrow: { fontSize: 24, lineHeight: 24 },
  descriptorButton: { marginBottom: 16 },
  descriptorButtonContent: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  descriptorPopupValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
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
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: '#00000099',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalDismissArea: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  modalCard: { alignItems: 'center', borderRadius: 8, maxWidth: '100%', padding: 12 },
  branchDescriptorValue: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  branchDescriptorRow: { alignSelf: 'stretch' },
  branchDescriptorsHeader: { alignSelf: 'flex-start', justifyContent: 'center', marginTop: 16, minHeight: 36 },
  branchDescriptorsHeaderContent: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  branchDescriptorsIndicator: { fontSize: 16, lineHeight: 20 },
  branchDescriptorsTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  qrImportNote: { fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  watchOnlyButton: { marginTop: 16 },
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
