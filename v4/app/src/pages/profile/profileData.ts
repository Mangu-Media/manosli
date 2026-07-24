// ─────────────────────────────────────────────
// PROFILE DATA — follows + support pledges (localStorage-backed)
// ─────────────────────────────────────────────

const FOLLOWS_KEY = 'manosli.follows.v1';
const PLEDGES_KEY = 'manosli.pledges.v1';

export interface Pledge {
  artistId: string;
  amount: number; // USD
  at: number; // epoch ms
}

// ── follows ──

export function getFollows(): Set<string> {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveFollows(follows: Set<string>): void {
  try {
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify([...follows]));
  } catch {
    // storage unavailable — follow state stays in-memory only
  }
}

// ── pledges ──

export function getPledges(): Pledge[] {
  try {
    const raw = localStorage.getItem(PLEDGES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((p) => p && typeof p.artistId === 'string' && typeof p.amount === 'number')
      : [];
  } catch {
    return [];
  }
}

export function addPledge(pledge: Pledge): Pledge[] {
  const all = [...getPledges(), pledge];
  try {
    localStorage.setItem(PLEDGES_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable
  }
  return all;
}

export function pledgeTotal(pledges: Pledge[]): number {
  return pledges.reduce((sum, p) => sum + p.amount, 0);
}

// ── number parsing / formatting for "12.4M" style strings ──

export function parseCompact(s: string): number {
  const m = s.trim().match(/^([\d.]+)\s*([KMB])?$/i);
  if (!m) return 0;
  const base = parseFloat(m[1]);
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[((m[2] || '').toUpperCase() as 'K' | 'M' | 'B')] ?? 1;
  return Math.round(base * mult);
}

export function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

export const fmtMoney = (n: number): string =>
  `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
