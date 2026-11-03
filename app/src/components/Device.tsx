import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font, theme } from '@/theme';

export function Device({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shell}>
      <View style={styles.corners}>
        <Text style={styles.corner}>$</Text>
        <Text style={styles.live}>● LIVE PAPER</Text>
      </View>
      <View style={styles.lcd}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'rgba(4, 24, 18, 0.92)',
    borderRadius: 28,
    padding: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: theme.gold,
  },
  corners: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 },
  corner: { color: theme.gold, fontFamily: font.display, fontSize: 16 },
  live: { color: theme.neon, fontFamily: font.sansBold, fontSize: 11, letterSpacing: 1 },
  lcd: {
    backgroundColor: 'rgba(8, 48, 34, 0.72)',
    borderRadius: 22,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(61, 255, 154, 0.35)',
    overflow: 'hidden',
  },
});
