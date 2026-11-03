import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function safe(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  run().catch(() => undefined);
}

export function hapticTap() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticPlay() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticHold() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

export function hapticWin() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticLoss() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
