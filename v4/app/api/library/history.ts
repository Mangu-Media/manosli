// POST /api/library/history — append a play event for the authenticated user.
// Body: { trackId: string, playedAt?: ISO string }
// The per-user history is a capped list (most-recent-first, max 100 events).
import { getCollections } from '../_lib/db';
import { getAuth } from '../_lib/auth';
import { CAPS } from '../_lib/library';
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;

  const auth = getAuth(req);
  if (!auth) return sendJson(res, 401, { error: 'unauthorized' });

  const body = await readJsonBody(req);
  if (typeof body !== 'object' || body === null) {
    return sendJson(res, 400, { error: 'invalid_body' });
  }
  const { trackId, playedAt } = body as { trackId?: unknown; playedAt?: unknown };
  if (typeof trackId !== 'string' || trackId.length === 0 || trackId.length > 120) {
    return sendJson(res, 400, { error: 'invalid_track_id' });
  }
  const playedAtIso =
    typeof playedAt === 'string' && !Number.isNaN(Date.parse(playedAt))
      ? new Date(playedAt).toISOString()
      : new Date().toISOString();

  const collections = await getCollections();
  if (!collections) return sendJson(res, 503, { error: 'database_not_configured' });

  // Append to the front, drop any older duplicate of the same track, cap.
  await collections.history.updateOne(
    { _id: auth.sub },
    [
      {
        $set: {
          events: {
            $slice: [
              {
                $concatArrays: [
                  [{ trackId, playedAt: playedAtIso }],
                  {
                    $filter: {
                      input: { $ifNull: ['$events', []] },
                      as: 'e',
                      cond: { $ne: ['$$e.trackId', trackId] },
                    },
                  },
                ],
              },
              CAPS.historyEvents,
            ],
          },
          updatedAt: new Date().toISOString(),
        },
      },
    ],
    { upsert: true },
  );
  return sendJson(res, 200, { ok: true });
}
