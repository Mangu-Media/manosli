// ─────────────────────────────────────────────
// ARTIST STUDIO — data layer
// ─────────────────────────────────────────────
// Real data: the artist's uploads + playEvents (PlayerRepository state) and
// /audio/ledger.json (license provenance). Synthetic demo listener numbers
// for catalog tracks are derived deterministically from a seed hash of the
// track id — stable across reloads, clearly labeled "demo" in the UI.

import { TRACKS } from '../player/data';
import type { Track } from '../player/data';
import type { PlayEvent } from '../player/analytics';
import type { UploadMeta } from '../player/uploads';

/** Artist rate per stream — displayed prominently in the transparency panel. */
export const ROYALTY_RATE = 0.004; // $/stream
/** Payout threshold for the payout-history stub. */
export const PAYOUT_THRESHOLD = 10; // $

/** One entry of /audio/ledger.json (license provenance for catalog audio). */
export interface LedgerEntry {
  file: string;
  title: string;
  artist: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
}

/** FNV-1a 32-bit hash — tiny, deterministic seed from a string id. */
export function seedHash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0, 1) from seed + salt. */
function rand(seed: number, salt: number): number {
  let h = seed ^ Math.imul(salt + 1, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface TrackStats {
  plays: number;
  minutes: number;
  royalty: number;
  /** true when the plays include seeded demo data, not only measured playEvents. */
  demo: boolean;
}

/** Stats for one catalog track: real playEvents + seeded demo listener data. */
export function catalogTrackStats(track: Track, events: PlayEvent[]): TrackStats {
  const real = events.filter((e) => e.trackId === track.id).length;
  const seed = seedHash(track.id);
  const demoPlays = 40 + Math.floor(rand(seed, 0) * 960); // 40–999 demo plays
  const plays = real + demoPlays;
  const minutes = Math.round((plays * track.duration) / 60);
  return { plays, minutes, royalty: plays * ROYALTY_RATE, demo: true };
}

/** Stats for one upload: measured playEvents only (no synthetic inflation). */
export function uploadTrackStats(upload: UploadMeta, events: PlayEvent[]): TrackStats {
  const plays = events.filter((e) => e.trackId === upload.id).length;
  const minutes = Math.round((plays * upload.duration) / 60);
  return { plays, minutes, royalty: plays * ROYALTY_RATE, demo: false };
}

export interface WeekDay {
  label: string;
  plays: number;
  isToday: boolean;
}

/**
 * Last-7-days plays bar series. Real playEvents always count;
 * a deterministic seeded demo series is layered on top (labeled in the UI).
 */
export function weekSeries(events: PlayEvent[], includeDemo: boolean): WeekDay[] {
  const now = new Date();
  const days: WeekDay[] = [];
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    dayKeys.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      plays: 0,
      isToday: i === 0,
    });
  }
  for (const ev of events) {
    const when = new Date(ev.playedAt);
    if (Number.isNaN(when.getTime())) continue;
    const idx = dayKeys.indexOf(`${when.getFullYear()}-${when.getMonth()}-${when.getDate()}`);
    if (idx >= 0) days[idx].plays++;
  }
  if (includeDemo) {
    // Seeded demo listener activity — stable per day index.
    const seed = seedHash('catalog-week');
    for (let i = 0; i < 7; i++) {
      days[i].plays += 12 + Math.floor(rand(seed, i) * 60);
    }
  }
  return days;
}

export type Daypart = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

/** Daypart histogram from real playEvents (+ seeded demo when requested). */
export function daypartMix(events: PlayEvent[], includeDemo: boolean): { name: Daypart; plays: number }[] {
  const mix: Record<Daypart, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  for (const ev of events) {
    const when = new Date(ev.playedAt);
    if (Number.isNaN(when.getTime())) continue;
    const h = when.getHours();
    const part: Daypart =
      h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : h >= 17 && h < 22 ? 'Evening' : 'Night';
    mix[part]++;
  }
  if (includeDemo) {
    const seed = seedHash('dayparts');
    (['Morning', 'Afternoon', 'Evening', 'Night'] as Daypart[]).forEach((part, i) => {
      mix[part] += 8 + Math.floor(rand(seed, i) * 40);
    });
  }
  return [
    { name: 'Morning', plays: mix.Morning },
    { name: 'Afternoon', plays: mix.Afternoon },
    { name: 'Evening', plays: mix.Evening },
    { name: 'Night', plays: mix.Night },
  ];
}

/** Audience mix: local (this device) vs. synced listeners, plus a seeded demo split. */
export function audienceMix(realPlays: number, signedIn: boolean): { local: number; synced: number; demo: boolean } {
  const seed = seedHash('audience');
  const demoSynced = 20 + Math.floor(rand(seed, 1) * 120);
  return {
    local: realPlays,
    synced: (signedIn ? Math.ceil(realPlays / 2) : 0) + demoSynced,
    demo: true,
  };
}

export const fmtMoney = (v: number): string => `$${v.toFixed(v >= 100 ? 0 : 2)}`;

export const ledgerFileForTrack = (track: Track): string => track.audioUrl.split('/').pop() ?? '';

export { TRACKS };
