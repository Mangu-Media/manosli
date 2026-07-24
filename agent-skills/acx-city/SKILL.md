---
name: acx-city
description: Build, review, test, or operate the ACX City audiobook production platform. Use when working in this repository or on its Vite frontend, Flask API, PostgreSQL job queue, worker, storage, Supabase authentication, Docker deployment, GitHub Actions CI, ops dashboard, or GitHub App webhook integration.
---

# ACX City

Read the shared `../mangu-web-platform/SKILL.md` first, then apply these
product-specific rules. This skill is the authoritative source for the
full integration topology of ACX City.

---

## Architecture overview

```
Browser (React SPA)          Vercel (Next.js)
  └── /api proxy ──────────▶  Railway: backend (Flask/Gunicorn)
                                  │  ├── PostgreSQL (system of record)
                                  │  ├── Worker process (job queue)
                                  │  ├── Storage (local / Supabase S3)
                                  │  └── POST /api/webhooks/github
                                  │              ▲
                              GitHub App ────────┘
```

---

## Services and their roles

| Service | Host | Purpose |
|---|---|---|
| React SPA (`frontend/`) | Railway | User-facing audiobook production UI |
| Flask API (`backend/app.py`) | Railway | REST API, auth, job enqueue, signed downloads |
| Worker (`backend/worker.py`) | Railway | Durable job consumer — TTS synthesis, QC, assembly |
| PostgreSQL | Railway managed | System of record — all jobs, users, orgs, usage |
| Shared Volume `/data` | Railway Volume | Audio outputs, uploads, cache (shared by API + worker) |
| Ops Dashboard (`dashboard/`) | Vercel | Internal admin — job queue, QC, health, usage |
| GitHub App | github.com | CI status, deployment badges, PR labels, webhook events |

---

## All external API connections

### Authentication — `AUTH_MODE` env var
- **`legacy`** (default) — built-in bcrypt + JWT. Endpoints: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`.
- **`supabase`** — verify Supabase-issued JWTs (HS256 via `SUPABASE_JWT_SECRET` or RS256/ES256 via `SUPABASE_JWKS_URL`). Users provisioned just-in-time. Toggle: set `AUTH_MODE=supabase` in backend env.

### Object storage — `STORAGE_BACKEND` env var
- **`local`** (default) — filesystem at `STORAGE_LOCAL_ROOT`, HMAC-signed download URLs via `/api/files/<key>`.
- **`s3`** — Supabase Storage, AWS S3, R2, or MinIO. Set `STORAGE_S3_ENDPOINT`, `STORAGE_S3_BUCKET`, `STORAGE_S3_ACCESS_KEY`, `STORAGE_S3_SECRET_KEY`.

### TTS providers
- **Edge TTS** (free, default) — `edge-tts` WebSocket to Microsoft. No credentials. `max_chars=5000`.
- **AWS Polly** — active when `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` set. `max_chars=2500` (UTF-8 byte limit).
- New providers: implement `SpeechProvider` ABC in `backend/services/providers/`, register in `ProviderRegistry`.

### GitHub App — `GITHUB_WEBHOOK_SECRET` env var
- Webhook receiver: `POST /api/webhooks/github` (backend)
- Verifies `X-Hub-Signature-256` HMAC with `GITHUB_WEBHOOK_SECRET`
- Handled events: `push`, `pull_request`, `ping`, `check_run`, `deployment`
- GitHub App webhook URL (set in App settings): `https://<backend-railway-url>/api/webhooks/github`
- To add a new event: add a handler in `backend/webhooks/github.py` and add the event to `_HANDLERS`

### Monitoring
- **Sentry** — lazy import, active only when `SENTRY_DSN` is set. `send_default_pii=False`. No code changes needed to enable.
- **Structured logging** — JSON by default (`LOG_FORMAT=json`), request-id correlation, secret redaction in `backend/observability/`.

### Rate limiting — `RATE_LIMIT_BACKEND` env var
- `postgres` (default) — fixed-window counter in `rate_buckets` table.
- `upstash` — Redis REST via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- `none` — disabled.

---

## Ops dashboard (`dashboard/`)

- **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, SWR for data fetching.
- **Deployed to:** Vercel. Root: `dashboard/` directory.
- **Auth:** uses the same backend `POST /api/auth/login` + JWT. Token stored in localStorage.
- **Key env var:** `NEXT_PUBLIC_API_URL` — set to the Railway backend URL in Vercel project settings (e.g. `https://backend-production.up.railway.app`).
- **Pages:**
  - `/dashboard` — overview: job queue counts, QC fail rate, usage, cache stats, provider status
  - `/dashboard/jobs` — job list with status filter, per-chapter QC detail, approve/reject/cancel/delete actions
  - `/dashboard/health` — API + DB health, provider availability, integration checklist
- **API client:** `dashboard/lib/api.ts` — all types match backend `_job_json`, `health_check`, `usage` response shapes exactly.
- **Never** connect the dashboard directly to Postgres. All data flows through the backend API.

---

## Deployment

### Railway (`railway.toml`)
- 3 services: `backend`, `worker`, `frontend`
- `backend` runs `alembic upgrade head` on start via `entrypoint.sh` (ROLE=api)
- `worker` runs `python worker.py` (ROLE=worker)
- Both share a Railway Volume mounted at `/data`
- Postgres auto-injects `DATABASE_URL`
- See `RAILWAY_SETUP.md` for step-by-step instructions

### Vercel (ops dashboard)
- Root directory: `dashboard/`
- Framework: Next.js (auto-detected)
- Required env var: `NEXT_PUBLIC_API_URL=https://<backend>.up.railway.app`
- Add the dashboard origin to `CORS_ALLOW_ORIGINS` on the backend

### CI (`github/workflows/ci.yml`)
- Backend: pytest (against real Postgres), ruff, alembic upgrade
- Frontend: npm ci, eslint, tsc, vite build
- Runs on every push to `main` and every PR

---

## Safety rules

1. Authenticated, org-scoped access to all jobs, files, usage, and admin actions. An ID alone is never authorization.
2. Preserve `FOR UPDATE SKIP LOCKED`, retry, orphan-recovery, and cancellation in the job queue.
3. Verify `X-Hub-Signature-256` on every GitHub webhook request — never skip in production.
4. Keep generated audio, uploads, caches, local databases, and `.env` files out of Git.
5. Never expose S3, Supabase, JWT, AWS, Sentry, GitHub App, or rate-limit credentials to the browser, repository, logs, or agent output.
6. Keep frontend API URLs configurable through environment variables. Never hardcode a deployed backend URL.
7. Do not connect the ops dashboard directly to Postgres. All data flows through the API.
8. Do not migrate the Vite SPA to Next.js without a written architecture decision.

---

## Verification

Before calling any work complete, run:

```bash
# Backend
cd backend
pytest -q
ruff check .

# Frontend
cd frontend
npm ci && npm run lint && npm run build

# Dashboard
cd dashboard
npm install && npm run build

# Database (on schema changes)
alembic upgrade head && alembic downgrade base && alembic upgrade head
```

For GitHub webhook changes, verify signature verification logic with:
```bash
cd backend && pytest -q tests/test_webhook.py
```
