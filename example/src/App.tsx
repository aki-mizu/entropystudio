import { type ReactNode, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import TabView, { type AppleIcon, useBottomTabBarHeight } from 'react-native-bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { EntropyTool } from './components/EntropyMethodList';
import { KeyStationTabs } from './components/KeyStationTabs';
import { diceColors } from './features/dice/diceTheme';
import { EntropySyncProvider } from './features/entropySync';
import {
  createKeyStationTab,
  DEFAULT_KEY_STATION_SCRIPT_TYPE,
  defaultKeyStationDerivationSettings,
} from './features/keyStation/keyStation';
import type {
  KeyStationDerivation,
  KeyStationAdvancedDerivationUpdater,
  KeyStationAdvancedHardening,
  KeyStationDerivationSettings,
  KeyStationInput,
  KeyStationMethod,
  KeyStationScriptType,
  KeyStationTab,
} from './features/keyStation/keyStation';
import {
  keyDerivationAdvancedState,
  keyDerivationProjectAdvancedPath,
  keyDerivationVisiblePathState,
} from './native/entropyStudio';
import { STUDIO_UI_TEXT } from './features/studioUiCopy';
import { UPSTREAM_TEXT } from './features/upstreamUiCopy';
import type {
  KeyDerivationAdvancedInput,
  KeyDerivationAdvancedState,
  KeyDerivationPathComponent,
  KeyDerivationVisiblePathState,
} from './native/entropyStudio';
import { CardsScreen } from './screens/CardsScreen';
import { DiceRollsScreen } from './screens/DiceRollsScreen';
import { NumberBasesScreen } from './screens/NumberBasesScreen';
import { PrivateKeyScreen } from './screens/PrivateKeyScreen';
import { EntropySyncSettingsScreen } from './screens/EntropySyncSettingsScreen';
import { KeyStationResultScreen } from './screens/KeyStationResultScreen';
import { SeedPhraseScreen } from './screens/SeedPhraseScreen';

function pathComponentDraft({ index, hardened }: KeyDerivationPathComponent): string {
  return `${index}${hardened ? "'" : ''}`;
}

function normalizedAdvancedInput(
  advancedInput: KeyDerivationAdvancedInput,
  advancedState: KeyDerivationAdvancedState,
): KeyDerivationAdvancedInput {
  return {
    ...advancedInput,
    addressRange: advancedState.addressWindow.range.displayValue,
    branchRange: advancedState.branchWindow.range.displayValue,
  };
}

function synchronizedAdvancedHardening(
  previous: KeyStationAdvancedHardening,
  state: KeyDerivationAdvancedState,
): KeyStationAdvancedHardening {
  // EntropyLab only synchronizes a Harden checkbox from its paired draft
  // after that draft parses successfully. Invalid drafts retain the prior
  // checkbox value, so their help text continues to describe that control.
  return {
    account: state.account.valid ? state.account.hardened : previous.account,
    address: state.addressWindow.start.valid
      ? state.addressWindow.start.hardened
      : previous.address,
    branch: state.branchWindow.start.valid
      ? state.branchWindow.start.hardened
      : previous.branch,
    coinType: state.coinType.valid ? state.coinType.hardened : previous.coinType,
    purpose: state.purpose.valid ? state.purpose.hardened : previous.purpose,
  };
}

function advancedHardeningFromVisiblePath(
  previous: KeyStationAdvancedHardening,
  visiblePathState: KeyDerivationVisiblePathState,
): KeyStationAdvancedHardening {
  const [purpose, coinType, account] = visiblePathState.accountComponents;

  // The upstream visible-path apply action only updates the optional suffix
  // controls when that suffix is currently displayed.
  return {
    account: account.hardened,
    address: visiblePathState.address?.hardened ?? previous.address,
    branch: visiblePathState.branch?.hardened ?? previous.branch,
    coinType: coinType.hardened,
    purpose: purpose.hardened,
  };
}

function advancedInputFromVisiblePath(
  advancedInput: KeyDerivationAdvancedInput,
  visiblePathState: KeyDerivationVisiblePathState,
): KeyDerivationAdvancedInput {
  const [purpose, coinType, account] = visiblePathState.accountComponents;

  return {
    ...advancedInput,
    account: pathComponentDraft(account),
    addressStart: visiblePathState.address
      ? pathComponentDraft(visiblePathState.address)
      : advancedInput.addressStart,
    branchStart: visiblePathState.branch
      ? pathComponentDraft(visiblePathState.branch)
      : advancedInput.branchStart,
    coinType: pathComponentDraft(coinType),
    purpose: pathComponentDraft(purpose),
  };
}

function projectAdvancedSettings(
  current: KeyStationDerivationSettings,
  advancedInput: KeyDerivationAdvancedInput,
  advancedHardening = current.advancedHardening,
): KeyStationDerivationSettings {
  const projection = keyDerivationProjectAdvancedPath({
    accountPath: current.accountPath,
    advanced: advancedInput,
  });
  const normalizedInput = normalizedAdvancedInput(advancedInput, projection.advancedState);
  const synchronizedHardening = synchronizedAdvancedHardening(
    advancedHardening,
    projection.advancedState,
  );

  if (!projection.advancedState.valid) {
    return {
      ...current,
      advancedHardening: synchronizedHardening,
      advancedInput: normalizedInput,
    };
  }

  return {
    accountPath: projection.accountPath,
    advancedHardening: synchronizedHardening,
    advancedInput: normalizedInput,
    visiblePath: projection.visiblePath,
  };
}

type AppTab = 'method' | 'settings';

type AppTabRoute = {
  readonly focusedIcon?: AppleIcon;
  readonly key: AppTab;
  readonly testID: string;
  readonly title: string;
};

const APP_TAB_ROUTES: AppTabRoute[] = [
  {
    focusedIcon: Platform.OS === 'ios' ? { sfSymbol: 'key.fill' } : undefined,
    key: 'method',
    testID: 'app-tab-method',
    title: UPSTREAM_TEXT.keys.tabLabel,
  },
  {
    focusedIcon: Platform.OS === 'ios' ? { sfSymbol: 'gearshape.fill' } : undefined,
    key: 'settings',
    testID: 'app-tab-settings',
    title: STUDIO_UI_TEXT.navigation.settings,
  },
];

function TabScene({ children }: { readonly children: ReactNode }) {
  const tabBarHeight = useBottomTabBarHeight();

  return <View style={[styles.scene, { paddingBottom: tabBarHeight }]}>{children}</View>;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTool, setActiveTool] = useState<EntropyTool>('dice');
  const [activeTab, setActiveTab] = useState<AppTab>('method');
  const [activeKeyStationTabId, setActiveKeyStationTabId] = useState<number | null>(null);
  const [keyStationTabs, setKeyStationTabs] = useState<readonly KeyStationTab[]>([]);
  const [editInputRequest, setEditInputRequest] = useState<KeyStationTab | null>(null);
  const [seedPhraseAutocompleteEnabled, setSeedPhraseAutocompleteEnabled] = useState(true);
  const [keyStationScriptType, setKeyStationScriptType] = useState<KeyStationScriptType>(
    DEFAULT_KEY_STATION_SCRIPT_TYPE,
  );
  const [keyStationDerivationSettings, setKeyStationDerivationSettings] = useState(
    defaultKeyStationDerivationSettings,
  );
  const nextKeyStationTabId = useRef(1);
  const nextKeyStationTabNumber = useRef(1);
  const colors = diceColors(isDarkMode);
  const activeKeyStationTab = keyStationTabs.find(tab => tab.id === activeKeyStationTabId) ?? null;
  const isKeyStationActive = activeTab === 'method' && activeKeyStationTabId === null;
  const keyStationAdvancedState = keyDerivationAdvancedState(
    keyStationDerivationSettings.advancedInput,
  );
  const keyStationVisiblePathState = keyDerivationVisiblePathState({
    addressRange: keyStationDerivationSettings.advancedInput.addressRange,
    addressStart: keyStationDerivationSettings.advancedInput.addressStart,
    branchRange: keyStationDerivationSettings.advancedInput.branchRange,
    branchStart: keyStationDerivationSettings.advancedInput.branchStart,
    path: keyStationDerivationSettings.visiblePath,
  });
  const keyStationDerivationPathValid =
    keyStationAdvancedState.valid && keyStationVisiblePathState.valid;

  function selectKeyStationScriptType(scriptType: KeyStationScriptType) {
    setKeyStationScriptType(scriptType);
    const defaults = defaultKeyStationDerivationSettings(scriptType);
    setKeyStationDerivationSettings(current =>
      projectAdvancedSettings(current, {
        ...current.advancedInput,
        purpose: defaults.advancedInput.purpose,
      }),
    );
  }

  function setKeyStationDerivationPath(path: string) {
    setKeyStationDerivationSettings(current => {
      const visiblePathState = keyDerivationVisiblePathState({
        addressRange: current.advancedInput.addressRange,
        addressStart: current.advancedInput.addressStart,
        branchRange: current.advancedInput.branchRange,
        branchStart: current.advancedInput.branchStart,
        path,
      });

      if (!visiblePathState.valid) {
        return { ...current, visiblePath: path };
      }

      return {
        accountPath: visiblePathState.accountPath,
        advancedInput: advancedInputFromVisiblePath(current.advancedInput, visiblePathState),
        advancedHardening: advancedHardeningFromVisiblePath(
          current.advancedHardening,
          visiblePathState,
        ),
        visiblePath: path,
      };
    });
  }

  function setKeyStationAdvancedDerivation(update: KeyStationAdvancedDerivationUpdater) {
    setKeyStationDerivationSettings(current => {
      const next = update(current);
      return projectAdvancedSettings(
        current,
        next.advancedInput,
        next.advancedHardening,
      );
    });
  }

  function addKeyStationTab(derivation: KeyStationDerivation, input: KeyStationInput) {
    const editedTab = editInputRequest;
    const tab = createKeyStationTab(
      derivation,
      editedTab?.id ?? nextKeyStationTabId.current++,
      editedTab?.number ?? nextKeyStationTabNumber.current++,
      {
        derivationSettings: keyStationDerivationSettings,
        input,
        method: activeTool as KeyStationMethod,
        scriptType: keyStationScriptType,
      },
    );
    setKeyStationTabs(tabs =>
      editedTab ? tabs.map(existingTab => (existingTab.id === editedTab.id ? tab : existingTab)) : [...tabs, tab],
    );
    setEditInputRequest(null);
    setActiveKeyStationTabId(tab.id);
  }

  function deleteActiveKeyStationTab() {
    if (activeKeyStationTabId === null) {
      return;
    }

    const deletedIndex = keyStationTabs.findIndex(tab => tab.id === activeKeyStationTabId);
    if (deletedIndex < 0) {
      setActiveKeyStationTabId(null);
      return;
    }

    const remainingTabs = keyStationTabs.filter(tab => tab.id !== activeKeyStationTabId);
    setKeyStationTabs(remainingTabs);
    setActiveKeyStationTabId(remainingTabs[Math.min(deletedIndex, remainingTabs.length - 1)]?.id ?? null);
  }

  function editKeyStationInput(tab: KeyStationTab) {
    setActiveTab('method');
    setActiveTool(tab.method);
    setKeyStationScriptType(tab.scriptType);
    setKeyStationDerivationSettings(tab.derivationSettings);
    setEditInputRequest(tab);
    setActiveKeyStationTabId(null);
  }

  function renderMethodScene() {
    return (
      <TabScene>
        <KeyStationTabs
          activeTabId={activeKeyStationTabId}
          colors={colors}
          onDeleteActiveTab={deleteActiveKeyStationTab}
          onOpenKeyStation={() => setActiveKeyStationTabId(null)}
          onSelectTab={setActiveKeyStationTabId}
          tabs={keyStationTabs}
        />
        <View style={styles.content}>
          <DiceRollsScreen
            activeTool={activeTool}
            autocompleteEnabled={seedPhraseAutocompleteEnabled}
            advancedDerivationHardening={keyStationDerivationSettings.advancedHardening}
            advancedDerivationInput={keyStationDerivationSettings.advancedInput}
            derivationPath={keyStationDerivationSettings.visiblePath}
            derivationPathValid={keyStationDerivationPathValid}
            editInputRequest={editInputRequest}
            isActive={activeTool === 'dice' && isKeyStationActive}
            isDarkMode={isDarkMode}
            onDeriveKey={addKeyStationTab}
            onSetAdvancedDerivation={setKeyStationAdvancedDerivation}
            onSetDerivationPath={setKeyStationDerivationPath}
            onSetScriptType={selectKeyStationScriptType}
            onSelectTool={setActiveTool}
            scriptType={keyStationScriptType}
          />
          <CardsScreen
            activeTool={activeTool}
            autocompleteEnabled={seedPhraseAutocompleteEnabled}
            advancedDerivationHardening={keyStationDerivationSettings.advancedHardening}
            advancedDerivationInput={keyStationDerivationSettings.advancedInput}
            derivationPath={keyStationDerivationSettings.visiblePath}
            derivationPathValid={keyStationDerivationPathValid}
            editInputRequest={editInputRequest}
            isActive={activeTool === 'cards' && isKeyStationActive}
            isDarkMode={isDarkMode}
            onDeriveKey={addKeyStationTab}
            onSetAdvancedDerivation={setKeyStationAdvancedDerivation}
            onSetDerivationPath={setKeyStationDerivationPath}
            onSetScriptType={selectKeyStationScriptType}
            onSelectTool={setActiveTool}
            scriptType={keyStationScriptType}
          />
          <NumberBasesScreen
            activeTool={activeTool}
            autocompleteEnabled={seedPhraseAutocompleteEnabled}
            editInputRequest={editInputRequest}
            isActive={activeTool === 'hex' && isKeyStationActive}
            isDarkMode={isDarkMode}
            onDeriveKey={addKeyStationTab}
            onSelectTool={setActiveTool}
          />
          <SeedPhraseScreen
            activeTool={activeTool}
            autocompleteEnabled={seedPhraseAutocompleteEnabled}
            advancedDerivationHardening={keyStationDerivationSettings.advancedHardening}
            advancedDerivationInput={keyStationDerivationSettings.advancedInput}
            derivationPath={keyStationDerivationSettings.visiblePath}
            derivationPathValid={keyStationDerivationPathValid}
            editInputRequest={editInputRequest}
            isActive={activeTool === 'seed' && isKeyStationActive}
            isDarkMode={isDarkMode}
            onDeriveKey={addKeyStationTab}
            onSetAdvancedDerivation={setKeyStationAdvancedDerivation}
            onSetDerivationPath={setKeyStationDerivationPath}
            onSetScriptType={selectKeyStationScriptType}
            onSelectTool={setActiveTool}
            scriptType={keyStationScriptType}
          />
          <PrivateKeyScreen
            activeTool={activeTool}
            editInputRequest={editInputRequest}
            isActive={activeTool === 'key' && isKeyStationActive}
            isDarkMode={isDarkMode}
            onDeriveKey={addKeyStationTab}
            onSelectTool={setActiveTool}
          />
          <KeyStationResultScreen
            colors={colors}
            isActive={activeTab === 'method' && activeKeyStationTab !== null}
            onEditInput={() => (activeKeyStationTab ? editKeyStationInput(activeKeyStationTab) : undefined)}
            onReturnToStation={() => setActiveKeyStationTabId(null)}
            tab={activeKeyStationTab}
          />
        </View>
      </TabScene>
    );
  }

  function renderSettingsScene() {
    return (
      <TabScene>
        <EntropySyncSettingsScreen
          autocompleteEnabled={seedPhraseAutocompleteEnabled}
          isActive={activeTab === 'settings'}
          isDarkMode={isDarkMode}
          onSetAutocompleteEnabled={setSeedPhraseAutocompleteEnabled}
          onReturnToMethod={() => setActiveTab('method')}
        />
      </TabScene>
    );
  }

  return (
    <SafeAreaProvider>
      <EntropySyncProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.app}>
          <SafeAreaView
            edges={['top']}
            style={[styles.workspace, { backgroundColor: colors.background }]}
            testID="app-workspace-safe-area"
          >
            <View style={styles.tabHost} testID="app-bottom-tab-bar">
              <TabView
                getTestID={({ route }) => route.testID}
                navigationState={{
                  index: activeTab === 'method' ? 0 : 1,
                  routes: APP_TAB_ROUTES,
                }}
                onIndexChange={index => setActiveTab(index === 0 ? 'method' : 'settings')}
                renderScene={({ route }) =>
                  route.key === 'method' ? renderMethodScene() : renderSettingsScene()
                }
                tabBarActiveTintColor={colors.accent}
                tabBarInactiveTintColor={colors.muted}
                tabBarStyle={{ backgroundColor: colors.background }}
                tabLabelStyle={styles.tabLabel}
                translucent={false}
              />
            </View>
          </SafeAreaView>
        </View>
      </EntropySyncProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
  tabHost: {
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  workspace: {
    flex: 1,
  },
});

export default App;
