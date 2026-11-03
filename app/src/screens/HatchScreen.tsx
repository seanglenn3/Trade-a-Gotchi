import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Device } from '@/components/Device';
import { InteractivePet } from '@/components/InteractivePet';
import { Button, DisclaimerStrip, Screen, Wordmark } from '@/components/ui';
import { useGame } from '@/state/GameProvider';
import { font, theme } from '@/theme';

export function HatchScreen() {
  const game = useGame();
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen>
      <Wordmark />
      <Text style={styles.lead}>The egg rattles when it hears a name.</Text>
      <Device>
        <InteractivePet stage="egg" mood="sleepy" quip="Name me. The shell already rattles." effect={null} />
      </Device>
      {game.bot ? (
        <View style={styles.card}>
          <Text style={styles.ink}>
            {game.bot.name} is already out of the shell. You can go back, or let this bot go and hatch another.
          </Text>
          <Button label={`Visit ${game.bot.name}`} onPress={() => router.replace('/home')} />
          <Button
            label="Let this bot go"
            tone="cream"
            onPress={() => {
              game.release();
              setName('');
            }}
          />
        </View>
      ) : (
        <View style={styles.card}>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder="Name the egg"
            placeholderTextColor="#8A7560"
            maxLength={16}
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="Bot name"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="Hatch"
            onPress={() => {
              try {
                game.hatch(name);
                router.replace('/home');
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'Could not hatch.');
              }
            }}
          />
          <Button
            label="Wake the demo bot, Pip"
            tone="teal"
            onPress={() => {
              game.loadDemo();
              router.replace('/home');
            }}
          />
          <Text style={styles.hint}>Demo mode replays the bundled sample so you can see trades, mood, and evolution immediately.</Text>
        </View>
      )}
      <DisclaimerStrip />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: theme.goldLight, textAlign: 'center', fontFamily: font.sans, fontSize: font.body },
  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    gap: 10,
  },
  input: {
    backgroundColor: '#06281C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.gold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: theme.goldLight,
    fontFamily: font.display,
  },
  error: { color: theme.danger, fontFamily: font.sansBold },
  hint: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, lineHeight: 18 },
  ink: { color: theme.text, fontFamily: font.sans, fontSize: font.body, lineHeight: 22 },
});
