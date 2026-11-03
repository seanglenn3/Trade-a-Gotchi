import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DISCLAIMER } from '@trade-a-gotchi/engine';
import type { MarketTone } from '@/marketTone';
import { font, glow, theme } from '@/theme';
import { MarketSky } from './MarketSky';

export function Screen({ children, tone = 'flat' }: { children: ReactNode; tone?: MarketTone }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <MarketSky tone={tone} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 36,
          paddingBottom: 28,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={styles.markWrap}>
      <Text style={styles.kicker}>PAPER DESK</Text>
      <Text style={styles.wordmark}>TRADE-A-GOTCHI</Text>
    </View>
  );
}

export function DisclaimerStrip() {
  return <Text style={styles.disclaimer}>{DISCLAIMER.short}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Banner({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <Pressable onPress={onDismiss} style={styles.banner} accessibilityRole="button">
      <Text style={styles.bannerText}>{text}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'cream' | 'teal' | 'ink';
  disabled?: boolean;
}) {
  const light = tone === 'cream' || tone === 'ink';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary' && styles.primary,
        tone === 'cream' && styles.cream,
        tone === 'teal' && styles.teal,
        tone === 'ink' && styles.ink,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { color: light ? (tone === 'ink' ? theme.danger : theme.gold) : theme.onGold }]}>{label}</Text>
    </Pressable>
  );
}

export function VitalBar({ label, value, color }: { label: string; value: number; color: string }) {
  const width = `${Math.max(2, Math.min(100, value))}%` as const;
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.row}>
        <Text style={styles.vitalLabel}>{label}</Text>
        <Text style={styles.vitalValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  digits = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  digits?: number;
}) {
  const shown = digits > 0 ? value.toFixed(digits) : String(value);
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable accessibilityRole="button" onPress={() => onChange(clamp(round(value - step, digits), min, max))} style={styles.step}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{shown}</Text>
        <Pressable accessibilityRole="button" onPress={() => onChange(clamp(round(value + step, digits), min, max))} style={styles.step}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  column: { width: '100%', maxWidth: 440, gap: 14 },
  markWrap: { alignItems: 'center', gap: 2 },
  kicker: { color: theme.neon, fontFamily: font.sansBold, fontSize: 11, letterSpacing: 3 },
  wordmark: {
    color: theme.gold,
    fontFamily: font.display,
    fontSize: font.title,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  disclaimer: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, lineHeight: 18, textAlign: 'center' },
  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 10,
    ...glow,
  },
  banner: {
    backgroundColor: 'rgba(245, 196, 81, 0.16)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.gold,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerText: { color: theme.goldLight, fontFamily: font.sansBold, fontSize: font.small, lineHeight: 18 },
  button: {
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.gold },
  cream: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.gold },
  teal: { backgroundColor: theme.neon },
  ink: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.danger },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  buttonText: { fontFamily: font.sansBold, fontSize: font.body },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalLabel: { color: theme.text, fontFamily: font.sansBold, fontSize: font.small },
  vitalValue: { color: theme.gold, fontFamily: font.sansBold, fontSize: font.small },
  track: { height: 12, borderRadius: 99, backgroundColor: '#06281C', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 99 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepperLabel: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: theme.onGold, fontSize: 20, fontFamily: font.display },
  stepValue: { minWidth: 42, textAlign: 'center', color: theme.goldLight, fontFamily: font.sansBold, fontSize: font.body },
});
