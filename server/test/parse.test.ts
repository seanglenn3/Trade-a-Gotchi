import { describe, expect, it } from 'vitest';
import { SampleMarketData } from '../src/market/sample';
import { parseAlpacaBars, parsePolygonAggs, parseYahooChart } from '../src/market/parse';

describe('market parsers', () => {
  it('reads a Yahoo chart payload and skips empty prints', () => {
    const bars = parseYahooChart({
      chart: {
        result: [
          {
            timestamp: [1704171600, 1704258000],
            indicators: {
              quote: [
                {
                  open: [100, null],
                  high: [110, 105],
                  low: [99, 100],
                  close: [108, 104],
                  volume: [1000, 1000],
                },
              ],
            },
          },
        ],
      },
    });
    expect(bars).toHaveLength(1);
    expect(bars[0].close).toBe(108);
    expect(bars[0].date).toBe('2024-01-02');
  });

  it('reads Alpaca daily bars for one symbol', () => {
    const bars = parseAlpacaBars(
      {
        bars: {
          AAPL: [{ t: '2024-03-01T05:00:00Z', o: 10, h: 12, l: 9, c: 11, v: 50 }],
        },
      },
      'AAPL',
    );
    expect(bars).toEqual([{ date: '2024-03-01', open: 10, high: 12, low: 9, close: 11, volume: 50 }]);
  });

  it('reads Polygon aggregates', () => {
    const bars = parsePolygonAggs({
      results: [{ t: Date.parse('2024-04-05T00:00:00Z'), o: 1, h: 2, l: 1, c: 1.5, v: 9 }],
    });
    expect(bars[0]).toMatchObject({ date: '2024-04-05', close: 1.5, volume: 9 });
  });
});

describe('sample provider', () => {
  it('serves bundled symbols and a date window offline', async () => {
    const market = new SampleMarketData();
    const symbols = await market.listSymbols();
    expect(symbols).toContain('SPY');
    const bars = await market.getBars('SPY', { from: '2024-01-02', to: '2024-01-31' });
    expect(bars.length).toBeGreaterThan(10);
    expect(bars[0].date >= '2024-01-02').toBe(true);
    expect(bars[bars.length - 1].date <= '2024-01-31').toBe(true);
    await expect(market.getBars('NOPE')).rejects.toThrow(/sample/i);
  });
});
