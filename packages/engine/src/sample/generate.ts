import type { Bar } from '../types';

export interface SampleSpec {
  symbol: string;
  start: number;
  drift: number;
  vol: number;
  baseVolume: number;
  seed: number;
}

export const SAMPLE_RANGE = { start: '2023-01-03', end: '2025-10-31' } as const;

export const SAMPLE_SPECS: readonly SampleSpec[] = [
  { symbol: 'SPY', start: 382, drift: 0.00032, vol: 0.0085, baseVolume: 80_000_000, seed: 101 },
  { symbol: 'AAPL', start: 126, drift: 0.0004, vol: 0.014, baseVolume: 55_000_000, seed: 202 },
  { symbol: 'MSFT', start: 240, drift: 0.00038, vol: 0.012, baseVolume: 28_000_000, seed: 303 },
  { symbol: 'NVDA', start: 148, drift: 0.00085, vol: 0.028, baseVolume: 42_000_000, seed: 404 },
  { symbol: 'TSLA', start: 123, drift: 0.00015, vol: 0.032, baseVolume: 90_000_000, seed: 505 },
  { symbol: 'IWM', start: 178, drift: 0.00012, vol: 0.011, baseVolume: 32_000_000, seed: 606 },
];

export interface SampleDataset {
  source: 'synthetic-sample';
  description: string;
  start: string;
  end: string;
  symbols: string[];
  bars: Record<string, Bar[]>;
}

const DESCRIPTION =
  'Synthetic end-of-day prices for offline play. These are not real market prints and must not be read as a forecast or as investment research.';

export function businessDays(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor.getTime() <= last.getTime()) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function generateSampleDataset(
  specs: readonly SampleSpec[] = SAMPLE_SPECS,
  range: { start: string; end: string } = SAMPLE_RANGE,
): SampleDataset {
  const dates = businessDays(range.start, range.end);
  const bars: Record<string, Bar[]> = {};
  for (const spec of specs) bars[spec.symbol] = generateSymbol(spec, dates);
  return {
    source: 'synthetic-sample',
    description: DESCRIPTION,
    start: dates[0] ?? range.start,
    end: dates[dates.length - 1] ?? range.end,
    symbols: specs.map((spec) => spec.symbol),
    bars,
  };
}

export function generateSymbol(spec: SampleSpec, dates: readonly string[]): Bar[] {
  const rng = mulberry32(spec.seed);
  const bars: Bar[] = [];
  let previous = spec.start;
  for (let i = 0; i < dates.length; i += 1) {
    const regime = Math.floor(i / 63) % 4;
    const driftScale = [1.35, -0.55, 1.05, 0.15][regime];
    const shock = gaussian(rng) * spec.vol;
    const gap = gaussian(rng) * spec.vol * 0.35;
    let open = round2(Math.max(1, previous * Math.exp(gap)));
    let close = round2(Math.max(1, previous * Math.exp(spec.drift * driftScale + shock)));
    const wickUp = Math.abs(gaussian(rng)) * spec.vol * previous;
    const wickDown = Math.abs(gaussian(rng)) * spec.vol * previous * 0.9;
    let high = round2(Math.max(open, close) + wickUp);
    let low = round2(Math.min(open, close) - wickDown);
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);
    if (!(low > 0)) low = Math.min(open, close);
    const spike = rng() > 0.95 ? 2.2 + rng() * 2.5 : 1;
    const volume = Math.max(1, Math.round(spec.baseVolume * spike * Math.exp(gaussian(rng) * 0.22)));
    bars.push({ date: dates[i], open, high, low, close, volume });
    previous = close;
  }
  return bars;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
