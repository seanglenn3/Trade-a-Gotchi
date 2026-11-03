import { describe, expect, it } from 'vitest';
import { rsi } from '../src/indicators';
import { defaultRules, entrySignal, explainEntries, validateRuleSet } from '../src/rules';
import type { Bar, EntryRule } from '../src/types';

function barsFrom(closes: number[], volumes?: number[], highs?: number[]): Bar[] {
  return closes.map((close, index) => {
    const high = highs?.[index] ?? close;
    const low = Math.min(close, high);
    return {
      date: `2024-01-${String(index + 2).padStart(2, '0')}`,
      open: close,
      high,
      low,
      close,
      volume: volumes?.[index] ?? 1_000_000,
    };
  });
}

const maRule: EntryRule = { id: 'ma', type: 'price_above_ma', period: 4, enabled: true };
const breakoutRule: EntryRule = { id: 'breakout', type: 'breakout_high', period: 3, enabled: true };
const volumeRule: EntryRule = { id: 'volume', type: 'volume_spike', period: 3, multiplier: 2, enabled: true };

describe('entry cards', () => {
  it('passes price-above-average only when the close clears the window', () => {
    const above = barsFrom([1, 1, 1, 5]);
    const below = barsFrom([5, 5, 5, 1]);
    expect(explainEntries([maRule], above, above.length - 1)[0].pass).toBe(true);
    expect(explainEntries([maRule], below, below.length - 1)[0].pass).toBe(false);
  });

  it('compares RSI with the threshold using the same series the indicator uses', () => {
    const closes = [10, 11, 12, 13, 12, 11, 10, 9, 10, 11, 12, 13, 14, 15, 14, 13];
    const value = rsi(closes, 14);
    expect(value).not.toBeNull();
    const series = barsFrom(closes);
    const last = series.length - 1;
    const below: EntryRule = { id: 'rsi', type: 'rsi_below', period: 14, threshold: (value as number) + 1, enabled: true };
    const above: EntryRule = { id: 'rsi', type: 'rsi_below', period: 14, threshold: (value as number) - 1, enabled: true };
    expect(explainEntries([below], series, last)[0].pass).toBe(true);
    expect(explainEntries([above], series, last)[0].pass).toBe(false);
  });

  it('requires a close above the prior N-session high, excluding today', () => {
    const series = barsFrom([10, 11, 12, 13], undefined, [10, 11, 12, 13]);
    const last = series.length - 1;
    expect(explainEntries([breakoutRule], series, last)[0].pass).toBe(true);
    const tied = barsFrom([10, 11, 12, 12], undefined, [10, 11, 12, 12]);
    expect(explainEntries([breakoutRule], tied, tied.length - 1)[0].pass).toBe(false);
  });

  it('flags volume only when today beats a multiple of the prior average', () => {
    const hot = barsFrom([1, 1, 1, 1], [100, 100, 100, 250]);
    const quiet = barsFrom([1, 1, 1, 1], [100, 100, 100, 150]);
    expect(explainEntries([volumeRule], hot, 3)[0].pass).toBe(true);
    expect(explainEntries([volumeRule], quiet, 3)[0].pass).toBe(false);
  });

  it('ANDs enabled cards and ignores disabled ones', () => {
    const series = barsFrom([1, 1, 1, 5], [100, 100, 100, 100]);
    const last = series.length - 1;
    const volumeOff: EntryRule = { ...volumeRule, enabled: false };
    expect(entrySignal([maRule, volumeOff], series, last)).toBe(true);
    expect(entrySignal([maRule, volumeRule], series, last)).toBe(false);
    expect(entrySignal([{ ...maRule, enabled: false }], series, last)).toBe(false);
  });

  it('does not read bars after the signal index', () => {
    const series = barsFrom([1, 2, 3, 4, 3]);
    const index = 3;
    const before = explainEntries([maRule], series, index)[0].pass;
    const polluted = series.map((bar) => ({ ...bar }));
    polluted[index + 1] = { ...polluted[index + 1], close: 10_000, high: 10_000, open: 10_000 };
    polluted.push({
      date: '2099-01-01',
      open: 1,
      high: 1,
      low: 1,
      close: 1,
      volume: 1,
    });
    expect(explainEntries([maRule], polluted, index)[0].pass).toBe(before);
  });
});

describe('validateRuleSet', () => {
  it('accepts the starter recipe and rejects nonsense', () => {
    expect(validateRuleSet(defaultRules())).toEqual([]);
    const broken = defaultRules();
    const stop = broken.exits.find((exit) => exit.type === 'stop_loss');
    if (stop && stop.type === 'stop_loss') stop.percent = 0;
    expect(validateRuleSet(broken).length).toBeGreaterThan(0);
  });
});
