# manosli+ Engineering Roadmap — Rungs 2–4 (autonomous build plan)

Master state: repo at /mnt/agents/output/app (master branch = latest delivered version).
Current version: 186b8c7 (marketing site + working web player at /app, real CC-BY audio).
Verifier: /mnt/agents/output/verifier/ (v2 = site checks, v3 = player checks). Every delivery
must add a new verifier version and log runs to verifier/runs/.

## RUNG 2 — Real backend (auth, persistence, sync)
Status: BLOCKED on user stack answers (see QUESTIONS below). Fallback default if no
answer after 2 scheduled cycles: backend-building-swarm graft (Hono + tRPC + Drizzle + DB)
with auth; player state (likes, playlists, history) persisted per user; E2EE-shaped sync
layer for playback history.
Work packages:
- 2a. Backend graft + DB schema (users, playlists, playlist_tracks, likes, history)
- 2b. Auth wiring (login page, Navbar auth slot, player session)
- 2c. Player ↔ API integration (replace in-memory state with API + optimistic UI)
- 2d. Listening-history analytics page ("Your Year in Sound" preview)

## RUNG 3 — Catalog expansion
- 3a. Artist-upload flow (upload audio → stored, appears in catalog) 
- 3b. Expand seeded catalog to 50+ tracks via more CC-BY/CC0 sources with license ledger
- 3c. Real search indexing + genre pages fed from DB

## RUNG 4 — Native-app readiness
- 4a. PWA conversion (manifest, service worker, offline playback of cached tracks)
- 4b. Mobile player polish pass (install prompts, media-session API lockscreen controls)

## Standing rules for every scheduled run
1. Read this file + verifier/README.md first.
2. Pick the next unblocked work package; if blocked, do stack-agnostic prep instead.
3. Work via swarm pattern: branch off master → worktree → build → verifier (new version) →
   website_version_manager build_version → merge to master.
4. Update this file's statuses and append a dated entry to the LOG below.
5. If a user answer is needed, stop after completing unblocked work and list questions.

## QUESTIONS awaiting user (record answers here when received)
- Q1 hosting/deploy: Vercel? (Note: sandbox delivers versions via platform; Vercel deploy
  would be a repo push + user's Vercel link — confirm)
- Q2 database: MongoDB preferred? (skill default is SQL+Drizzle; Mongo swaps the ORM layer)
- Q3 auth: email/password, OAuth (Google/Apple), or both?
- Q4 artist uploads: yes now, or later?

## LOG
- 2026-07-21 — Roadmap created. Rung 2 blocked on Q1–Q3. Player (rung 1) live: 186b8c7.
- 2026-07-21 (cycle 1) — Stack-agnostic prep shipped: player persistence seam (PlayerRepository
  + localStorage impl + ApiRepository stub for rung 2), PWA manifest + service worker (offline
  audio/asset caching), Media Session lockscreen controls. Version 50f2848. Rung 4a partially
  done. Q1–Q4 still unanswered — rung 2 backend graft remains blocked one more cycle.
- 2026-07-21 (cycle 2) — RUNG 2 SHIPPED (defaults applied: Vercel serverless + MongoDB +
  dual auth; reversible if user vetoes). api/ functions: auth signup/login (scrypt+JWT),
  OAuth scaffold (501 until provider keys), library sync GET/PUT, history POST. Frontend:
  ApiRepository with health-check + local fallback, useAuth, AuthModal (email + Google/Apple),
  first-login migration of local library. Version 94ace08. Verifiers v2–v5 all green.
  Remaining rung 2: 2d analytics page. Next: rung 3 catalog + history hookup on play.
- 2026-07-21 (cycle 3) — RUNG 3 SHIPPED: catalog 24→58 tracks, 23 audio files (all CC-BY,
  Kevin MacLeod), public/audio/ledger.json license ledger + in-app licenses modal, artist
  uploads (IndexedDB blobs, Your Uploads tab, 20MB cap) + api/upload.ts scaffold, history
  hookup posts play events when signed in. Version 8d279f8. Verifiers v2–v5+v7 green.
  Remaining: 2d analytics page, 3c DB-fed search, 4b install prompts/media-session polish.
- 2026-07-21 (cycle 4) — FINAL PACKAGES SHIPPED: 2d "Your Sound" analytics (minutes, plays,
  top tracks/artists/genres, 7-day chart, listening personality, local play-event log),
  3c ranked search incl. uploads (pure rank function, relevance scoring), 4b install prompt
  (beforeinstallprompt + iOS hint, dismissible) + media-session seek/position. Version 0d8bfcb.
  Verifiers v2–v5, v7, v8 all green. RUNGS 2–4 COMPLETE. Engineering goal closed.
- 2026-07-22 — ARTIST STUDIO SHIPPED (/studio, version 6617c6f): overview band, My Tracks
  (edit/delete/inline preview), listener insights (7-day chart, dayparts, audience mix),
  royalty transparency panel ($0.004/stream rate card, per-track math, payout stub, ledger.json
  license provenance). Synthetic stats are seeded + demo-labeled. Verifiers v2–v9 green.
  Rung-6 indie-moat seed planted.
- 2026-07-22 — ARTIST PUBLIC PROFILES SHIPPED (/artist/:id, version 4e38269): hero w/ aurora
  wash, top tracks (playable preview), discography grid, long bios (all 14 artists), follow
  (persisted, optimistic follower count), support pledges ($2/$5/$10/custom, stubbed checkout,
  local pledge ledger), player TrackRow artist links + Studio "view public profile" wiring.
  Marketplace loop closed: listener ↔ artist. Verifiers v2–v10 green.
