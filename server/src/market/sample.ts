import { loadSampleDataset, type Bar } from '@trade-a-gotchi/engine';
import { filterBars } from './parse';
import type { BarRange, MarketDataProvider } from './types';

export class SampleMarketData implements MarketDataProvider {
  readonly id = 'sample' as const;
  private readonly data = loadSampleDataset();

  async listSymbols(): Promise<string[]> {
    return [...this.data.symbols];
  }

  async getBars(symbol: string, range?: BarRange): Promise<Bar[]> {
    const bars = this.data.bars[symbol.trim().toUpperCase()];
    if (!bars) throw new Error(`No bundled sample for ${symbol}. Try ${this.data.symbols.join(', ')}.`);
    return filterBars(bars, range);
  }
}
