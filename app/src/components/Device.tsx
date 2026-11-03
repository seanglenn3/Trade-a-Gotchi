import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '@/theme';

export function Device({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shell}>
      <View style={styles.lcd}>{children}</View>
      <View style={styles.keys}>
        <View style={[styles.key, { backgroundColor: theme.pink }]} />
        <View style={[styles.key, { backgroundColor: theme.teal }]} />
        <View style={[styles.key, { backgroundColor: theme.ink }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.shell,
    borderRadius: 36,
    padding: 16,
    gap: 14,
    borderBottomWidth: 6,
    borderBottomColor: theme.shellDark,
  },
  lcd: {
    backgroundColor: theme.lcd,
    borderRadius: 24,
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 4,
    borderColor: '#8FBF86',
  },
  keys: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 4 },
  key: { width: 28, height: 28, borderRadius: 14 },
});
