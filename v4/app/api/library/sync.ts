// GET  /api/library/sync — full library state for the authenticated user:
//        { likedTrackIds, playlists, recentlyPlayed, queue }
// PUT  /api/library/sync — validate + cap + upsert the full library state.
// Both require `Authorization: Bearer <token>`.
import { getCollections } from '../_lib/db';
import { getAuth } from '../_lib/auth';
import { emptyLibraryState, sanitizeLibraryState } from '../_lib/library';
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['GET', 'PUT'])) return;

  const auth = getAuth(req);
  if (!auth) return sendJson(res, 401, { error: 'unauthorized' });

  const collections = await getCollections();
  if (!collections) return sendJson(res, 503, { error: 'database_not_configured' });

  if (req.method === 'GET') {
    const doc = await collections.library.findOne({ _id: auth.sub });
    if (!doc) return sendJson(res, 200, emptyLibraryState());
    return sendJson(res, 200, {
      likedTrackIds: doc.likedTrackIds,
      playlists: doc.playlists,
      recentlyPlayed: doc.recentlyPlayed,
      queue: doc.queue,
      updatedAt: doc.updatedAt,
    });
  }

  // PUT
  const body = await readJsonBody(req);
  const state = sanitizeLibraryState(body);
  if (!state) return sendJson(res, 400, { error: 'invalid_library_state' });

  await collections.library.updateOne(
    { _id: auth.sub },
    { $set: { ...state, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  return sendJson(res, 200, { ok: true, ...state });
}
