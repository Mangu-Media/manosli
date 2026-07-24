---
name: acx-city-integrations
description: Govern, implement, review, test, and troubleshoot ACX City external integrations and deployment topology. Use for work involving Supabase authentication, Supabase Storage or S3-compatible object storage, GitHub App webhooks, Sentry monitoring, the Next.js operations dashboard on Vercel, Railway services, environment variables, CORS, API connectivity, secrets, webhook signatures, deployment configuration, or integration health checks in the ACX City repository.
---

# ACX City Integrations

Read `../mangu-web-platform/SKILL.md` and `../acx-city/SKILL.md` first. Apply this skill as the authoritative integration and deployment boundary for ACX City.

Read [integration-topology.md](references/integration-topology.md) before changing an integration, environment contract, webhook, dashboard data path, or deployment configuration.

## Operating rules

1. Preserve the backend API as the trust boundary. Browser applications and the Vercel dashboard must call the backend API; never connect them directly to Postgres, Supabase service-role APIs, or private storage credentials.
2. Keep service URLs configurable through environment variables. Never hardcode deployed Railway, Vercel, Supabase, S3, or webhook URLs in application code.
3. Keep secrets server-only. Never expose JWT secrets, Supabase service-role keys, S3 credentials, GitHub webhook secrets, Sentry credentials, or rate-limit tokens to client bundles, logs, fixtures, documentation examples, or agent output.
4. Verify every GitHub webhook with `X-Hub-Signature-256` and `GITHUB_WEBHOOK_SECRET` before parsing or dispatching the event. Reject missing or invalid signatures.
5. Treat `AUTH_MODE=supabase` and `STORAGE_BACKEND=s3` as explicit deployment choices. Do not silently fall back to legacy auth or local storage when production configuration is incomplete.
6. Keep the ops dashboard deployment rooted at `dashboard/` on Vercel. Use `NEXT_PUBLIC_API_URL` only for the public backend base URL; do not place secrets in `NEXT_PUBLIC_*` variables.
7. Keep the backend and worker on Railway and preserve their shared storage and database contracts. Update `railway.toml`, startup commands, health checks, and documentation together when topology changes.
8. Add the dashboard origin to backend CORS configuration. Use an allowlist; never use unrestricted production CORS with authenticated endpoints.
9. Initialize Sentry only when `SENTRY_DSN` is configured, disable default PII collection, and redact tokens, credentials, signed URLs, and sensitive user data from telemetry.
10. Record any provider, deployment platform, auth model, storage model, or trust-boundary change as an architecture decision before implementation.

## Integration workflow

When adding or changing an integration:

1. Inspect the current code, environment examples, deployment files, tests, and documentation before editing.
2. Identify the caller, trust boundary, authentication mechanism, endpoint, required variables, failure modes, retries, and observability.
3. Update the canonical environment contract and fail fast for missing production variables.
4. Implement the smallest change consistent with existing project patterns.
5. Add tests for success, authentication failure, invalid configuration, provider failure, and duplicate or replayed webhook delivery when applicable.
6. Update the integration health surface used by the ops dashboard without exposing secrets.
7. Verify the deployed data path remains browser or dashboard to backend API to service or database.
8. Report changed files, required environment variables, deployment actions, tests run, and unresolved operational risks.

## Required checks

Run checks relevant to the changed surface before completion:

```bash
# Backend and integration tests
cd backend
pytest -q
ruff check .

# GitHub webhook changes
pytest -q tests/test_webhook.py

# Dashboard
cd ../dashboard
npm install
npm run build

# Frontend, when API contracts or CORS change
cd ../frontend
npm ci
npm run lint
npm run build
```

Also verify:

- Production variables are documented but no secret values are committed.
- Webhook signatures are checked before event handling.
- Dashboard requests use the backend API client.
- No direct browser-to-database or browser-to-private-storage path exists.
- Health responses disclose status and provider availability, not credentials or sensitive configuration.
- Railway and Vercel configuration agree on public URLs, CORS origins, and service roles.

## Scope boundary

Do not redesign the core job queue, migrate the Vite application to Next.js, replace Railway or Vercel, change the primary database, or introduce a second auth or storage authority unless the task explicitly includes an approved architecture decision.
