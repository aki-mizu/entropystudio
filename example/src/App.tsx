import { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { EntropyTool } from './components/EntropyMethodList';
import { CardsScreen } from './screens/CardsScreen';
import { DiceRollsScreen } from './screens/DiceRollsScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTool, setActiveTool] = useState<EntropyTool>('dice');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <DiceRollsScreen
        activeTool={activeTool}
        isActive={activeTool === 'dice'}
        isDarkMode={isDarkMode}
        onSelectTool={setActiveTool}
      />
      <CardsScreen
        activeTool={activeTool}
        isActive={activeTool === 'cards'}
        isDarkMode={isDarkMode}
        onSelectTool={setActiveTool}
      />
    </SafeAreaProvider>
  );
}

export default App;