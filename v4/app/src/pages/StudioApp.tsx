// ─────────────────────────────────────────────
// ARTIST STUDIO (/studio) — where indie artists manage their music on manosli+
// ─────────────────────────────────────────────
// Data honesty contract:
//  - REAL: uploads (PlayerRepository state + IndexedDB bytes), playEvents,
//    /audio/ledger.json provenance.
//  - SYNTHETIC: catalog play counts / week series / dayparts / audience mix
//    are deterministic seeded demo data (seed = hash of id) and carry a
//    visible "demo" tag wherever they appear.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme, fmt } from './player/data';
import type { Track } from './player/data';
import { useAuth, getToken } from './player/auth';
import { createPlayerRepository } from './player/repository';
import type { PlayerState } from './player/repository';
import { deleteUploadAudio, getUploadAudio } from './player/uploads';
import type { UploadMeta } from './player/uploads';
import type { PlayEvent } from './player/analytics';
import {
  TRACKS,
  ROYALTY_RATE,
  PAYOUT_THRESHOLD,
  catalogTrackStats,
  uploadTrackStats,
  weekSeries,
  daypartMix,
  audienceMix,
  fmtMoney,
  ledgerFileForTrack,
} from './studio/studioData';
import type { LedgerEntry } from './studio/studioData';
import { Section, StatCard, BarChart, DemoTag, card, caption } from './studio/components';

type Row =
  | { kind: 'upload'; upload: UploadMeta; stats: ReturnType<typeof uploadTrackStats> }
  | { kind: 'catalog'; track: Track; stats: ReturnType<typeof catalogTrackStats> };

export default function StudioApp() {
  const { user } = useAuth();
  const artistName = user?.name ?? 'Independent Artist';

  // Repository state (uploads + playEvents) — same mechanism as the player.
  const repo = useMemo(() => createPlayerRepository(getToken), []);
  const [state, setState] = useState<PlayerState>(() => {
    const loaded = repo.load();
    return loaded ?? { likedTrackIds: [], playlists: [], recentlyPlayed: [], uploads: [], playEvents: [] };
  });
  const uploads = useMemo(() => state.uploads ?? [], [state.uploads]);
  const events: PlayEvent[] = useMemo(() => state.playEvents ?? [], [state.playEvents]);

  const persist = (nextUploads: UploadMeta[]) => {
    const next: PlayerState = { ...state, uploads: nextUploads };
    setState(next);
    repo.save(next);
    repo.flush();
  };

  // License provenance ledger.
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/audio/ledger.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LedgerEntry[]) => {
        if (alive && Array.isArray(data)) setLedger(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ── Overview totals ──
  const [showCatalog, setShowCatalog] = useState(false);
  const rows: Row[] = useMemo(() => {
    const up: Row[] = uploads.map((u) => ({ kind: 'upload', upload: u, stats: uploadTrackStats(u, events) }));
    const cat: Row[] = showCatalog
      ? TRACKS.map((t) => ({ kind: 'catalog', track: t, stats: catalogTrackStats(t, events) }))
      : [];
    return [...up, ...cat];
  }, [uploads, events, showCatalog]);

  const totals = useMemo(() => {
    const trackCount = uploads.length;
    const plays = rows.reduce((n, r) => n + r.stats.plays, 0);
    const minutes = rows.reduce((n, r) => n + r.stats.minutes, 0);
    const royalty = rows.reduce((n, r) => n + r.stats.royalty, 0);
    return { trackCount, plays, minutes, royalty, anyDemo: rows.some((r) => r.stats.demo) };
  }, [rows, uploads]);

  // ── Edit modal ──
  const [editing, setEditing] = useState<UploadMeta | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const openEdit = (u: UploadMeta) => {
    setEditing(u);
    setEditTitle(u.title);
    setEditArtist(u.artist);
  };
  const saveEdit = () => {
    if (!editing) return;
    persist(
      uploads.map((u) =>
        u.id === editing.id
          ? { ...u, title: editTitle.trim() || u.title, artist: editArtist.trim() || u.artist }
          : u,
      ),
    );
    setEditing(null);
  };

  // ── Delete with confirm ──
  const [deleting, setDeleting] = useState<UploadMeta | null>(null);
  const confirmDelete = () => {
    if (!deleting) return;
    persist(uploads.filter((u) => u.id !== deleting.id));
    void deleteUploadAudio(deleting.id);
    if (playingId === deleting.id) stopPreview();
    setDeleting(null);
  };

  // ── Inline preview (one shared HTMLAudioElement) ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopPreview = () => {
    audioRef.current?.pause();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingId(null);
  };
  useEffect(() => stopPreview, []); // cleanup on unmount
  const togglePreview = async (id: string, src: () => Promise<string | null>) => {
    if (playingId === id) {
      stopPreview();
      return;
    }
    stopPreview();
    const url = await src();
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const el = audioRef.current;
    el.src = url;
    el.onended = () => stopPreview();
    void el.play().catch(() => stopPreview());
    setPlayingId(id);
  };
  const previewUpload = (u: UploadMeta) =>
    togglePreview(u.id, async () => {
      const blob = await getUploadAudio(u.id);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      return url;
    });
  const previewCatalog = (t: Track) => togglePreview(t.id, async () => t.audioUrl);

  // ── Listener insights ──
  const week = useMemo(() => weekSeries(events, true), [events]);
  const dayparts = useMemo(() => daypartMix(events, true), [events]);
  const audience = useMemo(() => audienceMix(events.length, user !== null), [events, user]);
  const daypartMax = Math.max(1, ...dayparts.map((d) => d.plays));
  const audienceTotal = Math.max(1, audience.local + audience.synced);

  // ── Royalty transparency: ledger for played files ──
  const playedFiles = useMemo(() => {
    const ids = new Set(events.map((e) => e.trackId));
    const files = new Set<string>();
    for (const t of TRACKS) if (ids.has(t.id)) files.add(ledgerFileForTrack(t));
    if (files.size === 0) TRACKS.slice(0, 4).forEach((t) => files.add(ledgerFileForTrack(t)));
    return ledger.filter((entry) => files.has(entry.file));
  }, [events, ledger]);

  const progress = Math.min(1, totals.royalty / PAYOUT_THRESHOLD);

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'inherit' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.abyss,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: theme.text, fontWeight: 800, fontSize: 18 }}>
          manosli<span style={{ color: theme.accent }}>+</span>
        </Link>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: theme.green,
            border: `1px solid ${theme.green}`,
            borderRadius: 8,
            padding: '3px 10px',
          }}
        >
          Artist Studio
        </span>
        <div style={{ flex: 1 }} />
        <Link to="/artist/a1" style={{ color: theme.textSecondary, fontSize: 13, textDecoration: 'none' }}>
          View public profile → <span style={{ color: theme.dim, fontSize: 11 }}>(preview)</span>
        </Link>
        <Link to="/app" style={{ color: theme.textSecondary, fontSize: 13, textDecoration: 'none' }}>
          Open player →
        </Link>
        <Link to="/" style={{ color: theme.textSecondary, fontSize: 13, textDecoration: 'none' }}>
          Back to site
        </Link>
      </header>

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* ── 1. Overview band ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ ...card, flex: '1 1 260px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              🎧
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{artistName}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>
                {user ? user.email : 'Not signed in — local artist profile'}
              </div>
            </div>
          </div>
          <StatCard label="Tracks uploaded" value={String(totals.trackCount)} accent={theme.green} />
          <StatCard
            label="Total plays"
            value={totals.plays.toLocaleString()}
            hint={totals.anyDemo ? 'includes seeded demo listener data' : 'from your play history'}
            accent={theme.accent}
          />
          <StatCard label="Total minutes" value={totals.minutes.toLocaleString()} accent={theme.amber} />
          <StatCard label="Est. royalties" value={fmtMoney(totals.royalty)} hint={`@ $${ROYALTY_RATE.toFixed(3)}/stream`} accent={theme.pink} />
        </div>

        {/* ── 2. My Tracks ── */}
        <Section
          title="My Tracks"
          subtitle="Your uploads, measured from real plays on this device. Toggle the catalog to compare against demo listener data."
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={showCatalog} onChange={(e) => setShowCatalog(e.target.checked)} />
              Also view catalog tracks <DemoTag />
            </label>
            <Link
              to="/app"
              style={{
                background: theme.accent,
                color: theme.text,
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              + Upload new track
            </Link>
          </div>

          {uploads.length === 0 && !showCatalog ? (
            <div style={{ ...card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32 }}>📤</div>
              <p style={{ color: theme.textSecondary, fontSize: 14 }}>
                No uploads yet. Your music lives on this device until you upload it in the player.
              </p>
              <Link to="/app" style={{ color: theme.accent, fontWeight: 700, fontSize: 14 }}>
                Upload your first track in the player →
              </Link>
            </div>
          ) : (
            <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
                <thead>
                  <tr style={{ color: theme.textSecondary, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {['', 'Title', 'Plays', 'Minutes', 'Royalty est.', 'License', ''].map((h) => (
                      <th key={h} style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = row.kind === 'upload' ? row.upload.id : row.track.id;
                    const title = row.kind === 'upload' ? row.upload.title : row.track.title;
                    const artist = row.kind === 'upload' ? row.upload.artist : row.track.artist;
                    const playing = playingId === id;
                    return (
                      <tr key={id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            onClick={() => (row.kind === 'upload' ? previewUpload(row.upload) : previewCatalog(row.track))}
                            title={playing ? 'Stop preview' : 'Play preview'}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              background: playing ? theme.pink : theme.surfaceActive,
                              color: theme.text,
                              fontSize: 13,
                            }}
                          >
                            {playing ? '■' : '▶'}
                          </button>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700 }}>{title}</div>
                          <div style={{ color: theme.textSecondary, fontSize: 12 }}>{artist}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {row.stats.plays.toLocaleString()}
                          {row.stats.demo && <DemoTag />}
                        </td>
                        <td style={{ padding: '10px 14px' }}>{row.stats.minutes.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: theme.green, fontWeight: 700 }}>{fmtMoney(row.stats.royalty)}</td>
                        <td style={{ padding: '10px 14px', color: theme.textSecondary }}>
                          {row.kind === 'upload' ? 'Your master' : 'CC BY 4.0'}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {row.kind === 'upload' ? (
                            <>
                              <button onClick={() => openEdit(row.upload)} style={actionBtn}>Edit</button>
                              <button onClick={() => setDeleting(row.upload)} style={{ ...actionBtn, color: theme.pink }}>Delete</button>
                            </>
                          ) : (
                            <Link to="/app" style={{ ...actionBtn, textDecoration: 'none', display: 'inline-block' }}>Open in player</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── 3. Listener insights ── */}
        <Section title="Listener insights" subtitle="Real playEvents from this device, blended with seeded demo listener activity.">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ ...card, flex: '2 1 420px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Plays — last 7 days <DemoTag />
              </div>
              <BarChart days={week} />
              <div style={caption}>Includes deterministic demo listener data (seeded per day) layered over your real plays.</div>
            </div>
            <div style={{ ...card, flex: '1 1 240px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Top listener dayparts <DemoTag />
              </div>
              {dayparts.map((d) => (
                <div key={d.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.textSecondary }}>
                    <span>{d.name}</span>
                    <span>{d.plays}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: theme.surfaceActive, marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${(d.plays / daypartMax) * 100}%`, borderRadius: 3, background: theme.accent }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 13, fontWeight: 700, margin: '16px 0 8px' }}>
                Audience mix <DemoTag />
              </div>
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: theme.surfaceActive }}>
                <div style={{ width: `${(audience.local / audienceTotal) * 100}%`, background: theme.green }} title={`Local: ${audience.local}`} />
                <div style={{ width: `${(audience.synced / audienceTotal) * 100}%`, background: theme.pink }} title={`Synced: ${audience.synced}`} />
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: theme.textSecondary }}>
                <span><span style={{ color: theme.green }}>●</span> Local listeners ({audience.local})</span>
                <span><span style={{ color: theme.pink }}>●</span> Synced listeners ({audience.synced})</span>
              </div>
              <div style={caption}>Local = plays on this device; synced = account listeners. Synced count is seeded demo data.</div>
            </div>
          </div>
        </Section>

        {/* ── 4. Royalty transparency — the signature panel ── */}
        <Section title="Royalty transparency" subtitle="Every stream, every cent, every license — out in the open.">
          <div
            style={{
              ...card,
              background: `linear-gradient(135deg, ${theme.surface}, #1B0F2E)`,
              border: `1px solid ${theme.accent}`,
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: theme.textSecondary }}>Artist rate</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: theme.green }}>${ROYALTY_RATE.toFixed(3)}<span style={{ fontSize: 16, color: theme.textSecondary, fontWeight: 600 }}>/stream</span></div>
              <div style={{ fontSize: 13, color: theme.text, marginTop: 4 }}>No label cut — you keep <strong>100%</strong>.</div>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>The math, per track</div>
              {rows.slice(0, 5).map((row) => {
                const title = row.kind === 'upload' ? row.upload.title : row.track.title;
                return (
                  <div key={row.kind === 'upload' ? row.upload.id : row.track.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: `1px dashed ${theme.border}` }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{title}</span>
                    <span style={{ color: theme.textSecondary }}>
                      {row.stats.plays.toLocaleString()} × ${ROYALTY_RATE.toFixed(3)} ={' '}
                      <strong style={{ color: theme.green }}>{fmtMoney(row.stats.royalty)}</strong>
                    </span>
                  </div>
                );
              })}
              {rows.length === 0 && <div style={{ fontSize: 13, color: theme.textSecondary }}>Upload a track and the royalty math appears here.</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {/* Payout history stub */}
            <div style={{ ...card, flex: '1 1 280px' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Payout history</div>
              <div style={{ margin: '14px 0 8px', height: 8, borderRadius: 4, background: theme.surfaceActive }}>
                <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 4, background: `linear-gradient(90deg, ${theme.accent}, ${theme.green})` }} />
              </div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>
                {fmtMoney(totals.royalty)} of ${PAYOUT_THRESHOLD.toFixed(2)} — first payout at ${PAYOUT_THRESHOLD}
              </div>
              <div style={{ ...caption, fontStyle: 'italic' }}>No payouts yet. Keep streaming.</div>
            </div>

            {/* License provenance */}
            <div style={{ ...card, flex: '2 1 380px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>License provenance</div>
              <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10 }}>
                Every catalog audio file you've played, traced to its source via <code>ledger.json</code>.
              </div>
              {playedFiles.length === 0 ? (
                <div style={caption}>Loading ledger…</div>
              ) : (
                playedFiles.map((entry) => (
                  <div key={entry.file} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, padding: '6px 0', borderBottom: `1px dashed ${theme.border}`, flexWrap: 'wrap' }}>
                    <span>
                      <strong>{entry.title}</strong> — {entry.artist}
                    </span>
                    <span style={{ display: 'flex', gap: 10 }}>
                      <a href={entry.sourceUrl} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>source</a>
                      <a href={entry.licenseUrl} target="_blank" rel="noreferrer" style={{ color: theme.green }}>{entry.license}</a>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Section>

        {/* ── 5. Upload CTA ── */}
        <Section title="Release something new">
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Your next track is one upload away.</div>
              <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                Uploads are stored on this device (IndexedDB) and appear here instantly with full analytics.
              </div>
            </div>
            <Link
              to="/app"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                color: theme.text,
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Upload in the player →
            </Link>
          </div>
        </Section>
      </main>

      {/* ── Edit modal ── */}
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Edit track</h3>
          <label style={labelStyle}>Title</label>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Artist</label>
          <input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button onClick={() => setEditing(null)} style={ghostBtn}>Cancel</button>
            <button onClick={saveEdit} style={primaryBtn}>Save</button>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Delete “{deleting.title}”?</h3>
          <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>
            This removes the metadata and the stored audio ({deleting.fileName}
            {deleting.duration > 0 ? `, ${fmt(deleting.duration)}` : ''}) from this device. This can't be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button onClick={() => setDeleting(null)} style={ghostBtn}>Keep it</button>
            <button onClick={confirmDelete} style={{ ...primaryBtn, background: theme.pink }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,1,8,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...card, width: '100%', maxWidth: 420, background: theme.abyss }}
      >
        {children}
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  color: theme.textSecondary,
  fontSize: 12,
  padding: '5px 10px',
  marginRight: 6,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.textSecondary, margin: '10px 0 4px' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  color: theme.text,
  padding: '9px 12px',
  fontSize: 14,
};

const primaryBtn: React.CSSProperties = {
  background: theme.accent,
  border: 'none',
  borderRadius: 8,
  color: theme.text,
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  color: theme.textSecondary,
  padding: '9px 18px',
  fontSize: 13,
  cursor: 'pointer',
};
