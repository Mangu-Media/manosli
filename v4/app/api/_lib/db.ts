// MongoDB data layer for the manosli+ serverless API.
// The connection is cached on `globalThis` so warm invocations reuse it
// (serverless functions may share a process across requests). The driver is
// only loaded when MONGODB_URI is configured, so local dev / static preview
// without a database still boots.
import { MongoClient, type Collection, type Db } from 'mongodb';

// ── Document shapes ──────────────────────────────────────────────
export interface UserDoc {
  _id: string; // generated id (crypto.randomUUID)
  email: string; // stored lowercased, unique index
  name: string;
  passwordHash: string; // scrypt format: `scrypt$N$salt$hash` (hex)
  createdAt: string; // ISO
}

export interface PlaylistDoc {
  id: string;
  name: string;
  description: string;
  cover: string;
  color: string;
  tracks: string[];
}

/** Full library mirror, one document per user (upserted by /api/library/sync). */
export interface LibraryDoc {
  _id: string; // userId
  likedTrackIds: string[];
  playlists: PlaylistDoc[];
  recentlyPlayed: string[];
  queue: string[];
  updatedAt: string;
}

export interface HistoryEventDoc {
  trackId: string;
  playedAt: string;
}

/** Capped most-recent-first play history, one document per user. */
export interface HistoryDoc {
  _id: string; // userId
  events: HistoryEventDoc[];
  updatedAt: string;
}

export interface Collections {
  users: Collection<UserDoc>;
  library: Collection<LibraryDoc>;
  history: Collection<HistoryDoc>;
}

const DB_NAME = process.env.MONGODB_DB ?? 'manosli';

declare global {
  // eslint-disable-next-line no-var
  var __manosliMongo: { client: MongoClient; db: Db } | undefined;
}

export function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

/** Lazily connect (cached across warm invocations); null when unconfigured. */
export async function getDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!globalThis.__manosliMongo) {
    const client = new MongoClient(uri, { maxPoolSize: 5 });
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection<UserDoc>('users').createIndex({ email: 1 }, { unique: true });
    globalThis.__manosliMongo = { client, db };
  }
  return globalThis.__manosliMongo.db;
}

/** Typed collection handles; null when Mongo is not configured. */
export async function getCollections(): Promise<Collections | null> {
  const db = await getDb();
  if (!db) return null;
  return {
    users: db.collection<UserDoc>('users'),
    library: db.collection<LibraryDoc>('library'),
    history: db.collection<HistoryDoc>('history'),
  };
}
