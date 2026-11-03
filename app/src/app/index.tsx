import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useGame } from '@/state/GameProvider';
import { theme } from '@/theme';

export default function Index() {
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
  return <Redirect href="/home" />;
}
