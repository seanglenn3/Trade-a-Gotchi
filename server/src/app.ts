import {
  DISCLAIMER,
  GAME_CONFIG,
  createDemoBot,
  fastForwardBot,
  feedLesson,
  hatchBot,
  listLessons,
  presentBot,
  stepBot,
  updateBotRules,
  type Bar,
  type Bot,
  type RuleSet,
} from '@trade-a-gotchi/engine';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { MarketDataProvider } from './market';
import type { BotStore } from './store';

export interface AppDeps {
  store: BotStore;
  market: MarketDataProvider;
}

export function createApp({ store, market }: AppDeps) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, paperOnly: true, provider: market.id });
  });

  app.get('/api/meta', async (_req, res, next) => {
    try {
      const symbols = await market.listSymbols();
      res.json({
        disclaimer: DISCLAIMER,
        provider: market.id,
        startingCash: GAME_CONFIG.startingCash,
        stages: GAME_CONFIG.stages,
        unlocks: GAME_CONFIG.unlocks,
        lessons: listLessons(),
        symbols,
        dataNote:
          market.id === 'sample'
            ? 'Serving the bundled synthetic sample. No network calls.'
            : `Serving ${market.id} end-of-day bars. Still paper only — no orders are sent.`,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/bots', (_req, res) => {
    res.json(store.list().map(summarize));
  });

  app.post('/api/bots', (req, res) => {
    try {
      const bot = hatchBot(String(req.body?.name ?? ''));
      store.save(bot);
      res.status(201).json(presentBot(bot));
    } catch (error) {
      sendUserError(res, error);
    }
  });

  app.get('/api/bots/:id', (req, res) => {
    const bot = store.get(param(req.params.id));
    if (!bot) return res.status(404).json({ error: 'No bot with that id.' });
    return res.json(presentBot(bot));
  });

  app.put('/api/bots/:id/rules', (req, res) => {
    try {
      const bot = requireBot(store, param(req.params.id));
      const updated = updateBotRules(bot, req.body?.rules as RuleSet, readWatchlist(req.body?.watchlist));
      store.save(updated.bot);
      res.json({ ...presentBot(updated.bot), disciplineDelta: updated.disciplineDelta });
    } catch (error) {
      sendUserError(res, error);
    }
  });

  app.post('/api/bots/:id/lessons/:lessonId', (req, res) => {
    try {
      const bot = requireBot(store, param(req.params.id));
      const fed = feedLesson(bot, param(req.params.lessonId));
      store.save(fed.bot);
      res.json({ ...presentBot(fed.bot), gainedXp: fed.gainedXp });
    } catch (error) {
      sendUserError(res, error);
    }
  });

  app.post('/api/bots/:id/step', async (req, res, next) => {
    try {
      const bot = requireBot(store, param(req.params.id));
      const days = req.body?.days == null ? 1 : Number(req.body.days);
      const nextBot = stepBot(bot, await loadBars(market, bot.watchlist), days);
      store.save(nextBot);
      res.json(presentBot(nextBot));
    } catch (error) {
      if (isUserError(error)) sendUserError(res, error);
      else next(error);
    }
  });

  app.post('/api/bots/:id/fast-forward', async (req, res, next) => {
    try {
      const bot = requireBot(store, param(req.params.id));
      const nextBot = fastForwardBot(bot, await loadBars(market, bot.watchlist), {
        from: optionalDate(req.body?.from),
        to: optionalDate(req.body?.to),
        reset: Boolean(req.body?.reset),
      });
      store.save(nextBot);
      res.json(presentBot(nextBot));
    } catch (error) {
      if (isUserError(error)) sendUserError(res, error);
      else next(error);
    }
  });

  app.post('/api/demo/reset', (_req, res) => {
    const bot = createDemoBot();
    store.save(bot);
    res.json(presentBot(bot));
  });

  app.get('/api/market/symbols', async (_req, res, next) => {
    try {
      res.json({ provider: market.id, symbols: await market.listSymbols() });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/market/:symbol/bars', async (req, res, next) => {
    try {
      const symbol = param(req.params.symbol).toUpperCase();
      const bars = await market.getBars(symbol, {
        from: optionalDate(req.query.from),
        to: optionalDate(req.query.to),
      });
      res.json({
        symbol,
        provider: market.id,
        synthetic: market.id === 'sample',
        disclaimer: DISCLAIMER.short,
        bars,
      });
    } catch (error) {
      if (isUserError(error)) sendUserError(res, error);
      else next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(502).json({ error: message, paperOnly: true });
  });

  return app;
}

async function loadBars(market: MarketDataProvider, symbols: readonly string[]): Promise<Record<string, Bar[]>> {
  const bars: Record<string, Bar[]> = {};
  for (const symbol of symbols) bars[symbol] = await market.getBars(symbol);
  return bars;
}

function summarize(bot: Bot) {
  const view = presentBot(bot);
  return {
    id: view.id,
    name: view.name,
    stage: view.stage,
    stageLabel: view.stageLabel,
    mood: view.mood,
    xp: view.xp,
    equity: view.stats.endingEquity,
    cursor: view.portfolio.cursor,
  };
}

function requireBot(store: BotStore, id: string): Bot {
  const bot = store.get(id);
  if (!bot) {
    const error = new Error('No bot with that id.');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }
  return bot;
}

function readWatchlist(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function optionalDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Dates must look like YYYY-MM-DD.');
  return value;
}

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function sendUserError(res: Response, error: unknown) {
  const status = error instanceof Error && 'status' in error && typeof error.status === 'number' ? error.status : 400;
  const message = error instanceof Error ? error.message : 'Bad request';
  res.status(status).json({ error: message });
}

function isUserError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return !/yahoo|alpaca|polygon|fetch|network|ENOTFOUND/i.test(error.message);
}
