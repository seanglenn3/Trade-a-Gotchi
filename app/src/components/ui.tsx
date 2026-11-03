import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DISCLAIMER } from '@trade-a-gotchi/engine';
import { font, theme } from '@/theme';

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
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
  return <Text style={styles.wordmark}>TRADE-A-GOTCHI</Text>;
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
      <Text style={[styles.buttonText, { color: tone === 'teal' || tone === 'ink' ? theme.cream : theme.ink }]}>{label}</Text>
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
  wordmark: {
    color: theme.shell,
    fontSize: font.title,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  disclaimer: { color: '#E7D7C8', fontSize: font.small, lineHeight: 18, textAlign: 'center' },
  card: {
    backgroundColor: theme.cream,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  banner: {
    backgroundColor: '#FFE08A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerText: { color: theme.ink, fontSize: font.small, fontWeight: '700', lineHeight: 18 },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.shell },
  cream: { backgroundColor: theme.cream },
  teal: { backgroundColor: theme.teal },
  ink: { backgroundColor: theme.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: font.body, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalLabel: { color: theme.ink, fontWeight: '700', fontSize: font.small },
  vitalValue: { color: theme.muted, fontSize: font.small, fontWeight: '700' },
  track: { height: 12, borderRadius: 99, backgroundColor: '#E7D7C4', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 99 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepperLabel: { color: theme.muted, fontSize: font.small, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: theme.cream, fontSize: 20, fontWeight: '700' },
  stepValue: { minWidth: 42, textAlign: 'center', color: theme.ink, fontWeight: '800', fontSize: font.body },
});
