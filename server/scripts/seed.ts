import { resolve } from 'node:path';
import { createDemoBot, presentBot } from '@trade-a-gotchi/engine';
import { openStore } from '../src/store';

const databasePath = resolve(process.env.DATABASE_PATH || './data/tradeagotchi.db');
const store = openStore(databasePath);
const bot = createDemoBot();
store.save(bot);
const view = presentBot(bot);
store.close();

console.log(
  JSON.stringify(
    {
      id: view.id,
      name: view.name,
      stage: view.stage,
      mood: view.mood,
      equity: view.stats.endingEquity,
      closedTrades: view.stats.closedTrades,
      winRate: view.stats.winRate,
      maxDrawdown: view.stats.maxDrawdown,
      databasePath,
      note: 'Demo uses the bundled synthetic sample, even if MARKET_DATA_PROVIDER is something else.',
    },
    null,
    2,
  ),
);
