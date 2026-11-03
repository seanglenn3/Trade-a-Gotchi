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
  lead: { color: theme.goldLight, fontFamily: font.sans, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { color: theme.goldLight, fontFamily: font.display, fontSize: 16 },
  summary: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, lineHeight: 18 },
  badge: {
    backgroundColor: theme.gold,
    color: theme.onGold,
    fontFamily: font.sansBold,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  badgeDone: { backgroundColor: '#145C3A', color: theme.neon },
  body: { color: theme.text, fontFamily: font.sans, fontSize: font.body, lineHeight: 22 },
  takeaway: { backgroundColor: 'rgba(245, 196, 81, 0.12)', borderRadius: 12, padding: 10, gap: 4 },
  takeawayLabel: { color: theme.gold, fontFamily: font.display, fontSize: font.small },
});
