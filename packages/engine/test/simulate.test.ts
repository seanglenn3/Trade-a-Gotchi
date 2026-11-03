import { describe, expect, it } from 'vitest';
import { maxDrawdownFromEquity } from '../src/metrics';
import { initialPortfolio, runSimulation } from '../src/simulate';
import type { Bar, RuleSet } from '../src/types';

function bar(date: string, close: number, extra: Partial<Bar> = {}): Bar {
  const open = extra.open ?? close;
  const high = extra.high ?? Math.max(open, close);
  const low = extra.low ?? Math.min(open, close);
  return { date, open, high, low, close, volume: extra.volume ?? 1_000_000 };
}

function rules(patch: Partial<RuleSet> = {}): RuleSet {
  return {
    entries: patch.entries ?? [{ id: 'ma', type: 'price_above_ma', period: 2, enabled: true }],
    exits: patch.exits ?? [
      { id: 'stop', type: 'stop_loss', percent: 5, enabled: true },
      { id: 'target', type: 'take_profit', percent: 10, enabled: true },
      { id: 'hold', type: 'max_hold_days', days: 5, enabled: true },
    ],
    sizing: patch.sizing ?? { id: 'size', type: 'percent_of_account', percent: 100 },
  };
}

describe('runSimulation', () => {
  it('fills the next open after a close signal and honors a stop', () => {
    const series = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 100),
      bar('2024-01-04', 108),
      bar('2024-01-05', 108, { open: 108, high: 109, low: 107, close: 108 }),
      bar('2024-01-06', 107, { open: 108, high: 109, low: 100, close: 107 }),
    ];
    const result = runSimulation({ TEST: series }, ['TEST'], rules(), initialPortfolio(5000));
    expect(result.trades).toHaveLength(1);
    const trade = result.trades[0];
    expect(trade.entryDate).toBe('2024-01-05');
    expect(trade.exitDate).toBe('2024-01-06');
    expect(trade.exitReason).toBe('stop_loss');
    expect(trade.entryPrice).toBe(108);
    expect(trade.exitPrice).toBeCloseTo(102.6, 8);
    expect(trade.pnl).toBeCloseTo(-250, 2);
    expect(result.cash).toBeCloseTo(4750, 2);
    expect(result.positions).toHaveLength(0);
  });

  it('does not enter on the same session that produced the signal', () => {
    const series = [bar('2024-01-02', 100), bar('2024-01-03', 110), bar('2024-01-04', 110)];
    const result = runSimulation({ TEST: series }, ['TEST'], rules(), initialPortfolio(5000), {
      to: '2024-01-03',
    });
    expect(result.trades).toHaveLength(0);
    expect(result.positions).toHaveLength(0);
  });

  it('fills a gap through the stop at the open', () => {
    const series = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 110),
      bar('2024-01-04', 100, { open: 100, high: 101, low: 99, close: 100 }),
      bar('2024-01-05', 85, { open: 80, high: 90, low: 80, close: 85 }),
    ];
    const result = runSimulation({ TEST: series }, ['TEST'], rules(), initialPortfolio(5000));
    expect(result.trades[0].entryDate).toBe('2024-01-04');
    expect(result.trades[0].entryPrice).toBe(100);
    expect(result.trades[0].exitDate).toBe('2024-01-05');
    expect(result.trades[0].exitReason).toBe('stop_loss');
    expect(result.trades[0].exitPrice).toBe(80);
  });

  it('sells at the target, and at the open if the session gaps through it', () => {
    const tagged = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 110),
      bar('2024-01-04', 112, { open: 100, high: 115, low: 99, close: 112 }),
    ];
    const taggedResult = runSimulation({ TEST: tagged }, ['TEST'], rules(), initialPortfolio(5000));
    expect(taggedResult.trades[0].exitReason).toBe('take_profit');
    expect(taggedResult.trades[0].exitPrice).toBeCloseTo(110, 8);

    const gapped = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 110),
      bar('2024-01-04', 100, { open: 100, high: 101, low: 99, close: 100 }),
      bar('2024-01-05', 121, { open: 120, high: 122, low: 119, close: 121 }),
    ];
    const gappedResult = runSimulation({ TEST: gapped }, ['TEST'], rules(), initialPortfolio(5000));
    expect(gappedResult.trades[0].exitReason).toBe('take_profit');
    expect(gappedResult.trades[0].exitPrice).toBe(120);
  });

  it('lets the stop win when the same bar touches the stop and the target', () => {
    const series = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 110),
      bar('2024-01-04', 120, { open: 100, high: 130, low: 90, close: 120 }),
    ];
    const result = runSimulation({ TEST: series }, ['TEST'], rules(), initialPortfolio(5000));
    expect(result.trades[0].exitReason).toBe('stop_loss');
    expect(result.trades[0].exitPrice).toBeCloseTo(95, 8);
  });

  it('exits at the close of the Nth session when max hold is the only exit', () => {
    const series = [
      bar('2024-01-02', 10),
      bar('2024-01-03', 12),
      bar('2024-01-04', 12),
      bar('2024-01-05', 12),
      bar('2024-01-06', 13),
      bar('2024-01-07', 14),
    ];
    const result = runSimulation(
      { TEST: series },
      ['TEST'],
      rules({
        exits: [
          { id: 'stop', type: 'stop_loss', percent: 5, enabled: false },
          { id: 'target', type: 'take_profit', percent: 10, enabled: false },
          { id: 'hold', type: 'max_hold_days', days: 3, enabled: true },
        ],
      }),
      initialPortfolio(5000),
    );
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].entryDate).toBe('2024-01-04');
    expect(result.trades[0].exitDate).toBe('2024-01-06');
    expect(result.trades[0].exitReason).toBe('max_hold_days');
    expect(result.trades[0].exitPrice).toBe(13);
    expect(result.trades[0].holdDays).toBe(3);
  });

  it('spends percentage of equity in alphabetical order and never goes on margin', () => {
    const up = [bar('2024-01-02', 100), bar('2024-01-03', 110), bar('2024-01-04', 110)];
    const sized = rules({ sizing: { id: 'size', type: 'percent_of_account', percent: 60 } });
    const result = runSimulation({ BBB: up, AAA: up.map((item) => ({ ...item })) }, ['BBB', 'AAA'], sized, initialPortfolio(5000));
    expect(result.positions.map((position) => position.symbol)).toEqual(['AAA', 'BBB']);
    expect(result.positions[0].cost).toBe(3000);
    expect(result.positions[1].cost).toBe(2000);
    expect(result.cash).toBe(0);

    const allIn = runSimulation(
      { ZZZ: up, AAA: up.map((item) => ({ ...item })) },
      ['ZZZ', 'AAA'],
      rules({ sizing: { id: 'size', type: 'percent_of_account', percent: 100 } }),
      initialPortfolio(5000),
    );
    expect(allIn.positions).toHaveLength(1);
    expect(allIn.positions[0].symbol).toBe('AAA');
    expect(allIn.cash).toBe(0);
  });

  it('keeps a disabled stop from firing', () => {
    const series = [
      bar('2024-01-02', 100),
      bar('2024-01-03', 110),
      bar('2024-01-04', 70, { open: 100, high: 101, low: 70, close: 70 }),
    ];
    const result = runSimulation(
      { TEST: series },
      ['TEST'],
      rules({
        exits: [
          { id: 'stop', type: 'stop_loss', percent: 5, enabled: false },
          { id: 'target', type: 'take_profit', percent: 50, enabled: true },
          { id: 'hold', type: 'max_hold_days', days: 5, enabled: true },
        ],
      }),
      initialPortfolio(5000),
    );
    expect(result.trades).toHaveLength(0);
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].entryPrice).toBe(100);
  });

  it('continues from the cursor instead of replaying earlier sessions', () => {
    const series = [bar('2024-01-02', 100), bar('2024-01-03', 110), bar('2024-01-04', 112), bar('2024-01-05', 111)];
    const recipe = rules({
      exits: [
        { id: 'stop', type: 'stop_loss', percent: 40, enabled: true },
        { id: 'target', type: 'take_profit', percent: 80, enabled: true },
        { id: 'hold', type: 'max_hold_days', days: 20, enabled: true },
      ],
    });
    const first = runSimulation({ TEST: series }, ['TEST'], recipe, initialPortfolio(5000), { to: '2024-01-04' });
    expect(first.positions).toHaveLength(1);
    const second = runSimulation({ TEST: series }, ['TEST'], recipe, first, { to: '2024-01-05' });
    expect(second.trades).toHaveLength(0);
    expect(second.positions).toHaveLength(1);
    expect(second.equityCurve.map((point) => point.date)).toEqual(['2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']);
  });
});

describe('maxDrawdownFromEquity', () => {
  it('measures the deepest peak-to-trough drop', () => {
    const drawdown = maxDrawdownFromEquity(100, [
      { date: '2024-01-02', equity: 120 },
      { date: '2024-01-03', equity: 90 },
      { date: '2024-01-04', equity: 110 },
    ]);
    expect(drawdown).toBeCloseTo(0.25, 8);
  });
});
