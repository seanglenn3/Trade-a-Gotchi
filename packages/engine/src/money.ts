export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  const [whole, frac] = Math.abs(value).toFixed(2).split('.');
  return `${sign}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${frac}`;
}

export function formatShares(shares: number): string {
  const rounded = Math.round(shares * 10000) / 10000;
  return rounded.toFixed(4).replace(/\.?0+$/, '');
}

export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
