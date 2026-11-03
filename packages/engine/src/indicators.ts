/** Simple moving average of the last `period` values. Null when the window is short. */
export function sma(values: readonly number[], period: number): number | null {
  if (!Number.isInteger(period) || period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i += 1) sum += values[i];
  return sum / period;
}

/**
 * Wilder-smoothed RSI.
 * Needs `period + 1` closes (the first change is a seed, then Wilder smoothing).
 * Returns 50 when price has not moved, and 100 when there are gains and no losses.
 */
export function rsi(closes: readonly number[], period: number): number | null {
  if (!Number.isInteger(period) || period <= 0 || closes.length < period + 1) return null;

  let seedGain = 0;
  let seedLoss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) seedGain += change;
    else seedLoss -= change;
  }

  let avgGain = seedGain / period;
  let avgLoss = seedLoss / period;

  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgGain === 0 && avgLoss === 0) return 50;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function highestHigh(highs: readonly number[], endExclusive: number, period: number): number | null {
  if (period <= 0 || endExclusive < period) return null;
  let high = -Infinity;
  for (let i = endExclusive - period; i < endExclusive; i += 1) {
    if (highs[i] > high) high = highs[i];
  }
  return high;
}
