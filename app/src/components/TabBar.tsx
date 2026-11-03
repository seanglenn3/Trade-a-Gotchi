import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { font, theme } from '@/theme';

const TABS = [
  { href: '/home', label: 'Pet', icon: 'pet' },
  { href: '/rules', label: 'Rules', icon: 'rules' },
  { href: '/stats', label: 'Tape', icon: 'tape' },
  { href: '/learn', label: 'Feed', icon: 'feed' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Pressable key={tab.href} accessibilityRole="button" onPress={() => router.replace(tab.href)} style={styles.tab}>
            <View style={[styles.iconWrap, active && styles.iconOn]}>
              <TabIcon name={tab.icon} active={active} />
            </View>
            <Text style={[styles.label, active && styles.labelOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, active }: { name: (typeof TABS)[number]['icon']; active: boolean }) {
  const color = active ? theme.onGold : theme.gold;
  if (name === 'pet') {
    return (
      <Svg width={22} height={22}>
        <Circle cx={11} cy={12} r={7} fill={color} />
        <Circle cx={11} cy={5} r={2.5} fill={color} />
      </Svg>
    );
  }
  if (name === 'rules') {
    return (
      <Svg width={22} height={22}>
        <Rect x={4} y={4} width={12} height={14} rx={2} stroke={color} fill="none" />
        <Path d="M7 9 H13 M7 13 H11" stroke={color} strokeWidth={1.6} />
      </Svg>
    );
  }
  if (name === 'tape') {
    return (
      <Svg width={22} height={22}>
        <Path d="M3 16 L8 10 L12 13 L19 5" stroke={color} strokeWidth={2} fill="none" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22}>
      <Circle cx={11} cy={11} r={7} stroke={color} fill="none" />
      <Path d="M11 7 V15 M8 11 H14" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(2, 17, 12, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 196, 81, 0.45)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 42, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: theme.gold },
  label: { color: theme.muted, fontFamily: font.sansBold, fontSize: 11, letterSpacing: 0.4 },
  labelOn: { color: theme.gold },
});
