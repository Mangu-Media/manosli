// ─────────────────────────────────────────────
// ARTIST UPLOADS — client-side upload store
// ─────────────────────────────────────────────
// Upload metadata lives in the PlayerRepository state (`uploads`), audio
// bytes live in IndexedDB (localStorage would blow its quota on a single
// mp3). At runtime bytes are materialized as object URLs so uploaded tracks
// play through the normal <audio> engine like any catalog track.
// The server-side path (api/upload.ts) is a scaffold until storage env is
// configured; this client-side flow is the active one.

export interface UploadMeta {
  id: string; // 'u-<uuid>'
  title: string;
  artist: string;
  fileName: string;
  contentType: string;
  size: number;
  duration: number; // seconds, measured at import time (0 = unknown)
  addedAt: string; // ISO
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB per file

const DB_NAME = 'manosli.uploads.v1';
const STORE = 'audio';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexeddb_open_failed'));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = run(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('indexeddb_request_failed'));
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error('indexeddb_tx_failed'));
        };
      }),
  );
}

/** Persist audio bytes for an upload. */
export async function putUploadAudio(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id));
}

/** Fetch audio bytes for an upload; `null` when missing. */
export async function getUploadAudio(id: string): Promise<Blob | null> {
  try {
    const result = await withStore('readonly', (store) => store.get(id));
    return result instanceof Blob ? result : null;
  } catch {
    return null; // IndexedDB unavailable (private mode) — track just won't play
  }
}

/** Remove audio bytes for an upload. */
export async function deleteUploadAudio(id: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(id));
  } catch {
    // best effort
  }
}

/** Measure duration of an audio blob by loading it into a throwaway element. */
export function probeAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? Math.round(el.duration) : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

/** Defensive validation for upload metadata from persisted state. */
export const sanitizeUpload = (value: unknown): UploadMeta | null => {
  if (typeof value !== 'object' || value === null) return null;
  const u = value as Partial<UploadMeta>;
  if (typeof u.id !== 'string' || typeof u.title !== 'string' || typeof u.fileName !== 'string') {
    return null;
  }
  return {
    id: u.id,
    title: u.title,
    artist: typeof u.artist === 'string' ? u.artist : 'Unknown Artist',
    fileName: u.fileName,
    contentType: typeof u.contentType === 'string' ? u.contentType : 'audio/mpeg',
    size: typeof u.size === 'number' && Number.isFinite(u.size) ? u.size : 0,
    duration: typeof u.duration === 'number' && Number.isFinite(u.duration) ? u.duration : 0,
    addedAt: typeof u.addedAt === 'string' ? u.addedAt : new Date(0).toISOString(),
  };
};
