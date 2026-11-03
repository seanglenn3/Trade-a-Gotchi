import { StyleSheet, Text, View } from 'react-native';
import { formatMoney, presentBot } from '@trade-a-gotchi/engine';
import { Device } from '@/components/Device';
import { InteractivePet } from '@/components/InteractivePet';
import { Banner, Button, Card, DisclaimerStrip, Screen, VitalBar, Wordmark } from '@/components/ui';
import { confirmAction } from '@/confirm';
import { percent, prettyDate, signedMoney } from '@/format';
import { marketTone } from '@/marketTone';
import { useGame } from '@/state/GameProvider';
import { font, theme } from '@/theme';

export function HomeScreen() {
  const game = useGame();
  const bot = game.bot;
  if (!bot) return null;
  const view = presentBot(bot);
  const stats = view.stats;

  async function replay(sessions: number | 'all', label: string) {
    const ok = await confirmAction(
      'Reset the paper account?',
      `${label} starts the $5,000 account over and reruns that window. ${bot?.name ?? 'The bot'} keeps its rules.`,
      'Replay',
    );
    if (ok) game.replay(sessions);
  }

  const tone = marketTone(view.portfolio.equityCurve);
  return (
    <Screen tone={tone}>
      <Wordmark />
      <View style={styles.stageRow}>
        <Text style={styles.stage}>
          {view.stageLabel} · {view.mood}
        </Text>
        <Text style={styles.stage}>{view.xp} XP</Text>
      </View>
      {game.notice ? <Banner text={game.notice} onDismiss={game.clearNotice} /> : null}
      <Device>
        <InteractivePet
          stage={view.stage}
          mood={view.mood}
          name={view.name}
          quip={view.quip}
          effect={game.celebration}
          stats={{
            equity: formatMoney(stats.endingEquity),
            winRate: stats.closedTrades === 0 ? 'no closes' : percent(stats.winRate, 0),
            drawdown: percent(stats.maxDrawdown),
          }}
        />
      </Device>
      <Text style={styles.hint}>Tap the pet, drag to play, hold for the tape.</Text>
      <Card>
        <VitalBar label="Health" value={view.health} color={theme.neon} />
        <VitalBar label="Happiness" value={view.happiness} color={theme.gold} />
        <VitalBar label="Discipline" value={view.discipline} color={theme.goldLight} />
        {view.nextStage ? (
          <Text style={styles.hint}>
            Next: {view.nextStage.label}. Still needs {view.nextStage.unmet.slice(0, 3).join('; ')}.
          </Text>
        ) : (
          <Text style={styles.hint}>Every stage is unlocked. The legend still wants careful rules.</Text>
        )}
      </Card>
      <Card>
        <Text style={styles.kicker}>Paper equity</Text>
        <Text style={styles.equity}>{formatMoney(stats.endingEquity)}</Text>
        <Text style={styles.pnl}>
          {signedMoney(stats.totalPnl)} ({percent(stats.totalReturn)}) · {stats.wins} wins, {stats.losses} losses
        </Text>
        <Text style={styles.meta}>Market day {prettyDate(view.portfolio.cursor)} · cash {formatMoney(view.portfolio.cash)}</Text>
        <Text style={styles.meta}>
          {stats.openPositions} open · max drawdown {percent(stats.maxDrawdown)} · sample {game.dataset.start} to {game.dataset.end}
        </Text>
      </Card>
      <Card>
        <Text style={styles.section}>Care</Text>
        <Text style={styles.hint}>Steps forward through the sample. This does not reset the account.</Text>
        <Button label="Next market day" onPress={() => game.step(1)} />
        <Button label="Skip 20 days" tone="cream" onPress={() => game.step(20)} />
        <Button label="Fast-forward to the end" tone="teal" onPress={() => game.continueToEnd()} />
      </Card>
      <Card>
        <Text style={styles.section}>Time machine</Text>
        <Text style={styles.hint}>A backtest over a past window of the bundled sample. The paper account resets to $5,000. Rules stay.</Text>
        <Button label="Replay last 60 days" tone="cream" onPress={() => replay(60, 'The last 60 sessions')} />
        <Button label="Replay about 6 months" tone="cream" onPress={() => replay(126, 'About six months')} />
        <Button label="Replay the full sample" onPress={() => replay('all', 'The full sample')} />
      </Card>
      <Card>
        <Text style={styles.section}>Journal</Text>
        {view.portfolio.journal.length === 0 ? (
          <Text style={styles.hint}>No trades yet. Give it a day, or open the time machine.</Text>
        ) : (
          [...view.portfolio.journal].slice(-6).reverse().map((event, index) => (
            <Text key={`${event.date}-${index}`} style={styles.journal}>
              {event.date === 'start' ? 'Replay' : prettyDate(event.date)} · {event.message}
            </Text>
          ))
        )}
      </Card>
      <DisclaimerStrip />
      <Text style={styles.sampleNote}>{game.dataset.description}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stage: { color: theme.gold, fontFamily: font.display, fontSize: 14 },
  kicker: { color: theme.muted, fontFamily: font.sansBold, fontSize: font.small },
  equity: { color: theme.goldLight, fontFamily: font.display, fontSize: 34 },
  pnl: { color: theme.text, fontFamily: font.sansBold },
  meta: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, lineHeight: 18 },
  section: { color: theme.gold, fontFamily: font.display, fontSize: 18 },
  hint: { color: theme.muted, fontFamily: font.sans, fontSize: font.small, lineHeight: 18 },
  journal: { color: theme.text, fontFamily: font.sans, fontSize: font.small, lineHeight: 18 },
  sampleNote: { color: theme.muted, fontFamily: font.sans, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
