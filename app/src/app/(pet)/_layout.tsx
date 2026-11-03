import { ActivityIndicator, View } from 'react-native';
import { Redirect, Slot, usePathname } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { TabBar } from '@/components/TabBar';
import { useGame } from '@/state/GameProvider';
import { theme } from '@/theme';

export default function PetLayout() {
  const game = useGame();
  const path = usePathname();
  if (!game.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }
  if (!game.disclaimerAccepted) return <Redirect href="/disclaimer" />;
  if (!game.bot) return <Redirect href="/hatch" />;
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Animated.View key={path} entering={FadeIn.duration(280)} style={{ flex: 1 }}>
        <Slot />
      </Animated.View>
      <TabBar />
    </View>
  );
}
