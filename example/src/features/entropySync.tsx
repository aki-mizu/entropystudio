import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { CardMethod } from './cards/cards';
import type { DiceMethod, WordCount } from './dice/dice';
import type { DiceColors } from './dice/diceTheme';
import type { NumberBaseFormat } from './numberBases/numberBases';
import type { PrivateKeyInputFormat } from './privateKey/privateKey';
import type { SeedPhraseEntryMethod } from './seedPhrase/components/SeedPhraseKeypad';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from './upstreamUiCopy';
import { EntropySyncSource, synchronizeEntropy } from '../native/entropyStudio';
import type { EntropySyncSnapshot } from '../native/entropyStudio';

type EntropySyncSourceValue =
  (typeof EntropySyncSource)[keyof typeof EntropySyncSource];

export type EntropySyncRequest = {
  readonly selectedFinalWord: string;
  readonly source: EntropySyncSourceValue;
  readonly targetWords: WordCount;
  readonly value: string;
  readonly zeroIndexed: boolean;
};

type EntropySyncContextValue = {
  readonly disable: () => void;
  readonly enable: (request?: EntropySyncRequest) => void;
  readonly enabled: boolean;
  readonly publish: (request: EntropySyncRequest) => void;
  readonly registerCurrentRequest: (request: EntropySyncRequest) => void;
  readonly selectTargetWords: (targetWords: WordCount) => void;
  readonly snapshot: EntropySyncSnapshot | null;
  readonly targetWords: WordCount;
};

type EntropySyncControlProps = {
  readonly colors: DiceColors;
  readonly enabled: boolean;
  readonly onDisable: () => void;
  readonly onEnable: () => void;
  readonly snapshot: EntropySyncSnapshot | null;
  readonly testID: string;
};

const EntropySyncContext = createContext<EntropySyncContextValue | null>(null);

export function EntropySyncProvider({ children }: PropsWithChildren) {
  const currentRequest = useRef<EntropySyncRequest | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [snapshot, setSnapshot] = useState<EntropySyncSnapshot | null>(null);
  const [targetWords, setTargetWords] = useState<WordCount>(24);

  function synchronize(request: EntropySyncRequest) {
    try {
      const nextSnapshot = synchronizeEntropy(
        request.value,
        request.source,
        request.targetWords,
        request.zeroIndexed,
        request.selectedFinalWord,
      );
      setSnapshot(nextSnapshot);
      setTargetWords(request.targetWords);
    } catch {
      setSnapshot(null);
    }
  }

  function registerCurrentRequest(request: EntropySyncRequest) {
    currentRequest.current = request;
  }

  function enable(request?: EntropySyncRequest) {
    const nextRequest = request ?? currentRequest.current;
    setEnabled(true);
    if (nextRequest) {
      synchronize(nextRequest);
    }
  }

  function publish(request: EntropySyncRequest) {
    registerCurrentRequest(request);
    if (!enabled) {
      return;
    }
    synchronize(request);
  }

  function disable() {
    setEnabled(false);
    setSnapshot(null);
  }

  function selectTargetWords(nextTargetWords: WordCount) {
    const request = currentRequest.current;
    setTargetWords(nextTargetWords);
    if (!request) {
      return;
    }

    const nextRequest = { ...request, targetWords: nextTargetWords };
    currentRequest.current = nextRequest;
    if (enabled) {
      synchronize(nextRequest);
    }
  }

  return (
    <EntropySyncContext.Provider
      value={{
        disable,
        enable,
        enabled,
        publish,
        registerCurrentRequest,
        selectTargetWords,
        snapshot,
        targetWords,
      }}
    >
      {children}
    </EntropySyncContext.Provider>
  );
}

export function useEntropySync(): EntropySyncContextValue {
  const context = useContext(EntropySyncContext);
  if (!context) {
    throw new Error('EntropySyncProvider is required.');
  }
  return context;
}

export function useRegisterCurrentEntropySyncRequest(
  isActive: boolean,
  request: EntropySyncRequest,
) {
  const { registerCurrentRequest } = useEntropySync();

  useEffect(() => {
    if (isActive) {
      registerCurrentRequest(request);
    }
  }, [isActive, registerCurrentRequest, request]);
}

export function EntropySyncControl({
  colors,
  enabled,
  onDisable,
  onEnable,
  snapshot,
  testID,
}: EntropySyncControlProps) {
  const showStatus = enabled && Boolean(snapshot?.bitCount);
  const caution =
    snapshot && showStatus
      ? snapshot.entropyStrengthUnknown
        ? UPSTREAM_TEXT.sync.entropyUnknown
        : snapshot.entropyBelowMinimum
        ? UPSTREAM_UI_FALLBACK_COPY.sync.shortfall(
            snapshot.effectiveEntropyBits,
            snapshot.minimumEntropyBits,
          )
        : null
      : null;

  return (
    <View
      style={[styles.control, { borderTopColor: colors.border }]}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {UPSTREAM_TEXT.sync.title}
          </Text>
          {showStatus ? (
            <View style={styles.statusGroup}>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.status, { color: colors.accent }]}
                testID={`${testID}-status`}
              >
                {UPSTREAM_TEXT.sync.status}
              </Text>
              {caution ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.caution, { color: colors.diceText }]}
                  testID={`${testID}-caution`}
                >
                  {caution}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <Switch
          accessibilityHint={UPSTREAM_TEXT.sync.description}
          accessibilityLabel={UPSTREAM_TEXT.sync.title}
          onValueChange={value => (value ? onEnable() : onDisable())}
          testID={`${testID}-toggle`}
          thumbColor={enabled ? colors.accent : colors.surface}
          trackColor={{ false: colors.segment, true: colors.accent }}
          value={enabled}
        />
      </View>
      <Text style={[styles.description, { color: colors.muted }]}>
        {UPSTREAM_TEXT.sync.description}
      </Text>
    </View>
  );
}

export function diceEntropySyncSource(
  method: DiceMethod,
): EntropySyncSourceValue {
  switch (method) {
    case 'coldcard':
      return EntropySyncSource.DiceColdcard;
    case 'coleman':
      return EntropySyncSource.DiceColeman;
    case 'bitbox':
      return EntropySyncSource.DiceBitbox;
    case 'd8d16':
      return EntropySyncSource.DiceD8D16;
  }
}

export function cardEntropySyncSource(
  method: CardMethod,
  matchesIanColeman: boolean,
): EntropySyncSourceValue {
  if (method === 'direct') {
    return EntropySyncSource.CardsDirect;
  }
  return matchesIanColeman
    ? EntropySyncSource.CardsHashedColeman
    : EntropySyncSource.CardsHashedAscii;
}

export function numberBaseEntropySyncSource(
  format: NumberBaseFormat,
): EntropySyncSourceValue {
  switch (format) {
    case 'bin':
      return EntropySyncSource.NumberBaseBin;
    case 'base4':
      return EntropySyncSource.NumberBaseBase4;
    case 'base8':
      return EntropySyncSource.NumberBaseBase8;
    case 'hex':
      return EntropySyncSource.NumberBaseHex;
    case 'base32':
      return EntropySyncSource.NumberBaseBase32;
    case 'base64':
      return EntropySyncSource.NumberBaseBase64;
  }
}

export function seedEntropySyncSource(
  method: SeedPhraseEntryMethod,
): EntropySyncSourceValue {
  return method === 'words'
    ? EntropySyncSource.SeedWords
    : EntropySyncSource.SeedNumbers;
}

export function privateKeyEntropySyncSource(
  format: PrivateKeyInputFormat,
  trimBrainWalletBoundaryWhitespace: boolean,
): EntropySyncSourceValue {
  switch (format) {
    case 'wif':
      return EntropySyncSource.PrivateKeyWif;
    case 'hex':
      return EntropySyncSource.PrivateKeyHex;
    case 'mini':
      return EntropySyncSource.PrivateKeyMiniKey;
    case 'brain':
      return trimBrainWalletBoundaryWhitespace
        ? EntropySyncSource.PrivateKeyBrainWalletTrimmed
        : EntropySyncSource.PrivateKeyBrainWallet;
  }
}

const styles = StyleSheet.create({
  caution: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
  },
  control: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusGroup: {
    marginTop: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
});
