import { DISCLAIMER, GAME_CONFIG } from './config';
import { presentFrom, withStageProgress } from './evolution';
import { getLesson, LESSONS } from './lessons';
import { loadSampleDataset } from './sample/load';
import { createId, formatMoney, round2 } from './money';
import { computeStats } from './metrics';
import {
  defaultRules,
  lockedEnabledCards,
  normalizeWatchlist,
  rulesFingerprint,
  validateRuleSet,
  cardCopy,
} from './rules';
import { initialPortfolio, runSimulation, tradingDates, upcomingSession } from './simulate';
import type { Bar, Bot, BotView, RuleSet } from './types';

export function validateName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 1 || trimmed.length > 16) return 'Use a name between 1 and 16 characters.';
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '-]*$/u.test(trimmed)) {
    return 'Use letters, numbers, spaces, or apostrophes.';
  }
  return null;
}

export function displayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Hatch the egg into a baby with a $5,000 paper account and the starter recipe. */
export function hatchBot(name: string, now = new Date().toISOString()): Bot {
  const error = validateName(name);
  if (error) throw new Error(error);
  const cash = GAME_CONFIG.startingCash;
  return {
    id: createId(),
    name: displayName(name),
    createdAt: now,
    hatchedAt: now,
    lessonXp: 0,
    exploreXp: 0,
    farthestDate: null,
    discipline: GAME_CONFIG.discipline.start,
    lastRulesChangeAt: null,
    rulesVersion: 1,
    highestStage: 'baby',
    rules: defaultRules(),
    watchlist: [...GAME_CONFIG.defaultWatchlist],
    portfolio: initialPortfolio(cash),
    lessonsCompleted: [],
  };
}

export interface RuleChangePreview {
  delta: number;
  message: string;
}

export function previewRuleChange(bot: Bot, now = new Date().toISOString()): RuleChangePreview {
  if (bot.lastRulesChangeAt == null) {
    return { delta: 0, message: 'The first recipe is free. Later edits, made too often, lower discipline.' };
  }
  const next = applyDiscipline(bot.discipline, bot.lastRulesChangeAt, now);
  const delta = round2(next - bot.discipline);
  if (delta < 0 && daysBetween(bot.lastRulesChangeAt, now) < GAME_CONFIG.discipline.rapidChangeDays) {
    return { delta, message: `Changing the recipe again within ${GAME_CONFIG.discipline.rapidChangeDays} days lowers discipline by ${Math.abs(delta)}.` };
  }
  if (delta < 0) {
    return { delta, message: `This edit lands inside ${GAME_CONFIG.discipline.mediumChangeDays} days, so discipline slips by ${Math.abs(delta)}.` };
  }
  if (delta > 0) {
    return { delta, message: 'A patient edit nudges discipline up.' };
  }
  return { delta: 0, message: 'Discipline stays put.' };
}

export function updateBotRules(
  bot: Bot,
  rules: RuleSet,
  watchlist: readonly string[],
  now = new Date().toISOString(),
): { bot: Bot; disciplineDelta: number } {
  const errors = validateRuleSet(rules);
  if (errors.length > 0) throw new Error(errors.join(' '));
  const symbols = normalizeWatchlist(watchlist);
  if (symbols.length === 0) throw new Error('Pick at least one ticker.');
  const locked = lockedEnabledCards(rules, bot.highestStage);
  if (locked.length > 0) {
    const names = locked.map((card) => cardCopy(card).title).join(', ');
    throw new Error(`Still locked at this stage: ${names}.`);
  }
  if (rulesFingerprint(bot.rules, bot.watchlist) === rulesFingerprint(rules, symbols)) {
    return { bot, disciplineDelta: 0 };
  }

  const lastChange = bot.lastRulesChangeAt;
  const discipline = lastChange == null ? bot.discipline : applyDiscipline(bot.discipline, lastChange, now);
  const disciplineDelta = round2(discipline - bot.discipline);
  const next: Bot = {
    ...bot,
    rules: cloneRules(rules),
    watchlist: symbols,
    discipline,
    lastRulesChangeAt: now,
    rulesVersion: bot.rulesVersion + 1,
  };
  return { bot: presentAndSync(next), disciplineDelta };
}

export function feedLesson(bot: Bot, lessonId: string): { bot: Bot; gainedXp: number } {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error('Unknown lesson.');
  if (bot.lessonsCompleted.includes(lessonId)) return { bot, gainedXp: 0 };
  const next: Bot = {
    ...bot,
    lessonXp: bot.lessonXp + GAME_CONFIG.xp.lesson,
    lessonsCompleted: [...bot.lessonsCompleted, lessonId],
  };
  return { bot: presentAndSync(next), gainedXp: GAME_CONFIG.xp.lesson };
}

export function stepBot(bot: Bot, barsBySymbol: Record<string, Bar[]>, days = 1): Bot {
  if (!Number.isInteger(days) || days <= 0 || days > 252) {
    throw new Error('Step between 1 and 252 sessions.');
  }
  const dates = tradingDates(barsBySymbol, bot.watchlist);
  const to = upcomingSession(dates, bot.portfolio.cursor, days);
  if (!to || to === bot.portfolio.cursor) return bot;
  return advance(bot, barsBySymbol, { to, liquidateAtEnd: false });
}

export function fastForwardBot(
  bot: Bot,
  barsBySymbol: Record<string, Bar[]>,
  options: { from?: string; to?: string; reset?: boolean } = {},
): Bot {
  const starting = options.reset
    ? {
        ...bot,
        exploreXp: 0,
        farthestDate: null,
        portfolio: initialPortfolio(GAME_CONFIG.startingCash),
      }
    : bot;
  const portfolio = starting.portfolio;
  const withNote = options.reset
    ? {
        ...portfolio,
        journal: [
          {
            date: options.from ?? 'start',
            kind: 'info' as const,
            message: `Time machine reset the paper account to ${formatMoney(GAME_CONFIG.startingCash)}.`,
          },
        ],
      }
    : portfolio;
  return advance({ ...starting, portfolio: withNote }, barsBySymbol, {
    from: options.from,
    to: options.to,
    liquidateAtEnd: Boolean(options.reset),
  });
}

export function createDemoBot(barsBySymbol?: Record<string, Bar[]>, now = '2026-01-15T15:00:00.000Z'): Bot {
  let bot = hatchBot('Pip', now);
  bot = {
    ...bot,
    id: 'demo-pip',
    rules: demoRules(),
    watchlist: ['AAPL', 'MSFT', 'SPY'],
  };
  const bars = barsBySymbol ?? loadSampleDataset().bars;
  bot = fastForwardBot(bot, bars, { reset: true });
  for (const lessonId of ['paper-trading', 'moving-averages', 'stop-losses', 'position-sizing']) {
    bot = feedLesson(bot, lessonId).bot;
  }
  return bot;
}

export function presentBot(bot: Bot): BotView {
  return presentFrom(bot, computeStats(bot.portfolio));
}

export function disclaimerLines(): string[] {
  return [...DISCLAIMER.long];
}

function advance(
  bot: Bot,
  barsBySymbol: Record<string, Bar[]>,
  options: { from?: string; to?: string; liquidateAtEnd?: boolean },
): Bot {
  const previousFarthest = bot.farthestDate;
  const portfolio = runSimulation(barsBySymbol, bot.watchlist, bot.rules, bot.portfolio, options);
  const addedDates = portfolio.equityCurve.filter((point) => !previousFarthest || point.date > previousFarthest);
  const room = GAME_CONFIG.xp.exploreCap - bot.exploreXp;
  const exploreXp = bot.exploreXp + Math.max(0, Math.min(room, addedDates.length, GAME_CONFIG.xp.exploreCap));
  const farthestDate = laterDate(previousFarthest, portfolio.cursor);
  return presentAndSync({ ...bot, portfolio, exploreXp, farthestDate });
}

function presentAndSync(bot: Bot): Bot {
  return withStageProgress(bot, computeStats(bot.portfolio));
}

function applyDiscipline(current: number, lastChangeIso: string, nowIso: string): number {
  const days = daysBetween(lastChangeIso, nowIso);
  const { rapidChangeDays, rapidPenalty, mediumChangeDays, mediumPenalty, stableBonus } = GAME_CONFIG.discipline;
  let next = current;
  if (days < rapidChangeDays) next -= rapidPenalty;
  else if (days < mediumChangeDays) next -= mediumPenalty;
  else next += stableBonus;
  return Math.max(0, Math.min(100, next));
}

function daysBetween(earlierIso: string, laterIso: string): number {
  const earlier = new Date(earlierIso).getTime();
  const later = new Date(laterIso).getTime();
  if (!Number.isFinite(earlier) || !Number.isFinite(later)) return 0;
  return Math.floor((later - earlier) / 86_400_000);
}

function laterDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function cloneRules(rules: RuleSet): RuleSet {
  return {
    entries: rules.entries.map((entry) => ({ ...entry })),
    exits: rules.exits.map((exit) => ({ ...exit })),
    sizing: { ...rules.sizing },
  };
}

function demoRules(): RuleSet {
  const rules = defaultRules();
  const average = rules.entries.find((entry) => entry.type === 'price_above_ma');
  if (average && average.type === 'price_above_ma') average.period = 20;
  const stop = rules.exits.find((exit) => exit.type === 'stop_loss');
  if (stop && stop.type === 'stop_loss') stop.percent = 8;
  const target = rules.exits.find((exit) => exit.type === 'take_profit');
  if (target && target.type === 'take_profit') target.percent = 15;
  const hold = rules.exits.find((exit) => exit.type === 'max_hold_days');
  if (hold && hold.type === 'max_hold_days') hold.days = 10;
  rules.sizing.percent = 25;
  return rules;
}

export function lessonCatalog() {
  return LESSONS.map((lesson) => ({ ...lesson }));
}
