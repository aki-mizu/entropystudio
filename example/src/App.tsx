import { useRef, useState } from 'react';
import { StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomTabs } from './components/AppBottomTabs';
import type { AppTab } from './components/AppBottomTabs';
import type { EntropyTool } from './components/EntropyMethodList';
import { KeyStationTabs } from './components/KeyStationTabs';
import { diceColors } from './features/dice/diceTheme';
import { EntropySyncProvider } from './features/entropySync';
import {
  createKeyStationTab,
  DEFAULT_KEY_STATION_DERIVATION_PATH,
  DEFAULT_KEY_STATION_SCRIPT_TYPE,
  keyStationDerivationPathForScriptType,
} from './features/keyStation/keyStation';
import type {
  KeyStationDerivation,
  KeyStationMethod,
  KeyStationScriptType,
  KeyStationTab,
} from './features/keyStation/keyStation';
import { CardsScreen } from './screens/CardsScreen';
import { DiceRollsScreen } from './screens/DiceRollsScreen';
import { NumberBasesScreen } from './screens/NumberBasesScreen';
import { PrivateKeyScreen } from './screens/PrivateKeyScreen';
import { EntropySyncSettingsScreen } from './screens/EntropySyncSettingsScreen';
import { KeyStationResultScreen } from './screens/KeyStationResultScreen';
import { SeedPhraseScreen } from './screens/SeedPhraseScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTool, setActiveTool] = useState<EntropyTool>('dice');
  const [activeTab, setActiveTab] = useState<AppTab>('method');
  const [activeKeyStationTabId, setActiveKeyStationTabId] = useState<number | null>(null);
  const [keyStationTabs, setKeyStationTabs] = useState<readonly KeyStationTab[]>([]);
  const [seedPhraseAutocompleteEnabled, setSeedPhraseAutocompleteEnabled] = useState(true);
  const [keyStationScriptType, setKeyStationScriptType] = useState<KeyStationScriptType>(
    DEFAULT_KEY_STATION_SCRIPT_TYPE,
  );
  const [keyStationDerivationPath, setKeyStationDerivationPath] = useState(
    DEFAULT_KEY_STATION_DERIVATION_PATH,
  );
  const nextKeyStationTabId = useRef(1);
  const nextKeyStationTabNumber = useRef(1);
  const colors = diceColors(isDarkMode);
  const activeKeyStationTab = keyStationTabs.find(tab => tab.id === activeKeyStationTabId) ?? null;
  const isKeyStationActive = activeTab === 'method' && activeKeyStationTabId === null;

  function selectKeyStationScriptType(scriptType: KeyStationScriptType) {
    setKeyStationScriptType(scriptType);
    setKeyStationDerivationPath(currentPath =>
      keyStationDerivationPathForScriptType(scriptType, currentPath),
    );
  }

  function addKeyStationTab(derivation: KeyStationDerivation) {
    const tab = createKeyStationTab(
      derivation,
      nextKeyStationTabId.current++,
      nextKeyStationTabNumber.current++,
      {
        derivationPath: keyStationDerivationPath,
        method: activeTool as KeyStationMethod,
        scriptType: keyStationScriptType,
      },
    );
    setKeyStationTabs(tabs => [...tabs, tab]);
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
            {activeTab === 'method' ? (
              <KeyStationTabs
                activeTabId={activeKeyStationTabId}
                colors={colors}
                onDeleteActiveTab={deleteActiveKeyStationTab}
                onOpenKeyStation={() => setActiveKeyStationTabId(null)}
                onSelectTab={setActiveKeyStationTabId}
                tabs={keyStationTabs}
              />
            ) : null}
            <View style={styles.content}>
              <DiceRollsScreen
                activeTool={activeTool}
                autocompleteEnabled={seedPhraseAutocompleteEnabled}
                derivationPath={keyStationDerivationPath}
                isActive={activeTool === 'dice' && isKeyStationActive}
                isDarkMode={isDarkMode}
                onDeriveKey={addKeyStationTab}
                onSetDerivationPath={setKeyStationDerivationPath}
                onSetScriptType={selectKeyStationScriptType}
                onSelectTool={setActiveTool}
                scriptType={keyStationScriptType}
              />
              <CardsScreen
                activeTool={activeTool}
                autocompleteEnabled={seedPhraseAutocompleteEnabled}
                derivationPath={keyStationDerivationPath}
                isActive={activeTool === 'cards' && isKeyStationActive}
                isDarkMode={isDarkMode}
                onDeriveKey={addKeyStationTab}
                onSetDerivationPath={setKeyStationDerivationPath}
                onSetScriptType={selectKeyStationScriptType}
                onSelectTool={setActiveTool}
                scriptType={keyStationScriptType}
              />
              <NumberBasesScreen
                activeTool={activeTool}
                autocompleteEnabled={seedPhraseAutocompleteEnabled}
                isActive={activeTool === 'hex' && isKeyStationActive}
                isDarkMode={isDarkMode}
                onDeriveKey={addKeyStationTab}
                onSelectTool={setActiveTool}
              />
              <SeedPhraseScreen
                activeTool={activeTool}
                autocompleteEnabled={seedPhraseAutocompleteEnabled}
                derivationPath={keyStationDerivationPath}
                isActive={activeTool === 'seed' && isKeyStationActive}
                isDarkMode={isDarkMode}
                onDeriveKey={addKeyStationTab}
                onSetDerivationPath={setKeyStationDerivationPath}
                onSetScriptType={selectKeyStationScriptType}
                onSelectTool={setActiveTool}
                scriptType={keyStationScriptType}
              />
              <PrivateKeyScreen
                activeTool={activeTool}
                isActive={activeTool === 'key' && isKeyStationActive}
                isDarkMode={isDarkMode}
                onDeriveKey={addKeyStationTab}
                onSelectTool={setActiveTool}
              />
              <KeyStationResultScreen
                colors={colors}
                isActive={activeTab === 'method' && activeKeyStationTab !== null}
                onReturnToStation={() => setActiveKeyStationTabId(null)}
                tab={activeKeyStationTab}
              />
              <EntropySyncSettingsScreen
                autocompleteEnabled={seedPhraseAutocompleteEnabled}
                isActive={activeTab === 'settings'}
                isDarkMode={isDarkMode}
                onSetAutocompleteEnabled={setSeedPhraseAutocompleteEnabled}
                onReturnToMethod={() => setActiveTab('method')}
              />
            </View>
          </SafeAreaView>
          <AppBottomTabs activeTab={activeTab} colors={colors} onSelectTab={setActiveTab} />
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
  workspace: {
    flex: 1,
  },
});

export default App;