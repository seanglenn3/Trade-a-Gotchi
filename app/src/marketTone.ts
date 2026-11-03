import type { EquityPoint } from '@trade-a-gotchi/engine';

export type MarketTone = 'up' | 'down' | 'flat';

export function marketTone(curve: readonly EquityPoint[]): MarketTone {
  if (curve.length < 2) return 'flat';
  const last = curve[curve.length - 1].equity;
  const prev = curve[curve.length - 2].equity;
  if (last > prev * 1.001) return 'up';
  if (last < prev * 0.999) return 'down';
  return 'flat';
}
