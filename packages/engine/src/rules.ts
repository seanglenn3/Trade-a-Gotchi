import { highestHigh, rsi, sma } from './indicators';
import { GAME_CONFIG, STAGE_ORDER } from './config';
import type { Bar, CardType, EntryRule, ExitRule, RuleSet, Stage } from './types';

export interface SignalCheck {
  id: string;
  type: EntryRule['type'];
  pass: boolean;
  detail: string;
}

const CARD_COPY: Record<
  CardType,
  { title: string; summary: string }
> = {
  price_above_ma: {
    title: 'Price above average',
    summary: 'Buy only if the close is higher than the average of the last N closes.',
  },
  rsi_below: {
    title: 'RSI below a line',
    summary: 'Buy only if the relative strength dial is under a number you pick.',
  },
  breakout_high: {
    title: 'Breakout over a high',
    summary: 'Buy only if the close clears the highest high of the previous N sessions.',
  },
  volume_spike: {
    title: 'Volume spike',
    summary: 'Buy only if today’s volume is a multiple of the prior N-session average.',
  },
  stop_loss: {
    title: 'Stop loss',
    summary: 'Sell if price falls this percent from the entry. Gaps fill at the open.',
  },
  take_profit: {
    title: 'Take profit',
    summary: 'Sell if price rises this percent from the entry.',
  },
  max_hold_days: {
    title: 'Max hold',
    summary: 'Sell at the close once the bot has held the trade this many sessions.',
  },
  sizing: {
    title: 'Bite size',
    summary: 'Percent of paper equity to spend on each new trade. Never more than the cash on hand.',
  },
};

export function cardCopy(type: CardType): { title: string; summary: string } {
  return CARD_COPY[type];
}

export function defaultRules(): RuleSet {
  return {
    entries: [
      { id: 'ma', type: 'price_above_ma', period: 20, enabled: true },
      { id: 'rsi', type: 'rsi_below', period: 14, threshold: 40, enabled: false },
      { id: 'breakout', type: 'breakout_high', period: 20, enabled: false },
      { id: 'volume', type: 'volume_spike', period: 20, multiplier: 1.8, enabled: false },
    ],
    exits: [
      { id: 'stop', type: 'stop_loss', percent: 5, enabled: true },
      { id: 'target', type: 'take_profit', percent: 10, enabled: true },
      { id: 'hold', type: 'max_hold_days', days: 5, enabled: true },
    ],
    sizing: { id: 'size', type: 'percent_of_account', percent: 20 },
  };
}

export interface RulePreset {
  id: string;
  name: string;
  description: string;
  rules: RuleSet;
}

export function rulePresets(): RulePreset[] {
  const starter = defaultRules();
  const patient = defaultRules();
  const ma = patient.entries.find((entry) => entry.type === 'price_above_ma');
  if (ma && ma.type === 'price_above_ma') ma.period = 50;
  const stop = patient.exits.find((exit) => exit.type === 'stop_loss');
  if (stop && stop.type === 'stop_loss') stop.percent = 8;
  const target = patient.exits.find((exit) => exit.type === 'take_profit');
  if (target && target.type === 'take_profit') target.percent = 20;
  const hold = patient.exits.find((exit) => exit.type === 'max_hold_days');
  if (hold && hold.type === 'max_hold_days') hold.days = 15;
  patient.sizing.percent = 15;

  return [
    {
      id: 'starter',
      name: 'Starter trend',
      description: '20-day average, 5% stop, 10% target, hold up to 5 sessions, 20% bites.',
      rules: starter,
    },
    {
      id: 'patient',
      name: 'Patient trend',
      description: 'A slower 50-day average, wider exits, and smaller bites.',
      rules: patient,
    },
  ];
}

function isIntegerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function validateRuleSet(rules: RuleSet): string[] {
  const errors: string[] = [];
  if (!rules || !Array.isArray(rules.entries) || !Array.isArray(rules.exits) || !rules.sizing) {
    return ['Rules are missing an entry list, an exit list, or a sizing card.'];
  }

  const entryTypes = new Set<string>();
  for (const entry of rules.entries) {
    if (!entry || typeof entry.type !== 'string' || typeof entry.enabled !== 'boolean') {
      errors.push('An entry card is incomplete.');
      continue;
    }
    if (entryTypes.has(entry.type)) errors.push(`Duplicate entry card: ${entry.type}.`);
    entryTypes.add(entry.type);
    if (entry.type === 'price_above_ma') {
      if (!isIntegerIn(entry.period, 2, 200)) errors.push('Moving-average length must be a whole number from 2 to 200.');
    } else if (entry.type === 'rsi_below') {
      if (!isIntegerIn(entry.period, 2, 50)) errors.push('RSI length must be a whole number from 2 to 50.');
      if (!isNumberIn(entry.threshold, 1, 99)) errors.push('RSI threshold must be between 1 and 99.');
    } else if (entry.type === 'breakout_high') {
      if (!isIntegerIn(entry.period, 2, 200)) errors.push('Breakout window must be a whole number from 2 to 200.');
    } else if (entry.type === 'volume_spike') {
      if (!isIntegerIn(entry.period, 2, 100)) errors.push('Volume window must be a whole number from 2 to 100.');
      if (!isNumberIn(entry.multiplier, 1.1, 10)) errors.push('Volume spike multiple must be between 1.1 and 10.');
    } else {
      errors.push(`Unknown entry card: ${(entry as EntryRule).type}.`);
    }
  }

  const exitTypes = new Set<string>();
  for (const exit of rules.exits) {
    if (!exit || typeof exit.type !== 'string' || typeof exit.enabled !== 'boolean') {
      errors.push('An exit card is incomplete.');
      continue;
    }
    if (exitTypes.has(exit.type)) errors.push(`Duplicate exit card: ${exit.type}.`);
    exitTypes.add(exit.type);
    if (exit.type === 'stop_loss' || exit.type === 'take_profit') {
      const label = exit.type === 'stop_loss' ? 'Stop loss' : 'Take profit';
      const max = exit.type === 'stop_loss' ? 50 : 200;
      if (!isNumberIn(exit.percent, 0.5, max)) errors.push(`${label} percent must be between 0.5 and ${max}.`);
    } else if (exit.type === 'max_hold_days') {
      if (!isIntegerIn(exit.days, 1, 60)) errors.push('Max hold must be a whole number of sessions from 1 to 60.');
    } else {
      errors.push(`Unknown exit card: ${(exit as ExitRule).type}.`);
    }
  }

  if (rules.sizing.type !== 'percent_of_account' || !isNumberIn(rules.sizing.percent, 1, 100)) {
    errors.push('Bite size must be between 1% and 100% of paper equity.');
  }

  return errors;
}

export function normalizeWatchlist(symbols: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const symbol of symbols) {
    const next = symbol.trim().toUpperCase();
    if (/^[A-Z][A-Z0-9.]{0,9}$/.test(next)) unique.add(next);
  }
  return [...unique].sort();
}

function closesThrough(bars: readonly Bar[], index: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= index; i += 1) out.push(bars[i].close);
  return out;
}

export function explainEntries(entries: readonly EntryRule[], bars: readonly Bar[], index: number): SignalCheck[] {
  return entries
    .filter((entry) => entry.enabled)
    .map((entry) => {
      const result = evaluateEntryRule(entry, bars, index);
      return { id: entry.id, type: entry.type, pass: result.pass, detail: result.detail };
    });
}

export function entrySignal(entries: readonly EntryRule[], bars: readonly Bar[], index: number): boolean {
  const checks = explainEntries(entries, bars, index);
  return checks.length > 0 && checks.every((check) => check.pass);
}

export function describePassingEntries(entries: readonly EntryRule[], bars: readonly Bar[], index: number): string {
  const passed = explainEntries(entries, bars, index).filter((check) => check.pass);
  if (passed.length === 0) return 'the entry cards';
  return passed.map((check) => cardCopy(check.type).title.toLowerCase()).join(' + ');
}

function evaluateEntryRule(rule: EntryRule, bars: readonly Bar[], index: number): { pass: boolean; detail: string } {
  if (index < 0 || index >= bars.length) return { pass: false, detail: 'No bar to read.' };
  const closes = closesThrough(bars, index);
  const close = bars[index].close;

  if (rule.type === 'price_above_ma') {
    const average = sma(closes, rule.period);
    if (average == null) return { pass: false, detail: `Need ${rule.period} closes for the average.` };
    const pass = close > average;
    return {
      pass,
      detail: `Close ${close.toFixed(2)} ${pass ? 'is above' : 'is not above'} the ${rule.period}-day average ${average.toFixed(2)}.`,
    };
  }

  if (rule.type === 'rsi_below') {
    const value = rsi(closes, rule.period);
    if (value == null) return { pass: false, detail: `Need ${rule.period + 1} closes for RSI.` };
    const pass = value < rule.threshold;
    return {
      pass,
      detail: `RSI(${rule.period}) ${value.toFixed(1)} ${pass ? 'is below' : 'is not below'} ${rule.threshold}.`,
    };
  }

  if (rule.type === 'breakout_high') {
    const highs = bars.slice(0, index + 1).map((bar) => bar.high);
    const prior = highestHigh(highs, index, rule.period);
    if (prior == null) return { pass: false, detail: `Need ${rule.period} earlier highs.` };
    const pass = close > prior;
    return {
      pass,
      detail: `Close ${close.toFixed(2)} ${pass ? 'cleared' : 'did not clear'} the prior ${rule.period}-session high ${prior.toFixed(2)}.`,
    };
  }

  const volumes: number[] = [];
  for (let i = index - rule.period; i < index; i += 1) {
    if (i < 0) return { pass: false, detail: `Need ${rule.period} earlier volume bars.` };
    volumes.push(bars[i].volume);
  }
  const average = volumes.reduce((sum, value) => sum + value, 0) / rule.period;
  if (!(average > 0)) return { pass: false, detail: 'Prior volume average is zero.' };
  const ratio = bars[index].volume / average;
  const pass = bars[index].volume > rule.multiplier * average;
  return {
    pass,
    detail: `Volume is ${ratio.toFixed(2)}× the prior ${rule.period}-session average (needs above ${rule.multiplier}×).`,
  };
}

export function rulesFingerprint(rules: RuleSet, watchlist: readonly string[]): string {
  return JSON.stringify({ rules, watchlist: normalizeWatchlist(watchlist) });
}

export function unlockStageFor(card: CardType): Stage {
  for (const stage of STAGE_ORDER) {
    if ((GAME_CONFIG.unlocks[stage] as readonly CardType[]).includes(card)) return stage;
  }
  return 'legend';
}

export function stageRank(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function unlockedCardTypes(stage: Stage): CardType[] {
  const rank = stageRank(stage);
  const types: CardType[] = [];
  for (const candidate of STAGE_ORDER) {
    if (stageRank(candidate) > rank) break;
    for (const card of GAME_CONFIG.unlocks[candidate]) types.push(card);
  }
  return types;
}

export function isCardUnlocked(stage: Stage, card: CardType): boolean {
  return unlockedCardTypes(stage).includes(card);
}

export function lockedEnabledCards(rules: RuleSet, stage: Stage): CardType[] {
  const locked: CardType[] = [];
  for (const entry of rules.entries) {
    if (entry.enabled && !isCardUnlocked(stage, entry.type)) locked.push(entry.type);
  }
  for (const exit of rules.exits) {
    if (exit.enabled && !isCardUnlocked(stage, exit.type)) locked.push(exit.type);
  }
  if (!isCardUnlocked(stage, 'sizing')) locked.push('sizing');
  return locked;
}
