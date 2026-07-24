import type { Playlist } from './data';
import type { PlayEvent } from './analytics';
import type { UploadMeta } from './uploads';
import { sanitizeUpload } from './uploads';
import { getToken } from './auth';

// ─────────────────────────────────────────────
// PERSISTENCE SEAM
// ─────────────────────────────────────────────
// All durable player state (likes, playlists, recently played, queue) flows
// through a `PlayerRepository`. The active implementation today is
// `LocalStorageRepository`; `ApiRepository` documents the future HTTP backend
// seam (same interface, not wired up). Components never touch localStorage
// directly — swap implementations in `createPlayerRepository` only.

/** Durable player state as exchanged with the repository. */
export interface PlayerState {
  likedTrackIds: string[];
  playlists: Playlist[];
  recentlyPlayed: string[];
  /** Optional capability — a repository may ignore it and return `undefined`. */
  queue?: string[];
  /** Artist-upload metadata; audio bytes live in IndexedDB (see uploads.ts). */
  uploads?: UploadMeta[];
  /**
   * Local play-event log powering the Your Sound analytics page.
   * Device-local by design (not merged from the server); capped at ~500.
   */
  playEvents?: PlayEvent[];
}

export interface PlayerRepository {
  /** Hydrate persisted state; `null` when nothing valid is stored yet. */
  load(): PlayerState | null;
  /** Persist state. Implementations may debounce/batch the actual write. */
  save(state: PlayerState): void;
  /** Flush any pending debounced write immediately (e.g. on `pagehide`). */
  flush(): void;
}

// ─────────────────────────────────────────────
// LOCAL STORAGE IMPLEMENTATION (active)
// ─────────────────────────────────────────────

/** Schema version — baked into the key (`manosli.player.v1`) and payload. */
export const PLAYER_STATE_VERSION = 1;

const STORAGE_KEY = `manosli.player.v${PLAYER_STATE_VERSION}`;
const SAVE_DEBOUNCE_MS = 300;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const sanitizePlaylist = (value: unknown): Playlist | null => {
  if (typeof value !== 'object' || value === null) return null;
  const p = value as Partial<Playlist>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;
  return {
    id: p.id,
    name: p.name,
    description: typeof p.description === 'string' ? p.description : '',
    cover: typeof p.cover === 'string' ? p.cover : '🎵',
    color: typeof p.color === 'string' ? p.color : '#7C5CFF',
    tracks: isStringArray(p.tracks) ? p.tracks : [],
  };
};

/** Defensive shape validation — never trust persisted payloads. */
const sanitizeState = (value: unknown): PlayerState | null => {
  if (typeof value !== 'object' || value === null) return null;
  const s = value as Partial<PlayerState> & { playlists?: unknown };
  if (!isStringArray(s.likedTrackIds)) return null;
  if (!Array.isArray(s.playlists)) return null;
  if (!isStringArray(s.recentlyPlayed)) return null;
  return {
    likedTrackIds: s.likedTrackIds,
    playlists: s.playlists.map(sanitizePlaylist).filter((p): p is Playlist => p !== null),
    recentlyPlayed: s.recentlyPlayed,
    queue: isStringArray(s.queue) ? s.queue : undefined,
    playEvents: Array.isArray(s.playEvents)
      ? s.playEvents
          .map((e: unknown) => {
            if (typeof e !== 'object' || e === null) return null;
            const p = e as Partial<PlayEvent>;
            return typeof p.trackId === 'string' && typeof p.playedAt === 'string'
              ? { trackId: p.trackId, playedAt: p.playedAt }
              : null;
          })
          .filter((e): e is PlayEvent => e !== null)
      : undefined,
    uploads: Array.isArray(s.uploads)
      ? s.uploads.map(sanitizeUpload).filter((u): u is UploadMeta => u !== null)
      : undefined,
  };
};

/**
 * Persists player state in `localStorage` under a versioned key.
 * Writes are debounced so rapid interactions (likes, queue edits) coalesce
 * into a single serialization; call `flush()` on page hide to avoid losses.
 */
export class LocalStorageRepository implements PlayerRepository {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: PlayerState | null = null;

  load(): PlayerState | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      // Corrupted JSON or an old/foreign shape falls back to `null` (defaults).
      return sanitizeState(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  save(state: PlayerState): void {
    this.pending = state;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), SAVE_DEBOUNCE_MS);
  }

  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.pending === null) return;
    const state = this.pending;
    this.pending = null;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: PLAYER_STATE_VERSION, ...state }),
      );
    } catch {
      // Storage full / unavailable (private mode) — state stays in memory.
    }
  }
}

// ─────────────────────────────────────────────
// API IMPLEMENTATION (active when signed in)
// ─────────────────────────────────────────────

const SYNC_PATH = '/api/library/sync';
const HEALTH_TIMEOUT_MS = 4000;
const REMOTE_SAVE_DEBOUNCE_MS = 1200;
/** After a remote failure, stay local-only for this long before retrying. */
const DEGRADED_COOLDOWN_MS = 30_000;

/** Union-merge local + remote state (likes/playlists union, newest history). */
const mergeStates = (local: PlayerState | null, remote: PlayerState): PlayerState => ({
  likedTrackIds: Array.from(new Set([...remote.likedTrackIds, ...(local?.likedTrackIds ?? [])])),
  playlists: [
    ...remote.playlists,
    ...(local?.playlists ?? []).filter((p) => !remote.playlists.some((r) => r.id === p.id)),
  ],
  recentlyPlayed:
    remote.recentlyPlayed.length > 0 ? remote.recentlyPlayed : (local?.recentlyPlayed ?? []),
  queue: local?.queue ?? remote.queue,
  // Uploads are device-local (bytes in IndexedDB) — never clobber them with
  // a remote state that doesn't know about them.
  uploads: local?.uploads ?? remote.uploads,
  // Play events are device-local analytics — never clobber with remote state.
  playEvents: local?.playEvents ?? remote.playEvents,
});

/**
 * `PlayerRepository` backed by the manosli+ API (`/api/library/sync`) with a
 * mandatory local mirror:
 *  - `load()` hydrates from the local mirror synchronously (instant startup),
 *    then reconciles with the server in the background. First sync after
 *    sign-in pushes local state up, pulls the merged state back, and reports
 *    it through `onRemoteState`.
 *  - `save()` always writes the local mirror and debounces a remote PUT.
 *  - Any network/auth failure degrades to local-only mode (with a cooldown)
 *    — the player keeps working fully offline.
 */
export class ApiRepository implements PlayerRepository {
  private readonly local = new LocalStorageRepository();
  private readonly getToken: () => string | null;
  /** Called when merged server state arrives (assign from the React side). */
  onRemoteState: ((state: PlayerState) => void) | null = null;

  private remoteTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRemote: PlayerState | null = null;
  private degradedUntil = 0;
  private syncStarted = false;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  private get remoteAvailable(): boolean {
    return this.getToken() !== null && Date.now() >= this.degradedUntil;
  }

  private markDegraded(): void {
    this.degradedUntil = Date.now() + DEGRADED_COOLDOWN_MS;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const token = this.getToken();
    if (!token) throw new Error('no session token');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      return await fetch(path, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  load(): PlayerState | null {
    const localState = this.local.load();
    this.startRemoteSync(localState);
    return localState;
  }

  /** First sync: pull server state, merge with the local mirror, push back. */
  private startRemoteSync(localState: PlayerState | null): void {
    if (this.syncStarted) return;
    this.syncStarted = true;
    void (async () => {
      if (!this.remoteAvailable) return;
      try {
        const res = await this.request(SYNC_PATH, { method: 'GET' });
        if (!res.ok) throw new Error(`sync GET ${res.status}`);
        const remote = sanitizeState(await res.json());
        if (!remote) throw new Error('sync GET invalid payload');
        const isRemoteEmpty =
          remote.likedTrackIds.length === 0 &&
          remote.playlists.length === 0 &&
          remote.recentlyPlayed.length === 0;
        if (isRemoteEmpty && localState) {
          // Migration: nothing on the server yet — push the local library up.
          await this.push(localState);
          return; // local is already the merged state; nothing to report
        }
        const merged = mergeStates(localState, remote);
        // Persist the merge locally + remotely, then hydrate the UI.
        this.local.save(merged);
        this.local.flush();
        await this.push(merged);
        this.onRemoteState?.(merged);
      } catch {
        // Offline / static preview / expired token — local mode it is.
        this.markDegraded();
      }
    })();
  }

  private async push(state: PlayerState): Promise<void> {
    const res = await this.request(SYNC_PATH, { method: 'PUT', body: JSON.stringify(state) });
    if (!res.ok) throw new Error(`sync PUT ${res.status}`);
  }

  save(state: PlayerState): void {
    // Local mirror is the source of continuity — always write it.
    this.local.save(state);
    this.pendingRemote = state;
    if (!this.remoteAvailable) return;
    if (this.remoteTimer !== null) clearTimeout(this.remoteTimer);
    this.remoteTimer = setTimeout(() => this.flushRemote(), REMOTE_SAVE_DEBOUNCE_MS);
  }

  private flushRemote(): void {
    if (this.remoteTimer !== null) {
      clearTimeout(this.remoteTimer);
      this.remoteTimer = null;
    }
    const state = this.pendingRemote;
    this.pendingRemote = null;
    if (!state || !this.remoteAvailable) return;
    void this.push(state).catch(() => this.markDegraded());
  }

  flush(): void {
    this.local.flush();
    const state = this.pendingRemote;
    if (state && this.remoteAvailable) {
      // Best-effort fire-and-forget; `keepalive` lets it survive pagehide.
      const token = this.getToken();
      if (token) {
        try {
          void fetch(SYNC_PATH, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(state),
            keepalive: true,
          }).catch(() => {});
        } catch {
          // keepalive unsupported — local mirror already has the state.
        }
      }
    }
    if (this.remoteTimer !== null) {
      clearTimeout(this.remoteTimer);
      this.remoteTimer = null;
    }
    this.pendingRemote = null;
  }
}

// ─────────────────────────────────────────────
// LISTENING HISTORY HOOKUP
// ─────────────────────────────────────────────

/**
 * Fire-and-forget play event → POST /api/library/history.
 * Only meaningful in API mode (signed in); local mode already records
 * `recentlyPlayed` in the repository state. Never blocks playback and
 * swallows every failure (offline, expired token, DB not configured).
 */
export function reportHistoryEvent(trackId: string): void {
  const token = getToken();
  if (!token) return; // local mode — no-op
  try {
    void fetch('/api/library/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trackId, playedAt: new Date().toISOString() }),
    }).catch(() => {});
  } catch {
    // fetch itself unavailable — ignore, playback must never break
  }
}

/**
 * The single swap point for persistence.
 * - No session token → `LocalStorageRepository` (default, fully offline).
 * - With a session token → `ApiRepository`: it health-checks the API on first
 *   load and silently degrades to the local mirror when the backend is
 *   unreachable (static preview, offline, expired token).
 */
export function createPlayerRepository(
  getToken?: (() => string | null) | null,
): PlayerRepository {
  if (getToken && getToken()) return new ApiRepository(getToken);
  return new LocalStorageRepository();
}
