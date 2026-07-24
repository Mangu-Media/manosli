# Verifier index (append-only)
- v1 (2026-07-21): initial criteria — build gate, route coverage, spec-pillar content coverage,
  branding, shared components, generated assets.
- v2 (2026-07-21): keyword fix — 'end-to-end' → 'E2EE'; all else identical to v1.
- v3 (2026-07-21): adds web-player criteria — /app route, real committed audio, audio-element-driven progress, docx-escape cleanup, design-token coherence.
- v4 (2026-07-21): stack-agnostic prep — repository seam + localStorage persistence, PWA manifest, service worker, media-session API.
- v5 (2026-07-21): rung 2 — serverless api/, Mongo data layer, real ApiRepository+fallback, dual auth UI, vercel.json.
- v6 (2026-07-21): rung 3 — catalog >=20 files/>=48 tracks, license ledger, upload flow, history hookup.
- v7 (2026-07-21): v6 track-count probe fix — count RAW_TRACKS entries instead of literal audioUrl greps.
- (note 2026-07-21) v7 run9 supersedes run8 — run8 failed due to a sed error writing the v7 script, not product code.
- v8 (2026-07-21): final packages — analytics view, search incl. uploads + ranking, install prompt, media-session seek/position.
- v9 (2026-07-21): Artist Studio — /studio route, upload mgmt, per-track analytics, royalty transparency tied to ledger.
- v10 (2026-07-22): artist public profiles — /artist/:id route, discography, follow/support, player+studio wiring.
