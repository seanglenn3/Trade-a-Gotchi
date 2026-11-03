import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

const TABS = [
  { href: '/home', label: 'Pet' },
  { href: '/rules', label: 'Rules' },
  { href: '/stats', label: 'Stats' },
  { href: '/learn', label: 'Food' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Pressable key={tab.href} accessibilityRole="button" onPress={() => router.replace(tab.href)} style={[styles.tab, active && styles.active]}>
            <Text style={[styles.label, active && styles.labelOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: theme.bgDeep,
  },
  tab: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', backgroundColor: '#3A2752' },
  active: { backgroundColor: theme.shell },
  label: { color: theme.cream, fontWeight: '800' },
  labelOn: { color: theme.ink },
});
