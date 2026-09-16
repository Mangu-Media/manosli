import { useCallback, useEffect, useRef } from 'react';
import type { Track } from './data';

// ─────────────────────────────────────────
// REAL AUDIO ENGINE
// ─────────────────────────────────────────
// Wraps a single HTMLAudioElement. Progress is derived from the element's
// `timeupdate` events; track end is signaled through the `ended` event.
// All controls (play/pause/seek/volume/mute) drive the element directly.

export interface PlayerEngineCallbacks {
  onTimeUpdate: (current: number, duration: number) => void;
  onEnded: () => void;
}

export interface PlayerEngine {
  /** Point the element at a new source, reset position, optionally autoplay. */
  loadTrack: (src: string, autoplay: boolean) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  /** Simulate spatial / binaural width with Web Audio (panner + Haas delay). */
  setSpatial: (enabled: boolean) => void;
}

export function usePlayerEngine(callbacks: PlayerEngineCallbacks): PlayerEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spatialRef = useRef<{
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
    panner: StereoPannerNode;
    delay: DelayNode;
    wet: GainNode;
    dry: GainNode;
    enabled: boolean;
  } | null>(null);
  // Always call the latest callbacks (they close over changing player state).
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      callbacksRef.current.onTimeUpdate(audio.currentTime, duration);
    };
    const handleEnded = () => callbacksRef.current.onEnded();
    const handleError = () => {
      // eslint-disable-next-line no-console
      console.warn('[player] audio error', audio.error?.message ?? 'unknown');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.removeAttribute('src');
      audioRef.current = null;
      if (spatialRef.current) {
        spatialRef.current.ctx.close().catch(() => {});
        spatialRef.current = null;
      }
    };
  }, []);

  const loadTrack = useCallback((src: string, autoplay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    const absolute = new URL(src, window.location.href).href;
    if (audio.src !== absolute) {
      audio.src = src;
      audio.load();
    }
    audio.currentTime = 0;
    if (autoplay) {
      audio.play().catch(() => {
        /* autoplay can be blocked before first user gesture — UI stays paused */
      });
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, seconds);
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = Math.min(1, Math.max(0, volume));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, []);

  const setSpatial = useCallback((enabled: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    const ensureGraph = () => {
      if (spatialRef.current) return spatialRef.current;
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const dry = ctx.createGain();
      const wet = ctx.createGain();
      const panner = ctx.createStereoPanner();
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.018;
      panner.pan.value = 0.35;
      dry.gain.value = 1;
      wet.gain.value = 0;
      source.connect(dry);
      dry.connect(ctx.destination);
      source.connect(delay);
      delay.connect(panner);
      panner.connect(wet);
      wet.connect(ctx.destination);
      const graph = { ctx, source, panner, delay, wet, dry, enabled: false };
      spatialRef.current = graph;
      return graph;
    };

    const graph = ensureGraph();
    if (!graph) return;
    if (graph.ctx.state === 'suspended') {
      graph.ctx.resume().catch(() => {});
    }
    graph.enabled = enabled;
    graph.wet.gain.setTargetAtTime(enabled ? 0.55 : 0, graph.ctx.currentTime, 0.05);
    graph.dry.gain.setTargetAtTime(enabled ? 0.75 : 1, graph.ctx.currentTime, 0.05);
    graph.panner.pan.setTargetAtTime(enabled ? 0.42 : 0, graph.ctx.currentTime, 0.08);
  }, []);

  return { loadTrack, play, pause, seek, setVolume, setMuted, setSpatial };
}

// ─────────────────────────────────────────
// MEDIA SESSION (lockscreen / OS media controls)
// ─────────────────────────────────────────

export interface MediaSessionHandlers {
  play: () => void;
  pause: () => void;
  previousTrack: () => void;
  nextTrack: () => void;
  seekTo: (seconds: number) => void;
  /** ±10s relative seeks (lockscreen 10-second skip buttons). */
  seekBackward: () => void;
  seekForward: () => void;
}

export interface MediaSessionOptions {
  track: Track | null;
  /** Artwork URL for the current track (mapped `/assets/` album image). */
  artwork?: string | null;
  isPlaying: boolean;
  /** Live playback position — keeps `setPositionState` fresh (throttled). */
  position?: { current: number; duration: number };
  handlers: MediaSessionHandlers;
}

/** Minimum interval between setPositionState calls (OS scrub bar smoothness). */
const POSITION_STATE_THROTTLE_MS = 1500;

/**
 * Wires the Web Media Session API: publishes now-playing metadata on track
 * change, mirrors playback state, and routes OS-level actions (play, pause,
 * previous, next, seekto) back into the player. No-op when unsupported.
 */
export function useMediaSession({ track, artwork, isPlaying, position, handlers }: MediaSessionOptions): void {
  const supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

  // Always invoke the latest handlers (they close over changing player state).
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Register OS-level action handlers once.
  useEffect(() => {
    if (!supported) return;
    const mediaSession = navigator.mediaSession;
    const registrations: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => handlersRef.current.play()],
      ['pause', () => handlersRef.current.pause()],
      ['previoustrack', () => handlersRef.current.previousTrack()],
      ['nexttrack', () => handlersRef.current.nextTrack()],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') handlersRef.current.seekTo(details.seekTime);
        },
      ],
      ['seekbackward', () => handlersRef.current.seekBackward()],
      ['seekforward', () => handlersRef.current.seekForward()],
    ];
    for (const [action, handler] of registrations) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported by this browser — ignore.
      }
    }
    return () => {
      for (const [action] of registrations) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [supported]);

  // Publish now-playing metadata whenever the track changes.
  useEffect(() => {
    if (!supported) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const artworkUrl = artwork ? new URL(artwork, window.location.href).href : null;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: artworkUrl
        ? [
            { src: artworkUrl, sizes: '512x512', type: 'image/png' },
            { src: artworkUrl, sizes: '256x256', type: 'image/png' },
          ]
        : [],
    });
  }, [supported, track, artwork]);

  // Keep the OS playback state in sync.
  useEffect(() => {
    if (!supported) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [supported, isPlaying]);

  // Keep the OS scrub bar in sync via setPositionState. `position` changes on
  // every timeupdate, so throttle — the lockscreen only needs ~1Hz freshness.
  const lastPositionUpdateRef = useRef(0);
  useEffect(() => {
    if (!supported || !position || !track) return;
    const now = Date.now();
    if (now - lastPositionUpdateRef.current < POSITION_STATE_THROTTLE_MS) return;
    lastPositionUpdateRef.current = now;
    const duration = Number.isFinite(position.duration) ? position.duration : 0;
    if (duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, position.current), duration),
      });
    } catch {
      // Invalid position state (e.g. Infinity) — ignore, metadata still works.
    }
  }, [supported, track, position]);
}
