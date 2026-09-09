import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { KeyStationLifeHash } from '../features/keyStation/components/KeyStationLifeHash';
import { RecoveryMaterialPanel } from '../features/keyStation/components/RecoveryMaterialPanel';
import { SeedQrPanel } from '../features/keyStation/components/SeedQrPanel';
import { ScriptTypePickerScreen } from '../features/keyStation/components/ScriptTypePickerScreen';
import { keyStationSafetyNotes } from '../features/keyStation/keyStation';
import {
  KeyDerivationNetworkKind,
  keyDerivationAdvancedState,
  seedQrData,
} from '../native/entropyStudio';
import type {
  KeyStationSafetyNote,
  KeyStationScriptType,
  KeyStationTab,
} from '../features/keyStation/keyStation';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly colors: DiceColors;
  readonly isActive: boolean;
  readonly onEditInput: () => void;
  readonly onReturnToStation: () => void;
  readonly onSetResultScriptType: (scriptType: KeyStationScriptType) => void;
  readonly tab: KeyStationTab | null;
};

type SafetyNotesProps = {
  readonly colors: DiceColors;
  readonly notes: readonly KeyStationSafetyNote[];
  readonly testIDPrefix: string;
};

function SafetyNote({
  colors,
  note,
  noteTestID,
}: {
  readonly colors: DiceColors;
  readonly note: KeyStationSafetyNote;
  readonly noteTestID: string;
}) {
  const color = note.kind === 'warning' ? colors.error : colors.muted;
  const arrow = UPSTREAM_TEXT.calculations.conversionArrow;
  const arrowIndex = note.centeredArrow ? note.text.indexOf(arrow) : -1;

  if (arrowIndex < 0) {
    return (
      <Text style={[styles.safetyNotesCopy, { color }]} testID={noteTestID}>
        {note.text}
      </Text>
    );
  }

  const beforeArrow = note.text.slice(0, arrowIndex);
  const afterArrow = note.text.slice(arrowIndex + arrow.length);

  return (
    <View
      accessible
      accessibilityLabel={note.text}
      style={styles.safetyNotesCenteredArrowLine}
      testID={noteTestID}
    >
      <Text accessible={false} style={[styles.safetyNotesCopy, { color }]}>
        {beforeArrow}
        <Text style={[styles.safetyNotesCenteredArrow, { color }]} testID={`${noteTestID}-arrow`}>
          {arrow}
        </Text>
        <Text style={[styles.safetyNotesCenteredArrowCopy, { color }]}>{afterArrow}</Text>
      </Text>
    </View>
  );
}

function SafetyNotes({ colors, notes, testIDPrefix }: SafetyNotesProps) {
  if (!notes.length) {
    return null;
  }

  return (
    <View style={[styles.safetyNotes, { borderColor: colors.border }]} testID={`${testIDPrefix}-notes`}>
      <Text style={[styles.safetyNotesTitle, { color: colors.text }]}>
        {UPSTREAM_TEXT.result.safetyNotes}
      </Text>
      {notes.map((note, index) => (
        <SafetyNote
          colors={colors}
          key={note.text}
          note={note}
          noteTestID={`${testIDPrefix}-note-${index}`}
        />
      ))}
    </View>
  );
}

export function KeyStationResultScreen({
  colors,
  isActive,
  onEditInput,
  onReturnToStation,
  onSetResultScriptType,
  tab,
}: Props) {
  const [showingPrivateRecoveryMaterial, setShowingPrivateRecoveryMaterial] = useState(false);
  const [showingWatchOnlyWalletData, setShowingWatchOnlyWalletData] = useState(false);
  const [showingWalletData, setShowingWalletData] = useState(false);
  const [showingScriptType, setShowingScriptType] = useState(false);

  useEffect(() => {
    setShowingPrivateRecoveryMaterial(false);
    setShowingWatchOnlyWalletData(false);
    setShowingWalletData(false);
    setShowingScriptType(false);
  }, [tab?.id]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showingPrivateRecoveryMaterial) {
        setShowingPrivateRecoveryMaterial(false);
        return true;
      }
      if (showingWatchOnlyWalletData) {
        setShowingWatchOnlyWalletData(false);
        return true;
      }
      if (showingWalletData) {
        setShowingWalletData(false);
        return true;
      }
      if (showingScriptType) {
        setShowingScriptType(false);
        return true;
      }
      onReturnToStation();
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToStation, showingPrivateRecoveryMaterial, showingScriptType, showingWalletData, showingWatchOnlyWalletData]);

  if (!tab) {
    return null;
  }

  const { derivation } = tab;
  const safetyNotes = keyStationSafetyNotes(tab);
  const derivationState = keyDerivationAdvancedState(tab.derivationSettings.advancedInput);
  const resultPurpose = derivationState.purpose.valid
    ? `${derivationState.purpose.value}${derivationState.purpose.hardened ? "'" : ''}`
    : tab.derivationSettings.advancedInput.purpose;
  // EntropyLab derives testnet only for coin type 1; every other valid coin
  // type uses its mainnet address family.
  const resultNetwork =
    derivationState.networkKind === KeyDerivationNetworkKind.Testnet ? 'testnet' : 'mainnet';
  const seedQr =
    derivation.kind === 'bip39' && showingWalletData && showingPrivateRecoveryMaterial
      ? seedQrData(derivation.mnemonic)
      : null;

  if (showingScriptType) {
    return (
      <ScriptTypePickerScreen
        colors={colors}
        onBack={() => setShowingScriptType(false)}
        onSetScriptType={onSetResultScriptType}
        network={resultNetwork}
        privateAccountMaterialInput={
          derivation.kind === 'bip39'
            ? {
                accountPath: tab.derivationSettings.accountPath,
                addressIndex: derivationState.addressWindow.start.value,
                addressCount: derivationState.addressWindow.range.value,
                branches: derivationState.branchWindow.branches.map(branch => branch.index),
                addressHardened: tab.derivationSettings.advancedHardening.address,
                branchHardened: tab.derivationSettings.advancedHardening.branch,
                masterFingerprint: tab.masterFingerprint,
                mnemonic: derivation.mnemonic,
                passphrase: derivation.passphrase,
              }
            : undefined
        }
        purpose={resultPurpose}
        scriptType={tab.resultScriptType}
      />
    );
  }

  return (
    <View
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[styles.screen, { backgroundColor: colors.background }, !isActive && styles.hidden]}
      testID="key-station-result-screen"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showingWalletData && derivation.kind === 'bip39' ? (
          <View testID="wallet-data-screen">
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => {
                setShowingPrivateRecoveryMaterial(false);
                setShowingWalletData(false);
              }}
              style={styles.backButton}
              testID="close-wallet-data"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <Text style={[styles.walletDataTitle, { color: colors.text }]} testID="wallet-data-title">
              {UPSTREAM_TEXT.result.walletRecoveryDetails}
            </Text>
            <Text style={[styles.walletDataIntro, { color: colors.muted }]} testID="wallet-data-intro">
              {UPSTREAM_TEXT.result.walletDataIntro}
            </Text>
            <SafetyNotes colors={colors} notes={safetyNotes} testIDPrefix="wallet-data-safety" />
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.privateRecoveryMaterial}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingPrivateRecoveryMaterial }}
              onPress={() => setShowingPrivateRecoveryMaterial(value => !value)}
              style={({ pressed }) => [
                styles.walletDataSectionButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-private-recovery-material"
            >
              <Text style={[styles.walletDataSectionTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.privateRecoveryMaterial}
              </Text>
            </Pressable>
            {showingPrivateRecoveryMaterial ? (
              <>
                <Text
                  style={[styles.privateRecoveryMaterialSafety, { color: colors.muted }]}
                  testID="private-recovery-material-safety"
                >
                  {UPSTREAM_TEXT.result.privateRecoveryMaterialSafety}
                </Text>
                <RecoveryMaterialPanel
                  afterMnemonic={
                    seedQr ? (
                      <SeedQrPanel
                        colors={colors}
                        data={seedQr}
                        passphraseUsed={Boolean(derivation.passphrase)}
                      />
                    ) : undefined
                  }
                  colors={colors}
                  entropyLabel={UPSTREAM_TEXT.result.entropyHex}
                  masterSeedLabel={UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex}
                  mnemonicLabel={UPSTREAM_UI_FALLBACK_COPY.result.seedPhrase(
                    derivation.mnemonic.trim().split(/\s+/).length,
                  )}
                  result={{
                    entropy: derivation.entropy,
                    masterSeed: derivation.masterSeed,
                    mnemonic: derivation.mnemonic,
                    rootXprv: tab.rootXprv,
                  }}
                  rootXprvLabel={formatCopy(UPSTREAM_TEXT.result.rootXprv, { name: 'xprv' })}
                />
              </>
            ) : null}
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.watchOnlyWalletData}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingWatchOnlyWalletData }}
              onPress={() => setShowingWatchOnlyWalletData(value => !value)}
              style={({ pressed }) => [
                styles.walletDataSectionButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-watch-only-wallet-data"
            >
              <Text style={[styles.walletDataSectionTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.watchOnlyWalletData}
              </Text>
            </Pressable>
            {showingWatchOnlyWalletData ? (
              <View testID="watch-only-wallet-data">
                <Text style={[styles.privateRecoveryMaterialSafety, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.result.watchOnlyWalletDataSafety}
                </Text>
                <Text style={[styles.watchOnlyLabel, { color: colors.muted }]}>
                  {UPSTREAM_TEXT.fingerprint.master}
                </Text>
                <Text selectable style={[styles.watchOnlyValue, { color: colors.text }]} testID="watch-only-master-fingerprint">
                  {tab.masterFingerprint}
                </Text>
                <Text style={[styles.watchOnlyLabel, { color: colors.muted }]}>
                  {formatCopy(UPSTREAM_TEXT.result.rootXprv, { name: 'xpub' })}
                </Text>
                <Text selectable style={[styles.watchOnlyValue, { color: colors.text }]} testID="watch-only-root-xpub">
                  {tab.rootXpub}
                </Text>
              </View>
            ) : null}
          </View>
        ) : derivation.kind === 'private-key' ? (
          <>
            <View style={styles.privateKeySummary} testID="key-station-private-key-summary">
              <View style={styles.summaryDetails}>
                <Text
                  style={[styles.privateKeyTitle, { color: colors.text }]}
                  testID="key-station-private-key-title"
                >
                  {UPSTREAM_UI_LABELS.keyMode[tab.method]}
                </Text>
                <Text style={[styles.meta, { color: colors.muted }]} testID="key-station-script-value">
                  {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
                </Text>
                <Text style={[styles.meta, styles.path, { color: colors.muted }]} testID="key-station-path-value">
                  {tab.derivationPath}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={UPSTREAM_TEXT.keys.editInput}
                accessibilityRole="button"
                onPress={onEditInput}
                style={({ pressed }) => [
                  styles.editButton,
                  { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                ]}
                testID="key-station-edit-inputs"
              >
                <Text style={[styles.editButtonText, { color: colors.accent }]}>
                  {UPSTREAM_TEXT.keys.editInput}
                </Text>
              </Pressable>
            </View>
            <SafetyNotes colors={colors} notes={safetyNotes} testIDPrefix="private-key-safety" />
            <View style={styles.scriptTypeButtonSpacing}>
              <ScriptTypeButton colors={colors} onPress={() => setShowingScriptType(true)} />
            </View>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.privateKey}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingPrivateRecoveryMaterial }}
              onPress={() => setShowingPrivateRecoveryMaterial(value => !value)}
              style={({ pressed }) => [
                styles.walletDataSectionButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-private-key-material"
            >
              <Text style={[styles.walletDataSectionTitle, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.privateKey}
              </Text>
            </Pressable>
          </>
        ) : null}
        {derivation.kind === 'bip39' && !showingWalletData ? (
          <>
            <View style={styles.summary} testID="key-station-summary">
              <View style={styles.summaryHeader}>
                <KeyStationLifeHash
                  fingerprint={tab.masterFingerprint}
                  imageTestID="key-station-master-fingerprint-lifehash"
                />
                <View style={styles.summaryDetails}>
                  <Text style={[styles.fingerprint, { color: colors.text }]} testID="key-station-master-fingerprint-value">
                    {tab.masterFingerprint}
                  </Text>
                  <Text style={[styles.meta, { color: colors.muted }]} testID="key-station-method-value">
                    {UPSTREAM_UI_LABELS.keyMode[tab.method]}
                  </Text>
                  <Text style={[styles.meta, { color: colors.muted }]} testID="key-station-script-value">
                    {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
                  </Text>
                  <Text style={[styles.meta, styles.path, { color: colors.muted }]} testID="key-station-path-value">
                    {tab.derivationPath}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={UPSTREAM_TEXT.keys.editInput}
                  accessibilityRole="button"
                  onPress={onEditInput}
                  style={({ pressed }) => [
                    styles.editButton,
                    { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                  ]}
                  testID="key-station-edit-inputs"
                >
                  <Text style={[styles.editButtonText, { color: colors.accent }]}>
                    {UPSTREAM_TEXT.keys.editInput}
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.walletData}
              accessibilityRole="button"
              onPress={() => {
                setShowingPrivateRecoveryMaterial(false);
                setShowingWalletData(true);
              }}
              style={({ pressed }) => [
                styles.walletDataButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="open-wallet-data"
            >
              <Text style={[styles.walletDataButtonText, { color: colors.accent }]}>
                {UPSTREAM_TEXT.result.walletData}
              </Text>
            </Pressable>
            <View style={styles.scriptTypeButtonSpacing}>
              <ScriptTypeButton colors={colors} onPress={() => setShowingScriptType(true)} />
            </View>
          </>
        ) : derivation.kind === 'private-key' && showingPrivateRecoveryMaterial ? (
          <>
            <Text
              style={[styles.privateRecoveryMaterialSafety, { color: colors.muted }]}
              testID="private-key-material-safety"
            >
              {UPSTREAM_TEXT.result.privateKeyMaterialSafety}
            </Text>
          <RecoveryMaterialPanel
            colors={colors}
            entropyLabel={UPSTREAM_TEXT.result.hexPrivateKey}
            result={{
              entropy: derivation.entropy,
              wifCompressed: derivation.wifCompressed,
              wifUncompressed: derivation.wifUncompressed,
            }}
            wifCompressedLabel={UPSTREAM_TEXT.result.wifCompressed}
            wifUncompressedLabel={UPSTREAM_TEXT.result.wifUncompressed}
          />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ScriptTypeButton({
  colors,
  onPress,
}: {
  readonly colors: DiceColors;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.walletDataButton,
        { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}
      testID="open-key-station-script-type"
    >
      <Text style={[styles.walletDataButtonText, { color: colors.accent }]}>
        {UPSTREAM_TEXT.keys.scriptType}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 22,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fingerprint: {
    flexShrink: 1,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 0,
  },
  hidden: {
    display: 'none',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  path: {
    fontFamily: 'monospace',
  },
  privateKeyTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  privateKeySummary: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 18,
  },
  privateRecoveryMaterialSafety: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  screen: {
    flex: 1,
  },
  scriptTypeButtonSpacing: {
    marginTop: 12,
  },
  safetyNotes: {
    borderLeftWidth: 3,
    marginBottom: 20,
    paddingLeft: 12,
  },
  safetyNotesCopy: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  safetyNotesCenteredArrow: {
    fontSize: 14,
    lineHeight: 21,
    transform: [{ translateY: -3 }],
  },
  safetyNotesCenteredArrowCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  safetyNotesCenteredArrowLine: {
    marginTop: 6,
  },
  safetyNotesTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  summary: {
    marginBottom: 18,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  summaryDetails: {
    flex: 1,
    minWidth: 0,
  },
  walletDataButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  walletDataButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletDataIntro: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  walletDataSectionButton: {
    alignItems: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  walletDataSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  walletDataTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  watchOnlyLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  watchOnlyValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
});
