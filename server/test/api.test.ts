import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { defaultRules } from '@trade-a-gotchi/engine';
import { createApp } from '../src/app';
import { SampleMarketData } from '../src/market/sample';
import { openStore, type BotStore } from '../src/store';

const stores: BotStore[] = [];

function testApp() {
  const dir = mkdtempSync(join(tmpdir(), 'gotchi-'));
  const store = openStore(join(dir, 'bots.db'));
  stores.push(store);
  return createApp({ store, market: new SampleMarketData() });
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

describe('paper API', () => {
  it('hatches, edits rules, feeds a lesson, and fast-forwards without sending orders', async () => {
    const app = testApp();
    const meta = await request(app).get('/api/meta');
    expect(meta.status).toBe(200);
    expect(meta.body.disclaimer.short).toMatch(/not investment advice/i);
    expect(meta.body.provider).toBe('sample');
    expect(meta.body.startingCash).toBe(5000);

    const hatched = await request(app).post('/api/bots').send({ name: 'Mochi' });
    expect(hatched.status).toBe(201);
    expect(hatched.body.stage).toBe('baby');
    expect(hatched.body.stats.endingEquity).toBe(5000);
    const id = hatched.body.id as string;

    const rules = defaultRules();
    rules.sizing.percent = 15;
    const saved = await request(app).put(`/api/bots/${id}/rules`).send({ rules, watchlist: ['spy', 'aapl'] });
    expect(saved.status).toBe(200);
    expect(saved.body.watchlist).toEqual(['AAPL', 'SPY']);
    expect(saved.body.disciplineDelta).toBe(0);

    const lesson = await request(app).post(`/api/bots/${id}/lessons/drawdowns`);
    expect(lesson.status).toBe(200);
    expect(lesson.body.gainedXp).toBeGreaterThan(0);
    const repeat = await request(app).post(`/api/bots/${id}/lessons/drawdowns`);
    expect(repeat.body.gainedXp).toBe(0);

    const replay = await request(app).post(`/api/bots/${id}/fast-forward`).send({ reset: true, from: '2024-06-03', to: '2024-08-30' });
    expect(replay.status).toBe(200);
    expect(replay.body.stats.closedTrades).toBeGreaterThan(0);
    expect(replay.body.portfolio.cursor).toBe('2024-08-30');

    const missing = await request(app).post('/api/bots').send({ name: '' });
    expect(missing.status).toBe(400);
  });

  it('resets the demo bot', async () => {
    const app = testApp();
    const demo = await request(app).post('/api/demo/reset');
    expect(demo.status).toBe(200);
    expect(demo.body.id).toBe('demo-pip');
    expect(demo.body.stage === 'adult' || demo.body.stage === 'legend').toBe(true);
    const listed = await request(app).get('/api/bots');
    expect(listed.body.map((bot: { id: string }) => bot.id)).toContain('demo-pip');
  });
});
