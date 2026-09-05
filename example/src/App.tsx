import { useState } from 'react';
import { StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBottomTabs } from './components/AppBottomTabs';
import type { AppTab } from './components/AppBottomTabs';
import type { EntropyTool } from './components/EntropyMethodList';
import { diceColors } from './features/dice/diceTheme';
import { EntropySyncProvider } from './features/entropySync';
import { CardsScreen } from './screens/CardsScreen';
import { DiceRollsScreen } from './screens/DiceRollsScreen';
import { NumberBasesScreen } from './screens/NumberBasesScreen';
import { PrivateKeyScreen } from './screens/PrivateKeyScreen';
import { EntropySyncSettingsScreen } from './screens/EntropySyncSettingsScreen';
import { SeedPhraseScreen } from './screens/SeedPhraseScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTool, setActiveTool] = useState<EntropyTool>('dice');
  const [activeTab, setActiveTab] = useState<AppTab>('method');
  const [seedPhraseAutocompleteEnabled, setSeedPhraseAutocompleteEnabled] = useState(true);
  const colors = diceColors(isDarkMode);

  return (
    <SafeAreaProvider>
      <EntropySyncProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.app}>
          <View style={styles.content}>
            <DiceRollsScreen
              activeTool={activeTool}
              autocompleteEnabled={seedPhraseAutocompleteEnabled}
              isActive={activeTool === 'dice' && activeTab === 'method'}
              isDarkMode={isDarkMode}
              onSelectTool={setActiveTool}
            />
            <CardsScreen
              activeTool={activeTool}
              autocompleteEnabled={seedPhraseAutocompleteEnabled}
              isActive={activeTool === 'cards' && activeTab === 'method'}
              isDarkMode={isDarkMode}
              onSelectTool={setActiveTool}
            />
            <NumberBasesScreen
              activeTool={activeTool}
              autocompleteEnabled={seedPhraseAutocompleteEnabled}
              isActive={activeTool === 'hex' && activeTab === 'method'}
              isDarkMode={isDarkMode}
              onSelectTool={setActiveTool}
            />
            <SeedPhraseScreen
              activeTool={activeTool}
              autocompleteEnabled={seedPhraseAutocompleteEnabled}
              isActive={activeTool === 'seed' && activeTab === 'method'}
              isDarkMode={isDarkMode}
              onSelectTool={setActiveTool}
            />
            <PrivateKeyScreen
              activeTool={activeTool}
              isActive={activeTool === 'key' && activeTab === 'method'}
              isDarkMode={isDarkMode}
              onSelectTool={setActiveTool}
            />
            <EntropySyncSettingsScreen
              autocompleteEnabled={seedPhraseAutocompleteEnabled}
              isActive={activeTab === 'settings'}
              isDarkMode={isDarkMode}
              onSetAutocompleteEnabled={setSeedPhraseAutocompleteEnabled}
              onReturnToMethod={() => setActiveTab('method')}
            />
          </View>
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
});

export default App;