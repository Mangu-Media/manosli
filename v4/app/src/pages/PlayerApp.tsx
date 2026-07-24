import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ARTISTS,
  ALBUMS,
  TRACKS,
  GENRES,
  PLAYLISTS_INIT,
  theme,
  fmt,
  clamp,
} from './player/data';
import type { Artist, Album, Track, Genre, Playlist } from './player/data';
import { usePlayerEngine, useMediaSession } from './player/usePlayerEngine';
import { createPlayerRepository, ApiRepository, reportHistoryEvent } from './player/repository';
import { computeListeningStats, PLAY_EVENTS_CAP } from './player/analytics';
import type { PlayEvent } from './player/analytics';
import { rankSearch } from './player/search';
import {
  dismissInstallCta,
  getInstallState,
  initInstallPromptCapture,
  isInstallDismissed,
  isIOSSafari,
  onInstallStateChange,
  promptInstall,
} from './player/installPrompt';
import {
  MAX_UPLOAD_BYTES,
  deleteUploadAudio,
  getUploadAudio,
  probeAudioDuration,
  putUploadAudio,
} from './player/uploads';
import type { UploadMeta } from './player/uploads';
import { getToken, useAuth } from './player/auth';
import { AuthModal } from './player/AuthModal';
import { Icon } from './player/icons';
import {
  Waveform,
  Cover,
  Avatar,
  ProgressBar,
  Pill,
  SectionHead,
  ScrollRow,
  GridRow,
} from './player/components';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Page = 'home' | 'search' | 'library' | 'stats' | 'album' | 'artist' | 'playlist' | 'genre';

interface PageStackEntry {
  page: Page;
  selectedAlbum: Album | null;
  selectedArtist: Artist | null;
  selectedPlaylist: Playlist | null;
  selectedGenre: Genre | null;
}

interface NavData {
  album?: Album;
  artist?: Artist;
  playlist?: Playlist;
  genre?: Genre;
}

interface ContextMenuState {
  track: Track;
  playlistId: string | null;
  x: number;
  y: number;
}

// ─────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────

export default function PlayerApp() {
  // Navigation
  const routeNavigate = useNavigate(); // SPA routes (e.g. public artist profiles at /artist/:id)
  const [page, setPage] = useState<Page>('home');
  const [pageStack, setPageStack] = useState<PageStackEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0=off, 1=all, 2=one
  const [showQueue, setShowQueue] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // Auth — session token + profile; null means local (offline) mode.
  const { session, user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // Library — hydrated from the persistence seam. Signed out: localStorage.
  // Signed in: ApiRepository keeps a local mirror and syncs with
  // /api/library/sync, degrading back to local when the API is unreachable.
  // Falls back to the shipped defaults on first run.
  const repository = useMemo(
    () => createPlayerRepository(session ? getToken : null),
    [session],
  );
  const [hydratedState] = useState(() => repository.load());
  const [likedTracks, setLikedTracks] = useState<Set<string>>(
    () => new Set(hydratedState?.likedTrackIds ?? ['t5', 't11', 't13']),
  );
  const [playlists, setPlaylists] = useState<Playlist[]>(() => hydratedState?.playlists ?? PLAYLISTS_INIT);
  const [queue, setQueue] = useState<string[]>(() => hydratedState?.queue ?? []);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(
    () => hydratedState?.recentlyPlayed ?? ['t13', 't5', 't1', 't11', 't7'],
  );
  // Local play-event log — feeds the "Your Sound" analytics page. Persisted
  // through the repository alongside the rest of the library state.
  const [playEvents, setPlayEvents] = useState<PlayEvent[]>(() => hydratedState?.playEvents ?? []);
  // Artist uploads — metadata persisted via the repository; audio bytes in
  // IndexedDB, materialized here as object URLs (see player/uploads.ts).
  const [uploads, setUploads] = useState<UploadMeta[]>(() => hydratedState?.uploads ?? []);
  const [uploadUrls, setUploadUrls] = useState<Record<string, string>>({});
  const uploadUrlsRef = useRef<Record<string, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // PWA install prompt — captured event + dismissal persistence
  // (see player/installPrompt.ts).
  const [installState, setInstallState] = useState(getInstallState);
  const [installDismissed, setInstallDismissed] = useState(isInstallDismissed);

  useEffect(() => {
    initInstallPromptCapture();
    setInstallState(getInstallState());
    return onInstallStateChange(() => setInstallState(getInstallState()));
  }, []);

  // Detail views
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  // Modals
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // ─────────────────────────────────────────
  // REAL AUDIO ENGINE
  // Progress comes from `timeupdate`; track end from `ended`.
  // ─────────────────────────────────────────

  // Holds the latest "track ended" logic; invoked by the engine's ended event.
  const endedLogicRef = useRef<() => void>(() => {});

  const engine = usePlayerEngine({
    onTimeUpdate: (current) => setProgress(current),
    onEnded: () => endedLogicRef.current(),
  });

  // Keep element volume/mute in sync with state (also applies initial values).
  useEffect(() => {
    engine.setVolume(volume);
  }, [engine, volume]);

  useEffect(() => {
    engine.setMuted(muted);
  }, [engine, muted]);

  // ─────────────────────────────────────────
  // PERSISTENCE — write durable state through the repository (debounced).
  // ─────────────────────────────────────────

  useEffect(() => {
    repository.save({
      likedTrackIds: Array.from(likedTracks),
      playlists,
      recentlyPlayed,
      queue,
      uploads,
      playEvents,
    });
  }, [repository, likedTracks, playlists, recentlyPlayed, queue, uploads, playEvents]);

  // Flush any pending debounced save before the page goes away.
  useEffect(() => {
    const flush = () => repository.flush();
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [repository]);

  // Server sync — when signed in, start the remote reconciliation (first sync
  // migrates local state up, then pulls the merged state down) and hydrate
  // the UI from whatever the server merges.
  useEffect(() => {
    if (!(repository instanceof ApiRepository)) return;
    repository.onRemoteState = (state) => {
      setLikedTracks(new Set(state.likedTrackIds));
      setPlaylists(state.playlists);
      setRecentlyPlayed(state.recentlyPlayed);
      if (state.queue) setQueue(state.queue);
      // mergeStates preserves local uploads; hydrate when present.
      if (state.uploads) setUploads(state.uploads);
      // mergeStates preserves local play events too.
      if (state.playEvents) setPlayEvents(state.playEvents);
    };
    repository.load(); // kicks off the background sync (local data unchanged)
    return () => {
      repository.onRemoteState = null;
    };
  }, [repository]);

  // ─────────────────────────────────────────
  // PWA — offline-capable app shell via service worker (production only).
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure must never break playback.
    });
  }, []);

  // ─────────────────────────────────────────
  // ARTIST UPLOADS
  // Object URLs are created lazily from IndexedDB bytes so uploaded tracks
  // flow through the same <audio> engine as catalog tracks.
  // ─────────────────────────────────────────

  useEffect(() => {
    uploadUrlsRef.current = uploadUrls;
  }, [uploadUrls]);

  // Revoke every object URL on unmount.
  useEffect(
    () => () => {
      Object.values(uploadUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  // Materialize persisted uploads (bytes live in IndexedDB).
  useEffect(() => {
    let cancelled = false;
    uploads.forEach((u) => {
      if (uploadUrlsRef.current[u.id]) return;
      void getUploadAudio(u.id).then((blob) => {
        if (!blob || cancelled) return;
        const url = URL.createObjectURL(blob);
        setUploadUrls((prev) => (prev[u.id] ? prev : { ...prev, [u.id]: url }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [uploads]);

  const uploadTracks = useMemo<Track[]>(
    () =>
      uploads.map((u) => ({
        id: u.id,
        title: u.title,
        artist: u.artist,
        artistId: 'uploads',
        album: 'Your Uploads',
        albumId: 'uploads',
        duration: u.duration,
        plays: 'you',
        audioUrl: uploadUrls[u.id] ?? '',
      })),
    [uploads, uploadUrls],
  );

  // Catalog + user uploads — every lookup below goes through this list.
  const allTracks = useMemo(() => [...TRACKS, ...uploadTracks], [uploadTracks]);

  const handleUploadFile = (file: File | null) => {
    setUploadError(null);
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadFile(null);
      setUploadError(
        `“${file.name}” is ${(file.size / (1024 * 1024)).toFixed(1)} MB — uploads are capped at 20 MB per file.`,
      );
      return;
    }
    setUploadFile(file);
    if (!uploadTitle.trim()) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadArtist('');
    setUploadError(null);
    setUploadBusy(false);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim() || uploadBusy) return;
    setUploadBusy(true);
    setUploadError(null);
    try {
      const id = `u-${crypto.randomUUID()}`;
      const duration = await probeAudioDuration(uploadFile);
      await putUploadAudio(id, uploadFile);
      const meta: UploadMeta = {
        id,
        title: uploadTitle.trim(),
        artist: uploadArtist.trim() || 'You',
        fileName: uploadFile.name,
        contentType: uploadFile.type || 'audio/mpeg',
        size: uploadFile.size,
        duration,
        addedAt: new Date().toISOString(),
      };
      setUploadUrls((prev) => ({ ...prev, [id]: URL.createObjectURL(uploadFile) }));
      setUploads((prev) => [...prev, meta]);
      setShowUpload(false);
      resetUploadForm();
    } catch {
      setUploadError('Could not store the audio on this device (storage unavailable).');
      setUploadBusy(false);
    }
  };

  const removeUpload = useCallback(
    (id: string) => {
      void deleteUploadAudio(id);
      const url = uploadUrlsRef.current[id];
      if (url) URL.revokeObjectURL(url);
      setUploadUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setUploads((prev) => prev.filter((u) => u.id !== id));
      setLikedTracks((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setQueue((prev) => prev.filter((t) => t !== id));
      setRecentlyPlayed((prev) => prev.filter((t) => t !== id));
      setPlayEvents((prev) => prev.filter((e) => e.trackId !== id));
      if (currentTrack?.id === id) {
        engine.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
        setProgress(0);
      }
    },
    [currentTrack, engine],
  );

  // Navigation helpers
  const navigateTo = useCallback(
    (pg: Page, data?: NavData) => {
      setPageStack((prev) => [...prev, { page, selectedAlbum, selectedArtist, selectedPlaylist, selectedGenre }]);
      setPage(pg);
      if (data?.album) setSelectedAlbum(data.album);
      if (data?.artist) setSelectedArtist(data.artist);
      if (data?.playlist) setSelectedPlaylist(data.playlist);
      if (data?.genre) setSelectedGenre(data.genre);
      setSidebarOpen(false);
    },
    [page, selectedAlbum, selectedArtist, selectedPlaylist, selectedGenre],
  );

  const goBack = useCallback(() => {
    const prev = pageStack[pageStack.length - 1];
    if (prev) {
      setPage(prev.page);
      setSelectedAlbum(prev.selectedAlbum);
      setSelectedArtist(prev.selectedArtist);
      setSelectedPlaylist(prev.selectedPlaylist);
      setSelectedGenre(prev.selectedGenre);
      setPageStack((s) => s.slice(0, -1));
    }
  }, [pageStack]);

  const navTo = useCallback((pg: Page) => {
    setPage(pg);
    setPageStack([]);
    setSidebarOpen(false);
  }, []);

  // Player actions
  const playTrack = useCallback(
    (track: Track) => {
      if (!track.audioUrl) return; // upload bytes not materialized (yet)
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      engine.loadTrack(track.audioUrl, true);
      // Listening history: fire-and-forget when signed in (API mode); a
      // no-op in local mode where recentlyPlayed above is the record.
      reportHistoryEvent(track.id);
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((id) => id !== track.id);
        return [track.id, ...filtered].slice(0, 20);
      });
      // Local analytics: append to the capped play-event log (Your Sound page).
      setPlayEvents((prev) =>
        [...prev, { trackId: track.id, playedAt: new Date().toISOString() }].slice(-PLAY_EVENTS_CAP),
      );
    },
    [engine],
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      engine.pause();
      setIsPlaying(false);
    } else {
      engine.play();
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, engine]);

  const seekTo = useCallback(
    (v: number) => {
      setProgress(v);
      engine.seek(v);
    },
    [engine],
  );

  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const nextId = queue[0];
      const nextTrack = allTracks.find((t) => t.id === nextId);
      if (nextTrack) {
        playTrack(nextTrack);
        setQueue((q) => q.slice(1));
      }
    } else if (currentTrack) {
      const idx = allTracks.findIndex((t) => t.id === currentTrack.id);
      const next = shuffleOn
        ? allTracks[Math.floor(Math.random() * allTracks.length)]
        : allTracks[(idx + 1) % allTracks.length];
      playTrack(next);
    }
  }, [queue, currentTrack, shuffleOn, playTrack, allTracks]);

  const handlePrev = useCallback(() => {
    if (progress > 3) {
      seekTo(0);
      return;
    }
    if (currentTrack) {
      const idx = allTracks.findIndex((t) => t.id === currentTrack.id);
      const prev = allTracks[(idx - 1 + allTracks.length) % allTracks.length];
      playTrack(prev);
    }
  }, [progress, currentTrack, playTrack, seekTo, allTracks]);

  // `ended` event logic — honors repeat / shuffle modes.
  endedLogicRef.current = () => {
    if (!currentTrack) return;
    if (repeatMode === 2) {
      // repeat one — restart the same track
      engine.seek(0);
      engine.play();
      setProgress(0);
      return;
    }
    if (
      repeatMode === 0 &&
      !shuffleOn &&
      queue.length === 0 &&
      currentTrack.id === allTracks[allTracks.length - 1].id
    ) {
      // repeat off — stop at the end of the catalog
      engine.seek(0);
      setIsPlaying(false);
      setProgress(0);
      return;
    }
    handleNext();
  };

  const toggleLike = useCallback((id: string) => {
    setLikedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const addToQueue = useCallback((trackId: string) => {
    setQueue((q) => [...q, trackId]);
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId && !p.tracks.includes(trackId) ? { ...p, tracks: [...p.tracks, trackId] } : p)),
    );
    setAddToPlaylistTrack(null);
  }, []);

  const createPlaylist = useCallback(() => {
    if (!newPlaylistName.trim()) return;
    const np: Playlist = {
      id: `p${Date.now()}`,
      name: newPlaylistName.trim(),
      description: '',
      cover: '🎵',
      color: GENRES[Math.floor(Math.random() * GENRES.length)].color,
      tracks: [],
    };
    setPlaylists((prev) => [...prev, np]);
    setNewPlaylistName('');
    setShowNewPlaylist(false);
  }, [newPlaylistName]);

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t !== trackId) } : p)));
  }, []);

  // Search — uploads included (they're in allTracks) and relevance-ranked
  // (exact > prefix > substring, artist boost, playing/liked boost).
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return {
      tracks: rankSearch(allTracks, searchQuery, (t) => ({
        isCurrent: currentTrack?.id === t.id,
        isLiked: likedTracks.has(t.id),
      })),
      // Albums reuse the same ranking via a light title/artist-name adapter.
      albums: rankSearch(
        ALBUMS.map((album) => ({ id: album.id, title: album.title, artist: album.artistName, album })),
        searchQuery,
      ).map((r) => r.album),
      artists: ARTISTS.filter((a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q)),
    };
  }, [searchQuery, allTracks, currentTrack, likedTracks]);

  // Track album helper
  const getAlbumTracks = useCallback((albumId: string) => allTracks.filter((t) => t.albumId === albumId), [allTracks]);
  const getArtistTracks = useCallback((artistId: string) => allTracks.filter((t) => t.artistId === artistId), [allTracks]);
  const getArtistAlbums = useCallback((artistId: string) => ALBUMS.filter((a) => a.artist === artistId), []);

  const albumFor = useCallback((track: Track) => ALBUMS.find((a) => a.id === track.albumId), []);

  // Lockscreen / OS media controls (Media Session API) — metadata follows the
  // current track; hardware actions route back into the player controls.
  useMediaSession({
    track: currentTrack,
    artwork: currentTrack ? (albumFor(currentTrack)?.artwork ?? null) : null,
    isPlaying,
    handlers: {
      play: () => {
        if (!currentTrack) return;
        engine.play();
        setIsPlaying(true);
      },
      pause: () => {
        engine.pause();
        setIsPlaying(false);
      },
      previousTrack: handlePrev,
      nextTrack: handleNext,
      seekTo,
      // Lockscreen 10-second skip buttons.
      seekBackward: () => seekTo(Math.max(0, progress - 10)),
      seekForward: () => {
        if (!currentTrack) return;
        seekTo(Math.min(currentTrack.duration, progress + 10));
      },
    },
    position: { current: progress, duration: currentTrack?.duration ?? 0 },
  });

  // ─────────────────────────────────────────
  // LAYOUT STYLES (manosli+ tokens)
  // ─────────────────────────────────────────

  const css: Record<string, CSSProperties> = {
    app: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: 'hidden',
      position: 'relative',
      fontSize: 14,
    },
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: 240,
      background: theme.abyss,
      borderRight: `1px solid ${theme.border}`,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    },
    sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49, backdropFilter: 'blur(4px)' },
    main: { flex: 1, overflow: 'auto', paddingBottom: currentTrack ? 140 : 20 },
    topBar: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: `${theme.bg}ee`,
      backdropFilter: 'blur(12px)',
    },
    player: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      background: `${theme.surface}f0`,
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${theme.border}`,
    },
  };

  // ─────────────────────────────────────────
  // SHARED COMPONENTS
  // ─────────────────────────────────────────

  const TrackRow = ({
    track,
    index,
    showAlbum = true,
    playlistId = null,
    compact = false,
  }: {
    track: Track;
    index?: number | null;
    showAlbum?: boolean;
    playlistId?: string | null;
    compact?: boolean;
  }) => {
    const isActive = currentTrack?.id === track.id;
    return (
      <div
        onClick={() => playTrack(track)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: compact ? '8px 0' : '10px 12px',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: isActive ? `${theme.accent}15` : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = theme.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isActive ? `${theme.accent}15` : 'transparent';
        }}
      >
        <span style={{ width: 24, textAlign: 'center', color: isActive ? theme.accent : theme.textSecondary, fontSize: 13, flexShrink: 0 }}>
          {isActive && isPlaying ? <Waveform isPlaying bars={4} color={theme.accent} /> : index != null ? index + 1 : '·'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: isActive ? theme.accent : theme.text,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.title}
          </div>
          <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (track.artistId !== 'uploads') routeNavigate(`/artist/${track.artistId}`);
                else navigateTo('artist', { artist: ARTISTS.find((a) => a.id === track.artistId) });
              }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textSecondary;
              }}
            >
              {track.artist}
            </span>
            {showAlbum && (
              <>
                {' · '}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('album', { album: ALBUMS.find((a) => a.id === track.albumId) });
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  {track.album}
                </span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {track.artistId === 'uploads' && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: `${theme.green}20`,
                color: theme.green,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Upload
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: likedTracks.has(track.id) ? theme.pink : theme.textSecondary,
              padding: 4,
              display: 'flex',
            }}
          >
            <Icon name={likedTracks.has(track.id) ? 'heartFill' : 'heart'} size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ track, playlistId, x: e.clientX, y: e.clientY });
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: 4, display: 'flex' }}
          >
            <Icon name="more" size={16} />
          </button>
          <span style={{ color: theme.textSecondary, fontSize: 12, width: 36, textAlign: 'right' }}>{fmt(track.duration)}</span>
        </div>
      </div>
    );
  };

  const AlbumCard = ({ album }: { album: Album }) => (
    <div onClick={() => navigateTo('album', { album })} style={{ cursor: 'pointer', width: '100%', flexShrink: 0 }} className="album-card">
      <Cover
        color={album.color}
        artwork={album.artwork}
        emoji={album.cover}
        alt={album.title}
        style={{ aspectRatio: '1', borderRadius: 10, fontSize: 40, marginBottom: 8, transition: 'transform 0.2s' }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            boxShadow: '0 4px 12px rgba(124,92,255,0.4)',
          }}
          className="album-play-btn"
        >
          <Icon name="play" size={16} />
        </div>
      </Cover>
      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</div>
      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{album.artistName}</div>
    </div>
  );

  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <div onClick={() => navigateTo('artist', { artist })} style={{ cursor: 'pointer', textAlign: 'center', flexShrink: 0 }}>
      <div
        style={{ transition: 'transform 0.2s', marginBottom: 8 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Avatar name={artist.name} color={artist.color} artwork={artist.artwork} emoji={artist.image} style={{ width: '100%', aspectRatio: '1', fontSize: 32 }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{artist.name}</div>
      <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{artist.genre}</div>
    </div>
  );

  // ─────────────────────────────────────────
  // CONTEXT MENU
  // ─────────────────────────────────────────

  const ContextMenuEl = () => {
    if (!contextMenu) return null;
    const { track, playlistId } = contextMenu;
    const items: { label: string; action: () => void; danger?: boolean }[] = [
      { label: 'Add to Queue', action: () => { addToQueue(track.id); setContextMenu(null); } },
      { label: 'Add to Playlist', action: () => { setAddToPlaylistTrack(track.id); setContextMenu(null); } },
      { label: likedTracks.has(track.id) ? 'Unlike' : 'Like', action: () => { toggleLike(track.id); setContextMenu(null); } },
      { label: 'Go to Artist', action: () => { navigateTo('artist', { artist: ARTISTS.find((a) => a.id === track.artistId) }); setContextMenu(null); } },
      { label: 'Go to Album', action: () => { navigateTo('album', { album: ALBUMS.find((a) => a.id === track.albumId) }); setContextMenu(null); } },
    ];
    if (playlistId) {
      items.push({ label: 'Remove from Playlist', action: () => { removeFromPlaylist(playlistId, track.id); setContextMenu(null); }, danger: true });
    }
    const album = albumFor(track);
    return (
      <>
        <div onClick={() => setContextMenu(null)} style={css.sidebarOverlay} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            background: theme.surface,
            borderTop: `1px solid ${theme.border}`,
            borderRadius: '16px 16px 0 0',
            padding: '8px 0 24px',
            animation: 'slideUp 0.2s ease',
          }}
        >
          <div style={{ width: 36, height: 4, background: theme.surfaceActive, borderRadius: 2, margin: '4px auto 12px' }} />
          <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Cover
              color={album?.color || theme.accent}
              artwork={album?.artwork}
              emoji={album?.cover || '🎵'}
              alt={track.album}
              style={{ width: 44, height: 44, borderRadius: 6, fontSize: 22, flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{track.title}</div>
              <div style={{ color: theme.textSecondary, fontSize: 12 }}>{track.artist}</div>
            </div>
          </div>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                color: item.danger ? theme.pink : theme.text,
                fontSize: 15,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────
  // ADD TO PLAYLIST MODAL
  // ─────────────────────────────────────────

  const AddToPlaylistModal = () => {
    if (!addToPlaylistTrack) return null;
    return (
      <>
        <div onClick={() => setAddToPlaylistTrack(null)} style={css.sidebarOverlay} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            background: theme.surface,
            borderTop: `1px solid ${theme.border}`,
            borderRadius: '16px 16px 0 0',
            padding: '8px 0 24px',
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          <div style={{ width: 36, height: 4, background: theme.surfaceActive, borderRadius: 2, margin: '4px auto 12px' }} />
          <div style={{ padding: '0 16px 12px', fontSize: 16, fontWeight: 700 }}>Add to Playlist</div>
          <button
            onClick={() => {
              setShowNewPlaylist(true);
              setAddToPlaylistTrack(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              color: theme.accent,
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Icon name="plus" size={18} /> New Playlist
          </button>
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => addTrackToPlaylist(p.id, addToPlaylistTrack)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                color: theme.text,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <span style={{ fontSize: 20 }}>{p.cover}</span> {p.name}
              <span style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 'auto' }}>{p.tracks.length} tracks</span>
            </button>
          ))}
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────
  // NEW PLAYLIST MODAL
  // ─────────────────────────────────────────

  const NewPlaylistModal = () => {
    if (!showNewPlaylist) return null;
    return (
      <>
        <div onClick={() => setShowNewPlaylist(false)} style={css.sidebarOverlay} />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 24,
            width: 'calc(100% - 48px)',
            maxWidth: 340,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>New Playlist</div>
          <input
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.surfaceHover,
              color: theme.text,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowNewPlaylist(false)}
              style={{ padding: '10px 20px', borderRadius: 10, background: theme.surfaceHover, border: 'none', color: theme.text, cursor: 'pointer', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={createPlaylist}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: theme.accent,
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                opacity: newPlaylistName.trim() ? 1 : 0.4,
              }}
            >
              Create
            </button>
          </div>
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────
  // UPLOAD MODAL — pick a local audio file, name it, play it.
  // ─────────────────────────────────────────

  const UploadModal = () => {
    if (!showUpload) return null;
    const inputStyle: CSSProperties = {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: theme.surfaceHover,
      color: theme.text,
      fontSize: 15,
      outline: 'none',
      boxSizing: 'border-box',
    };
    return (
      <>
        <div onClick={() => { setShowUpload(false); resetUploadForm(); }} style={css.sidebarOverlay} />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 24,
            width: 'calc(100% - 48px)',
            maxWidth: 380,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Upload a track</div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16 }}>
            Stored on this device (IndexedDB) · max 20 MB per file
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '18px 14px',
              marginBottom: 14,
              borderRadius: 10,
              border: `1px dashed ${theme.border}`,
              background: theme.surfaceHover,
              color: uploadFile ? theme.text : theme.textSecondary,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <Icon name="upload" size={18} />
            {uploadFile ? `${uploadFile.name} (${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Choose an audio file'}
            <input
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Title"
              style={inputStyle}
            />
            <input
              value={uploadArtist}
              onChange={(e) => setUploadArtist(e.target.value)}
              placeholder="Artist (defaults to “You”)"
              style={inputStyle}
            />
          </div>
          {uploadError && (
            <div style={{ marginTop: 12, fontSize: 12, color: theme.pink }}>{uploadError}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowUpload(false); resetUploadForm(); }}
              style={{ padding: '10px 20px', borderRadius: 10, background: theme.surfaceHover, border: 'none', color: theme.text, cursor: 'pointer', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleUploadSubmit()}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: theme.accent,
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                opacity: uploadFile && uploadTitle.trim() && !uploadBusy ? 1 : 0.4,
              }}
            >
              {uploadBusy ? 'Saving…' : 'Add to Your Uploads'}
            </button>
          </div>
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────
  // MUSIC LICENSES MODAL — attribution ledger for public/audio (CC-BY).
  // ─────────────────────────────────────────

  const LicensesModal = () => {
    const [entries, setEntries] = useState<
      { file: string; title: string; artist: string; sourceUrl: string; license: string; licenseUrl: string }[] | null
    >(null);
    useEffect(() => {
      if (!showLicenses || entries !== null) return;
      fetch('/audio/ledger.json')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setEntries(Array.isArray(data) ? data : []))
        .catch(() => setEntries([]));
    }, [entries]);
    if (!showLicenses) return null;
    return (
      <>
        <div onClick={() => setShowLicenses(false)} style={css.sidebarOverlay} />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 24,
            width: 'calc(100% - 48px)',
            maxWidth: 420,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Music licenses</div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16 }}>
            All catalog audio is Creative Commons — full ledger in <code>/audio/ledger.json</code>.
          </div>
          {entries === null ? (
            <div style={{ color: theme.textSecondary, fontSize: 13 }}>Loading…</div>
          ) : (
            entries.map((e) => (
              <div key={e.file} style={{ padding: '10px 0', borderTop: `1px solid ${theme.border}`, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {e.artist} ·{' '}
                  <a href={e.licenseUrl} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>
                    {e.license}
                  </a>
                </div>
                <a
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: theme.dim, fontSize: 11, wordBreak: 'break-all' }}
                >
                  {e.sourceUrl}
                </a>
              </div>
            ))
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setShowLicenses(false)}
              style={{ padding: '10px 20px', borderRadius: 10, background: theme.surfaceHover, border: 'none', color: theme.text, cursor: 'pointer', fontSize: 14 }}
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────
  // SIDEBAR
  // ─────────────────────────────────────────

  const Sidebar = () => (
    <>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={css.sidebarOverlay} />}
      <div style={{ ...css.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              m
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em' }}>
              manosli<span style={{ color: theme.accent }}>+</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <nav style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'home' as Page, icon: 'home', label: 'Home' },
            { id: 'search' as Page, icon: 'search', label: 'Search' },
            { id: 'library' as Page, icon: 'library', label: 'Your Library' },
            { id: 'stats' as Page, icon: 'trending', label: 'Your Sound' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                padding: '12px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: page === item.id ? 600 : 400,
                background: page === item.id ? theme.surfaceHover : 'transparent',
                color: page === item.id ? theme.text : theme.textSecondary,
                transition: 'all 0.15s',
              }}
            >
              <Icon name={item.icon} size={20} /> {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setShowUpload(true);
              setSidebarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '12px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 400,
              background: 'transparent',
              color: theme.textSecondary,
              transition: 'all 0.15s',
            }}
          >
            <Icon name="upload" size={20} /> Upload
          </button>
          <div
            style={{
              margin: '16px 12px 8px',
              fontSize: 11,
              fontWeight: 600,
              color: theme.textSecondary,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Your Playlists
          </div>
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => navigateTo('playlist', { playlist: p })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                background: selectedPlaylist?.id === p.id && page === 'playlist' ? theme.surfaceHover : 'transparent',
                color: selectedPlaylist?.id === p.id && page === 'playlist' ? theme.text : theme.textSecondary,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 16 }}>{p.cover}</span> {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewPlaylist(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              background: 'transparent',
              color: theme.accent,
            }}
          >
            <Icon name="plus" size={16} /> New Playlist
          </button>
        </nav>
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${theme.border}` }}>
          {/* PWA install CTA — native prompt when available, iOS hint otherwise. */}
          {!installDismissed && installState === 'available' && (
            <div
              style={{
                marginBottom: 12,
                padding: '12px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${theme.accent}30, ${theme.pink}18)`,
                border: `1px solid ${theme.accent}40`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Install manosli<span style={{ color: theme.accent }}>+</span>
                </div>
                <button
                  onClick={() => {
                    dismissInstallCta();
                    setInstallDismissed(true);
                  }}
                  aria-label="Dismiss install prompt"
                  style={{ background: 'none', border: 'none', color: theme.dim, cursor: 'pointer', padding: 2, display: 'flex' }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: theme.textSecondary, margin: '4px 0 10px', lineHeight: 1.4 }}>
                Offline playback, one tap from your home screen.
              </div>
              <button
                onClick={() => {
                  void promptInstall().then(() => setInstallState(getInstallState()));
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: theme.accent,
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Install app
              </button>
            </div>
          )}
          {!installDismissed && installState !== 'installed' && installState !== 'available' && isIOSSafari() && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                fontSize: 11,
                color: theme.textSecondary,
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  Install manosli<span style={{ color: theme.accent }}>+</span>: tap <strong>Share</strong> →{' '}
                  <strong>Add to Home Screen</strong>
                </span>
                <button
                  onClick={() => {
                    dismissInstallCta();
                    setInstallDismissed(true);
                  }}
                  aria-label="Dismiss install hint"
                  style={{ background: 'none', border: 'none', color: theme.dim, cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>
          )}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 12,
            }}
          >
            ← manosli<span style={{ color: theme.accent }}>+</span>
          </Link>
          <button
            onClick={() => {
              setShowLicenses(true);
              setSidebarOpen(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: 0,
              marginBottom: 12,
              color: theme.dim,
              fontSize: 11,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Music licenses
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="user" size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: theme.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: theme.surfaceHover,
                  border: `1px solid ${theme.border}`,
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                borderRadius: 10,
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="user" size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sign in to sync</div>
                <div style={{ fontSize: 11, color: theme.dim }}>Keep your library everywhere</div>
              </div>
            </button>
          )}
          <div style={{ fontSize: 10, color: theme.dim, marginTop: 12, lineHeight: 1.4 }}>
            Music: Kevin MacLeod (incompetech.com)
            <br />
            Licensed under CC-BY 4.0
          </div>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────
  // TOP BAR
  // ─────────────────────────────────────────

  const TopBar = () => (
    <div style={css.topBar}>
      {pageStack.length > 0 ? (
        <button onClick={goBack} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon name="back" size={22} />
        </button>
      ) : (
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon name="menu" size={22} />
        </button>
      )}
      {page === 'search' ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Songs, artists, albums..."
            autoFocus
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: 10,
              background: theme.surfaceHover,
              border: `1px solid ${searchFocused ? theme.accent : 'transparent'}`,
              color: theme.text,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }}>
            <Icon name="search" size={16} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {page === 'home' && (
                <>
                  manosli<span style={{ color: theme.accent }}>+</span>
                </>
              )}
              {page === 'library' && 'Your Library'}
              {page === 'stats' && 'Your Sound'}
              {page === 'album' && selectedAlbum?.title}
              {page === 'artist' && selectedArtist?.name}
              {page === 'playlist' && selectedPlaylist?.name}
              {page === 'genre' && selectedGenre?.name}
            </span>
          </div>
          <button
            onClick={() => navTo('search')}
            style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="search" size={20} />
          </button>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────
  // PAGES
  // ─────────────────────────────────────────

  // HOME PAGE
  const HomePage = () => {
    const recentTracks = recentlyPlayed.map((id) => allTracks.find((t) => t.id === id)).filter((t): t is Track => Boolean(t)).slice(0, 6);
    const topCharts = [...allTracks].sort((a, b) => parseFloat(b.plays) - parseFloat(a.plays)).slice(0, 10);
    const newReleases = ALBUMS.filter((a) => a.year === 2026);
    const greetHour = new Date().getHours();
    const greeting = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <div style={{ paddingBottom: 20 }}>
        {/* Hero */}
        <div
          style={{
            margin: '0 16px 24px',
            borderRadius: 16,
            padding: '28px 20px',
            background: `linear-gradient(135deg, ${theme.accent}30, ${theme.pink}15, ${theme.bg})`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 80, opacity: 0.08, transform: 'rotate(15deg)' }}>♪</div>
          <div style={{ fontSize: 13, color: theme.accent, fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>{greeting}</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            What do you want
            <br />
            to listen to?
          </div>
          <button
            onClick={() => navTo('search')}
            style={{
              marginTop: 14,
              padding: '10px 20px',
              borderRadius: 24,
              background: theme.accent,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="search" size={14} /> Browse music
          </button>
        </div>

        {/* Quick play — recently played as compact grid */}
        {recentTracks.length > 0 && (
          <>
            <SectionHead title="Jump back in" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px', marginBottom: 28 }}>
              {recentTracks.map((track) => {
                const album = albumFor(track);
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 0,
                      borderRadius: 6,
                      background: theme.surface,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.surface;
                    }}
                  >
                    <Cover
                      color={album?.color || theme.accent}
                      artwork={album?.artwork}
                      emoji={album?.cover || '🎵'}
                      alt={track.album}
                      style={{ width: 44, height: 44, flexShrink: 0, fontSize: 18, borderRadius: 0 }}
                    />
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 10 }}>
                      {track.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* New Releases */}
        <SectionHead title="New Releases" action="See all" />
        <ScrollRow>
          {newReleases.map((album) => (
            <div key={album.id} style={{ width: 140, flexShrink: 0 }}>
              <AlbumCard album={album} />
            </div>
          ))}
        </ScrollRow>
        <div style={{ height: 28 }} />

        {/* Top Charts */}
        <SectionHead title="Top Charts" />
        <div style={{ padding: '0 16px' }}>
          {topCharts.slice(0, 5).map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} />
          ))}
        </div>
        <div style={{ height: 28 }} />

        {/* Featured Artists */}
        <SectionHead title="Featured Artists" />
        <ScrollRow>
          {ARTISTS.slice(0, 6).map((artist) => (
            <div key={artist.id} style={{ width: 100, flexShrink: 0 }}>
              <ArtistCard artist={artist} />
            </div>
          ))}
        </ScrollRow>
        <div style={{ height: 28 }} />

        {/* Browse Genres */}
        <SectionHead title="Browse Genres" action="See all" onAction={() => navTo('search')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
          {GENRES.slice(0, 6).map((genre) => (
            <div
              key={genre.id}
              onClick={() => navigateTo('genre', { genre })}
              style={{
                padding: '16px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${genre.color}35, ${genre.color}10)`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>{genre.name}</div>
              <div style={{ position: 'absolute', bottom: -6, right: 4, fontSize: 28, opacity: 0.3, transform: 'rotate(-10deg)' }}>{genre.icon}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 28 }} />

        {/* Made For You — Playlists */}
        <SectionHead title="Made for you" />
        <ScrollRow>
          {playlists.map((p) => (
            <div key={p.id} onClick={() => navigateTo('playlist', { playlist: p })} style={{ width: 140, flexShrink: 0, cursor: 'pointer' }}>
              <div
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${p.color}40, ${p.color}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  marginBottom: 8,
                }}
              >
                {p.cover}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{p.tracks.length} tracks</div>
            </div>
          ))}
        </ScrollRow>
        <div style={{ height: 28 }} />

        {/* All Albums */}
        <SectionHead title="Albums" />
        <GridRow>{ALBUMS.slice(0, 6).map((album) => <AlbumCard key={album.id} album={album} />)}</GridRow>
      </div>
    );
  };

  // SEARCH PAGE
  const SearchPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    return (
      <div style={{ paddingBottom: 20 }}>
        {searchResults ? (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px 16px', overflowX: 'auto' }}>
              {['all', 'tracks', 'albums', 'artists'].map((f) => (
                <Pill key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Pill>
              ))}
            </div>
            {(activeFilter === 'all' || activeFilter === 'artists') && searchResults.artists.length > 0 && (
              <>
                <SectionHead title="Artists" />
                <div style={{ padding: '0 16px', marginBottom: 20 }}>
                  {searchResults.artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => navigateTo('artist', { artist })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}
                    >
                      <Avatar name={artist.name} color={artist.color} artwork={artist.artwork} emoji={artist.image} style={{ width: 48, height: 48, fontSize: 22 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{artist.name}</div>
                        <div style={{ color: theme.textSecondary, fontSize: 12 }}>Artist · {artist.followers} followers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {(activeFilter === 'all' || activeFilter === 'tracks') && searchResults.tracks.length > 0 && (
              <>
                <SectionHead title="Tracks" />
                <div style={{ padding: '0 16px', marginBottom: 20 }}>
                  {searchResults.tracks.map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i} />
                  ))}
                </div>
              </>
            )}
            {(activeFilter === 'all' || activeFilter === 'albums') && searchResults.albums.length > 0 && (
              <>
                <SectionHead title="Albums" />
                <GridRow>{searchResults.albums.map((album) => <AlbumCard key={album.id} album={album} />)}</GridRow>
              </>
            )}
            {searchResults.tracks.length === 0 && searchResults.albums.length === 0 && searchResults.artists.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 4 }}>No results</div>
                <div style={{ fontSize: 13 }}>Try a different search term</div>
              </div>
            )}
          </>
        ) : (
          <>
            <SectionHead title="Browse All" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
              {GENRES.map((genre) => (
                <div
                  key={genre.id}
                  onClick={() => navigateTo('genre', { genre })}
                  style={{
                    padding: '20px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${genre.color}35, ${genre.color}10)`,
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 80,
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{genre.name}</div>
                  <div style={{ position: 'absolute', bottom: -4, right: 6, fontSize: 32, opacity: 0.25, transform: 'rotate(-10deg)' }}>{genre.icon}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // LIBRARY PAGE
  const LibraryPage = () => {
    const [libTab, setLibTab] = useState('playlists');
    const likedTracksList = allTracks.filter((t) => likedTracks.has(t.id));
    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px 20px', overflowX: 'auto' }}>
          {['playlists', 'liked', 'uploads', 'artists', 'albums'].map((t) => (
            <Pill key={t} active={libTab === t} onClick={() => setLibTab(t)}>
              {t === 'liked' ? 'Liked Songs' : t === 'uploads' ? 'Your Uploads' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Pill>
          ))}
        </div>
        {libTab === 'playlists' && (
          <div style={{ padding: '0 16px' }}>
            {/* Liked Songs card */}
            <div
              onClick={() => setLibTab('liked')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.pink})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="heartFill" size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Liked Songs</div>
                <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{likedTracks.size} songs</div>
              </div>
            </div>
            {playlists.map((p) => (
              <div
                key={p.id}
                onClick={() => navigateTo('playlist', { playlist: p })}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${p.color}40, ${p.color}15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {p.cover}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Playlist · {p.tracks.length} songs</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowNewPlaylist(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                width: '100%',
                background: 'none',
                border: 'none',
                color: theme.accent,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 6, background: theme.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={22} />
              </div>
              Create Playlist
            </button>
          </div>
        )}
        {libTab === 'liked' && (
          <div style={{ padding: '0 16px' }}>
            {likedTracksList.length > 0 ? (
              <>
                <button
                  onClick={() => {
                    likedTracksList.forEach((t) => addToQueue(t.id));
                    playTrack(likedTracksList[0]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '0 0 16px',
                    padding: '10px 24px',
                    borderRadius: 24,
                    background: theme.accent,
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="play" size={16} /> Play All
                </button>
                {likedTracksList.map((track, i) => (
                  <TrackRow key={track.id} track={track} index={i} />
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textSecondary }}>
                <Icon name="heart" size={40} />
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 12, marginBottom: 4 }}>No liked songs yet</div>
                <div style={{ fontSize: 13 }}>Tap the heart on any track to save it here</div>
              </div>
            )}
          </div>
        )}
        {libTab === 'uploads' && (
          <div style={{ padding: '0 16px' }}>
            <button
              onClick={() => setShowUpload(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: `1px solid ${theme.border}`,
                color: theme.accent,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 6, background: theme.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="upload" size={22} />
              </div>
              Upload a track
            </button>
            {uploadTracks.length > 0 ? (
              uploadTracks.map((track, i) => (
                <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TrackRow track={track} index={i} />
                  </div>
                  <button
                    onClick={() => removeUpload(track.id)}
                    title="Remove upload"
                    style={{ background: 'none', border: 'none', color: theme.dim, cursor: 'pointer', padding: 6, display: 'flex', flexShrink: 0 }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: theme.textSecondary, fontSize: 13 }}>
                Nothing uploaded yet — your files stay on this device.
              </div>
            )}
          </div>
        )}
        {libTab === 'artists' && (
          <div style={{ padding: '0 16px' }}>
            {ARTISTS.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigateTo('artist', { artist })}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}
              >
                <Avatar name={artist.name} color={artist.color} artwork={artist.artwork} emoji={artist.image} style={{ width: 48, height: 48, fontSize: 22 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{artist.name}</div>
                  <div style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {artist.genre} · {artist.followers}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {libTab === 'albums' && <GridRow>{ALBUMS.map((album) => <AlbumCard key={album.id} album={album} />)}</GridRow>}
      </div>
    );
  };

  // YOUR SOUND PAGE — listening analytics from the local play-event log.
  const YourSoundPage = () => {
    const stats = useMemo(() => computeListeningStats(playEvents, allTracks), [playEvents, allTracks]);
    const maxDayPlays = Math.max(1, ...stats.week.map((d) => d.plays));

    if (stats.playCount === 0) {
      // Empty state for brand-new users.
      return (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: theme.textSecondary }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎧</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 6 }}>Your Sound is quiet… for now</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 280, margin: '0 auto 20px' }}>
            Play a few tracks and this page fills up with your top songs, artists, genres and listening habits.
          </div>
          <button
            onClick={() => navTo('home')}
            style={{
              padding: '10px 24px',
              borderRadius: 24,
              background: theme.accent,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Start listening
          </button>
        </div>
      );
    }

    const statCard = (value: string, label: string, color: string) => (
      <div
        style={{
          flex: 1,
          padding: '16px 14px',
          borderRadius: 12,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color }}>{value}</div>
        <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{label}</div>
      </div>
    );

    return (
      <div style={{ paddingBottom: 20 }}>
        {/* Personality card */}
        <div
          style={{
            margin: '8px 16px 20px',
            borderRadius: 16,
            padding: '22px 20px',
            background: `linear-gradient(135deg, ${theme.accent}30, ${theme.pink}15, ${theme.bg})`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 72, opacity: 0.12 }}>{stats.personality.emoji}</div>
          <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 6 }}>
            YOUR LISTENING PERSONALITY
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>{stats.personality.title}</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5, maxWidth: 320 }}>
            {stats.personality.description}
          </div>
        </div>

        {/* Headline numbers */}
        <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 24 }}>
          {statCard(String(stats.playCount), 'Plays', theme.accent)}
          {statCard(stats.totalMinutes >= 60 ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` : `${stats.totalMinutes}m`, 'Minutes listened', theme.green)}
          {statCard(String(stats.topArtists.length), 'Top artists', theme.pink)}
        </div>

        {/* 7-day activity — pure CSS bars, no chart lib */}
        <SectionHead title="Last 7 days" />
        <div
          style={{
            margin: '0 16px 24px',
            padding: '16px 16px 12px',
            borderRadius: 12,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 120,
          }}
        >
          {stats.week.map((d) => (
            <div key={d.label + String(d.isToday)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div
                  title={`${d.plays} plays`}
                  style={{
                    width: '100%',
                    height: `${Math.max(d.plays > 0 ? 8 : 3, (d.plays / maxDayPlays) * 100)}%`,
                    borderRadius: 4,
                    background: d.isToday ? theme.accent : `${theme.accent}55`,
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: d.isToday ? theme.text : theme.dim, fontWeight: d.isToday ? 700 : 400 }}>{d.label}</div>
            </div>
          ))}
        </div>

        {/* Top genres */}
        <SectionHead title="Top genres" />
        <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 24, flexWrap: 'wrap' }}>
          {stats.topGenres.map((g) => (
            <div
              key={g.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${g.color}30, ${g.color}10)`,
                border: `1px solid ${g.color}35`,
              }}
            >
              <span style={{ fontSize: 18 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: theme.textSecondary }}>{g.plays} plays</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top tracks */}
        <SectionHead title="Top tracks" />
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          {stats.topTracks.map((entry, i) => (
            <div key={entry.track.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TrackRow track={entry.track} index={i} />
              </div>
              <span style={{ fontSize: 11, color: theme.dim, flexShrink: 0, width: 48, textAlign: 'right' }}>{entry.plays} plays</span>
            </div>
          ))}
        </div>

        {/* Top artists */}
        <SectionHead title="Top artists" />
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          {stats.topArtists.map((entry, i) => (
            <div
              key={entry.name}
              onClick={() => entry.artist && navigateTo('artist', { artist: entry.artist })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                cursor: entry.artist ? 'pointer' : 'default',
                borderBottom: i < stats.topArtists.length - 1 ? `1px solid ${theme.border}` : 'none',
              }}
            >
              <span style={{ width: 20, textAlign: 'center', color: theme.dim, fontSize: 13 }}>{i + 1}</span>
              <Avatar
                name={entry.name}
                color={entry.artist?.color ?? theme.green}
                artwork={entry.artist?.artwork}
                emoji={entry.artist?.image ?? '📤'}
                style={{ width: 44, height: 44, fontSize: 20 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.name}</div>
                <div style={{ fontSize: 12, color: theme.textSecondary }}>
                  {entry.artist ? entry.artist.genre : 'Your uploads'} · {entry.plays} plays
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative waveform footer in the player's visual language */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', opacity: 0.6 }}>
          <Waveform isPlaying={isPlaying} bars={24} color={theme.accent} />
        </div>
      </div>
    );
  };

  // ALBUM PAGE
  const AlbumPage = () => {
    if (!selectedAlbum) return null;
    const tracks = getAlbumTracks(selectedAlbum.id);
    const artist = ARTISTS.find((a) => a.id === selectedAlbum.artist);
    const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);
    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 28px', textAlign: 'center' }}>
          <Cover
            color={selectedAlbum.color}
            artwork={selectedAlbum.artwork}
            emoji={selectedAlbum.cover}
            alt={selectedAlbum.title}
            style={{ width: 180, height: 180, borderRadius: 12, fontSize: 72, marginBottom: 16, boxShadow: `0 12px 40px ${selectedAlbum.color}30` }}
          />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>{selectedAlbum.title}</div>
          <div
            onClick={() => artist && navigateTo('artist', { artist })}
            style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4, cursor: artist ? 'pointer' : 'default' }}
            onMouseEnter={(e) => {
              if (artist) e.currentTarget.style.color = theme.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            {selectedAlbum.artistName} · {selectedAlbum.year}
          </div>
          <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            {tracks.length} songs · {Math.floor(totalDuration / 60)} min
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => {
                playTrack(tracks[0]);
                setQueue(tracks.slice(1).map((t) => t.id));
              }}
              style={{
                padding: '10px 28px',
                borderRadius: 24,
                background: theme.accent,
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="play" size={16} /> Play
            </button>
            <button
              onClick={() => {
                const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                playTrack(shuffled[0]);
                setQueue(shuffled.slice(1).map((t) => t.id));
                setShuffleOn(true);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 24,
                background: theme.surfaceHover,
                border: 'none',
                color: theme.text,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="shuffle" size={16} /> Shuffle
            </button>
          </div>
        </div>
        <div style={{ padding: '0 16px' }}>
          {tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} showAlbum={false} />
          ))}
        </div>
      </div>
    );
  };

  // ARTIST PAGE
  const ArtistPage = () => {
    if (!selectedArtist) return null;
    const tracks = getArtistTracks(selectedArtist.id);
    const albums = getArtistAlbums(selectedArtist.id);
    const topTracks = [...tracks].sort((a, b) => parseFloat(b.plays) - parseFloat(a.plays)).slice(0, 5);
    return (
      <div style={{ paddingBottom: 20 }}>
        {/* Hero */}
        <div style={{ padding: '30px 16px 28px', textAlign: 'center', background: `linear-gradient(180deg, ${selectedArtist.color}20, transparent)` }}>
          <Avatar
            name={selectedArtist.name}
            color={selectedArtist.color}
            artwork={selectedArtist.artwork}
            emoji={selectedArtist.image}
            style={{ width: 120, height: 120, margin: '0 auto 16px', fontSize: 48, boxShadow: `0 8px 32px ${selectedArtist.color}30` }}
          />
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{selectedArtist.name}</div>
          <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
            {selectedArtist.followers} followers · {selectedArtist.genre}
          </div>
          <p style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 1.5, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            {selectedArtist.bio}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={() => {
                playTrack(topTracks[0]);
                setQueue(topTracks.slice(1).map((t) => t.id));
              }}
              style={{
                padding: '10px 28px',
                borderRadius: 24,
                background: selectedArtist.color,
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="play" size={16} /> Play
            </button>
            <button
              style={{
                padding: '10px 20px',
                borderRadius: 24,
                background: 'transparent',
                border: `1px solid ${theme.textSecondary}`,
                color: theme.text,
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Follow
            </button>
          </div>
          <Link
            to={`/artist/${selectedArtist.id}`}
            style={{ display: 'inline-block', marginTop: 14, color: theme.textSecondary, fontSize: 12, textDecoration: 'none' }}
          >
            View public profile ↗
          </Link>
        </div>
        {/* Popular */}
        <SectionHead title="Popular" />
        <div style={{ padding: '0 16px' }}>
          {topTracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} />
          ))}
        </div>
        <div style={{ height: 24 }} />
        {/* Discography */}
        <SectionHead title="Discography" />
        <ScrollRow>
          {albums.map((album) => (
            <div key={album.id} style={{ width: 140, flexShrink: 0 }}>
              <AlbumCard album={album} />
            </div>
          ))}
        </ScrollRow>
      </div>
    );
  };

  // PLAYLIST PAGE
  const PlaylistPage = () => {
    if (!selectedPlaylist) return null;
    const pl = playlists.find((p) => p.id === selectedPlaylist.id) || selectedPlaylist;
    const tracks = pl.tracks.map((id) => allTracks.find((t) => t.id === id)).filter((t): t is Track => Boolean(t));
    const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);
    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 28px', textAlign: 'center' }}>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${pl.color}40, ${pl.color}15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              marginBottom: 16,
              boxShadow: `0 12px 40px ${pl.color}25`,
            }}
          >
            {pl.cover}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>{pl.name}</div>
          {pl.description && <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>{pl.description}</div>}
          <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            {tracks.length} songs · {Math.floor(totalDuration / 60)} min
          </div>
          {tracks.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => {
                  playTrack(tracks[0]);
                  setQueue(tracks.slice(1).map((t) => t.id));
                }}
                style={{
                  padding: '10px 28px',
                  borderRadius: 24,
                  background: theme.accent,
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name="play" size={16} /> Play
              </button>
              <button
                onClick={() => {
                  const s = [...tracks].sort(() => Math.random() - 0.5);
                  playTrack(s[0]);
                  setQueue(s.slice(1).map((t) => t.id));
                  setShuffleOn(true);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 24,
                  background: theme.surfaceHover,
                  border: 'none',
                  color: theme.text,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name="shuffle" size={16} /> Shuffle
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px' }}>
          {tracks.length > 0 ? (
            tracks.map((track, i) => <TrackRow key={track.id} track={track} index={i} playlistId={pl.id} />)
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textSecondary }}>
              <div style={{ fontSize: 13 }}>This playlist is empty. Search for songs to add.</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // GENRE PAGE
  const GenrePage = () => {
    if (!selectedGenre) return null;
    const genreArtists = ARTISTS.filter((a) => a.genre === selectedGenre.name);
    const genreTracks = allTracks.filter((t) => genreArtists.some((a) => a.id === t.artistId));
    const genreAlbums = ALBUMS.filter((a) => genreArtists.some((ar) => ar.id === a.artist));
    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ padding: '30px 16px', textAlign: 'center', background: `linear-gradient(180deg, ${selectedGenre.color}25, transparent)` }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{selectedGenre.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{selectedGenre.name}</div>
        </div>
        {genreArtists.length > 0 && (
          <>
            <SectionHead title="Artists" />
            <ScrollRow>
              {genreArtists.map((artist) => (
                <div key={artist.id} style={{ width: 100, flexShrink: 0 }}>
                  <ArtistCard artist={artist} />
                </div>
              ))}
            </ScrollRow>
            <div style={{ height: 24 }} />
          </>
        )}
        {genreTracks.length > 0 && (
          <>
            <SectionHead title="Popular Tracks" />
            <div style={{ padding: '0 16px' }}>
              {genreTracks.slice(0, 10).map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} />
              ))}
            </div>
            <div style={{ height: 24 }} />
          </>
        )}
        {genreAlbums.length > 0 && (
          <>
            <SectionHead title="Albums" />
            <GridRow>{genreAlbums.map((album) => <AlbumCard key={album.id} album={album} />)}</GridRow>
          </>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────
  // FULL-SCREEN PLAYER
  // ─────────────────────────────────────────

  const FullPlayer = () => {
    if (!showFullPlayer || !currentTrack) return null;
    const album = albumFor(currentTrack);
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: theme.bg,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: `radial-gradient(ellipse at center top, ${album?.color || theme.accent}20, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => setShowFullPlayer(false)}
            style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="chevDown" size={24} />
          </button>
          <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Now Playing</div>
          <button
            onClick={() => setShowQueue(!showQueue)}
            style={{ background: 'none', border: 'none', color: showQueue ? theme.accent : theme.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="queue" size={20} />
          </button>
        </div>

        {showQueue ? (
          /* Queue view */
          <div style={{ flex: 1, overflow: 'auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Queue</div>
            <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Now Playing
            </div>
            <TrackRow track={currentTrack} compact />
            {queue.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, margin: '20px 0 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Next Up
                </div>
                {queue.map((id, i) => {
                  const t = allTracks.find((tr) => tr.id === id);
                  return t ? <TrackRow key={`${id}-${i}`} track={t} index={i} compact /> : null;
                })}
              </>
            )}
            {queue.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: theme.textSecondary, fontSize: 13 }}>Queue is empty</div>}
          </div>
        ) : (
          /* Album art + info */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 30px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Cover
              color={album?.color || theme.accent}
              artwork={album?.artwork}
              emoji={album?.cover || '🎵'}
              alt={currentTrack.album}
              style={{
                width: 'min(280px, 75vw)',
                aspectRatio: '1',
                borderRadius: 16,
                fontSize: 100,
                boxShadow: `0 20px 60px ${album?.color || theme.accent}30`,
                marginBottom: 32,
              }}
            />
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.title}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>{currentTrack.artist}</div>
              </div>
              <button
                onClick={() => toggleLike(currentTrack.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: likedTracks.has(currentTrack.id) ? theme.pink : theme.textSecondary,
                  padding: 8,
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <Icon name={likedTracks.has(currentTrack.id) ? 'heartFill' : 'heart'} size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
          {/* Progress — drives the real audio element */}
          <ProgressBar value={progress} max={currentTrack.duration} onChange={seekTo} height={4} color={album?.color || theme.accent} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: theme.textSecondary }}>{fmt(progress)}</span>
            <span style={{ fontSize: 11, color: theme.textSecondary }}>{fmt(currentTrack.duration)}</span>
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 8px' }}>
            <button
              onClick={() => setShuffleOn(!shuffleOn)}
              style={{ background: 'none', border: 'none', color: shuffleOn ? theme.accent : theme.textSecondary, cursor: 'pointer', padding: 8, display: 'flex' }}
            >
              <Icon name="shuffle" size={20} />
            </button>
            <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 8, display: 'flex' }}>
              <Icon name="skipBack" size={28} />
            </button>
            <button
              onClick={togglePlay}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                color: theme.bg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={26} />
            </button>
            <button onClick={handleNext} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 8, display: 'flex' }}>
              <Icon name="skipFwd" size={28} />
            </button>
            <button
              onClick={() => setRepeatMode((m) => (m + 1) % 3)}
              style={{
                background: 'none',
                border: 'none',
                color: repeatMode > 0 ? theme.accent : theme.textSecondary,
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                position: 'relative',
              }}
            >
              <Icon name="repeat" size={20} />
              {repeatMode === 2 && <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 8, fontWeight: 800, color: theme.accent }}>1</span>}
            </button>
          </div>
          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setMuted(!muted)}
              style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
            >
              <Icon name={muted || volume === 0 ? 'volumeMute' : 'volume'} size={18} />
            </button>
            <ProgressBar
              value={muted ? 0 : volume}
              max={1}
              onChange={(v) => {
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
              height={3}
              color={theme.textSecondary}
            />
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // MINI PLAYER (bottom bar)
  // ─────────────────────────────────────────

  const MiniPlayer = () => {
    if (!currentTrack) return null;
    const album = albumFor(currentTrack);
    return (
      <div style={css.player}>
        {/* Thin progress on top edge */}
        <div style={{ height: 2, background: theme.surfaceActive }}>
          <div
            style={{
              height: '100%',
              background: album?.color || theme.accent,
              width: `${currentTrack.duration > 0 ? clamp((progress / currentTrack.duration) * 100, 0, 100) : 0}%`,
              transition: 'width 0.5s linear',
            }}
          />
        </div>
        <div onClick={() => setShowFullPlayer(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 12px', cursor: 'pointer' }}>
          <Cover
            color={album?.color || theme.accent}
            artwork={album?.artwork}
            emoji={album?.cover || '🎵'}
            alt={currentTrack.album}
            style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, fontSize: 22 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
            <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>{currentTrack.artist}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: likedTracks.has(currentTrack.id) ? theme.pink : theme.textSecondary,
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
              }}
            >
              <Icon name={likedTracks.has(currentTrack.id) ? 'heartFill' : 'heart'} size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: 8, display: 'flex' }}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={22} />
            </button>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0 12px', borderTop: `1px solid ${theme.border}` }}>
          {[
            { id: 'home' as Page, icon: 'home', label: 'Home' },
            { id: 'search' as Page, icon: 'search', label: 'Search' },
            { id: 'library' as Page, icon: 'library', label: 'Library' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: page === item.id ? theme.accent : theme.textSecondary,
                padding: '6px 16px',
              }}
            >
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Tab bar when no track playing
  const TabBar = () => {
    if (currentTrack) return null;
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: `${theme.surface}f0`,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 16px',
        }}
      >
        {[
          { id: 'home' as Page, icon: 'home', label: 'Home' },
          { id: 'search' as Page, icon: 'search', label: 'Search' },
          { id: 'library' as Page, icon: 'library', label: 'Library' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => navTo(item.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: page === item.id ? theme.accent : theme.textSecondary,
              padding: '6px 16px',
            }}
          >
            <Icon name={item.icon} size={22} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  return (
    <div style={css.app}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        button:active { opacity: 0.7; }
        .album-card:hover { transform: scale(1.02); }
        .album-card:hover .album-play-btn { opacity: 1; }
        .album-card { transition: transform 0.2s; }
      `}</style>
      <Sidebar />
      <TopBar />
      <div style={css.main}>
        {page === 'home' && <HomePage />}
        {page === 'search' && <SearchPage />}
        {page === 'library' && <LibraryPage />}
        {page === 'stats' && <YourSoundPage />}
        {page === 'album' && <AlbumPage />}
        {page === 'artist' && <ArtistPage />}
        {page === 'playlist' && <PlaylistPage />}
        {page === 'genre' && <GenrePage />}
      </div>
      <MiniPlayer />
      <TabBar />
      <FullPlayer />
      <ContextMenuEl />
      <AddToPlaylistModal />
      <NewPlaylistModal />
      <UploadModal />
      <LicensesModal />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
