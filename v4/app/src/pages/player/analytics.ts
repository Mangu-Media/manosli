import { ARTISTS, GENRES } from './data';
import type { Artist, Track } from './data';

// ─────────────────────────────────────────────
// LISTENING ANALYTICS ("Your Sound")
// ─────────────────────────────────────────────
// Pure derivations over the locally tracked play-event log (see
// PlayerState.playEvents in repository.ts). No server round-trips — every
// stat here is computed client-side from { trackId, playedAt } entries.

/** One recorded play — appended on every playTrack, capped by the caller. */
export interface PlayEvent {
  trackId: string;
  /** ISO timestamp. */
  playedAt: string;
}

/** Maximum events retained in the persisted log (ring-buffer style). */
export const PLAY_EVENTS_CAP = 500;

export interface TopTrackEntry {
  track: Track;
  plays: number;
}

export interface TopArtistEntry {
  name: string;
  /** Catalog artist when the plays belong to one (uploads have none). */
  artist: Artist | null;
  plays: number;
}

export interface TopGenreEntry {
  name: string;
  color: string;
  icon: string;
  plays: number;
}

export interface DayActivity {
  /** Short weekday label, e.g. "Mon". */
  label: string;
  plays: number;
  isToday: boolean;
}

export interface ListeningPersonality {
  title: string;
  description: string;
  emoji: string;
}

export interface ListeningStats {
  totalMinutes: number;
  playCount: number;
  topTracks: TopTrackEntry[];
  topArtists: TopArtistEntry[];
  topGenres: TopGenreEntry[];
  week: DayActivity[];
  personality: ListeningPersonality;
}

/** Genre of a track via its catalog artist; uploads get their own bucket. */
const genreFor = (track: Track): { name: string; color: string; icon: string } => {
  if (track.artistId === 'uploads') return { name: 'Your Uploads', color: '#2EE6D6', icon: '📤' };
  const artist = ARTISTS.find((a) => a.id === track.artistId);
  const genre = GENRES.find((g) => g.name === artist?.genre);
  return genre
    ? { name: genre.name, color: genre.color, icon: genre.icon }
    : { name: 'Other', color: '#6E6584', icon: '🎵' };
};

/** Time-of-day bucket for a timestamp — feeds the personality card. */
const daypart = (date: Date): 'Morning' | 'Afternoon' | 'Evening' | 'Night' => {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 22) return 'Evening';
  return 'Night';
};

const DAYPART_EMOJI: Record<string, string> = {
  Morning: '🌅',
  Afternoon: '☀️',
  Evening: '🌆',
  Night: '🌙',
};

const topN = <T>(map: Map<string, T & { plays: number }>, n: number): (T & { plays: number })[] =>
  Array.from(map.values())
    .sort((a, b) => b.plays - a.plays)
    .slice(0, n);

/**
 * Aggregates the raw play-event log into everything the Your Sound page
 * renders. `tracks` must include uploads so user files count too.
 * Events referencing unknown tracks are skipped defensively.
 */
export function computeListeningStats(events: PlayEvent[], tracks: Track[]): ListeningStats {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const trackPlays = new Map<string, { track: Track; plays: number }>();
  const artistPlays = new Map<string, { name: string; artist: Artist | null; plays: number }>();
  const genrePlays = new Map<string, { name: string; color: string; icon: string; plays: number }>();
  const daypartPlays = new Map<string, number>();

  // Last-7-days activity (local time, oldest → today).
  const days: DayActivity[] = [];
  const dayKeys: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    dayKeys.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      plays: 0,
      isToday: i === 0,
    });
  }

  let totalSeconds = 0;
  let counted = 0;
  for (const ev of events) {
    const track = byId.get(ev.trackId);
    if (!track) continue;
    counted++;
    totalSeconds += track.duration;

    const tp = trackPlays.get(track.id) ?? { track, plays: 0 };
    tp.plays++;
    trackPlays.set(track.id, tp);

    const ap = artistPlays.get(track.artist) ?? {
      name: track.artist,
      artist: ARTISTS.find((a) => a.id === track.artistId) ?? null,
      plays: 0,
    };
    ap.plays++;
    artistPlays.set(track.artist, ap);

    const g = genreFor(track);
    const gp = genrePlays.get(g.name) ?? { ...g, plays: 0 };
    gp.plays++;
    genrePlays.set(g.name, gp);

    const when = new Date(ev.playedAt);
    if (!Number.isNaN(when.getTime())) {
      daypartPlays.set(daypart(when), (daypartPlays.get(daypart(when)) ?? 0) + 1);
      const key = `${when.getFullYear()}-${when.getMonth()}-${when.getDate()}`;
      const idx = dayKeys.indexOf(key);
      if (idx >= 0) days[idx].plays++;
    }
  }

  const topGenres = topN(genrePlays, 4);
  const dominantDaypart =
    Array.from(daypartPlays.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Evening';
  const dominantGenre = topGenres[0];

  const personality: ListeningPersonality = dominantGenre
    ? {
        title: `${dominantDaypart} ${dominantGenre.name} Listener`,
        emoji: DAYPART_EMOJI[dominantDaypart],
        description: `Most of your plays are ${dominantGenre.name.toLowerCase()}, and you listen most in the ${dominantDaypart.toLowerCase()}. ${
          dominantGenre.name === 'Your Uploads' ? 'Your own uploads dominate — a true independent streak.' : ''
        }`.trim(),
      }
    : { title: 'New Explorer', emoji: '🎧', description: 'Press play a few times and your listening personality appears here.' };

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    playCount: counted,
    topTracks: topN(trackPlays, 5),
    topArtists: topN(artistPlays, 5),
    topGenres,
    week: days,
    personality,
  };
}
