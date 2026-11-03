import { resolve } from 'node:path';
import { createApp } from './app';
import { createMarketDataProvider } from './market';
import { openStore } from './store';

const port = Number(process.env.PORT || 8787);
const databasePath = resolve(process.env.DATABASE_PATH || './data/tradeagotchi.db');
const market = createMarketDataProvider();
const store = openStore(databasePath);
const app = createApp({ store, market });

app.listen(port, '0.0.0.0', () => {
  console.log(`Trade-a-Gotchi server listening on http://localhost:${port}`);
  console.log(`Market data: ${market.id}. Paper only — no orders are sent.`);
  console.log(`SQLite: ${databasePath}`);
});
