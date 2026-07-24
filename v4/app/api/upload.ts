// POST /api/upload — artist-upload scaffold.
//
// Today: authenticated endpoint that validates the request envelope and
// returns `501 not_configured` until object storage is wired up. This
// documents the future real storage path:
//
//   1. Client POSTs { fileName, contentType, size, title, artist } with a
//      Bearer token (same session as /api/library/*).
//   2. Once `UPLOAD_STORAGE_URL` + `UPLOAD_STORAGE_KEY` are provisioned
//      (S3-compatible bucket / Vercel Blob), the handler will mint a
//      pre-signed PUT URL, the client uploads bytes directly to storage,
//      then confirms; a track row is then written to the catalog.
//   3. Until then the player keeps uploads client-side (IndexedDB) — see
//      src/pages/player/uploads.ts.
//
// Limits mirror the client: audio/* only, max 20 MB per file.
import { getAuth } from './_lib/auth';
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;

  const auth = getAuth(req);
  if (!auth) return sendJson(res, 401, { error: 'unauthorized' });

  const body = await readJsonBody(req);
  if (typeof body !== 'object' || body === null) {
    return sendJson(res, 400, { error: 'invalid_body' });
  }
  const { fileName, contentType, size, title, artist } = body as {
    fileName?: unknown;
    contentType?: unknown;
    size?: unknown;
    title?: unknown;
    artist?: unknown;
  };
  if (typeof fileName !== 'string' || fileName.length === 0 || fileName.length > 200) {
    return sendJson(res, 400, { error: 'invalid_file_name' });
  }
  if (typeof contentType !== 'string' || !contentType.startsWith('audio/')) {
    return sendJson(res, 400, { error: 'invalid_content_type' });
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return sendJson(res, 400, { error: 'invalid_size' });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return sendJson(res, 413, { error: 'file_too_large', maxBytes: MAX_UPLOAD_BYTES });
  }
  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return sendJson(res, 400, { error: 'invalid_title' });
  }
  if (artist !== undefined && (typeof artist !== 'string' || artist.length > 200)) {
    return sendJson(res, 400, { error: 'invalid_artist' });
  }

  const storageUrl = process.env.UPLOAD_STORAGE_URL;
  const storageKey = process.env.UPLOAD_STORAGE_KEY;
  if (!storageUrl || !storageKey) {
    // Storage not provisioned yet — the client-side IndexedDB flow remains
    // the active upload path. Documented scaffold, intentionally a 501.
    return sendJson(res, 501, {
      error: 'not_configured',
      message:
        'Upload storage is not configured on this deployment. Set UPLOAD_STORAGE_URL and UPLOAD_STORAGE_KEY to enable server-side artist uploads; until then uploads stay on the device (IndexedDB).',
    });
  }

  // Future: mint a pre-signed PUT URL against the configured bucket and
  // return it for the direct client→storage upload. Unreachable today
  // because the not_configured branch above returns first whenever the env
  // vars are absent; when they are present this still refuses until the
  // signing implementation lands.
  return sendJson(res, 501, {
    error: 'not_implemented',
    message: 'Pre-signed upload URLs are not implemented yet.',
  });
}
