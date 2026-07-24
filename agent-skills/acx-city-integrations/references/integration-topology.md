# ACX City Integration Topology

## Canonical data flow

```text
User Browser (Vite React SPA) ─┐
                               ├── HTTPS API calls ──> Railway Backend (Flask/Gunicorn)
Vercel Ops Dashboard (Next.js) ┘                           │
                                                           ├── PostgreSQL system of record
                                                           ├── Supabase JWT verification
                                                           ├── S3-compatible object storage
                                                           ├── Sentry monitoring
                                                           └── job enqueue and administration

Railway Worker ───────────────> PostgreSQL job queue + shared storage
GitHub App ── signed webhook ─> POST /api/webhooks/github
```

The backend API is the only application-facing trust boundary. The dashboard and frontend never query Postgres directly and never use privileged Supabase or S3 credentials.

## Integration contract

| Capability | Canonical configuration | Connection point | Non-negotiable rule |
|---|---|---|---|
| Authentication | `AUTH_MODE=supabase` | Backend verifies Supabase-issued JWTs | Keep verification and user provisioning server-side |
| Object storage | `STORAGE_BACKEND=s3` | Backend and worker use an S3-compatible client | Never expose access keys or private bucket operations to browsers |
| GitHub App | `GITHUB_WEBHOOK_SECRET` | `POST /api/webhooks/github` | Verify `X-Hub-Signature-256` before processing |
| Monitoring | `SENTRY_DSN` | Backend and supported deployed services | Keep PII disabled and redact secrets |
| Ops dashboard | `NEXT_PUBLIC_API_URL` | Next.js app in `dashboard/` calls backend | Never connect the dashboard directly to the database |
| Backend deployment | `railway.toml` | Railway backend service | Preserve migrations, health checks, and API role |
| Worker deployment | `railway.toml` | Railway worker service | Preserve durable queue consumption and shared storage |
| Dashboard deployment | Vercel root `dashboard/` | Vercel project | Configure backend URL and matching backend CORS origin |

## Authentication

Production uses `AUTH_MODE=supabase`.

Supported verification inputs may include:

- `SUPABASE_JWT_SECRET` for compatible symmetric JWT verification.
- `SUPABASE_JWKS_URL` for asymmetric JWT verification.
- The project URL or issuer/audience variables required by the existing verifier.

Rules:

- Validate issuer, audience, signature, expiration, and token type according to the existing auth implementation.
- Provision or map application users through the backend, not the browser.
- Return authorization failures without leaking token contents or verification internals.
- Do not use a Supabase service-role key in frontend or dashboard code.
- Do not silently accept legacy tokens when production is configured for Supabase.

## S3-compatible storage

Production uses `STORAGE_BACKEND=s3`. Supabase Storage, AWS S3, Cloudflare R2, or MinIO may satisfy the interface when configured explicitly.

Expected variables include the existing equivalents of:

- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_BUCKET`
- `STORAGE_S3_ACCESS_KEY`
- `STORAGE_S3_SECRET_KEY`
- Region, addressing-style, or signing variables required by the selected provider

Rules:

- Keep credentials in Railway or provider-managed secrets.
- Use server-generated signed access when clients need temporary downloads or uploads.
- Validate object keys and organization ownership before issuing signed access.
- Avoid public buckets unless the product requirement explicitly calls for public assets.
- Do not commit generated audio, uploads, caches, or local storage mirrors.

## GitHub App webhook

Endpoint:

```text
POST /api/webhooks/github
```

Required processing order:

1. Read the raw request body.
2. Read `X-Hub-Signature-256`.
3. Compute HMAC-SHA256 with `GITHUB_WEBHOOK_SECRET`.
4. Compare signatures using a constant-time comparison.
5. Reject invalid or missing signatures.
6. Parse JSON only after verification.
7. Dispatch only supported event types.
8. Make handlers idempotent where duplicate delivery can cause side effects.
9. Log delivery ID, event type, outcome, and request ID without logging secrets or full sensitive payloads.

The configured GitHub App URL must use the public Railway backend URL followed by `/api/webhooks/github`.

## Sentry and logging

- Activate Sentry only when `SENTRY_DSN` is present.
- Set `send_default_pii=False` or the framework-equivalent privacy control.
- Preserve structured JSON logging and request-ID correlation.
- Redact authorization headers, cookies, tokens, credentials, signed URLs, and sensitive payload fields.
- Report integration failures with provider name, operation, status category, and retry context without exposing secrets.

## Ops dashboard on Vercel

Location and deployment:

```text
dashboard/
```

Public variable:

```text
NEXT_PUBLIC_API_URL=https://<railway-backend-host>
```

Rules:

- Route all dashboard data and actions through backend endpoints.
- Reuse backend authorization and organization scoping.
- Never import backend database clients, service-role Supabase clients, or S3 credentials into the dashboard.
- Keep API response types aligned with backend contracts.
- Add the Vercel production and preview origins to the backend CORS allowlist as appropriate.
- Expose integration status, last check, latency, and sanitized errors; never expose secret values.

## Railway deployment

`railway.toml` is the canonical deployment definition for backend and worker services.

Preserve:

- Backend startup and database migration ordering.
- Worker startup role and durable queue semantics.
- Shared storage or object-storage access expected by both processes.
- `DATABASE_URL` usage and connection management.
- Health and readiness endpoints.
- Environment parity between backend and worker where both call the same provider.

A deployment change is incomplete until configuration, environment documentation, health checks, and rollback notes agree.

## Environment and URL policy

- Never hardcode Railway, Vercel, Supabase, S3, or GitHub App deployment URLs.
- Keep public URLs in clearly named environment variables.
- Keep secrets in provider secret stores, not `.env.example` values.
- Include variable names, purpose, required/optional status, and owning service in environment documentation.
- Validate required production variables at startup and return actionable configuration errors.
- Do not print secret values in validation errors.

## Integration completion checklist

- [ ] Existing topology inspected before editing.
- [ ] Environment contract updated.
- [ ] Secrets remain server-only.
- [ ] Auth and organization ownership enforced.
- [ ] Webhook signatures verified before parsing.
- [ ] Dashboard calls backend only.
- [ ] CORS allowlist includes intended Vercel origins only.
- [ ] Provider errors and retries are observable.
- [ ] Health output is sanitized.
- [ ] Tests cover invalid credentials or signatures and provider failure.
- [ ] Railway and Vercel deployment instructions are updated.
- [ ] No generated media, local databases, caches, or `.env` files are committed.
