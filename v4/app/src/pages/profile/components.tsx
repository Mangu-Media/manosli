// ─────────────────────────────────────────────
// PROFILE COMPONENTS — hero, tracks, discography, about, support modal
// ─────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme, fmt } from '../player/data';
import type { Artist, Album, Track } from '../player/data';
import { Avatar, Cover, Waveform } from '../player/components';
import { Icon } from '../player/icons';
import { fmtMoney, parseCompact } from './profileData';

// ─────────────────────────────────────────────
// HERO — avatar artwork, aurora wash, follow + support
// ─────────────────────────────────────────────

interface HeroProps {
  artist: Artist;
  followersLabel: string;
  following: boolean;
  onToggleFollow: () => void;
  onSupport: () => void;
}

export function Hero({ artist, followersLabel, following, onToggleFollow, onSupport }: HeroProps) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* aurora gradient wash */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 55% at 20% 0%, ${artist.color}38, transparent 70%),
            radial-gradient(ellipse 60% 50% at 85% 15%, ${theme.accent}2E, transparent 70%),
            radial-gradient(ellipse 55% 45% at 50% 60%, ${theme.pink}18, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          maxWidth: 860,
          margin: '0 auto',
          padding: '88px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Avatar
          name={artist.name}
          color={artist.color}
          artwork={artist.artwork}
          emoji={artist.image}
          style={{
            width: 152,
            height: 152,
            fontSize: 60,
            boxShadow: `0 16px 56px ${artist.color}45, 0 0 0 1px ${theme.border}`,
          }}
        />
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', margin: '20px 0 0' }}>
          {artist.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              padding: '4px 14px',
              borderRadius: 14,
              background: `${artist.color}22`,
              border: `1px solid ${artist.color}55`,
              color: artist.color,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {artist.genre}
          </span>
          <span style={{ color: theme.textSecondary, fontSize: 14 }}>
            {followersLabel} followers
          </span>
        </div>
        <p style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '16px 0 0' }}>
          {artist.bio}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onToggleFollow}
            style={{
              padding: '11px 30px',
              borderRadius: 24,
              border: 'none',
              background: following ? theme.surfaceActive : artist.color,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            <Icon name={following ? 'heartFill' : 'heart'} size={15} />
            {following ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={onSupport}
            style={{
              padding: '11px 26px',
              borderRadius: 24,
              background: 'transparent',
              border: `1px solid ${theme.amber}88`,
              color: theme.amber,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="mic" size={15} />
            Support
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOP TRACKS — sorted by plays, playable preview rows
// ─────────────────────────────────────────────

interface TopTracksProps {
  tracks: Track[];
  playingId: string | null;
  onTogglePlay: (track: Track) => void;
}

export function TopTracks({ tracks, playingId, onTogglePlay }: TopTracksProps) {
  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: '8px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Top tracks</h2>
        <Link to="/app" style={{ color: theme.textSecondary, fontSize: 13, textDecoration: 'none' }}>
          Open in player →
        </Link>
      </div>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 6 }}>
        {tracks.map((track, i) => {
          const isPlaying = playingId === track.id;
          return (
            <div
              key={track.id}
              onClick={() => onTogglePlay(track)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: isPlaying ? `${theme.accent}15` : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isPlaying) e.currentTarget.style.background = theme.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isPlaying ? `${theme.accent}15` : 'transparent';
              }}
            >
              <span
                style={{
                  width: 26,
                  textAlign: 'center',
                  color: isPlaying ? theme.accent : theme.textSecondary,
                  fontSize: 13,
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isPlaying ? <Waveform isPlaying bars={4} color={theme.accent} /> : i + 1}
              </span>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isPlaying ? theme.accent : theme.surfaceActive,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: isPlaying ? theme.accent : theme.text,
                    fontSize: 14,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.title}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                  {track.album} · {track.plays} plays
                </div>
              </div>
              <span style={{ color: theme.textSecondary, fontSize: 12, flexShrink: 0 }}>{fmt(track.duration)}</span>
            </div>
          );
        })}
        {tracks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>
            No tracks in the catalog yet.
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// DISCOGRAPHY — album grid with covers, years, track counts
// ─────────────────────────────────────────────

export function Discography({ albums }: { albums: Album[] }) {
  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 0' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>Discography</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 16,
        }}
      >
        {albums.map((album) => (
          <div key={album.id}>
            <Cover
              color={album.color}
              artwork={album.artwork}
              emoji={album.cover}
              alt={album.title}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 12,
                fontSize: 40,
                boxShadow: `0 8px 24px ${album.color}25`,
              }}
            />
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>{album.title}</div>
            <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
              {album.year} · {album.tracks} tracks
            </div>
          </div>
        ))}
      </div>
      {albums.length === 0 && (
        <div style={{ color: theme.textSecondary, fontSize: 13 }}>No releases yet.</div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// ABOUT — long bio + royalty transparency blurb
// ─────────────────────────────────────────────

export function About({ artist }: { artist: Artist }) {
  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 0' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>About</h2>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20 }}>
        <p style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          {artist.longBio || artist.bio}
        </p>
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 10,
            background: `${theme.green}10`,
            border: `1px solid ${theme.green}33`,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: theme.green, flexShrink: 0, marginTop: 1 }}>
            <Icon name="trending" size={16} />
          </span>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <span style={{ color: theme.text, fontWeight: 600 }}>Royalty transparency. </span>
            <span style={{ color: theme.textSecondary }}>
              This artist keeps 100% — $0.004/stream, math shown openly. Every play on manosli+ is
              counted in a public ledger.
            </span>{' '}
            <Link to="/studio" style={{ color: theme.green, textDecoration: 'none', fontWeight: 600 }}>
              See the studio ledger →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SUPPORT MODAL — tip tiers, stubbed checkout
// ─────────────────────────────────────────────

const TIERS = [2, 5, 10];

interface SupportModalProps {
  artist: Artist;
  totalPledged: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export function SupportModal({ artist, totalPledged, onClose, onConfirm }: SupportModalProps) {
  const [tier, setTier] = useState<number>(5);
  const [custom, setCustom] = useState('');
  const [confirmed, setConfirmed] = useState<number | null>(null);

  const customAmount = parseFloat(custom);
  const amount = custom.trim() !== '' && !Number.isNaN(customAmount) && customAmount > 0 ? customAmount : tier;
  const isCustom = custom.trim() !== '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,2,10,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: theme.abyss,
          border: `1px solid ${theme.border}`,
          borderRadius: 18,
          padding: 24,
          boxShadow: `0 24px 80px ${artist.color}25`,
        }}
      >
        {confirmed === null ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Support {artist.name}</h3>
                <p style={{ color: theme.textSecondary, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
                  100% of your tip goes to the artist. Always.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTier(t);
                    setCustom('');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    borderRadius: 12,
                    border: `1px solid ${!isCustom && tier === t ? artist.color : theme.border}`,
                    background: !isCustom && tier === t ? `${artist.color}22` : theme.surface,
                    color: theme.text,
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${t}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', marginTop: 12 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 15 }}>
                $
              </span>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="Custom amount"
                inputMode="decimal"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '13px 14px 13px 28px',
                  borderRadius: 12,
                  border: `1px solid ${isCustom ? artist.color : theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={() => {
                onConfirm(amount);
                setConfirmed(amount);
              }}
              disabled={!amount || amount <= 0}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '13px 0',
                borderRadius: 24,
                border: 'none',
                background: artist.color,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                opacity: !amount || amount <= 0 ? 0.5 : 1,
              }}
            >
              Pledge {fmtMoney(amount)}
            </button>
            <p style={{ color: theme.dim, fontSize: 11, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
              Checkout is stubbed — payments launch with the full backend.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `${theme.green}1E`,
                border: `1px solid ${theme.green}55`,
                color: theme.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Icon name="heartFill" size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
              You pledged {fmtMoney(confirmed)} to {artist.name}
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 1.6, margin: '10px 0 0' }}>
              Recorded locally — payments launch with the full backend and every pledge converts at
              checkout, minus 0% platform fees.
            </p>
            <p style={{ color: theme.amber, fontSize: 13, fontWeight: 600, margin: '14px 0 0' }}>
              You've pledged {fmtMoney(totalPledged)} to independent artists
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 18,
                padding: '11px 34px',
                borderRadius: 24,
                border: 'none',
                background: artist.color,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOT FOUND — branded 404 for unknown artist ids
// ─────────────────────────────────────────────

export function ArtistNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 45% at 25% 20%, ${theme.accent}26, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 70%, ${theme.pink}1E, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎧</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Artist not found</h1>
        <p style={{ color: theme.textSecondary, fontSize: 14, margin: '12px 0 0' }}>
          This artist page doesn't exist — maybe it slipped off the setlist.
        </p>
        <Link
          to="/app"
          style={{
            display: 'inline-block',
            marginTop: 26,
            padding: '12px 32px',
            borderRadius: 24,
            background: theme.accent,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Back to the player
        </Link>
      </div>
    </div>
  );
}

// re-export for the page
export { parseCompact };
