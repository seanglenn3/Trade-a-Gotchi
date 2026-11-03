import { describe, expect, it } from 'vitest';
import { rsi, sma } from '../src/indicators';

describe('sma', () => {
  it('averages the last N values and refuses a short window', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toBe(4);
    expect(sma([1, 2], 3)).toBeNull();
    expect(sma([10, 10, 10], 0)).toBeNull();
  });
});

describe('rsi', () => {
  it('matches a hand-worked Wilder calculation', () => {
    const closes = [10, 10, 10, 10, 12, 11, 13];
    expect(rsi(closes, 3)).toBeCloseTo(81.25, 8);
  });

  it('returns 50 on a flat series and 100 when price only rises', () => {
    expect(rsi([5, 5, 5, 5], 3)).toBe(50);
    expect(rsi([1, 2, 3, 4], 3)).toBe(100);
  });

  it('needs period + 1 closes', () => {
    expect(rsi([1, 2, 3], 3)).toBeNull();
  });
});
