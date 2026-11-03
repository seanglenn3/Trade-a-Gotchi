export type Stage = 'egg' | 'baby' | 'teen' | 'adult' | 'legend';

export type Mood = 'sleepy' | 'ecstatic' | 'happy' | 'content' | 'worried' | 'sad' | 'sick';

export interface Bar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type EntryType = 'price_above_ma' | 'rsi_below' | 'breakout_high' | 'volume_spike';
export type ExitType = 'stop_loss' | 'take_profit' | 'max_hold_days';
export type CardType = EntryType | ExitType | 'sizing';

export interface PriceAboveMaRule {
  id: string;
  type: 'price_above_ma';
  period: number;
  enabled: boolean;
}

export interface RsiBelowRule {
  id: string;
  type: 'rsi_below';
  period: number;
  threshold: number;
  enabled: boolean;
}

export interface BreakoutRule {
  id: string;
  type: 'breakout_high';
  period: number;
  enabled: boolean;
}

export interface VolumeSpikeRule {
  id: string;
  type: 'volume_spike';
  period: number;
  multiplier: number;
  enabled: boolean;
}

export type EntryRule = PriceAboveMaRule | RsiBelowRule | BreakoutRule | VolumeSpikeRule;

export interface StopLossRule {
  id: string;
  type: 'stop_loss';
  percent: number;
  enabled: boolean;
}

export interface TakeProfitRule {
  id: string;
  type: 'take_profit';
  percent: number;
  enabled: boolean;
}

export interface MaxHoldRule {
  id: string;
  type: 'max_hold_days';
  days: number;
  enabled: boolean;
}

export type ExitRule = StopLossRule | TakeProfitRule | MaxHoldRule;

export interface SizingRule {
  id: string;
  type: 'percent_of_account';
  percent: number;
}

export interface RuleSet {
  entries: EntryRule[];
  exits: ExitRule[];
  sizing: SizingRule;
}

export type ExitReason = 'stop_loss' | 'take_profit' | 'max_hold_days' | 'end_of_data';

export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
  holdDays: number;
  exitReason: ExitReason;
}

export interface Position {
  symbol: string;
  shares: number;
  entryPrice: number;
  entryDate: string;
  /** Cash spent to open the position, in paper dollars. */
  cost: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
}

export interface JournalEvent {
  date: string;
  symbol?: string;
  kind: 'buy' | 'sell' | 'info';
  message: string;
}

export interface PortfolioState {
  startingCash: number;
  cash: number;
  positions: Position[];
  trades: Trade[];
  equityCurve: EquityPoint[];
  journal: JournalEvent[];
  /** Last session the sim has processed, or null if it has not started. */
  cursor: string | null;
}

export interface Bot {
  id: string;
  name: string;
  createdAt: string;
  hatchedAt: string;
  lessonXp: number;
  exploreXp: number;
  farthestDate: string | null;
  discipline: number;
  /** Null until the player edits rules. The starter recipe does not cost discipline. */
  lastRulesChangeAt: string | null;
  rulesVersion: number;
  highestStage: Stage;
  rules: RuleSet;
  watchlist: string[];
  portfolio: PortfolioState;
  lessonsCompleted: string[];
}

export interface Stats {
  startingEquity: number;
  endingEquity: number;
  totalPnl: number;
  totalReturn: number;
  closedPnl: number;
  openPnl: number;
  closedTrades: number;
  wins: number;
  losses: number;
  /** Share of closed trades with positive P&L, from 0 to 1. */
  winRate: number;
  /** Wins divided by losses. Null when nothing has lost yet. */
  winLossRatio: number | null;
  /** Deepest peak-to-trough drop as a fraction of the peak. */
  maxDrawdown: number;
  openPositions: number;
}

export interface StageProgress {
  id: Stage;
  label: string;
  unmet: string[];
}

export interface BotView extends Bot {
  xp: number;
  stage: Stage;
  stageLabel: string;
  health: number;
  happiness: number;
  mood: Mood;
  quip: string;
  stats: Stats;
  unlockedCards: CardType[];
  nextStage: StageProgress | null;
}
