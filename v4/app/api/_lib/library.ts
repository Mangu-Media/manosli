// Shared validation/caps for the library sync payload.
import type { PlaylistDoc } from './db';

export interface LibraryState {
  likedTrackIds: string[];
  playlists: PlaylistDoc[];
  recentlyPlayed: string[];
  queue: string[];
}

export const CAPS = {
  likedTrackIds: 2000,
  playlists: 200,
  playlistTracks: 500,
  recentlyPlayed: 50,
  queue: 200,
  historyEvents: 100,
} as const;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);

function sanitizePlaylist(v: unknown): PlaylistDoc | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Partial<PlaylistDoc>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;
  return {
    id: p.id,
    name: p.name.slice(0, 120),
    description: str(p.description, '').slice(0, 500),
    cover: str(p.cover, '🎵').slice(0, 16),
    color: str(p.color, '#7C5CFF').slice(0, 32),
    tracks: isStringArray(p.tracks) ? p.tracks.slice(0, CAPS.playlistTracks) : [],
  };
}

/**
 * Validate + cap a client-submitted library state. Returns null when the
 * shape is fundamentally wrong (caller should 400).
 */
export function sanitizeLibraryState(v: unknown): LibraryState | null {
  if (typeof v !== 'object' || v === null) return null;
  const s = v as Partial<LibraryState>;
  if (!isStringArray(s.likedTrackIds)) return null;
  if (!Array.isArray(s.playlists)) return null;
  if (!isStringArray(s.recentlyPlayed)) return null;
  return {
    likedTrackIds: s.likedTrackIds.slice(0, CAPS.likedTrackIds),
    playlists: s.playlists
      .map(sanitizePlaylist)
      .filter((p): p is PlaylistDoc => p !== null)
      .slice(0, CAPS.playlists),
    recentlyPlayed: s.recentlyPlayed.slice(0, CAPS.recentlyPlayed),
    queue: isStringArray(s.queue) ? s.queue.slice(0, CAPS.queue) : [],
  };
}

export function emptyLibraryState(): LibraryState {
  return { likedTrackIds: [], playlists: [], recentlyPlayed: [], queue: [] };
}
