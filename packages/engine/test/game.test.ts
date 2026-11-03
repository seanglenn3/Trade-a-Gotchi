import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../src/config';
import {
  createDemoBot,
  fastForwardBot,
  feedLesson,
  hatchBot,
  presentBot,
  previewRuleChange,
  updateBotRules,
} from '../src/game';
import { defaultRules } from '../src/rules';
import type { Bot, Trade } from '../src/types';

const NOW = '2026-04-01T15:00:00.000Z';
const LATER = '2026-04-03T15:00:00.000Z';
const PATIENT = '2026-05-15T15:00:00.000Z';

function trade(pnl: number, index: number): Trade {
  return {
    id: `t-${index}`,
    symbol: 'SPY',
    entryDate: '2024-02-01',
    exitDate: '2024-02-05',
    entryPrice: 100,
    exitPrice: 100 + pnl,
    shares: 1,
    pnl,
    pnlPercent: pnl / 100,
    holdDays: 3,
    exitReason: pnl > 0 ? 'take_profit' : 'stop_loss',
  };
}

describe('hatch and care', () => {
  it('hatches an egg into a baby with a $5,000 paper account', () => {
    const bot = hatchBot('  Mochi  ', NOW);
    const view = presentBot(bot);
    expect(bot.name).toBe('Mochi');
    expect(view.stage).toBe('baby');
    expect(view.stats.endingEquity).toBe(5000);
    expect(view.portfolio.cash).toBe(5000);
    expect(view.mood).toBe('happy');
    expect(view.health).toBeGreaterThan(70);
    expect(view.unlockedCards).toContain('price_above_ma');
    expect(view.unlockedCards).not.toContain('rsi_below');
    expect(view.quip.length).toBeGreaterThan(0);
  });

  it('rejects an empty name', () => {
    expect(() => hatchBot('   ', NOW)).toThrow(/name/i);
  });

  it('gives the first recipe away and then charges discipline for impatient edits', () => {
    let bot = hatchBot('Pip', NOW);
    const edited = defaultRules();
    edited.sizing.percent = 10;
    const first = updateBotRules(bot, edited, ['spy'], NOW);
    expect(first.disciplineDelta).toBe(0);
    expect(first.bot.discipline).toBe(GAME_CONFIG.discipline.start);
    expect(first.bot.watchlist).toEqual(['SPY']);

    const again = defaultRules();
    again.sizing.percent = 15;
    const preview = previewRuleChange(first.bot, LATER);
    const second = updateBotRules(first.bot, again, ['SPY'], LATER);
    expect(preview.delta).toBe(-15);
    expect(second.disciplineDelta).toBe(-15);
    expect(second.bot.discipline).toBe(65);

    const same = updateBotRules(second.bot, again, ['SPY'], LATER);
    expect(same.disciplineDelta).toBe(0);
    expect(same.bot.rulesVersion).toBe(second.bot.rulesVersion);

    const rested = updateBotRules(second.bot, defaultRules(), ['SPY', 'AAPL'], PATIENT);
    expect(rested.disciplineDelta).toBe(2);
    expect(rested.bot.watchlist).toEqual(['AAPL', 'SPY']);
  });

  it('refuses a card the current stage has not unlocked', () => {
    const bot = hatchBot('Pip', NOW);
    const rules = defaultRules();
    const rsi = rules.entries.find((entry) => entry.type === 'rsi_below');
    if (rsi) rsi.enabled = true;
    expect(() => updateBotRules(bot, rules, ['SPY'], NOW)).toThrow(/locked/i);
  });

  it('feeds each lesson once', () => {
    const bot = hatchBot('Pip', NOW);
    const first = feedLesson(bot, 'drawdowns');
    expect(first.gainedXp).toBe(GAME_CONFIG.xp.lesson);
    expect(presentBot(first.bot).xp).toBe(GAME_CONFIG.xp.lesson);
    const second = feedLesson(first.bot, 'drawdowns');
    expect(second.gainedXp).toBe(0);
    expect(second.bot.lessonXp).toBe(GAME_CONFIG.xp.lesson);
    expect(() => feedLesson(bot, 'not-a-lesson')).toThrow(/unknown lesson/i);
  });
});

describe('evolution', () => {
  it('promotes a practiced bot to teen and keeps that stage if stats later worsen', () => {
    const bot = hatchBot('Ada', NOW);
    bot.lessonXp = 100;
    bot.discipline = 80;
    bot.portfolio = {
      ...bot.portfolio,
      trades: [10, 12, 8, -4, 6].map(trade),
      equityCurve: [
        { date: '2024-03-01', equity: 5200 },
        { date: '2024-03-02', equity: 5100 },
      ],
    };
    const grown = fastForwardBot(bot, {}, { to: '2020-01-01' });
    const view = presentBot(grown);
    expect(view.stage).toBe('teen');
    expect(view.unlockedCards).toContain('rsi_below');
    expect(view.unlockedCards).not.toContain('breakout_high');

    const ruined: Bot = {
      ...grown,
      discipline: 10,
      portfolio: {
        ...grown.portfolio,
        trades: [trade(-500, 1)],
        equityCurve: [
          { date: '2024-04-01', equity: 5000 },
          { date: '2024-04-02', equity: 2500 },
        ],
      },
    };
    expect(presentBot(ruined).stage).toBe('teen');
    expect(presentBot(ruined).mood).toBe('sick');
  });

  it('requires win rate, drawdown, and trade count before legend', () => {
    const bot = hatchBot('Lux', NOW);
    bot.lessonXp = 500;
    bot.discipline = 90;
    bot.highestStage = 'baby';
    bot.portfolio = {
      ...bot.portfolio,
      trades: Array.from({ length: 20 }, (_, index) => trade(index % 5 === 0 ? -20 : 15, index)),
      equityCurve: [
        { date: '2024-05-01', equity: 5000 },
        { date: '2024-05-02', equity: 5600 },
      ],
    };
    const view = presentBot(bot);
    expect(view.stats.closedTrades).toBe(20);
    expect(view.stats.winRate).toBeGreaterThan(0.5);
    expect(view.stage).toBe('legend');
  });
});

describe('demo seed', () => {
  it('builds a bot that has already paper-traded the bundled sample', () => {
    const view = presentBot(createDemoBot());
    expect(view.name).toBe('Pip');
    expect(view.id).toBe('demo-pip');
    expect(view.stats.closedTrades).toBeGreaterThan(0);
    expect(Number.isFinite(view.stats.endingEquity)).toBe(true);
    expect(view.stats.endingEquity).toBeGreaterThan(1000);
    expect(view.stats.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(view.stats.maxDrawdown).toBeLessThan(1);
    expect(view.stage).toBe('adult');
    expect(view.nextStage?.id).toBe('legend');
    expect(view.lessonsCompleted).toContain('position-sizing');
    expect(view.portfolio.journal.some((event) => event.kind === 'buy' || event.kind === 'sell')).toBe(true);
  });
});
