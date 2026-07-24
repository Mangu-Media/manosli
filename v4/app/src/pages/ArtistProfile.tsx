// ─────────────────────────────────────────────
// ARTIST PUBLIC PROFILE (/artist/:id) — fan-facing artist pages
// Follow + support pledges persist in localStorage; audio previews
// use one shared HTMLAudioElement (the full engine lives in the player at /app).
// ─────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ALBUMS, ARTISTS, TRACKS, theme } from './player/data';
import type { Track } from './player/data';
import {
  Hero,
  TopTracks,
  Discography,
  About,
  SupportModal,
  ArtistNotFound,
} from './profile/components';
import {
  addPledge,
  formatCompact,
  getFollows,
  getPledges,
  parseCompact,
  pledgeTotal,
  saveFollows,
} from './profile/profileData';
import type { Pledge } from './profile/profileData';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const artist = ARTISTS.find((a) => a.id === id);

  // ── follows (persisted) ──
  const [follows, setFollows] = useState<Set<string>>(() => getFollows());
  const following = artist ? follows.has(artist.id) : false;

  const toggleFollow = () => {
    if (!artist) return;
    setFollows((prev) => {
      const next = new Set(prev);
      if (next.has(artist.id)) next.delete(artist.id);
      else next.add(artist.id);
      saveFollows(next);
      return next;
    });
  };

  // optimistic follower count: parsed base ± 1 while toggled
  const followersLabel = useMemo(() => {
    if (!artist) return '';
    const base = parseCompact(artist.followers);
    return formatCompact(base + (following ? 1 : 0));
  }, [artist, following]);

  // ── pledges (persisted, stubbed checkout) ──
  const [pledges, setPledges] = useState<Pledge[]>(() => getPledges());
  const [supportOpen, setSupportOpen] = useState(false);

  const confirmPledge = (amount: number) => {
    if (!artist) return;
    setPledges(addPledge({ artistId: artist.id, amount, at: Date.now() }));
  };

  // ── top tracks, sorted by parsed play counts ──
  const topTracks = useMemo(() => {
    if (!artist) return [];
    return TRACKS.filter((t) => t.artistId === artist.id)
      .sort((a, b) => parseCompact(b.plays) - parseCompact(a.plays))
      .slice(0, 8);
  }, [artist]);

  const albums = useMemo(
    () => (artist ? ALBUMS.filter((al) => al.artist === artist.id).sort((a, b) => b.year - a.year) : []),
    [artist],
  );

  // ── shared audio preview element ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    const onEnd = () => setPlayingId(null);
    audio.addEventListener('ended', onEnd);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnd);
      audioRef.current = null;
    };
  }, []);

  // stop preview when navigating to another artist
  useEffect(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, [id]);

  useEffect(() => {
    document.title = artist ? `${artist.name} — manosli+` : 'Artist not found — manosli+';
  }, [artist]);

  const togglePlay = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = track.audioUrl;
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(track.id);
  };

  if (!artist) return <ArtistNotFound />;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'inherit' }}>
      {/* header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 24px',
          background: `${theme.bg}CC`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: theme.text, fontWeight: 800, fontSize: 17 }}>
          manosli<span style={{ color: theme.accent }}>+</span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link to="/app" style={{ color: theme.textSecondary, fontSize: 13, textDecoration: 'none' }}>
          Open player →
        </Link>
      </header>

      <Hero
        artist={artist}
        followersLabel={followersLabel}
        following={following}
        onToggleFollow={toggleFollow}
        onSupport={() => setSupportOpen(true)}
      />

      <TopTracks tracks={topTracks} playingId={playingId} onTogglePlay={togglePlay} />

      <Discography albums={albums} />

      <About artist={artist} />

      {/* running pledge total */}
      {pledges.length > 0 && (
        <div
          style={{
            maxWidth: 860,
            margin: '36px auto 0',
            padding: '0 24px',
            color: theme.amber,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          You've pledged {`$${pledgeTotal(pledges) % 1 === 0 ? pledgeTotal(pledges).toFixed(0) : pledgeTotal(pledges).toFixed(2)}`}{' '}
          to independent artists
        </div>
      )}

      <footer
        style={{
          maxWidth: 860,
          margin: '48px auto 0',
          padding: '20px 24px 48px',
          borderTop: `1px solid ${theme.border}`,
          color: theme.dim,
          fontSize: 12,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Public profile preview</span>
        <Link to="/studio" style={{ color: theme.textSecondary, textDecoration: 'none' }}>
          Are you an artist? Open the studio →
        </Link>
      </footer>

      {supportOpen && (
        <SupportModal
          artist={artist}
          totalPledged={pledgeTotal(pledges)}
          onClose={() => setSupportOpen(false)}
          onConfirm={confirmPledge}
        />
      )}
    </div>
  );
}
