import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiceRollsScreen } from './screens/DiceRollsScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <DiceRollsScreen isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

export default App;