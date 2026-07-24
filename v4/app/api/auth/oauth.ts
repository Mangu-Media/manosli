// POST /api/auth/oauth — Google / Apple sign-in scaffold.
//
// Body: { provider: "google" | "apple", token: string }
//   · When the provider is NOT configured (env missing), responds
//     501 { error: "not_configured", provider } — the frontend renders this
//     as a graceful "coming soon" fallback.
//   · When configured, the provider token must be verified:
//       - Google: verify the ID token via https://oauth2.googleapis.com/tokeninfo?id_token=…
//         and check `aud` === GOOGLE_CLIENT_ID, then upsert the user by email.
//       - Apple: verify the identity token (JWS) against Apple's JWKS at
//         https://appleid.apple.com/auth/keys with audience APPLE_CLIENT_ID.
//     The verified email should then be upserted into `users` and a manosli
//     JWT returned exactly like /api/auth/login does. Verification is
//     intentionally stubbed (501 { error: "not_implemented" }) until a JWKS
//     verifier is wired in — never trust unverified provider tokens.
import { allowMethods, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

type Provider = 'google' | 'apple';

const PROVIDER_ENV: Record<Provider, string> = {
  google: 'GOOGLE_CLIENT_ID',
  apple: 'APPLE_CLIENT_ID',
};

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJsonBody(req);
  if (typeof body !== 'object' || body === null) {
    return sendJson(res, 400, { error: 'invalid_body' });
  }
  const { provider, token } = body as { provider?: unknown; token?: unknown };
  if (provider !== 'google' && provider !== 'apple') {
    return sendJson(res, 400, { error: 'unsupported_provider' });
  }
  if (typeof token !== 'string' || token.length === 0) {
    return sendJson(res, 400, { error: 'missing_provider_token' });
  }

  if (!process.env[PROVIDER_ENV[provider]]) {
    return sendJson(res, 501, { error: 'not_configured', provider });
  }

  // TODO(oauth): verify the provider token as documented above, upsert the
  // user, and return { token, user }. Refuse to issue sessions until then.
  return sendJson(res, 501, { error: 'not_implemented', provider });
}
