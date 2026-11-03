import { formatMoney, formatPrice, formatShares, round2 } from './money';
import { describePassingEntries, entrySignal, validateRuleSet } from './rules';
import type {
  Bar,
  EquityPoint,
  ExitReason,
  ExitRule,
  JournalEvent,
  PortfolioState,
  Position,
  RuleSet,
} from './types';

export interface SimulationOptions {
  /** First session eligible for a new fill. Earlier bars stay available as indicator history. */
  from?: string;
  /** Last session to process, inclusive. */
  to?: string;
  /**
   * Close anything still open at the final close.
   * Used by time-machine replays so the score includes unfinished trades.
   */
  liquidateAtEnd?: boolean;
}

const JOURNAL_LIMIT = 60;

/**
 * Daily paper simulator.
 *
 * Signals are read from a session's close. Orders fill at the next session's open
 * so a rule cannot trade on a price it has not "seen" yet.
 * Stops and targets are checked against that fill session's range.
 * If both a stop and a target are touched in the same bar, the stop fills first.
 * A gap through a stop or target fills at the open.
 * Hold-time exits fill at the close of the Nth session, counting the entry session.
 */
export function runSimulation(
  barsBySymbol: Record<string, Bar[]>,
  watchlist: readonly string[],
  rules: RuleSet,
  state: PortfolioState,
  options: SimulationOptions = {},
): PortfolioState {
  const errors = validateRuleSet(rules);
  if (errors.length > 0) throw new Error(errors.join(' '));

  const symbols = [...new Set(watchlist.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].sort();
  const books = new Map<string, Bar[]>();
  for (const symbol of symbols) {
    const bars = (barsBySymbol[symbol] ?? [])
      .filter(isValidBar)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    books.set(symbol, bars);
  }

  const calendar = sessionDates(books, state.cursor, options.from, options.to);
  let cash = state.cash;
  let positions = state.positions.map((position) => ({ ...position }));
  const trades = state.trades.slice();
  const equityCurve = state.equityCurve.slice();
  const journal = state.journal.slice();

  const indexOf = new Map<string, Map<string, number>>();
  for (const [symbol, bars] of books) {
    indexOf.set(symbol, new Map(bars.map((bar, index) => [bar.date, index])));
  }

  const closePosition = (position: Position, date: string, price: number, reason: ExitReason) => {
    const proceeds = round2(position.shares * price);
    cash = round2(cash + proceeds);
    const pnl = round2(proceeds - position.cost);
    const pnlPercent = position.cost > 0 ? pnl / position.cost : 0;
    const bars = books.get(position.symbol) ?? [];
    trades.push({
      id: `${position.symbol}-${position.entryDate}-${date}-${trades.length + 1}`,
      symbol: position.symbol,
      entryDate: position.entryDate,
      exitDate: date,
      entryPrice: position.entryPrice,
      exitPrice: price,
      shares: position.shares,
      pnl,
      pnlPercent,
      holdDays: sessionsHeld(bars, position.entryDate, date),
      exitReason: reason,
    });
    pushJournal(journal, {
      date,
      symbol: position.symbol,
      kind: 'sell',
      message: `Sold ${position.symbol} at ${formatPrice(price)} (${exitLabel(reason)}). P&L ${formatMoney(pnl)}.`,
    });
  };

  for (const date of calendar) {
    const survivors: Position[] = [];
    for (const position of positions) {
      const bars = books.get(position.symbol);
      const index = bars ? indexOf.get(position.symbol)?.get(date) : undefined;
      if (!bars || index == null) {
        survivors.push(position);
        continue;
      }
      const exit = resolveExit(position, bars[index], rules.exits, sessionsHeld(bars, position.entryDate, date));
      if (exit) closePosition(position, date, exit.price, exit.reason);
      else survivors.push(position);
    }
    positions = survivors;

    const openSymbols = new Set(positions.map((position) => position.symbol));
    for (const symbol of symbols) {
      if (openSymbols.has(symbol)) continue;
      const bars = books.get(symbol) ?? [];
      const index = indexOf.get(symbol)?.get(date);
      if (index == null || index < 1) continue;
      const signalIndex = index - 1;
      if (!entrySignal(rules.entries, bars, signalIndex)) continue;

      const bar = bars[index];
      const fill = bar.open;
      if (!(fill > 0)) continue;
      const equity = markEquity(cash, positions, books, date, 'open');
      const budget = round2(equity * (rules.sizing.percent / 100));
      const spend = round2(Math.min(budget, cash));
      if (spend < 1) continue;

      const shares = spend / fill;
      cash = round2(cash - spend);
      const position: Position = {
        symbol,
        shares,
        entryPrice: fill,
        entryDate: date,
        cost: spend,
      };
      const exit = resolveExit(position, bar, rules.exits, 1);
      if (exit) {
        pushJournal(journal, {
          date,
          symbol,
          kind: 'buy',
          message: `Bought ${formatShares(shares)} ${symbol} at ${formatPrice(fill)}.`,
        });
        closePosition(position, date, exit.price, exit.reason);
      } else {
        positions.push(position);
        openSymbols.add(symbol);
        positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
        pushJournal(journal, {
          date,
          symbol,
          kind: 'buy',
          message: `Bought ${formatShares(shares)} ${symbol} at ${formatPrice(fill)} (${describePassingEntries(rules.entries, bars, signalIndex)}).`,
        });
      }
    }

    equityCurve.push({ date, equity: round2(markEquity(cash, positions, books, date, 'close')) });
  }

  if (options.liquidateAtEnd && positions.length > 0 && calendar.length > 0) {
    const date = calendar[calendar.length - 1];
    for (const position of positions) {
      const bars = books.get(position.symbol) ?? [];
      const price = lastCloseOnOrBefore(bars, date) ?? position.entryPrice;
      closePosition(position, date, price, 'end_of_data');
    }
    positions = [];
    replaceLastEquity(equityCurve, date, round2(cash));
  }

  return {
    startingCash: state.startingCash,
    cash: round2(cash),
    positions,
    trades,
    equityCurve,
    journal: journal.slice(-JOURNAL_LIMIT),
    cursor: calendar.length > 0 ? calendar[calendar.length - 1] : state.cursor,
  };
}

export function initialPortfolio(startingCash: number): PortfolioState {
  return {
    startingCash,
    cash: round2(startingCash),
    positions: [],
    trades: [],
    equityCurve: [],
    journal: [],
    cursor: null,
  };
}

export function isValidBar(bar: Bar): boolean {
  if (!bar || typeof bar.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(bar.date)) return false;
  const numbers = [bar.open, bar.high, bar.low, bar.close, bar.volume];
  if (!numbers.every((value) => typeof value === 'number' && Number.isFinite(value))) return false;
  if (!(bar.open > 0 && bar.high > 0 && bar.low > 0 && bar.close > 0) || bar.volume < 0) return false;
  if (bar.high + 1e-6 < Math.max(bar.open, bar.close)) return false;
  if (bar.low - 1e-6 > Math.min(bar.open, bar.close)) return false;
  return true;
}

export function tradingDates(barsBySymbol: Record<string, Bar[]>, watchlist: readonly string[]): string[] {
  const books = new Map<string, Bar[]>();
  for (const symbol of watchlist) {
    books.set(symbol, (barsBySymbol[symbol] ?? []).filter(isValidBar));
  }
  return sessionDates(books, null, undefined, undefined);
}

export function windowEnding(dates: readonly string[], sessions: number): { from: string; to: string } | null {
  if (dates.length === 0 || sessions <= 0) return null;
  const to = dates[dates.length - 1];
  const from = dates[Math.max(0, dates.length - sessions)];
  return { from, to };
}

function sessionDates(
  books: Map<string, Bar[]>,
  cursor: string | null,
  from: string | undefined,
  to: string | undefined,
): string[] {
  const dates = new Set<string>();
  for (const bars of books.values()) {
    for (const bar of bars) {
      if (cursor && bar.date <= cursor) continue;
      if (from && bar.date < from) continue;
      if (to && bar.date > to) continue;
      dates.add(bar.date);
    }
  }
  return [...dates].sort();
}

function sessionsHeld(bars: readonly Bar[], entryDate: string, today: string): number {
  let count = 0;
  for (const bar of bars) {
    if (bar.date >= entryDate && bar.date <= today) count += 1;
  }
  return count;
}

function resolveExit(
  position: Position,
  bar: Bar,
  exits: readonly ExitRule[],
  held: number,
): { price: number; reason: ExitReason } | null {
  const stop = exits.find((exit) => exit.enabled && exit.type === 'stop_loss');
  const target = exits.find((exit) => exit.enabled && exit.type === 'take_profit');
  const hold = exits.find((exit) => exit.enabled && exit.type === 'max_hold_days');
  const stopPrice = stop && stop.type === 'stop_loss' ? position.entryPrice * (1 - stop.percent / 100) : null;
  const targetPrice = target && target.type === 'take_profit' ? position.entryPrice * (1 + target.percent / 100) : null;

  if (stopPrice != null && bar.open <= stopPrice) return { price: bar.open, reason: 'stop_loss' };
  if (targetPrice != null && bar.open >= targetPrice) return { price: bar.open, reason: 'take_profit' };

  const hitStop = stopPrice != null && bar.low <= stopPrice;
  const hitTarget = targetPrice != null && bar.high >= targetPrice;
  if (hitStop && hitTarget && stopPrice != null) return { price: stopPrice, reason: 'stop_loss' };
  if (hitStop && stopPrice != null) return { price: stopPrice, reason: 'stop_loss' };
  if (hitTarget && targetPrice != null) return { price: targetPrice, reason: 'take_profit' };
  if (hold && hold.type === 'max_hold_days' && held >= hold.days) return { price: bar.close, reason: 'max_hold_days' };
  return null;
}

function markEquity(
  cash: number,
  positions: readonly Position[],
  books: Map<string, Bar[]>,
  date: string,
  field: 'open' | 'close',
): number {
  let equity = cash;
  for (const position of positions) {
    const price = priceOn(books.get(position.symbol) ?? [], date, field) ?? position.entryPrice;
    equity += position.shares * price;
  }
  return equity;
}

function priceOn(bars: readonly Bar[], date: string, field: 'open' | 'close'): number | null {
  let previousClose: number | null = null;
  for (const bar of bars) {
    if (bar.date < date) previousClose = bar.close;
    else if (bar.date === date) return bar[field];
    else break;
  }
  return previousClose;
}

function lastCloseOnOrBefore(bars: readonly Bar[], date: string): number | null {
  let close: number | null = null;
  for (const bar of bars) {
    if (bar.date <= date) close = bar.close;
    else break;
  }
  return close;
}

function replaceLastEquity(curve: EquityPoint[], date: string, equity: number) {
  if (curve.length === 0) {
    curve.push({ date, equity });
    return;
  }
  curve[curve.length - 1] = { date, equity };
}

function pushJournal(journal: JournalEvent[], event: JournalEvent) {
  journal.push(event);
}

function exitLabel(reason: ExitReason): string {
  if (reason === 'stop_loss') return 'stop loss';
  if (reason === 'take_profit') return 'take profit';
  if (reason === 'max_hold_days') return 'max hold';
  return 'end of replay';
}

export function upcomingSession(dates: readonly string[], cursor: string | null, count: number): string | null {
  if (count <= 0) return cursor;
  const upcoming = dates.filter((date) => (cursor ? date > cursor : true));
  if (upcoming.length === 0) return cursor;
  return upcoming[Math.min(count, upcoming.length) - 1];
}
