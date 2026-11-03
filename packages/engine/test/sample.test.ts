import { describe, expect, it } from 'vitest';
import { generateSampleDataset } from '../src/sample/generate';
import { loadSampleDataset } from '../src/sample/load';
import { isValidBar } from '../src/simulate';

describe('sample dataset', () => {
  it('matches the generator committed into the bundle', () => {
    const fresh = generateSampleDataset();
    const bundled = loadSampleDataset();
    expect(bundled.source).toBe('synthetic-sample');
    expect(bundled.symbols).toEqual(fresh.symbols);
    expect(bundled.description.toLowerCase()).toContain('synthetic');
    for (const symbol of fresh.symbols) {
      expect(bundled.bars[symbol]).toEqual(fresh.bars[symbol]);
    }
  });

  it('has sorted, valid OHLC bars for every symbol', () => {
    const data = generateSampleDataset();
    expect(data.symbols.length).toBeGreaterThanOrEqual(4);
    for (const symbol of data.symbols) {
      const bars = data.bars[symbol];
      expect(bars.length).toBeGreaterThan(400);
      for (let i = 0; i < bars.length; i += 1) {
        expect(isValidBar(bars[i])).toBe(true);
        if (i > 0) expect(bars[i].date > bars[i - 1].date).toBe(true);
      }
    }
  });
});
