// POST /api/auth/login — email+password login.
// Body: { email, password } → { token, user: {id,email,name} } | 401
import { getCollections } from '../_lib/db';
import { isValidEmail, signToken, verifyPassword, type PublicUser } from '../_lib/auth';
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJsonBody(req);
  if (typeof body !== 'object' || body === null) {
    return sendJson(res, 400, { error: 'invalid_body' });
  }
  const { email, password } = body as Record<string, unknown>;
  if (!isValidEmail(email) || typeof password !== 'string') {
    return sendJson(res, 400, { error: 'invalid_credentials_shape' });
  }

  const collections = await getCollections();
  if (!collections) {
    return sendJson(res, 503, { error: 'database_not_configured' });
  }

  const doc = await collections.users.findOne({ email: email.trim().toLowerCase() });
  // Uniform failure message — do not leak whether the email exists.
  if (!doc || !(await verifyPassword(password, doc.passwordHash))) {
    return sendJson(res, 401, { error: 'invalid_credentials' });
  }

  const user: PublicUser = { id: doc._id, email: doc.email, name: doc.name };
  return sendJson(res, 200, { token: signToken(user), user });
}
