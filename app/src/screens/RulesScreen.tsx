import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  cardCopy,
  isCardUnlocked,
  presentBot,
  rulePresets,
  rulesFingerprint,
  unlockStageFor,
  type EntryRule,
  type ExitRule,
  type RuleSet,
} from '@trade-a-gotchi/engine';
import { Banner, Button, Card, DisclaimerStrip, Screen, Stepper, Wordmark } from '@/components/ui';
import { formatMoney } from '@trade-a-gotchi/engine';
import { useGame } from '@/state/GameProvider';
import { font, theme } from '@/theme';

export function RulesScreen() {
  const game = useGame();
  const bot = game.bot;
  const [draft, setDraft] = useState<RuleSet | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bot) return;
    setDraft(cloneRules(bot.rules));
    setSymbols([...bot.watchlist]);
    setError(null);
  }, [bot]);

  if (!bot || !draft) return null;
  const view = presentBot(bot);
  const dirty = rulesFingerprint(draft, symbols) !== rulesFingerprint(bot.rules, bot.watchlist);
  const preview = game.rulePreview();
  const bite = (view.stats.endingEquity * draft.sizing.percent) / 100;

  function updateEntry(id: string, patch: Partial<EntryRule>) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        entries: current.entries.map((entry) => (entry.id === id ? ({ ...entry, ...patch } as EntryRule) : entry)),
      };
    });
  }

  function updateExit(id: string, patch: Partial<ExitRule>) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        exits: current.exits.map((exit) => (exit.id === id ? ({ ...exit, ...patch } as ExitRule) : exit)),
      };
    });
  }

  return (
    <Screen>
      <Wordmark />
      <Text style={styles.lead}>All enabled entry cards must agree. Any enabled exit can close the trade.</Text>
      {game.notice ? <Banner text={game.notice} onDismiss={game.clearNotice} /> : null}
      <Card>
        <Text style={styles.section}>Watchlist</Text>
        <View style={styles.chips}>
          {game.dataset.symbols.map((symbol) => {
            const on = symbols.includes(symbol);
            return (
              <Pressable
                key={symbol}
                accessibilityRole="button"
                onPress={() => {
                  setSymbols((current) => {
                    if (on) return current.length === 1 ? current : current.filter((item) => item !== symbol);
                    return [...current, symbol].sort();
                  });
                }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{symbol}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <Text style={styles.section}>Presets</Text>
        {rulePresets().map((preset) => (
          <Button key={preset.id} label={preset.name} tone="cream" onPress={() => setDraft(cloneRules(preset.rules))} />
        ))}
        <Text style={styles.hint}>Presets only use cards a baby already has. Feeding one still counts as an edit.</Text>
      </Card>
      <Text style={styles.group}>Entry cards</Text>
      {draft.entries.map((entry) => (
        <RuleCard
          key={entry.id}
          type={entry.type}
          enabled={entry.enabled}
          unlocked={isCardUnlocked(view.stage, entry.type)}
          onToggle={() => updateEntry(entry.id, { enabled: !entry.enabled })}
        >
          {entry.type === 'price_above_ma' && (
            <Stepper label="Days in the average" value={entry.period} min={2} max={200} onChange={(period) => updateEntry(entry.id, { period })} />
          )}
          {entry.type === 'rsi_below' && (
            <>
              <Stepper label="RSI length" value={entry.period} min={2} max={50} onChange={(period) => updateEntry(entry.id, { period })} />
              <Stepper label="Buy below" value={entry.threshold} min={1} max={99} onChange={(threshold) => updateEntry(entry.id, { threshold })} />
            </>
          )}
          {entry.type === 'breakout_high' && (
            <Stepper label="Prior sessions" value={entry.period} min={2} max={200} onChange={(period) => updateEntry(entry.id, { period })} />
          )}
          {entry.type === 'volume_spike' && (
            <>
              <Stepper label="Prior sessions" value={entry.period} min={2} max={100} onChange={(period) => updateEntry(entry.id, { period })} />
              <Stepper
                label="Multiple of average"
                value={entry.multiplier}
                min={1.1}
                max={10}
                step={0.1}
                digits={1}
                onChange={(multiplier) => updateEntry(entry.id, { multiplier })}
              />
            </>
          )}
        </RuleCard>
      ))}
      <Text style={styles.group}>Exit cards</Text>
      {draft.exits.map((exit) => (
        <RuleCard
          key={exit.id}
          type={exit.type}
          enabled={exit.enabled}
          unlocked={isCardUnlocked(view.stage, exit.type)}
          onToggle={() => updateExit(exit.id, { enabled: !exit.enabled })}
        >
          {exit.type === 'stop_loss' && (
            <Stepper label="Percent below entry" value={exit.percent} min={1} max={50} onChange={(percent) => updateExit(exit.id, { percent })} />
          )}
          {exit.type === 'take_profit' && (
            <Stepper label="Percent above entry" value={exit.percent} min={1} max={200} onChange={(percent) => updateExit(exit.id, { percent })} />
          )}
          {exit.type === 'max_hold_days' && (
            <Stepper label="Sessions, counting the entry day" value={exit.days} min={1} max={60} onChange={(days) => updateExit(exit.id, { days })} />
          )}
        </RuleCard>
      ))}
      <Text style={styles.group}>Sizing card</Text>
      <Card>
        <Text style={styles.section}>{cardCopy('sizing').title}</Text>
        <Text style={styles.hint}>{cardCopy('sizing').summary}</Text>
        <Stepper
          label="Percent of paper equity"
          value={draft.sizing.percent}
          min={5}
          max={100}
          step={5}
          onChange={(percent) => setDraft({ ...draft, sizing: { ...draft.sizing, percent } })}
        />
        <Text style={styles.hint}>About {formatMoney(bite)} per new trade at today’s paper equity.</Text>
      </Card>
      {preview && dirty ? <Text style={styles.preview}>{preview.message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={dirty ? 'Feed these rules' : 'Recipe is current'}
        disabled={!dirty}
        onPress={() => {
          try {
            game.saveRules(draft, symbols);
            setError(null);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not save rules.');
          }
        }}
      />
      <DisclaimerStrip />
    </Screen>
  );
}

function RuleCard({
  type,
  enabled,
  unlocked,
  onToggle,
  children,
}: {
  type: EntryRule['type'] | ExitRule['type'];
  enabled: boolean;
  unlocked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const copy = cardCopy(type);
  return (
    <View style={[styles.rule, !unlocked && styles.locked]}>
      <View style={styles.ruleHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.section}>{copy.title}</Text>
          <Text style={styles.hint}>{copy.summary}</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled, disabled: !unlocked }}
          disabled={!unlocked}
          onPress={onToggle}
          style={[styles.toggle, enabled && unlocked && styles.toggleOn]}
        >
          <Text style={styles.toggleText}>{!unlocked ? 'Locked' : enabled ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
      {unlocked ? children : <Text style={styles.lockNote}>Unlocks at {unlockStageFor(type)} stage.</Text>}
    </View>
  );
}

function cloneRules(rules: RuleSet): RuleSet {
  return {
    entries: rules.entries.map((entry) => ({ ...entry })),
    exits: rules.exits.map((exit) => ({ ...exit })),
    sizing: { ...rules.sizing },
  };
}

const styles = StyleSheet.create({
  lead: { color: theme.cream, textAlign: 'center', lineHeight: 20 },
  section: { color: theme.ink, fontWeight: '900', fontSize: font.body },
  group: { color: theme.shell, fontWeight: '900', fontSize: 18 },
  hint: { color: theme.muted, fontSize: font.small, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EFE0C8' },
  chipOn: { backgroundColor: theme.ink },
  chipText: { color: theme.ink, fontWeight: '800' },
  chipTextOn: { color: theme.cream },
  rule: { backgroundColor: theme.cream, borderRadius: 18, padding: 14, gap: 10 },
  locked: { opacity: 0.72 },
  ruleHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  toggle: { backgroundColor: '#E7D7C4', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  toggleOn: { backgroundColor: theme.shell },
  toggleText: { fontWeight: '900', color: theme.ink },
  lockNote: { color: theme.muted, fontWeight: '700' },
  preview: { color: '#FFE08A', textAlign: 'center', lineHeight: 18 },
  error: { color: '#FFB4B4', fontWeight: '700', textAlign: 'center' },
});
