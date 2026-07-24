// ─────────────────────────────────────────────
// PWA INSTALL PROMPT
// ─────────────────────────────────────────────
// Captures the browser's `beforeinstallprompt` event exactly once at module
// scope so the deferred event survives React re-renders, and exposes a tiny
// subscription API. The UI (PlayerApp) shows a branded CTA while a native
// prompt is available, or an iOS Safari hint where the API does not exist.

/** Minimal shape of the non-standard BeforeInstallPromptEvent. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  | 'unavailable' // no prompt captured (yet)
  | 'available' // deferred prompt ready to invoke
  | 'installed'; // appinstalled fired — hide everything

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallState = 'unavailable';
let initialized = false;

const CHANGE_EVENT = 'manosli-install-change';

const setState = (next: InstallState) => {
  if (state === next) return;
  state = next;
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/**
 * Idempotent — call once at app startup. Listens for `beforeinstallprompt`
 * (preventing the default mini-infobar) and `appinstalled`.
 */
export function initInstallPromptCapture(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // suppress the browser mini-infobar; we show our own CTA
    deferredPrompt = e as BeforeInstallPromptEvent;
    setState('available');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    setState('installed');
  });
}

export function getInstallState(): InstallState {
  return state;
}

/** Subscribe to state changes; returns an unsubscribe function. */
export function onInstallStateChange(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Invoke the captured native prompt. Returns true when the user accepted.
 * Either way the deferred event is single-use, so the CTA hides afterwards.
 */
export async function promptInstall(): Promise<boolean> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return false;
  deferredPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setState('installed');
      return true;
    }
  } catch {
    // prompt rejected (e.g. called twice) — treat as dismissed
  }
  setState('unavailable');
  return false;
}

/** iOS Safari has no beforeinstallprompt — needs the manual Share flow. */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

// Dismissal persistence — a dismissed CTA stays hidden across sessions.
const DISMISS_KEY = 'manosli.install.dismissed';

export function isInstallDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissInstallCta(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // storage unavailable — dismissal just won't persist
  }
}
