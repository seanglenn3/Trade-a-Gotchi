import { AlpacaMarketData, PolygonMarketData, YahooMarketData } from './remote';
import { SampleMarketData } from './sample';
import type { MarketDataProvider } from './types';

export function createMarketDataProvider(kind = process.env.MARKET_DATA_PROVIDER || 'sample'): MarketDataProvider {
  switch (kind) {
    case 'sample':
      return new SampleMarketData();
    case 'yahoo':
      return new YahooMarketData();
    case 'alpaca':
      return new AlpacaMarketData();
    case 'polygon':
      return new PolygonMarketData();
    default:
      throw new Error(`Unknown MARKET_DATA_PROVIDER "${kind}". Use sample, yahoo, alpaca, or polygon.`);
  }
}

export { SampleMarketData } from './sample';
export type { MarketDataProvider } from './types';
