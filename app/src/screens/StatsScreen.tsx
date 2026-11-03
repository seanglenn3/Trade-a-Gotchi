import { StyleSheet, Text, View } from 'react-native';
import { formatMoney, presentBot, winLossLabel } from '@trade-a-gotchi/engine';
import { Sparkline } from '@/components/Sparkline';
import { Button, Card, DisclaimerStrip, Screen, Wordmark } from '@/components/ui';
import { confirmAction } from '@/confirm';
import { percent, prettyDate, signedMoney } from '@/format';
import { useGame } from '@/state/GameProvider';
import { useRouter } from 'expo-router';
import { font, theme } from '@/theme';

const REASONS: Record<string, string> = {
  stop_loss: 'stop loss',
  take_profit: 'take profit',
  max_hold_days: 'max hold',
  end_of_data: 'end of replay',
};

export function StatsScreen() {
  const game = useGame();
  const router = useRouter();
  const bot = game.bot;
  if (!bot) return null;
  const view = presentBot(bot);
  const stats = view.stats;
  const trades = [...view.portfolio.trades].reverse().slice(0, 30);

  return (
    <Screen>
      <Wordmark />
      <Card>
        <Text style={styles.kicker}>Paper account</Text>
        <Text style={styles.equity}>{formatMoney(stats.endingEquity)}</Text>
        <Text style={styles.pnl}>
          {signedMoney(stats.totalPnl)} · {percent(stats.totalReturn)} from {formatMoney(stats.startingEquity)}
        </Text>
      </Card>
      <View style={styles.grid}>
        <Stat label="Win rate" value={stats.closedTrades === 0 ? '—' : percent(stats.winRate, 0)} />
        <Stat label="Wins : losses" value={winLossLabel(stats)} />
        <Stat label="Max drawdown" value={percent(stats.maxDrawdown)} />
        <Stat label="Closed trades" value={String(stats.closedTrades)} />
        <Stat label="Closed P&L" value={signedMoney(stats.closedPnl)} />
        <Stat label="Open P&L" value={signedMoney(stats.openPnl)} />
      </View>
      <Card>
        <Text style={styles.section}>Equity</Text>
        {view.portfolio.equityCurve.length < 2 ? (
          <Text style={styles.hint}>The curve shows up after the first market day.</Text>
        ) : (
          <Sparkline values={view.portfolio.equityCurve.map((point) => point.equity)} />
        )}
      </Card>
      <Card>
        <Text style={styles.section}>Latest trades</Text>
        {trades.length === 0 ? (
          <Text style={styles.hint}>Nothing closed yet. Wins and losses both count once a trade is finished.</Text>
        ) : (
          trades.map((trade) => (
            <View key={trade.id} style={styles.trade}>
              <Text style={styles.tradeTitle}>
                {trade.symbol} · {prettyDate(trade.entryDate)} → {prettyDate(trade.exitDate)}
              </Text>
              <Text style={[styles.tradePnl, { color: trade.pnl >= 0 ? theme.good : theme.bad }]}>
                {signedMoney(trade.pnl)} · {REASONS[trade.exitReason]} · {trade.holdDays}d
              </Text>
            </View>
          ))
        )}
        {view.portfolio.trades.length > trades.length ? (
          <Text style={styles.hint}>Showing the latest {trades.length} of {view.portfolio.trades.length}.</Text>
        ) : null}
      </Card>
      <Text style={styles.note}>These numbers describe a paper simulation on sample or historical prices. They are not a forecast and not a recommendation.</Text>
      <Button
        label="Let this bot go"
        tone="ink"
        onPress={async () => {
          const ok = await confirmAction('Let this bot go?', 'The saved pet, rules, and paper journal on this device will be cleared.', 'Release');
          if (!ok) return;
          game.release();
          router.replace('/hatch');
        }}
      />
      <DisclaimerStrip />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.kicker}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: theme.muted, fontSize: font.small, fontWeight: '700' },
  equity: { color: theme.ink, fontSize: 32, fontWeight: '900' },
  pnl: { color: theme.ink, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { backgroundColor: theme.cream, borderRadius: 16, padding: 12, width: '48%', flexGrow: 1 },
  statValue: { color: theme.ink, fontWeight: '900', fontSize: 18, marginTop: 4 },
  section: { color: theme.ink, fontWeight: '900', fontSize: 18 },
  hint: { color: theme.muted, lineHeight: 18 },
  trade: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 8, gap: 2 },
  tradeTitle: { color: theme.ink, fontWeight: '700', fontSize: font.small },
  tradePnl: { fontWeight: '800', fontSize: font.small },
  note: { color: '#CDBBDE', fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
