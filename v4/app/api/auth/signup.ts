// POST /api/auth/signup — email+password registration.
// Body: { email, password (>= 8 chars), name? } → { token, user: {id,email,name} }
import { getCollections } from '../_lib/db';
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
  newUserId,
  signToken,
  type PublicUser,
} from '../_lib/auth';
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJsonBody(req);
  if (typeof body !== 'object' || body === null) {
    return sendJson(res, 400, { error: 'invalid_body' });
  }
  const { email, password, name } = body as Record<string, unknown>;
  if (!isValidEmail(email)) return sendJson(res, 400, { error: 'invalid_email' });
  if (!isValidPassword(password)) {
    return sendJson(res, 400, { error: 'invalid_password', message: 'Password must be at least 8 characters.' });
  }

  const collections = await getCollections();
  if (!collections) {
    return sendJson(res, 503, { error: 'database_not_configured' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await collections.users.findOne({ email: normalizedEmail });
  if (existing) return sendJson(res, 409, { error: 'email_taken' });

  const user: PublicUser = {
    id: newUserId(),
    email: normalizedEmail,
    name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : normalizedEmail.split('@')[0],
  };
  await collections.users.insertOne({
    _id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  return sendJson(res, 201, { token: signToken(user), user });
}
