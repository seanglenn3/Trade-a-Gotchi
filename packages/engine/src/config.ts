import type { CardType, Mood, Stage } from './types';

/**
 * Placeholder creature gates. These numbers are game balance, not market rules.
 * Change them here without touching the simulator.
 */
export interface StageDefinition {
  id: Stage;
  label: string;
  blurb: string;
  minXp: number;
  minHealth: number;
  minDiscipline: number;
  /** Required win rate after there is at least one closed trade. 0 disables the check. */
  minWinRate: number;
  /** The bot qualifies only when max drawdown is at or under this fraction. */
  maxDrawdown: number;
  minClosedTrades: number;
}

export const GAME_CONFIG = {
  startingCash: 5000,
  defaultWatchlist: ['SPY'],
  discipline: {
    start: 80,
    rapidChangeDays: 7,
    rapidPenalty: 15,
    mediumChangeDays: 21,
    mediumPenalty: 5,
    stableBonus: 2,
  },
  xp: {
    lesson: 20,
    winTrade: 2,
    lossTrade: 1,
    exploreCap: 25,
  },
  stages: [
    {
      id: 'egg',
      label: 'Egg',
      blurb: 'A quiet shell. It rattles when you say a name.',
      minXp: 0,
      minHealth: 0,
      minDiscipline: 0,
      minWinRate: 0,
      maxDrawdown: 1,
      minClosedTrades: 0,
    },
    {
      id: 'baby',
      label: 'Baby',
      blurb: 'Freshly hatched, with a $5,000 paper account and one trend card.',
      minXp: 0,
      minHealth: 0,
      minDiscipline: 0,
      minWinRate: 0,
      maxDrawdown: 1,
      minClosedTrades: 0,
    },
    {
      id: 'teen',
      label: 'Teen',
      blurb: 'Curious enough to try an RSI filter.',
      minXp: 60,
      minHealth: 40,
      minDiscipline: 35,
      minWinRate: 0,
      maxDrawdown: 0.5,
      minClosedTrades: 3,
    },
    {
      id: 'adult',
      label: 'Adult',
      blurb: 'Keeps a calendar and a breakout card.',
      minXp: 160,
      minHealth: 55,
      minDiscipline: 50,
      minWinRate: 0.4,
      maxDrawdown: 0.35,
      minClosedTrades: 8,
    },
    {
      id: 'legend',
      label: 'Legend',
      blurb: 'Calm enough that volume spikes become a snack, not a scare.',
      minXp: 380,
      minHealth: 70,
      minDiscipline: 75,
      minWinRate: 0.5,
      maxDrawdown: 0.22,
      minClosedTrades: 15,
    },
  ] as const satisfies readonly StageDefinition[],
  /**
   * Cards granted the moment a stage is reached. Unlocks stack:
   * a legend keeps every earlier card.
   */
  unlocks: {
    egg: [],
    baby: ['price_above_ma', 'stop_loss', 'take_profit', 'max_hold_days', 'sizing'],
    teen: ['rsi_below'],
    adult: ['breakout_high'],
    legend: ['volume_spike'],
  } as const satisfies Record<Stage, readonly CardType[]>,
};

export const STAGE_ORDER: readonly Stage[] = GAME_CONFIG.stages.map((stage) => stage.id);

export const MOOD_QUIPS: Record<Mood, readonly string[]> = {
  sleepy: ['Something taps from inside the shell.', 'Names make it wiggle. Try one.'],
  ecstatic: [
    'The rules are singing. I could do this all week.',
    'Play money, real curiosity. That is my favorite mix.',
  ],
  happy: [
    'That plan felt calm. I like calm plans.',
    'I am full of rules and ready for the next bell.',
  ],
  content: ['Nothing dramatic today. I will take it.', 'Still here, still paper, still learning.'],
  worried: [
    'The equity curve wiggled. Can we reread the exits?',
    'I am fine. I would also like a smaller bite next time.',
  ],
  sad: ['Those losses were heavy. A smaller size might help.', 'I keep the journal so we do not forget why.'],
  sick: [
    'Drawdown tummy ache. I need safer exits, not more snacks.',
    'The hole got deep. Let us shrink the size and keep the promise.',
  ],
};

export const DISCLAIMER = {
  short: 'Educational paper-trading toy. Not investment advice. No real money.',
  long: [
    'Trade-a-Gotchi is an educational simulation. Every order is pretend.',
    'Nothing in this toy is investment, financial, legal, or tax advice, and nothing is a recommendation to buy or sell anything.',
    'No brokerage account is connected. No real orders are sent. You cannot deposit money, and you cannot lose real money here.',
    'The bundled prices are synthetic sample data so the game can run offline. If you point the server at Yahoo, Alpaca, or Polygon, those series can be delayed, adjusted, incomplete, or wrong.',
    'A paper result is a story about the past (or about made-up prices). It does not predict what happens next.',
  ],
} as const;
