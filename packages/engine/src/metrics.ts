import { round2 } from './money';
import type { EquityPoint, PortfolioState, Position, Stats, Trade } from './types';

export function maxDrawdownFromEquity(startingEquity: number, curve: readonly EquityPoint[]): number {
  let peak = startingEquity;
  let maxDrawdown = 0;
  for (const point of curve) {
    if (point.equity > peak) peak = point.equity;
    if (peak > 0) {
      const drawdown = (peak - point.equity) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  }
  return maxDrawdown;
}

export function marketValue(positions: readonly Position[], priceOf: (symbol: string) => number | null): number {
  let value = 0;
  for (const position of positions) {
    const price = priceOf(position.symbol);
    value += position.shares * (price ?? position.entryPrice);
  }
  return value;
}

export function computeStats(portfolio: PortfolioState, markedEquity?: number): Stats {
  const endingEquity = round2(markedEquity ?? currentEquity(portfolio));
  const startingEquity = portfolio.startingCash;
  const totalPnl = round2(endingEquity - startingEquity);
  const closedPnl = round2(portfolio.trades.reduce((sum, trade) => sum + trade.pnl, 0));
  const openCost = portfolio.positions.reduce((sum, position) => sum + position.cost, 0);
  const openValue = endingEquity - portfolio.cash;
  const openPnl = round2(openValue - openCost);
  const wins = portfolio.trades.filter((trade) => trade.pnl > 0).length;
  const losses = portfolio.trades.length - wins;
  return {
    startingEquity,
    endingEquity,
    totalPnl,
    totalReturn: startingEquity > 0 ? totalPnl / startingEquity : 0,
    closedPnl,
    openPnl,
    closedTrades: portfolio.trades.length,
    wins,
    losses,
    winRate: portfolio.trades.length === 0 ? 0 : wins / portfolio.trades.length,
    winLossRatio: losses === 0 ? null : wins / losses,
    maxDrawdown: maxDrawdownFromEquity(startingEquity, portfolio.equityCurve),
    openPositions: portfolio.positions.length,
  };
}

export function currentEquity(portfolio: PortfolioState): number {
  if (portfolio.equityCurve.length > 0) return portfolio.equityCurve[portfolio.equityCurve.length - 1].equity;
  const openCost = portfolio.positions.reduce((sum, position) => sum + position.cost, 0);
  return round2(portfolio.cash + openCost);
}

export function winLossLabel(stats: Pick<Stats, 'wins' | 'losses' | 'winLossRatio'>): string {
  if (stats.wins === 0 && stats.losses === 0) return 'no closed trades';
  if (stats.winLossRatio == null) return `${stats.wins}:0`;
  return `${stats.wins}:${stats.losses}`;
}

export function tradeXpFrom(trades: readonly Trade[], winXp: number, lossXp: number): number {
  return trades.reduce((sum, trade) => sum + (trade.pnl > 0 ? winXp : lossXp), 0);
}
