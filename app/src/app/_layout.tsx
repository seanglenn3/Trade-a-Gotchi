import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import { Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from '@/state/GameProvider';
import { theme } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ChakraPetch_700Bold,
    Outfit_400Regular,
    Outfit_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: theme.bg },
            }}
          />
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
