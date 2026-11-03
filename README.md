# Trade-a-Gotchi

A pocket pet that paper-trades. You name an egg, hatch it, and feed it rule cards instead of rice. It rehearses those rules on end-of-day prices, and its health, mood, and evolution follow the results.

Every order is pretend. There is no brokerage connection, no deposit, and no way to lose real money. Nothing in the toy is investment advice.

## What’s in the repo

| Path | Role |
| --- | --- |
| `app/` | Expo (React Native, TypeScript) client. Runs offline in Expo Go. |
| `server/` | Node/TypeScript HTTP API. Same engine, SQLite storage, swappable market data. |
| `packages/engine/` | Indicators, rule cards, daily simulator, mood, evolution, lessons, and the bundled sample. |

The phone app imports the engine directly and ships with synthetic sample prices, so it does not need the server. The server is the same simulator behind HTTP, for scripts, tests, and a later data provider.

## Run it on a phone (Expo Go)

Install [Expo Go](https://expo.dev/go) on the phone. The phone and the computer need to be on the same network.

```bash
cd app
npm install
npx expo start
```

- Android: open Expo Go and scan the QR code.
- iOS: scan the QR code with the Camera app, then open it in Expo Go.

The sample prices are inside the app. You can hatch a bot, edit rule cards, fast-forward, and read lessons with the server turned off and the phone offline after the bundle loads.

`npx expo start --web` runs the same UI in a browser.

## Run the tests

From the repo root (Node.js 22 or newer):

```bash
npm install --prefix packages/engine
npm install --prefix server
npm test
```

`npm test` runs the engine suite (indicators, rule cards, fills, drawdown, evolution, demo seed) and the server suite (parsers and the paper API). Typecheck with `npm run typecheck` after the app dependencies are installed.

Regenerate the bundled sample, if you change the generator:

```bash
npm run generate-sample
```

The file `packages/engine/data/sample-eod.json` is synthetic. It is not a real price history.

## Run the server

```bash
cd server
cp .env.example .env   # optional
npm install
npm run seed           # writes the demo bot "Pip" into SQLite
npm run dev            # http://localhost:8787
```

Useful calls:

- `GET /health`
- `GET /api/meta` — disclaimer, stages, lessons, symbols
- `POST /api/bots` with `{ "name": "Mochi" }`
- `PUT /api/bots/:id/rules` with `{ "rules", "watchlist" }`
- `POST /api/bots/:id/step` with `{ "days": 1 }`
- `POST /api/bots/:id/fast-forward` with `{ "reset": true, "from": "2024-01-02", "to": "2024-06-28" }`
- `POST /api/demo/reset`
- `GET /api/market/SPY/bars?from=2024-01-02&to=2024-01-31`

The API has no auth. Keep it on localhost.

### Market data

`MARKET_DATA_PROVIDER` selects the source. The default is `sample`.

| Value | What it uses |
| --- | --- |
| `sample` | Bundled synthetic bars. No network. |
| `yahoo` | Yahoo chart endpoint, daily bars, with a browser user-agent. No key. |
| `alpaca` | Alpaca daily bars. Set `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY`. Still no orders. |
| `polygon` | Polygon daily aggregates. Set `POLYGON_API_KEY`. |

`npm run seed` always builds Pip from the synthetic sample, even if the provider is remote, so the demo is reproducible offline.

Bots are stored in SQLite through Node’s built-in `node:sqlite` driver (`DATABASE_PATH`, default `server/data/tradeagotchi.db`). The store is a small interface if you later swap in Prisma and Postgres.

## How the toy plays

1. Accept the disclaimer and hatch an egg. The baby starts with a **$5,000 paper account**, a 20-day moving-average entry, a 5% stop, a 10% target, a 5-session max hold, and 20% sizing. The first recipe edit is free.
2. Rule cards are toggles, not code. Enabled entry cards must all agree. Any enabled exit can close the trade. Sizing is a percent of paper equity and never spends more cash than the bot has.
3. **Next market day** walks the sample forward. **Fast-forward to the end** keeps going without resetting. **Replay** is a backtest over a past window: the account returns to $5,000, the rules stay, and leftover positions are closed at the final price so the score includes them.
4. Fills are the next session’s open, so a signal cannot trade on a close it has not seen yet. A stop and a target in the same bar fill the stop. A gap fills at the open.
5. Health and happiness follow win rate, drawdown, and discipline. Editing the recipe again within 7 days lowers discipline. Stages and the cards they unlock live in `packages/engine/src/config.ts` (placeholder gates). Stages do not fall backward.
6. Lessons are short original notes. Each new one grants XP. Feeding Pip the RSI lesson on the demo seed is enough to reach Legend with the current gates.

## Disclaimer

Trade-a-Gotchi is an educational simulation. It is not investment, financial, legal, or tax advice and not a recommendation to buy or sell anything. No real orders are sent. Past simulated results, including results on made-up prices, do not predict anything.

## Next steps

- Add slippage, fees, and a holdout window so a full-sample replay cannot be treated as a finished grade.
- Let the server provider feed the phone when you want Yahoo, Alpaca, or Polygon instead of the sample.
- Move the SQLite store to Postgres (Prisma fits the existing repository shape) once more than one device should share a bot.
- Add accounts, a daily “the bot is hungry” reminder, and sound.
- More cards (ATR stops, MACD) behind the same stage config.
