import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DISCLAIMER } from '@trade-a-gotchi/engine';
import { useGame } from '@/state/GameProvider';
import { font, theme } from '@/theme';
import { Button, Screen, Wordmark } from '@/components/ui';

export function DisclaimerScreen() {
  const game = useGame();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <Wordmark />
      <Text style={styles.lead}>A pocket pet that paper-trades. It cannot touch a real account.</Text>
      <View style={styles.card}>
        {DISCLAIMER.long.map((line) => (
          <Text key={line} style={styles.body}>
            {line}
          </Text>
        ))}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => setChecked((value) => !value)}
        style={styles.checkRow}
      >
        <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
        <Text style={styles.checkText}>I understand this is an educational simulation. No real money, no real orders, no advice.</Text>
      </Pressable>
      <Button
        label="Continue"
        disabled={!checked}
        onPress={() => {
          game.acceptDisclaimer();
          router.replace(game.bot ? '/home' : '/hatch');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: theme.goldLight, fontFamily: font.sans, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 12,
  },
  body: { color: theme.text, fontFamily: font.sans, fontSize: font.body, lineHeight: 22 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.shell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: theme.shell },
  tick: { color: theme.onGold, fontWeight: '900' },
  checkText: { color: theme.text, fontFamily: font.sans, flex: 1, fontSize: font.small, lineHeight: 18 },
});
