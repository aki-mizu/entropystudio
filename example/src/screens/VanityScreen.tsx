import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeSelect } from '../components/NativeSelect';
import type { NativeSelectOption } from '../components/NativeSelect';
import { diceColors } from '../features/dice/diceTheme';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
} from '../features/upstreamUiCopy';
import {
  VanityMethod,
  VanityRun,
  VanityScript,
  VanityValidationKind,
  vanityFilterPrefix,
  vanityInputState,
} from '../native/entropyStudio';
import type {
  VanityChunk,
  VanityInputState,
  VanityMatch,
  VanityRunInput,
} from '../native/entropyStudio';

const CONTENT_HORIZONTAL_PADDING = 24;
const MAX_DISPLAYED_MATCHES = 100;

type VanityMethodId = 'passphrase' | 'derivation';
type VanityScriptId = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2tr' | 'sp';
type VanitySourceTab = KeyStationTab & {
  readonly derivation: Extract<
    KeyStationTab['derivation'],
    { readonly kind: 'bip39' }
  >;
};

type RunMeta = {
  readonly accountHardened: boolean;
  readonly derivation: boolean;
  readonly path: string;
  readonly script: VanityScriptId;
  /**
   * The exact Key Station record used to prepare the native run.  IDs stay
   * stable when a key is re-derived, so an ID alone would let an old match
   * be applied to replacement key material.
   */
  readonly source: VanitySourceTab;
  readonly sourceLabel: string;
  readonly stopOnFirst: boolean;
};

type Props = {
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onApplyAccount: (
    source: KeyStationTab,
    accountIndex: number,
    accountHardened: boolean,
  ) => string | null;
  readonly onApplyPassphrase: (
    source: KeyStationTab,
    passphrase: string,
  ) => string | null;
  readonly tabs: readonly KeyStationTab[];
};

const METHOD_OPTIONS: readonly NativeSelectOption<VanityMethodId>[] = [
  {
    label: UPSTREAM_TEXT.vanity.form.methodOptions.passphrase,
    value: 'passphrase',
  },
  {
    label: UPSTREAM_TEXT.vanity.form.methodOptions.derivation,
    value: 'derivation',
  },
];

const SCRIPT_OPTIONS: readonly NativeSelectOption<VanityScriptId>[] = [
  {
    label: UPSTREAM_TEXT.vanity.form.scriptOptions.p2pkh,
    value: 'p2pkh',
  },
  {
    label: UPSTREAM_TEXT.vanity.form.scriptOptions.p2shP2wpkh,
    value: 'p2sh-p2wpkh',
  },
  {
    label: UPSTREAM_TEXT.vanity.form.scriptOptions.p2wpkh,
    value: 'p2wpkh',
  },
  {
    label: UPSTREAM_TEXT.vanity.form.scriptOptions.p2tr,
    value: 'p2tr',
  },
  {
    label: UPSTREAM_TEXT.vanity.form.scriptOptions.sp,
    value: 'sp',
  },
];

function vanityNativeMethod(method: VanityMethodId) {
  return method === 'derivation'
    ? VanityMethod.Derivation
    : VanityMethod.Passphrase;
}

function vanityNativeScript(script: VanityScriptId) {
  switch (script) {
    case 'p2pkh':
      return VanityScript.P2pkh;
    case 'p2sh-p2wpkh':
      return VanityScript.P2shP2wpkh;
    case 'p2wpkh':
      return VanityScript.P2wpkh;
    case 'p2tr':
      return VanityScript.P2tr;
    case 'sp':
      return VanityScript.SilentPayments;
  }
}

function scriptLabel(script: VanityScriptId): string {
  switch (script) {
    case 'p2pkh':
      return UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.p2pkh;
    case 'p2sh-p2wpkh':
      return UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.p2shP2wpkh;
    case 'p2wpkh':
      return UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.p2wpkh;
    case 'p2tr':
      return UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.p2tr;
    case 'sp':
      return UPSTREAM_UI_FALLBACK_COPY.vanity.form.scriptNames.sp;
  }
}

function isVanitySource(tab: KeyStationTab): tab is VanitySourceTab {
  return tab.derivation.kind === 'bip39';
}

function supportsPassphraseGrind(tab: VanitySourceTab | null): boolean {
  // Brain-wallet HD tabs derive their mnemonic from recovery text. Studio
  // currently has no durable BIP39-passphrase field for that input, so only
  // the account dial can be safely written back to those tabs.
  return tab?.input.kind !== 'private-key';
}

function sourceLabel(tab: KeyStationTab): string {
  return (
    tab.masterFingerprint ||
    tab.name ||
    formatCopy(UPSTREAM_TEXT.keys.defaultTab, { n: tab.number })
  );
}

function formattedCount(value: bigint | number | string): string {
  if (typeof value === 'bigint') {
    return value.toLocaleString('en-US');
  }
  if (typeof value === 'number') {
    return Math.round(value).toLocaleString('en-US');
  }
  return value;
}

function validationError(
  inputState: VanityInputState,
  method: VanityMethodId,
  script: VanityScriptId,
  selectedSourceLabel: string,
): string | null {
  if (
    inputState.valid ||
    inputState.validationKind === VanityValidationKind.Valid
  ) {
    return null;
  }

  const errors = UPSTREAM_UI_FALLBACK_COPY.vanity.errors;
  const selectedScriptLabel = scriptLabel(script);

  switch (inputState.validationKind) {
    case VanityValidationKind.MissingMnemonic:
      return errors.mnemonicMissing;
    case VanityValidationKind.MnemonicTooLong:
      return errors.mnemonicTooLong(
        inputState.normalizedMnemonicByteLength,
        inputState.maximumMnemonicByteLength,
      );
    case VanityValidationKind.PassphraseTooLong:
      return errors.startingPassphraseTooLong(
        inputState.normalizedStartingPassphraseByteLength,
        inputState.maximumStartingPassphraseByteLength,
      );
    case VanityValidationKind.PathRoot:
      return errors.pathRoot;
    case VanityValidationKind.PathIndex:
      return errors.pathIndex;
    case VanityValidationKind.PathTooLong:
      return errors.pathTooDeep(inputState.maximumPathComponents);
    case VanityValidationKind.MissingAccountComponents:
      return errors.accountPathNeedsComponents(selectedSourceLabel);
    case VanityValidationKind.NonMainnetCoinType:
      return errors.mainnetOnly(selectedSourceLabel, inputState.coinType ?? 0);
    case VanityValidationKind.InvalidBranchIndex:
    case VanityValidationKind.InvalidAddressIndex:
      return errors.branchAndAddressIndexes(selectedSourceLabel);
    case VanityValidationKind.InvalidPrefix:
      return errors.prefixMustStartWith(
        selectedScriptLabel,
        inputState.fixedPrefix,
      );
    case VanityValidationKind.PrefixTooShort:
      return errors.prefixNeedsAdditionalCharacter(
        selectedScriptLabel,
        inputState.fixedPrefix,
      );
    case VanityValidationKind.PrefixTooLong:
      return errors.prefixTooLong(
        selectedScriptLabel,
        inputState.maximumPrefixLength,
      );
    case VanityValidationKind.PrefixAlphabet:
      return script === 'p2pkh' || script === 'p2sh-p2wpkh'
        ? errors.base58Characters
        : errors.bech32Characters;
    case VanityValidationKind.SilentPaymentParity:
      return errors.silentPaymentParity(
        selectedScriptLabel,
        inputState.fixedPrefix,
        Array.from(inputState.firstVariableCharacters),
      );
    case VanityValidationKind.InvalidPassphraseLength:
      return errors.passphraseLength(inputState.maximumPassphraseLength);
    case VanityValidationKind.InvalidStart:
      return errors.wholeNumber(
        method === 'derivation'
          ? errors.counterLabels.startAccount
          : errors.counterLabels.startCounter,
      );
    case VanityValidationKind.InvalidCount:
      return errors.wholeNumber(
        method === 'derivation'
          ? errors.counterLabels.accountRange
          : errors.counterLabels.rangeSize,
      );
    case VanityValidationKind.PassphraseRangeMinimum:
      return errors.counterRangeMinimum;
    case VanityValidationKind.PassphraseStartBeyond:
      return errors.counterStartBeyond(inputState.passphraseLength);
    case VanityValidationKind.PassphraseRangePast:
      return errors.counterRangePast(
        inputState.passphraseLength,
        inputState.counterLimit ?? '',
      );
    case VanityValidationKind.PassphraseRangePast64Bit:
      return errors.counterRangePast64Bit;
    case VanityValidationKind.DerivationRangeMinimum:
      return errors.accountRangeMinimum;
    case VanityValidationKind.DerivationStartBeyond:
      return errors.accountStartBeyond;
    case VanityValidationKind.DerivationRangePast:
      return errors.accountRangePast;
    case VanityValidationKind.InvalidMnemonic:
    case VanityValidationKind.RunCleared:
      return UPSTREAM_TEXT.error.generic;
  }

  return UPSTREAM_TEXT.error.generic;
}

function Toggle({
  accessibilityLabel,
  checked,
  colors,
  disabled = false,
  label,
  onPress,
  testID,
}: {
  readonly accessibilityLabel: string;
  readonly checked: boolean;
  readonly colors: ReturnType<typeof diceColors>;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.accent : 'transparent',
            borderColor: colors.accent,
          },
        ]}
      >
        {checked ? (
          <View
            style={[styles.checkboxMark, { backgroundColor: colors.onAccent }]}
          />
        ) : null}
      </View>
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function VanityScreen({
  isActive,
  isDarkMode,
  onApplyAccount,
  onApplyPassphrase,
  tabs,
}: Props) {
  const colors = diceColors(isDarkMode);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foundRef = useRef(0);
  const matchesRef = useRef<readonly VanityMatch[]>([]);
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  const runMetaRef = useRef<RunMeta | null>(null);
  const runRef = useRef<InstanceType<typeof VanityRun> | null>(null);
  const runningRef = useRef(false);
  const updatingMatchRef = useRef<number | null>(null);
  const [derivationCount, setDerivationCount] = useState('100000');
  const [derivationStart, setDerivationStart] = useState('0');
  const [candidatesPerSecond, setCandidatesPerSecond] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [matches, setMatches] = useState<readonly VanityMatch[]>([]);
  const [method, setMethod] = useState<VanityMethodId>('passphrase');
  const [passphraseLength, setPassphraseLength] = useState('8');
  const [passphraseCount, setPassphraseCount] = useState('1000000');
  const [passphraseStart, setPassphraseStart] = useState('0');
  const [prefix, setPrefix] = useState('');
  const [progress, setProgress] = useState(0);
  const [revealPassphrases, setRevealPassphrases] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runMeta, setRunMeta] = useState<RunMeta | null>(null);
  const [savedMatches, setSavedMatches] = useState<
    Readonly<Record<number, string>>
  >({});
  const [script, setScript] = useState<VanityScriptId>('p2wpkh');
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [stopOnFirst, setStopOnFirst] = useState(false);
  const [status, setStatus] = useState<string>(
    UPSTREAM_TEXT.vanity.status.idle,
  );
  const [totalFound, setTotalFound] = useState(0);
  const [updatingMatch, setUpdatingMatch] = useState<number | null>(null);

  const sourceTabs = useMemo(() => tabs.filter(isVanitySource), [tabs]);
  const selectedSource =
    sourceTabs.find(tab => tab.id === selectedSourceId) ?? null;
  const selectedSourceLabel = selectedSource ? sourceLabel(selectedSource) : '';
  const canGrindPassphrase = supportsPassphraseGrind(selectedSource);
  const methodOptions =
    selectedSource && !canGrindPassphrase
      ? METHOD_OPTIONS.filter(option => option.value === 'derivation')
      : METHOD_OPTIONS;
  const activeStart =
    method === 'derivation' ? derivationStart : passphraseStart;
  const activeCount =
    method === 'derivation' ? derivationCount : passphraseCount;

  const input = useMemo<VanityRunInput>(() => {
    const source = selectedSource;
    return {
      accountPath: source?.derivationSettings.accountPath ?? '',
      addressHardened:
        source?.derivationSettings.advancedHardening.address ?? false,
      addressIndex: source?.derivationSettings.advancedInput.addressStart ?? '',
      branchHardened:
        source?.derivationSettings.advancedHardening.branch ?? false,
      branchIndex: source?.derivationSettings.advancedInput.branchStart ?? '',
      count: activeCount,
      method: vanityNativeMethod(method),
      mnemonic:
        source?.derivation.kind === 'bip39' ? source.derivation.mnemonic : '',
      passphraseLength,
      prefix,
      script: vanityNativeScript(script),
      start: activeStart,
      startingPassphrase:
        source?.derivation.kind === 'bip39' ? source.derivation.passphrase : '',
    };
  }, [
    activeCount,
    activeStart,
    method,
    passphraseLength,
    prefix,
    script,
    selectedSource,
  ]);

  const inputState = useMemo(() => vanityInputState(input), [input]);
  const formError = selectedSource
    ? validationError(inputState, method, script, selectedSourceLabel)
    : null;
  const visibleError = runError ?? formError;
  const canStart =
    Boolean(selectedSource) &&
    inputState.valid &&
    (method === 'derivation' || canGrindPassphrase) &&
    !isRunning &&
    updatingMatch === null;
  const currentScriptLabel = scriptLabel(script);
  const prefixHelp =
    script === 'sp'
      ? UPSTREAM_UI_FALLBACK_COPY.vanity.form.prefixHelp.silentPayment(
          currentScriptLabel,
          inputState.fixedPrefix,
          Array.from(inputState.firstVariableCharacters),
        )
      : script === 'p2pkh' || script === 'p2sh-p2wpkh'
      ? UPSTREAM_UI_FALLBACK_COPY.vanity.form.prefixHelp.base58(
          currentScriptLabel,
          inputState.fixedPrefix,
        )
      : UPSTREAM_UI_FALLBACK_COPY.vanity.form.prefixHelp.bech32(
          currentScriptLabel,
          inputState.fixedPrefix,
        );
  const liveDurationSeconds =
    Number(inputState.expectedCandidates) / candidatesPerSecond;
  const estimate = inputState.valid
    ? UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.summary(
        inputState.normalizedPrefix,
        inputState.expectedCandidates,
        currentScriptLabel,
        isRunning &&
          candidatesPerSecond > 0 &&
          Number.isFinite(liveDurationSeconds)
          ? UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.timing(
              formattedCount(candidatesPerSecond),
              true,
              1,
              UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.formatDuration(
                liveDurationSeconds,
              ),
            )
          : method === 'derivation'
          ? UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.derivationWithoutRate
          : UPSTREAM_UI_FALLBACK_COPY.vanity.estimate.passphraseWithoutRate,
      )
    : null;

  function setRunning(value: boolean) {
    runningRef.current = value;
    if (mountedRef.current) {
      setIsRunning(value);
    }
  }

  function clearQueuedChunk() {
    if (chunkTimerRef.current !== null) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  }

  function disposeNativeRun(run: InstanceType<typeof VanityRun>) {
    try {
      run.stop();
    } catch {
      // A completed or already-cleared run still needs its handle released.
    }
    try {
      run.clear();
    } catch {
      // Clearing is best-effort; Rust also clears during object destruction.
    }
    try {
      run.uniffiDestroy();
    } catch {
      // Teardown can race an already-destroyed bridge object.
    }
  }

  function clearNativeRun() {
    clearQueuedChunk();
    runIdRef.current += 1;
    const run = runRef.current;
    runRef.current = null;
    if (run) {
      disposeNativeRun(run);
    }
    setRunning(false);
  }

  function clearResults(nextStatus = UPSTREAM_TEXT.vanity.status.idle) {
    clearNativeRun();
    foundRef.current = 0;
    matchesRef.current = [];
    runMetaRef.current = null;
    if (!mountedRef.current) {
      return;
    }
    setMatches([]);
    setCandidatesPerSecond(0);
    setProgress(0);
    setRevealPassphrases(false);
    setRunError(null);
    setRunMeta(null);
    setSavedMatches({});
    setStatus(nextStatus);
    setTotalFound(0);
    updatingMatchRef.current = null;
    setUpdatingMatch(null);
  }

  function completeRun(
    run: InstanceType<typeof VanityRun>,
    runId: number,
    chunk: VanityChunk,
    meta: RunMeta,
  ) {
    if (runRef.current !== run || runIdRef.current !== runId) {
      return;
    }

    clearQueuedChunk();
    runRef.current = null;
    setRunning(false);
    if (!mountedRef.current) {
      disposeNativeRun(run);
      return;
    }

    if (meta.derivation) {
      setDerivationStart(String(chunk.nextCounter));
    } else {
      setPassphraseStart(String(chunk.nextCounter));
    }
    setProgress(chunk.progressPercent);
    setCandidatesPerSecond(0);
    setStatus(
      UPSTREAM_UI_FALLBACK_COPY.vanity.status.complete(
        chunk.stopped,
        meta.stopOnFirst,
        foundRef.current,
        formattedCount(chunk.totalProcessed),
        meta.derivation,
        formattedCount(chunk.nextCounter),
      ),
    );
    // Matches are now held by the screen state. Wipe the run's seed and
    // starting passphrase, then release its native handle immediately.
    disposeNativeRun(run);
  }

  function runNextChunk(
    run: InstanceType<typeof VanityRun>,
    runId: number,
    meta: RunMeta,
  ) {
    clearQueuedChunk();
    chunkTimerRef.current = setTimeout(() => {
      chunkTimerRef.current = null;
      if (runRef.current !== run || runIdRef.current !== runId) {
        return;
      }

      let chunk: VanityChunk;
      try {
        chunk = run.nextChunk();
      } catch {
        if (runRef.current !== run || runIdRef.current !== runId) {
          return;
        }
        runRef.current = null;
        setRunning(false);
        disposeNativeRun(run);
        if (mountedRef.current) {
          setRunError(UPSTREAM_TEXT.error.generic);
        }
        return;
      }

      if (runRef.current !== run || runIdRef.current !== runId) {
        return;
      }

      const chunkMatches = chunk.matches ?? [];
      const nextFound = foundRef.current + chunkMatches.length;
      foundRef.current = nextFound;
      if (chunkMatches.length > 0) {
        const nextMatches = [
          ...matchesRef.current,
          ...chunkMatches.slice(
            0,
            Math.max(0, MAX_DISPLAYED_MATCHES - matchesRef.current.length),
          ),
        ];
        matchesRef.current = nextMatches;
        if (mountedRef.current) {
          setMatches(nextMatches);
        }
      }

      if (mountedRef.current) {
        setProgress(chunk.progressPercent);
        setCandidatesPerSecond(chunk.candidatesPerSecond);
        setStatus(
          UPSTREAM_UI_FALLBACK_COPY.vanity.status.progress(
            formattedCount(chunk.totalProcessed),
            formattedCount(chunk.totalCount),
            formattedCount(chunk.candidatesPerSecond),
            nextFound,
          ),
        );
        setTotalFound(nextFound);
      }

      if (meta.stopOnFirst && chunkMatches.length > 0 && !chunk.complete) {
        try {
          run.stop();
        } catch {
          // A completed object does not need another stop request.
        }
      }

      if (chunk.complete) {
        completeRun(run, runId, chunk, meta);
        return;
      }

      runNextChunk(run, runId, meta);
    }, 0);
  }

  function stopRun() {
    const run = runRef.current;
    const meta = runMetaRef.current;
    if (!run || !meta || !runningRef.current) {
      return;
    }

    clearQueuedChunk();
    const runId = ++runIdRef.current;
    try {
      run.stop();
    } catch {
      // Treat a native teardown race as stopped; the queued result is stale.
    }
    if (mountedRef.current) {
      setStatus(UPSTREAM_UI_FALLBACK_COPY.vanity.status.stopped);
    }
    // One final bounded call turns the native stop request into a final
    // progress/next-counter record before its secret state is wiped.
    runNextChunk(run, runId, meta);
  }

  function selectSource(nextSourceId: number) {
    if (nextSourceId === selectedSourceId) {
      return;
    }
    const nextSource = sourceTabs.find(tab => tab.id === nextSourceId) ?? null;
    clearResults();
    if (!supportsPassphraseGrind(nextSource) && method === 'passphrase') {
      setMethod('derivation');
    }
    setSelectedSourceId(nextSourceId);
  }

  function selectMethod(nextMethod: VanityMethodId) {
    if (nextMethod === method) {
      return;
    }
    clearResults();
    setMethod(nextMethod);
  }

  function selectScript(nextScript: VanityScriptId) {
    if (nextScript === script) {
      return;
    }
    clearResults();
    setPrefix(current =>
      vanityFilterPrefix(current, vanityNativeScript(nextScript)),
    );
    setScript(nextScript);
  }

  function startRun() {
    if (
      !selectedSource ||
      !inputState.valid ||
      (method === 'passphrase' && !canGrindPassphrase) ||
      runningRef.current ||
      updatingMatch !== null
    ) {
      return;
    }

    clearNativeRun();
    foundRef.current = 0;
    matchesRef.current = [];
    runMetaRef.current = null;
    setMatches([]);
    setCandidatesPerSecond(0);
    setProgress(0);
    setRevealPassphrases(false);
    setRunError(null);
    setSavedMatches({});
    setTotalFound(0);

    let run: InstanceType<typeof VanityRun>;
    let nativeState: VanityInputState;
    try {
      run = new VanityRun(input);
      nativeState = run.state();
    } catch {
      setRunError(UPSTREAM_TEXT.error.generic);
      return;
    }

    if (!nativeState.valid) {
      disposeNativeRun(run);
      setRunError(
        validationError(nativeState, method, script, selectedSourceLabel),
      );
      return;
    }

    const meta: RunMeta = {
      accountHardened: nativeState.accountHardened,
      derivation: method === 'derivation',
      path: nativeState.path,
      script,
      source: selectedSource,
      sourceLabel: selectedSourceLabel,
      stopOnFirst,
    };
    const runId = ++runIdRef.current;
    runMetaRef.current = meta;
    runRef.current = run;
    setRunMeta(meta);
    setRunning(true);
    setStatus(
      UPSTREAM_UI_FALLBACK_COPY.vanity.status.starting(
        meta.derivation,
        meta.sourceLabel,
      ),
    );
    runNextChunk(run, runId, meta);
  }

  function updatePrefix(value: string) {
    setRunError(null);
    setPrefix(vanityFilterPrefix(value, vanityNativeScript(script)));
  }

  function applyMatch(index: number) {
    const match = matchesRef.current[index];
    const meta = runMetaRef.current;
    if (
      !match ||
      !meta ||
      updatingMatchRef.current !== null ||
      savedMatches[index]
    ) {
      return;
    }

    // A Key Station update replaces its immutable tab record while retaining
    // its numeric ID.  Do not hand a candidate calculated from the former
    // record to the current key.
    if (!tabs.includes(meta.source)) {
      setRunError(
        UPSTREAM_UI_FALLBACK_COPY.vanity.errors.keyNoLongerInStation(
          meta.sourceLabel,
        ),
      );
      return;
    }

    setRunError(null);
    updatingMatchRef.current = index;
    setUpdatingMatch(index);
    let savedTo: string | null = null;
    try {
      savedTo = meta.derivation
        ? typeof match.accountIndex === 'number'
          ? onApplyAccount(
              meta.source,
              match.accountIndex,
              meta.accountHardened,
            )
          : null
        : onApplyPassphrase(meta.source, match.candidatePassphrase);
    } catch {
      savedTo = null;
    }

    if (!savedTo) {
      setRunError(
        UPSTREAM_UI_FALLBACK_COPY.vanity.errors.keyNoLongerInStation(
          meta.sourceLabel,
        ),
      );
      updatingMatchRef.current = null;
      setUpdatingMatch(null);
      return;
    }

    setSavedMatches(previous => ({ ...previous, [index]: savedTo }));
    setStatus(
      UPSTREAM_UI_FALLBACK_COPY.vanity.status.saved(
        savedTo,
        meta.derivation ? match.accountIndex ?? null : null,
        meta.sourceLabel,
      ),
    );
    updatingMatchRef.current = null;
    setUpdatingMatch(null);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearNativeRun();
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      stopRun();
    }
  }, [isActive]);

  useEffect(() => {
    // A same-ID tab replacement can change its input kind while Vanity is
    // open. Keep the selected value representable by its method picker.
    if (
      selectedSource &&
      !supportsPassphraseGrind(selectedSource) &&
      method === 'passphrase'
    ) {
      selectMethod('derivation');
    }
  }, [method, selectedSource]);

  const resultWhere = runMeta
    ? runMeta.script === 'sp'
      ? UPSTREAM_UI_FALLBACK_COPY.vanity.result.silentPaymentWhere(runMeta.path)
      : UPSTREAM_UI_FALLBACK_COPY.vanity.result.addressWhere(
          scriptLabel(runMeta.script),
          runMeta.path,
        )
    : '';
  const resultDescription = runMeta
    ? runMeta.derivation
      ? UPSTREAM_UI_FALLBACK_COPY.vanity.result.derivationDescription(
          runMeta.sourceLabel,
          resultWhere,
        )
      : UPSTREAM_UI_FALLBACK_COPY.vanity.result.passphraseDescription(
          runMeta.sourceLabel,
          resultWhere,
        )
    : '';

  return (
    <SafeAreaView
      edges={[]}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="vanity-screen-safe-area"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.accent }]}>
            {UPSTREAM_TEXT.vanity.intro.kicker}
          </Text>
          <Text
            style={[styles.title, { color: colors.text }]}
            testID="vanity-screen-title"
          >
            {UPSTREAM_TEXT.vanity.intro.title}
          </Text>
          <Text style={[styles.intro, { color: colors.muted }]}>
            {UPSTREAM_TEXT.vanity.intro.description}
          </Text>
        </View>

        <View style={[styles.messages, { borderColor: colors.border }]}>
          <Text style={[styles.warning, { color: colors.error }]}>
            {UPSTREAM_TEXT.vanity.warnings.passphrase}
          </Text>
          <Text style={[styles.message, { color: colors.muted }]}>
            {UPSTREAM_TEXT.vanity.warnings.mainnet}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            {UPSTREAM_TEXT.vanity.source.heading}
          </Text>
          {sourceTabs.length > 0 ? (
            <>
              <View style={styles.sourceOptions}>
                {sourceTabs.map(tab => {
                  const label = sourceLabel(tab);
                  const selected = selectedSourceId === tab.id;
                  return (
                    <Pressable
                      accessibilityLabel={label}
                      accessibilityRole="radio"
                      accessibilityState={{ disabled: isRunning, selected }}
                      disabled={isRunning}
                      key={tab.id}
                      onPress={() => selectSource(tab.id)}
                      style={({ pressed }) => [
                        styles.sourceOption,
                        {
                          backgroundColor: selected
                            ? colors.surface
                            : 'transparent',
                          borderColor: selected ? colors.accent : colors.border,
                          opacity: isRunning ? 0.45 : pressed ? 0.72 : 1,
                        },
                      ]}
                      testID={`vanity-source-${tab.id}`}
                    >
                      <Text
                        style={[
                          styles.sourceOptionText,
                          { color: selected ? colors.text : colors.muted },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {!selectedSource ? (
                <Text style={[styles.help, { color: colors.muted }]}>
                  {UPSTREAM_UI_FALLBACK_COPY.vanity.source.noSelectedKey}
                </Text>
              ) : (
                <View
                  style={[
                    styles.selectedSource,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedSourceKicker,
                      { color: colors.muted },
                    ]}
                  >
                    {UPSTREAM_TEXT.vanity.source.selectedKey}
                  </Text>
                  <Text
                    style={[styles.selectedSourceName, { color: colors.text }]}
                  >
                    {selectedSourceLabel}
                  </Text>
                  <Text
                    style={[styles.selectedSourceKind, { color: colors.muted }]}
                  >
                    {UPSTREAM_UI_FALLBACK_COPY.vanity.source.kind(
                      true,
                      selectedSource.name,
                      selectedSourceLabel,
                      selectedSource.derivationPath,
                    )}
                  </Text>
                  {canGrindPassphrase ? (
                    <>
                      <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                        {UPSTREAM_TEXT.vanity.source.startingPassphrase}{' '}
                        {UPSTREAM_UI_FALLBACK_COPY.vanity.source.fromKey(
                          selectedSourceLabel,
                        )}
                      </Text>
                      <View
                        style={[
                          styles.readonlyField,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.readonlyValue,
                            {
                              color: selectedSource.derivation.passphrase
                                ? colors.text
                                : colors.placeholder,
                            },
                          ]}
                        >
                          {selectedSource.derivation.passphrase ||
                            UPSTREAM_TEXT.vanity.source.placeholder}
                        </Text>
                      </View>
                      <Text style={[styles.help, { color: colors.muted }]}>
                        {selectedSource.derivation.passphrase
                          ? UPSTREAM_UI_FALLBACK_COPY.vanity.source.withPassphraseNote(
                              selectedSourceLabel,
                            )
                          : UPSTREAM_UI_FALLBACK_COPY.vanity.source.withoutPassphraseNote(
                              selectedSourceLabel,
                            )}
                      </Text>
                    </>
                  ) : null}
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.help, { color: colors.muted }]}>
              {UPSTREAM_TEXT.vanity.source.noKeyYet}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              {UPSTREAM_TEXT.vanity.form.method}
            </Text>
            <NativeSelect
              accessibilityLabel={UPSTREAM_TEXT.vanity.form.method}
              colors={colors}
              controlTestID="vanity-method"
              disabled={isRunning}
              onValueChange={selectMethod}
              options={methodOptions}
              selectedValue={method}
            />
            <Text style={[styles.help, { color: colors.muted }]}>
              {method === 'derivation'
                ? UPSTREAM_UI_FALLBACK_COPY.vanity.form.methodDerivationHelp
                : UPSTREAM_TEXT.vanity.form.help.methodPassphrase}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              {UPSTREAM_TEXT.vanity.form.addressType}
            </Text>
            <NativeSelect
              accessibilityLabel={UPSTREAM_TEXT.vanity.form.addressType}
              colors={colors}
              controlTestID="vanity-script"
              disabled={isRunning}
              onValueChange={selectScript}
              options={SCRIPT_OPTIONS}
              selectedValue={script}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              {UPSTREAM_TEXT.vanity.form.addressPrefix}
            </Text>
            <TextInput
              accessibilityLabel={UPSTREAM_TEXT.vanity.form.addressPrefix}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              editable={!isRunning}
              importantForAutofill="no"
              onChangeText={updatePrefix}
              placeholder={UPSTREAM_UI_FALLBACK_COPY.vanity.form.prefixPlaceholder(
                inputState.fixedPrefix,
              )}
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.accent}
              spellCheck={false}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  opacity: isRunning ? 0.45 : 1,
                },
              ]}
              testID="vanity-prefix"
              textContentType="none"
              value={prefix}
            />
            <Text style={[styles.help, { color: colors.muted }]}>
              {prefixHelp}
            </Text>
          </View>

          {method === 'passphrase' ? (
            <>
              <VanityNumberField
                colors={colors}
                disabled={isRunning}
                help={UPSTREAM_TEXT.vanity.form.help.passphraseLength}
                label={UPSTREAM_TEXT.vanity.form.passphraseLength}
                onChangeText={value => {
                  setRunError(null);
                  setPassphraseLength(value);
                }}
                testID="vanity-passphrase-length"
                value={passphraseLength}
              />
              <VanityNumberField
                colors={colors}
                disabled={isRunning}
                help={UPSTREAM_TEXT.vanity.form.help.startCounter}
                label={UPSTREAM_TEXT.vanity.form.startCounter}
                onChangeText={value => {
                  setRunError(null);
                  setPassphraseStart(value);
                }}
                testID="vanity-start-counter"
                value={passphraseStart}
              />
              <VanityNumberField
                colors={colors}
                disabled={isRunning}
                help={UPSTREAM_TEXT.vanity.form.help.rangeSize}
                label={UPSTREAM_TEXT.vanity.form.rangeSize}
                onChangeText={value => {
                  setRunError(null);
                  setPassphraseCount(value);
                }}
                testID="vanity-range-size"
                value={passphraseCount}
              />
            </>
          ) : (
            <>
              <VanityNumberField
                colors={colors}
                disabled={isRunning}
                help={UPSTREAM_TEXT.vanity.form.help.startAccount}
                label={UPSTREAM_TEXT.vanity.form.startAccount}
                onChangeText={value => {
                  setRunError(null);
                  setDerivationStart(value);
                }}
                testID="vanity-start-account"
                value={derivationStart}
              />
              <VanityNumberField
                colors={colors}
                disabled={isRunning}
                help={UPSTREAM_TEXT.vanity.form.help.accountsToTry}
                label={UPSTREAM_TEXT.vanity.form.accountsToTry}
                onChangeText={value => {
                  setRunError(null);
                  setDerivationCount(value);
                }}
                testID="vanity-accounts-to-try"
                value={derivationCount}
              />
            </>
          )}
        </View>

        {estimate ? (
          <Text
            style={[styles.estimate, { color: colors.muted }]}
            testID="vanity-estimate"
          >
            {estimate}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={
              isRunning
                ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.grinding
                : UPSTREAM_TEXT.vanity.actions.startGrinding
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: !canStart }}
            disabled={!canStart}
            onPress={startRun}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.accent,
                opacity: !canStart ? 0.45 : pressed ? 0.82 : 1,
              },
            ]}
            testID="vanity-start"
          >
            <Text style={[styles.buttonText, { color: colors.onAccent }]}>
              {isRunning
                ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.grinding
                : UPSTREAM_TEXT.vanity.actions.startGrinding}
            </Text>
          </Pressable>
          {isRunning ? (
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.vanity.actions.stop}
              accessibilityRole="button"
              onPress={stopRun}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="vanity-stop"
            >
              <Text
                style={[styles.secondaryButtonText, { color: colors.text }]}
              >
                {UPSTREAM_TEXT.vanity.actions.stop}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={
              stopOnFirst
                ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.stopOnFirstEnabled
                : UPSTREAM_TEXT.vanity.actions.stopOnFirstFind
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: isRunning, selected: stopOnFirst }}
            disabled={isRunning}
            onPress={() => setStopOnFirst(value => !value)}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: stopOnFirst ? colors.segment : 'transparent',
                borderColor: stopOnFirst ? colors.accent : colors.border,
                opacity: isRunning ? 0.45 : pressed ? 0.72 : 1,
              },
            ]}
            testID="vanity-stop-on-first"
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {stopOnFirst
                ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.stopOnFirstEnabled
                : UPSTREAM_TEXT.vanity.actions.stopOnFirstFind}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={UPSTREAM_TEXT.vanity.actions.clearResults}
            accessibilityRole="button"
            accessibilityState={{
              disabled: isRunning || updatingMatch !== null || runMeta === null,
            }}
            disabled={isRunning || updatingMatch !== null || runMeta === null}
            onPress={() => clearResults()}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: colors.border,
                opacity:
                  isRunning || updatingMatch !== null || runMeta === null
                    ? 0.45
                    : pressed
                    ? 0.72
                    : 1,
              },
            ]}
            testID="vanity-clear"
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {UPSTREAM_TEXT.vanity.actions.clearResults}
            </Text>
          </Pressable>
        </View>

        {isRunning ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ max: 100, min: 0, now: Math.floor(progress) }}
            style={styles.progress}
            testID="vanity-progress"
          >
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.segment },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: colors.muted }]}
            >{`${progress.toFixed(1)}%`}</Text>
          </View>
        ) : null}

        <Text
          style={[styles.status, { color: colors.muted }]}
          testID="vanity-status"
        >
          {status}
        </Text>
        {visibleError ? (
          <Text
            style={[styles.error, { color: colors.error }]}
            testID="vanity-error"
          >
            {visibleError}
          </Text>
        ) : null}

        {runMeta && matches.length > 0 ? (
          <View
            style={[styles.results, { borderColor: colors.border }]}
            testID="vanity-results"
          >
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {UPSTREAM_UI_FALLBACK_COPY.vanity.result.matchesHeading(
                runMeta.derivation,
              )}
            </Text>
            <Text style={[styles.resultDescription, { color: colors.muted }]}>
              {resultDescription}
            </Text>
            {!runMeta.derivation ? (
              <Toggle
                accessibilityLabel={
                  UPSTREAM_UI_FALLBACK_COPY.vanity.result.showPassphrases
                }
                checked={revealPassphrases}
                colors={colors}
                label={`${UPSTREAM_UI_FALLBACK_COPY.vanity.result.showPassphrases} ${UPSTREAM_TEXT.vanity.result.airGapOnly}`}
                onPress={() => setRevealPassphrases(value => !value)}
                testID="vanity-reveal-passphrases"
              />
            ) : null}
            <View style={styles.matchList}>
              {matches.map((match, index) => {
                const savedTo = savedMatches[index];
                const account = match.accountIndex ?? null;
                return (
                  <View
                    key={`${String(match.counter)}-${index}`}
                    style={[
                      styles.match,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    testID={`vanity-match-${index}`}
                  >
                    <Text style={[styles.matchNumber, { color: colors.muted }]}>
                      {index + 1}
                    </Text>
                    {runMeta.derivation ? (
                      <ResultValue
                        colors={colors}
                        label={UPSTREAM_TEXT.keys.account}
                        value={`${account ?? ''}${
                          runMeta.accountHardened ? "'" : ''
                        }`}
                      />
                    ) : (
                      <>
                        <ResultValue
                          colors={colors}
                          label={
                            UPSTREAM_UI_FALLBACK_COPY.vanity.result.counter
                          }
                          value={String(match.counter)}
                        />
                        <ResultValue
                          colors={colors}
                          label={
                            UPSTREAM_UI_FALLBACK_COPY.vanity.result.passphrase
                          }
                          valueTestID={`vanity-match-${index}-passphrase`}
                          value={
                            revealPassphrases
                              ? match.candidatePassphrase
                              : UPSTREAM_UI_FALLBACK_COPY.vanity.result.maskedPassphrase()
                          }
                        />
                      </>
                    )}
                    <ResultValue
                      colors={colors}
                      label={UPSTREAM_TEXT.result.path}
                      value={match.path}
                    />
                    <ResultValue
                      colors={colors}
                      label={UPSTREAM_TEXT.result.address}
                      valueTestID={`vanity-match-${index}-address`}
                      value={match.address}
                    />
                    <ResultValue
                      colors={colors}
                      label={UPSTREAM_TEXT.vanity.result.key}
                      value={match.masterFingerprint ?? runMeta.sourceLabel}
                    />
                    {savedTo ? (
                      <Text style={[styles.saved, { color: colors.accent }]}>
                        {UPSTREAM_UI_FALLBACK_COPY.vanity.result.savedToKey(
                          savedTo,
                        )}
                      </Text>
                    ) : (
                      <Pressable
                        accessibilityLabel={
                          updatingMatch === index
                            ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.updating
                            : UPSTREAM_UI_FALLBACK_COPY.vanity.actions.updateKey
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: updatingMatch !== null,
                        }}
                        disabled={updatingMatch !== null}
                        onPress={() => applyMatch(index)}
                        style={({ pressed }) => [
                          styles.updateButton,
                          {
                            backgroundColor: colors.segment,
                            borderColor: colors.accent,
                            opacity:
                              updatingMatch !== null
                                ? 0.45
                                : pressed
                                ? 0.72
                                : 1,
                          },
                        ]}
                        testID={`vanity-match-${index}-apply`}
                      >
                        <Text
                          style={[
                            styles.updateButtonText,
                            { color: colors.text },
                          ]}
                        >
                          {updatingMatch === index
                            ? UPSTREAM_UI_FALLBACK_COPY.vanity.actions.updating
                            : UPSTREAM_UI_FALLBACK_COPY.vanity.actions
                                .updateKey}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
            {totalFound > matches.length ? (
              <Text style={[styles.overflow, { color: colors.muted }]}>
                {UPSTREAM_UI_FALLBACK_COPY.vanity.result.overflow(
                  matches.length,
                  formattedCount(totalFound),
                )}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.privacy, { color: colors.muted }]}>
          {UPSTREAM_TEXT.vanity.warnings.privacy}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function VanityNumberField({
  colors,
  disabled,
  help,
  label,
  onChangeText,
  testID,
  value,
}: {
  readonly colors: ReturnType<typeof diceColors>;
  readonly disabled: boolean;
  readonly help: string;
  readonly label: string;
  readonly onChangeText: (value: string) => void;
  readonly testID: string;
  readonly value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoComplete="off"
        autoCorrect={false}
        editable={!disabled}
        importantForAutofill="no"
        keyboardType="numeric"
        onChangeText={onChangeText}
        selectionColor={colors.accent}
        spellCheck={false}
        style={[
          styles.textInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
        testID={testID}
        textContentType="none"
        value={value}
      />
      <Text style={[styles.help, { color: colors.muted }]}>{help}</Text>
    </View>
  );
}

function ResultValue({
  colors,
  label,
  value,
  valueTestID,
}: {
  readonly colors: ReturnType<typeof diceColors>;
  readonly label: string;
  readonly value: string;
  readonly valueTestID?: string;
}) {
  return (
    <View style={styles.resultValue}>
      <Text style={[styles.resultLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        selectable
        style={[styles.resultText, { color: colors.text }]}
        testID={valueTestID}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginRight: 10,
    width: 20,
  },
  checkboxMark: {
    borderRadius: 1,
    height: 8,
    width: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  estimate: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  fieldGroup: {
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 6,
  },
  header: {
    marginBottom: 18,
  },
  help: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  hidden: {
    display: 'none',
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  match: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
  },
  matchList: {
    gap: 10,
    marginTop: 14,
  },
  matchNumber: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  messages: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
    paddingVertical: 12,
  },
  overflow: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 50,
  },
  privacy: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 20,
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginLeft: 10,
    minWidth: 48,
    textAlign: 'right',
  },
  progressTrack: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  readonlyField: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  readonlyValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  resultDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 1,
  },
  resultValue: {
    marginTop: 8,
  },
  results: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  saved: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 12,
  },
  screen: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 8,
  },
  selectedSource: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 14,
  },
  selectedSourceKind: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  selectedSourceKicker: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  selectedSourceName: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 2,
  },
  sourceOption: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sourceOptionText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sourceOptions: {
    gap: 8,
  },
  status: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  textInput: {
    borderRadius: 6,
    borderWidth: 1,
    fontFamily: 'monospace',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 3,
  },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 14,
    minHeight: 32,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  updateButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 40,
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  warning: {
    fontSize: 13,
    lineHeight: 19,
  },
});
