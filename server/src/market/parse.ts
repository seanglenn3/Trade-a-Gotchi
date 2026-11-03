import type { Bar } from '@trade-a-gotchi/engine';

export function parseYahooChart(payload: unknown): Bar[] {
  const result = asRecord(asRecord(payload).chart).result;
  const first = Array.isArray(result) ? asRecord(result[0]) : null;
  if (!first) {
    const error = asRecord(asRecord(payload).chart).error;
    const description = asRecord(error).description;
    throw new Error(typeof description === 'string' ? description : 'Yahoo chart response was empty.');
  }
  const timestamps = Array.isArray(first.timestamp) ? first.timestamp : [];
  const quoteList = asRecord(first.indicators).quote;
  const quote = asRecord(Array.isArray(quoteList) ? quoteList[0] : null);
  return zipBars(timestamps, quote.open, quote.high, quote.low, quote.close, quote.volume, (stamp) =>
    isoDate(Number(stamp) * 1000),
  );
}

export function parseAlpacaBars(payload: unknown, symbol: string): Bar[] {
  const bars = asRecord(asRecord(payload).bars)[symbol];
  if (!Array.isArray(bars)) return [];
  return bars.flatMap((item) => {
    const row = asRecord(item);
    const date = String(row.t ?? '').slice(0, 10);
    const bar = toBar(date, row.o, row.h, row.l, row.c, row.v);
    return bar ? [bar] : [];
  });
}

export function parsePolygonAggs(payload: unknown): Bar[] {
  const results = asRecord(payload).results;
  if (!Array.isArray(results)) return [];
  return results.flatMap((item) => {
    const row = asRecord(item);
    const bar = toBar(isoDate(Number(row.t)), row.o, row.h, row.l, row.c, row.v);
    return bar ? [bar] : [];
  });
}

export function filterBars(bars: readonly Bar[], range?: { from?: string; to?: string }): Bar[] {
  return bars.filter((bar) => {
    if (range?.from && bar.date < range.from) return false;
    if (range?.to && bar.date > range.to) return false;
    return true;
  });
}

export function dedupeBars(bars: readonly Bar[]): Bar[] {
  const byDate = new Map<string, Bar>();
  for (const bar of bars) {
    if (isUsable(bar)) byDate.set(bar.date, bar);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function zipBars(
  timestamps: unknown[],
  opens: unknown,
  highs: unknown,
  lows: unknown,
  closes: unknown,
  volumes: unknown,
  toDate: (stamp: unknown) => string,
): Bar[] {
  const open = Array.isArray(opens) ? opens : [];
  const high = Array.isArray(highs) ? highs : [];
  const low = Array.isArray(lows) ? lows : [];
  const close = Array.isArray(closes) ? closes : [];
  const volume = Array.isArray(volumes) ? volumes : [];
  const bars: Bar[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const bar = toBar(toDate(timestamps[i]), open[i], high[i], low[i], close[i], volume[i] ?? 0);
    if (bar) bars.push(bar);
  }
  return dedupeBars(bars);
}

function toBar(date: string, open: unknown, high: unknown, low: unknown, close: unknown, volume: unknown): Bar | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const numbers = [open, high, low, close, volume].map(Number);
  if (numbers.some((value) => !Number.isFinite(value))) return null;
  const bar: Bar = {
    date,
    open: numbers[0],
    high: numbers[1],
    low: numbers[2],
    close: numbers[3],
    volume: numbers[4],
  };
  return isUsable(bar) ? bar : null;
}

function isUsable(bar: Bar): boolean {
  return bar.open > 0 && bar.high > 0 && bar.low > 0 && bar.close > 0 && bar.volume >= 0 && bar.high >= Math.max(bar.open, bar.close) && bar.low <= Math.min(bar.open, bar.close);
}

function isoDate(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
