import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listLessons, presentBot } from '@trade-a-gotchi/engine';
import { Banner, Button, DisclaimerStrip, Screen, Wordmark } from '@/components/ui';
import { GAME_CONFIG } from '@trade-a-gotchi/engine';
import { useGame } from '@/state/GameProvider';
import { font, theme } from '@/theme';

export function LearnScreen() {
  const game = useGame();
  const bot = game.bot;
  const [openId, setOpenId] = useState<string | null>(listLessons()[0]?.id ?? null);
  if (!bot) return null;
  const view = presentBot(bot);

  return (
    <Screen>
      <Wordmark />
      <Text style={styles.lead}>Learning food. Short original notes. Each new card is worth {GAME_CONFIG.xp.lesson} XP.</Text>
      {game.notice ? <Banner text={game.notice} onDismiss={game.clearNotice} /> : null}
      {listLessons().map((lesson) => {
        const done = view.lessonsCompleted.includes(lesson.id);
        const open = openId === lesson.id;
        return (
          <View key={lesson.id} style={styles.card}>
            <Pressable accessibilityRole="button" onPress={() => setOpenId(open ? null : lesson.id)} style={styles.head}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{lesson.title}</Text>
                <Text style={styles.summary}>{lesson.summary}</Text>
              </View>
              <Text style={[styles.badge, done && styles.badgeDone]}>{done ? 'Eaten' : `+${GAME_CONFIG.xp.lesson} XP`}</Text>
            </Pressable>
            {open ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.body}>{lesson.body}</Text>
                <View style={styles.takeaway}>
                  <Text style={styles.takeawayLabel}>Remember</Text>
                  <Text style={styles.body}>{lesson.takeaway}</Text>
                </View>
                <Button label={done ? 'Already fed' : 'Feed this lesson'} disabled={done} onPress={() => game.feed(lesson.id)} />
              </View>
            ) : null}
          </View>
        );
      })}
      <DisclaimerStrip />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: theme.cream, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: theme.cream, borderRadius: 18, padding: 14, gap: 10 },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { color: theme.ink, fontWeight: '900', fontSize: font.body },
  summary: { color: theme.muted, fontSize: font.small, lineHeight: 18 },
  badge: { backgroundColor: theme.shell, color: theme.ink, fontWeight: '900', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  badgeDone: { backgroundColor: '#D7EBD4' },
  body: { color: theme.ink, fontSize: font.body, lineHeight: 22 },
  takeaway: { backgroundColor: '#FFEFC2', borderRadius: 12, padding: 10, gap: 4 },
  takeawayLabel: { color: theme.ink, fontWeight: '900', fontSize: font.small },
});
