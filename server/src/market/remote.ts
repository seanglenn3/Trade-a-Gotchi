import { SAMPLE_SPECS, type Bar } from '@trade-a-gotchi/engine';
import { dedupeBars, filterBars, parseAlpacaBars, parsePolygonAggs, parseYahooChart } from './parse';
import type { BarRange, MarketDataProvider } from './types';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const SUGGESTED = SAMPLE_SPECS.map((spec) => spec.symbol);

export class YahooMarketData implements MarketDataProvider {
  readonly id = 'yahoo' as const;
  private readonly cache = new Map<string, Bar[]>();

  async listSymbols(): Promise<string[]> {
    return [...SUGGESTED];
  }

  async getBars(symbol: string, range?: BarRange): Promise<Bar[]> {
    const key = symbol.trim().toUpperCase();
    const cached = this.cache.get(key) ?? (await this.fetch(key));
    this.cache.set(key, cached);
    return filterBars(cached, range);
  }

  private async fetch(symbol: string): Promise<Bar[]> {
    const range = process.env.YAHOO_RANGE || '5y';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${encodeURIComponent(range)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Yahoo chart ${response.status} for ${symbol}.`);
    return parseYahooChart(await response.json());
  }
}

export class AlpacaMarketData implements MarketDataProvider {
  readonly id = 'alpaca' as const;
  private readonly cache = new Map<string, Bar[]>();

  async listSymbols(): Promise<string[]> {
    return [...SUGGESTED];
  }

  async getBars(symbol: string, range?: BarRange): Promise<Bar[]> {
    const key = symbol.trim().toUpperCase();
    const cached = this.cache.get(key) ?? (await this.fetch(key));
    this.cache.set(key, cached);
    return filterBars(cached, range);
  }

  private async fetch(symbol: string): Promise<Bar[]> {
    const key = process.env.ALPACA_API_KEY_ID || process.env.APCA_API_KEY_ID;
    const secret = process.env.ALPACA_API_SECRET_KEY || process.env.APCA_API_SECRET_KEY;
    if (!key || !secret) {
      throw new Error('Alpaca needs ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY. This server still never sends orders.');
    }
    const root = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';
    const bars: Bar[] = [];
    let pageToken = '';
    for (let page = 0; page < 20; page += 1) {
      const url = new URL(`${root}/v2/stocks/bars`);
      url.searchParams.set('symbols', symbol);
      url.searchParams.set('timeframe', '1Day');
      url.searchParams.set('start', '2016-01-01');
      url.searchParams.set('adjustment', 'raw');
      url.searchParams.set('feed', process.env.ALPACA_FEED || 'iex');
      url.searchParams.set('limit', '10000');
      if (pageToken) url.searchParams.set('page_token', pageToken);
      const response = await fetch(url, {
        headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret },
      });
      if (!response.ok) throw new Error(`Alpaca ${response.status} for ${symbol}.`);
      const body = (await response.json()) as { next_page_token?: string };
      bars.push(...parseAlpacaBars(body, symbol));
      pageToken = body.next_page_token ?? '';
      if (!pageToken) break;
    }
    return dedupeBars(bars);
  }
}

export class PolygonMarketData implements MarketDataProvider {
  readonly id = 'polygon' as const;
  private readonly cache = new Map<string, Bar[]>();

  async listSymbols(): Promise<string[]> {
    return [...SUGGESTED];
  }

  async getBars(symbol: string, range?: BarRange): Promise<Bar[]> {
    const key = symbol.trim().toUpperCase();
    const cached = this.cache.get(key) ?? (await this.fetch(key));
    this.cache.set(key, cached);
    return filterBars(cached, range);
  }

  private async fetch(symbol: string): Promise<Bar[]> {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) throw new Error('Polygon needs POLYGON_API_KEY.');
    const to = new Date().toISOString().slice(0, 10);
    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/2018-01-01/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Polygon ${response.status} for ${symbol}.`);
    return dedupeBars(parsePolygonAggs(await response.json()));
  }
}
