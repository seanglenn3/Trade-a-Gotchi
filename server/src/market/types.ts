import type { Bar } from '@trade-a-gotchi/engine';

export interface BarRange {
  from?: string;
  to?: string;
}

export interface MarketDataProvider {
  readonly id: 'sample' | 'yahoo' | 'alpaca' | 'polygon';
  listSymbols(): Promise<string[]>;
  getBars(symbol: string, range?: BarRange): Promise<Bar[]>;
}
