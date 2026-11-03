import { ActivityIndicator, View } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { useGame } from '@/state/GameProvider';
import { theme } from '@/theme';

export default function PetLayout() {
  const game = useGame();
  if (!game.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.shell} />
      </View>
    );
  }
  if (!game.disclaimerAccepted) return <Redirect href="/disclaimer" />;
  if (!game.bot) return <Redirect href="/hatch" />;
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <TabBar />
    </View>
  );
}
